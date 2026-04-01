/**
 * useChatV1 - Orchestrator hook for V1 chat container
 *
 * Composes all V1-specific hooks and returns everything
 * the ChatV1Container needs to render. Business logic only — no JSX.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  SendMessageOptions,
  FileAttachment,
  MessageFileAttachment,
} from "@vonlabs/design-components";

import type { MessageWithStreaming } from "../types/conversation";
import type { User } from "../services";
import { fileUploadService } from "../services/fileUploadService";
import useChatStore from "../store/chatStore";
import { usePusherChannel } from "./usePusherChannel";
import { useV1EventProcessor } from "./useV1EventProcessor";
import { useSendMessage } from "./useSendMessage";
import { useStopStreaming } from "./useStopStreaming";
import { useFileUploadPipeline } from "./useFileUploadPipeline";
import { useArtifactState } from "./useArtifactState";
import { transformConversationMessages } from "../lib/dashboardUtils";

export interface UseChatV1Props {
  conversationId: string;
  user: User | null;
  conversationMessages: MessageWithStreaming[];
  refetchMessages: () => Promise<unknown>;
  canSubmit: boolean;
  onDisabledInteraction: () => void;
  isSalesforceReady: boolean;
  salesforceInstanceUrl?: string;
  isSlashCommandsEnabled: boolean;
  isActionsEnabled: boolean;
  isDeepLinksEnabled: boolean;
  isSourcesEnabled: boolean;
  isFileUploadEnabled: boolean;
}

export function useChatV1(props: UseChatV1Props) {
  const { conversationId, user, conversationMessages, canSubmit } = props;

  // Pusher connection (single instance)
  const pusherConfig = useMemo(
    () => ({
      conversationId,
      tenantId: user?.tenantId,
      userId: user?.id,
    }),
    [conversationId, user?.tenantId, user?.id],
  );

  const { channel, error: channelError } = usePusherChannel(pusherConfig);

  // V1 event processing (AGUI events + user messages + errors → chatStore)
  useV1EventProcessor(channel, conversationId);

  // Send message
  const { mutate: sendMessage } = useSendMessage();

  // Stop streaming
  const { mutate: stopStreaming } = useStopStreaming();

  // File uploads
  const [fileErrorMessage, setFileErrorMessage] = useState<string | null>(null);
  const fileErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleFileError = useCallback((_error: string, message: string) => {
    setFileErrorMessage(message);
    if (fileErrorTimerRef.current) clearTimeout(fileErrorTimerRef.current);
    fileErrorTimerRef.current = setTimeout(
      () => setFileErrorMessage(null),
      4000,
    );
  }, []);

  const {
    attachments: fileAttachmentState,
    addFiles: handleFilesSelected,
    removeFile: handleRemoveAttachment,
    uploadPendingFiles,
    clearFiles: clearFileAttachments,
    hasAttachments: hasFileAttachments,
    allUploaded,
  } = useFileUploadPipeline(conversationId, { onError: handleFileError });

  // File preview
  const [filePreviewAttachment, setFilePreviewAttachment] =
    useState<MessageFileAttachment | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isFilePreviewLoading, setIsFilePreviewLoading] = useState(false);

  const handleFileClick = useCallback(
    async (attachment: MessageFileAttachment) => {
      setFilePreviewAttachment(attachment);
      setFilePreviewUrl(null);
      setIsFilePreviewLoading(true);
      try {
        const { downloadUrl } = await fileUploadService.getDownloadUrl(
          conversationId,
          attachment.id,
        );
        setFilePreviewUrl(downloadUrl);
      } catch (err) {
        console.error("[useChatV1] Failed to get download URL:", err);
      } finally {
        setIsFilePreviewLoading(false);
      }
    },
    [conversationId],
  );

  // Artifacts
  const { artifactState, handleArtifactClick, closeArtifact } =
    useArtifactState();

  // Auto-populate input on error
  const [autoPopulatedInput, setAutoPopulatedInput] = useState("");
  const lastUserMessageRef = useRef("");

  // Re-populate input when the last assistant message fails
  useEffect(() => {
    if (!conversationId) return;

    const messages = useChatStore.getState().messages[conversationId] || [];
    const lastMessage = messages[messages.length - 1];

    if (lastMessage?.status === "failed" && lastMessage?.errorMessage) {
      const userMessage = lastUserMessageRef.current;
      if (userMessage) {
        setAutoPopulatedInput(userMessage);
      }
    }
  }, [conversationId, conversationMessages]);

  // Transform messages to Chat component format (V1 path)
  const { messages: transformedMessages } = useMemo(
    () => transformConversationMessages(conversationMessages, false),
    [conversationMessages],
  );

  // Message filtering state
  const showMessagesFromIndex = useChatStore(
    (state) => state.showMessagesFromIndex[conversationId] ?? 0,
  );

  // Send message handler
  const handleSendMessage = useCallback(
    async (
      content: string,
      _attachments?: FileAttachment[],
      options?: SendMessageOptions,
    ) => {
      lastUserMessageRef.current = content;

      let fileAttachments;
      if (hasFileAttachments) {
        try {
          fileAttachments = await uploadPendingFiles(conversationId);
        } catch (error) {
          console.error("[useChatV1] File upload failed:", error);
          return;
        }
      }

      sendMessage({
        conversationId,
        content,
        fileAttachments,
        command: options?.command
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
          : undefined,
      });
      clearFileAttachments();
    },
    [
      conversationId,
      hasFileAttachments,
      uploadPendingFiles,
      sendMessage,
      clearFileAttachments,
    ],
  );

  // Stop streaming handler
  const handleStopStreaming = useCallback(
    (convId: string) => {
      stopStreaming(convId);
    },
    [stopStreaming],
  );

  return {
    // Channel state
    channelError,

    // Messages
    transformedMessages,
    showMessagesFromIndex,

    // Input
    autoPopulatedInput,
    setAutoPopulatedInput,

    // Handlers
    handleSendMessage,
    handleStopStreaming,

    // Files
    fileAttachmentState,
    handleFilesSelected,
    handleRemoveAttachment,
    handleFileClick,
    fileErrorMessage,
    setFileErrorMessage,
    filePreviewAttachment,
    setFilePreviewAttachment,
    filePreviewUrl,
    setFilePreviewUrl,
    isFilePreviewLoading,

    // Artifacts
    artifactState,
    handleArtifactClick,
    closeArtifact,

    // Submit guard
    canSubmitFinal: canSubmit && (!hasFileAttachments || allUploaded),
  };
}
