/**
 * useCreateAndSendMessage
 *
 * Shared logic for the "create conversation on first message" pattern used in:
 * - NewConversation.tsx  (regular chat)
 * - ChatSession.tsx  (analytics chat pane, new-conversation flow)
 *
 * Returns:
 *   handleSendMessage  — call with message content (+ optional SendMessageOptions)
 *   transformedMessages — pre-formatted messages for the Chat component
 *   isCreating         — true while the API calls are in-flight
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type {
  SendMessageOptions,
  FileAttachment,
} from "@vonlabs/design-components";

import { useCreateConversation, conversationKeys } from "./useConversations";
import { folderKeys } from "./folders";
import { MESSAGES_PAGE_LIMIT } from "../config/constants";
import { useSendMessage } from "./useSendMessage";
import { useFileUploadPipeline } from "./useFileUploadPipeline";
import type { MessageFileAttachment } from "./useFileUploadPipeline";
import { fileUploadService } from "../services/fileUploadService";
import { transformConversationMessages } from "../lib/dashboardUtils";
import { buildMentionReferences } from "../lib/messageReferenceUtils";
import type {
  MessageWithStreaming,
  MessageReference,
  MessageCommand,
} from "../types/conversation";
import useChatStore from "../store/chatStore";

export interface UseCreateAndSendMessageOptions {
  /**
   * Agent version to use when creating the conversation.
   * Defaults to "v2".
   */
  agentVersion?: "v1" | "v2";

  /**
   * Whether the agent is v2 — used when transforming pending messages.
   * Defaults to true.
   */
  isAgentV2?: boolean;

  /**
   * Conversation title. Defaults to "".
   */
  title?: string;

  /**
   * References to attach to the first message (e.g. a dashboard reference).
   */
  references?: MessageReference[];

  /**
   * Called with the new conversationId on success.
   * Provide this instead of `navigateOnCreate` for embedded contexts (e.g. analytics pane).
   */
  onCreated?: (conversationId: string) => void;

  /**
   * When true, navigates to /chat/:id after creation (regular chat flow).
   * Mutually exclusive with onCreated — set one or the other.
   * Defaults to false.
   */
  navigateOnCreate?: boolean;
}

