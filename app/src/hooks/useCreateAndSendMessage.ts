/**
 * useCreateAndSendMessage
 *
 * Shared logic for the "create conversation on first message" pattern used in:
 * - NewConversation.tsx  (regular chat)
 * - AnalyticsNewConversationContainer.tsx  (analytics chat pane)
 *
 * Returns:
 *   handleSendMessage  — call with message content (+ optional SendMessageOptions)
 *   transformedMessages — pre-formatted messages for the Chat component
 *   isCreating         — true while the API calls are in-flight
 */

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ConversationMode } from "@vonlabs/design-components";
import type {
  SendMessageOptions,
  FileAttachment,
} from "@vonlabs/design-components";

import { useCreateConversation, conversationKeys } from "./useConversations";
import { chatSidebarKeys } from "./useChatSidebar";
import { useSendMessage } from "./useSendMessage";
import { useFileUploadPipeline } from "./useFileUploadPipeline";
import { transformConversationMessages } from "../lib/dashboardUtils";
import { ReferenceType } from "../types/conversation";
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
   * If provided, the conversation is locked to this mode.
   * If undefined, the mode comes from SendMessageOptions.agentMode (regular chat).
   */
  fixedMode?: ConversationMode;

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

  /**
   * Required when navigateOnCreate=true.
   * Used to select the correct sidebar refetch key.
   */
  isSidebarV2?: boolean;
}

export function useCreateAndSendMessage({
  agentVersion = "v2",
  isAgentV2 = true,
  title = "",
  fixedMode,
  references,
  onCreated,
  navigateOnCreate = false,
  isSidebarV2 = true,
}: UseCreateAndSendMessageOptions = {}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutateAsync: createConversation } = useCreateConversation();
  const { mutateAsync: sendMessage } = useSendMessage();

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
  } = useFileUploadPipeline(null);

  const [isCreating, setIsCreating] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<
    MessageWithStreaming[] | null
  >(null);

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
      if (isCreating) return;
      setIsCreating(true);

      // Show user message + thinking indicator immediately, before any API call.
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

      try {
        // Resolve conversation mode
        const mode: ConversationMode | undefined =
          fixedMode ??
          ((): ConversationMode | undefined => {
            const agentMode = options?.agentMode as
              | ConversationMode
              | undefined;
            return agentMode && agentMode !== ConversationMode.Auto
              ? agentMode
              : undefined;
          })();

        // 1. Create the conversation
        const res = await createConversation({ title, agentVersion, mode });
        const newId = res.conversation.conversationId;

        // 2. Pre-populate React Query cache so the chat renders without waiting for a round-trip
        queryClient.setQueryData(["conversation", newId], res.conversation);

        // 3. Upload any pending file attachments now that we have a conversation ID
        const uploadedFiles = await uploadPendingFiles(newId);

        // 4. Seed chatStore synchronously before transitioning so the receiving
        //    component (Conversation.tsx / AnalyticsChatContainer) sees messages
        //    immediately on mount instead of flashing blank then re-populating.
        //    We pass these IDs to sendMessage so its onMutate skips duplicate seeding.
        const now = new Date().toISOString();
        const optimisticUserId = `optimistic-${Date.now()}-u`;
        const optimisticAssistantId = `optimistic-${Date.now()}-a`;
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

        // 4. Send message — await so we only navigate/onCreated on success.
        //    If this throws, onError in useSendMessage rolls back the chatStore
        //    pre-seeded messages, and the catch block below resets local UI state.
        //    Merge static references (e.g. dashboard) with any @mention references.
        const mentionRefs: MessageReference[] = (options?.mentions ?? []).map(
          (m) => ({
            refId: `${ReferenceType.Dashboard}-${m.id}`,
            type: ReferenceType.Dashboard,
            context: {
              dashboardId: m.id,
              dashboardVersion: m.version,
              dashboardName: m.name,
            },
          }),
        );
        const allReferences =
          mentionRefs.length > 0
            ? [...(references ?? []), ...mentionRefs]
            : references;

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
            }
          : undefined;

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

        if (navigateOnCreate) {
          // 5a. Refresh sidebar (fire-and-forget)
          queryClient.refetchQueries({
            queryKey: isSidebarV2
              ? chatSidebarKeys.sidebar()
              : conversationKeys.lists(),
          });

          // 5b. Navigate — replace so back button skips /chat/new.
          //     { newlyCreated: true } tells Conversation.tsx to skip the skeleton.
          //     chatStore is already seeded above so no blank flash on mount.
          navigate(`/chat/${newId}`, {
            replace: true,
            state: { newlyCreated: true },
          });
        } else {
          // 5. Notify parent — chatStore already seeded so receiving component
          //    (e.g. AnalyticsChatContainer) renders messages immediately on mount.
          onCreated?.(newId);
        }
      } catch (error) {
        console.error(
          "[useCreateAndSendMessage] Failed to create conversation:",
          error,
        );
        setIsCreating(false);
        setPendingMessages(null);
      }
    },
    [
      agentVersion,
      clearFiles,
      createConversation,
      fixedMode,
      isCreating,
      isSidebarV2,
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
  };
}