export function useCreateAndSendMessage({
  agentVersion = "v2",
  isAgentV2 = true,
  title = "",
  references,
  onCreated,
  navigateOnCreate = false,
}: UseCreateAndSendMessageOptions = {}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutateAsync: createConversation } = useCreateConversation();
  const { mutateAsync: sendMessage } = useSendMessage();

  const [isCreating, setIsCreating] = useState(false);
  const isCreatingRef = useRef(false);
  const [pendingMessages, setPendingMessages] = useState<
    MessageWithStreaming[] | null
  >(null);
  const [fileErrorMessage, setFileErrorMessage] = useState<string | null>(null);
  const fileErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleFileError = useCallback((_errorCode: string, message: string) => {
    setFileErrorMessage(message);
    if (fileErrorTimerRef.current) clearTimeout(fileErrorTimerRef.current);
    fileErrorTimerRef.current = setTimeout(
      () => setFileErrorMessage(null),
      4000,
    );
  }, []);

  // null conversationId = files stay pending until the conversation is created.
  // uploadPendingFiles(newId) is called after creation to upload them.
  const {
    attachments: fileAttachments,
    addFiles,
    removeFile,
    uploadPendingFiles,
    clearFiles,
    allUploaded,
    hasAttachments,
  } = useFileUploadPipeline(null, { onError: handleFileError });

  const transformedMessages = useMemo(() => {
    if (!pendingMessages) return [];
    return transformConversationMessages(pendingMessages, isAgentV2).messages;
  }, [pendingMessages, isAgentV2]);

  const handleSendMessage = useCallback(
    async (
      content: string,
      _?: FileAttachment[],
      options?: SendMessageOptions,
    ) => {
      if (isCreatingRef.current) return;
      isCreatingRef.current = true;
      setIsCreating(true);

      // Show user message + thinking indicator immediately, before any API call.
      // Build command early so it's visible in the pending message.
      const command: MessageCommand | undefined = options?.command
        ? {
            id: options.command.id,
            name: options.command.name,
            prompt: options.command.prompt,
            dataSources: options.command.dataSources
              ?.filter((ds) => ds.s3Key)
              ?.map((ds) => ({
                fileId: ds.id,
                fileName: ds.name,
                fileSize: ds.size,
                mimeType: ds.type,
                extension: ds.extension,
                category: ds.category,
                s3Key: ds.s3Key!,
              })),
            accessLevel:
              options.command.sharingScope === "org" ? "tenant" : "user",
          }
        : undefined;

      const mentionRefsForOptimistic = buildMentionReferences(
        options?.mentions ?? [],
      );
      const optimisticReferences =
        mentionRefsForOptimistic.length > 0
          ? [...(references ?? []), ...mentionRefsForOptimistic]
          : references;
      const tempId = `temp-${Date.now()}`;
      setPendingMessages([
        {
          id: tempId,
          runId: tempId,
          conversationId: "",
          messageType: "text",
          messageContent: content,
          role: "user",
          createdAt: new Date().toISOString(),
          createdBy: null,
          isStreaming: false,
          status: "completed",
          ...(command ? { command } : {}),
          ...(optimisticReferences?.length
            ? { references: optimisticReferences }
            : {}),
        },
        {
          id: `${tempId}-assistant`,
          runId: `${tempId}-assistant`,
          conversationId: "",
          messageType: "text",
          messageContent: "",
          role: "assistant",
          createdAt: new Date().toISOString(),
          createdBy: null,
          isStreaming: true,
          status: "streaming",
        },
      ]);

      let newId: string | undefined;
      let uploadedFiles: MessageFileAttachment[] = [];
      let succeeded = false;

      try {
        // 1. Create the conversation (always auto mode)
        const res = await createConversation({ title, agentVersion });
        newId = res.conversation.conversationId;

        // 2. Pre-populate React Query cache so the chat renders without waiting for a round-trip
        queryClient.setQueryData(["conversation", newId], res.conversation);

        // 3. Upload any pending file attachments now that we have a conversation ID
        uploadedFiles = await uploadPendingFiles(newId);

        // 4. Seed chatStore synchronously before transitioning so the receiving
        //    component (Conversation.tsx / ChatSession) sees messages
        //    immediately on mount instead of flashing blank then re-populating.
        //    We pass these IDs to sendMessage so its onMutate skips duplicate seeding.
        const now = new Date().toISOString();
        const optimisticBase = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const optimisticUserId = `${optimisticBase}-u`;
        const optimisticAssistantId = `${optimisticBase}-a`;
        const store = useChatStore.getState();
        store.setShowMessagesFromIndex(newId, 0);
        store.addPendingOptimisticId(optimisticUserId);
        store.addPendingOptimisticId(optimisticAssistantId);
        store.addMessage(newId, {
          id: optimisticUserId,
          runId: optimisticUserId,
          conversationId: newId,
          messageType: "text",
          messageContent: content,
          role: "user",
          createdAt: now,
          createdBy: null,
          isStreaming: false,
          status: "completed",
          ...(uploadedFiles.length ? { fileAttachments: uploadedFiles } : {}),
          ...(command ? { command } : {}),
          ...(optimisticReferences?.length
            ? { references: optimisticReferences }
            : {}),
        });
        store.addMessage(newId, {
          id: optimisticAssistantId,
          runId: optimisticAssistantId,
          conversationId: newId,
          messageType: "text",
          messageContent: "",
          role: "assistant",
          createdAt: now,
          createdBy: null,
          isStreaming: true,
          status: "streaming",
        });
        store.triggerScrollToBottom(newId);

        // 5. Pre-seed the React Query infinite messages cache with an empty page.
        // When Conversation.tsx mounts, useMessages will find this cache entry
        // (fresh within staleTime) and skip the network fetch — preventing an
        // empty-page response from overwriting the optimistic chatStore messages.
        queryClient.setQueryData(
          conversationKeys.messagesList(newId, 1, MESSAGES_PAGE_LIMIT),
          {
            pages: [
              {
                data: [],
                pagination: {
                  page: 1,
                  limit: MESSAGES_PAGE_LIMIT,
                  total: 0,
                  totalPages: 0,
                  hasNextPage: false,
                },
              },
            ],
            pageParams: [1],
          },
        );

        // 6. Send message — await so we only navigate/onCreated on success.
        //    If this throws, onError in useSendMessage rolls back the chatStore
        //    pre-seeded messages, and the catch block below resets local UI state.
        const mentionRefs = buildMentionReferences(options?.mentions ?? []);
        const allReferences =
          mentionRefs.length > 0
            ? [...(references ?? []), ...mentionRefs]
            : references;

        await sendMessage({
          conversationId: newId,
          content,
          ...(uploadedFiles.length ? { fileAttachments: uploadedFiles } : {}),
          ...(allReferences?.length ? { references: allReferences } : {}),
          ...(command ? { command } : {}),
          preSeededOptimisticIds: {
            userId: optimisticUserId,
            assistantId: optimisticAssistantId,
          },
        });

        clearFiles();

        succeeded = true;

        if (navigateOnCreate) {
          // 7a. Refresh sidebar (fire-and-forget) — top-level unfiled chats list
          queryClient.refetchQueries({
            queryKey: folderKeys.unfiled("conversation"),
          });

          // 7b. Navigate — replace so back button skips /chat/new.
          //     { newlyCreated: true } tells Conversation.tsx to skip the skeleton.
          //     chatStore is already seeded above so no blank flash on mount.
          navigate(`/chat/${newId}`, {
            replace: true,
            state: { newlyCreated: true },
          });
        } else {
          // 7. Notify parent — chatStore already seeded so receiving component
          //    (e.g. ChatSession) renders messages immediately on mount.
          onCreated?.(newId);
        }
      } catch (error) {
        console.error(
          "[useCreateAndSendMessage] Failed to create conversation:",
          error,
        );
        // Best-effort: delete any files already uploaded to the failed conversation
        // so stale file IDs don't leak into a retry on a new conversation.
        if (newId && uploadedFiles.length > 0) {
          uploadedFiles.forEach((f) => {
            fileUploadService.deleteFile(newId!, f.uploadId).catch(() => {});
          });
        }
        clearFiles();
      } finally {
        isCreatingRef.current = false;
        setIsCreating(false);
        // On navigateOnCreate success the component is about to unmount — skipping
        // setPendingMessages(null) avoids a blank-chat flash between navigate() being
        // called and the component actually unmounting. For errors and the onCreated
        // path (component stays mounted) we always clear.
        if (!succeeded || !navigateOnCreate) {
          setPendingMessages(null);
        }
      }
    },
    [
      agentVersion,
      clearFiles,
      createConversation,
      navigate,
      navigateOnCreate,
      onCreated,
      queryClient,
      references,
      sendMessage,
      title,
      uploadPendingFiles,
    ],
  );

  return {
    handleSendMessage,
    transformedMessages,
    isCreating,
    // File attachment state — pass to Chat as controlledAttachments / handlers
    fileAttachments,
    addFiles,
    removeFile,
    allUploaded,
    hasAttachments,
    fileErrorMessage,
    dismissFileError: () => {
      if (fileErrorTimerRef.current) clearTimeout(fileErrorTimerRef.current);
      setFileErrorMessage(null);
    },
  };
}
