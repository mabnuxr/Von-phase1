/**
 * useChatV2 - Orchestrator hook for V2 chat container
 *
 * Composes all V2-specific hooks and returns everything
 * the ChatV2Container needs to render. Business logic only — no JSX.
 *
 * Handles both regular V2 chat and deep research mode.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AgentMode,
  SendMessageOptions,
  FileAttachment,
  MessageFileAttachment,
} from "@vonlabs/design-components";

import type {
  MessageWithStreaming,
  Conversation,
  ConversationMode,
} from "../types/conversation";
import type { User } from "../services";
import { fileUploadService } from "../services/fileUploadService";
import useChatStore from "../store/chatStore";
import { usePusherChannel } from "./usePusherChannel";
import { useV2EventProcessor } from "./useV2EventProcessor";
import { useUserMessageProcessor } from "./useUserMessageProcessor";
import { useReconciliation } from "./useReconciliation";
import { useStreamGuard } from "./useStreamGuard";
import { useSendMessage } from "./useSendMessage";
import { useStopStreaming } from "./useStopStreaming";
import { useFileUploadPipeline } from "./useFileUploadPipeline";
import { useArtifactState } from "./useArtifactState";
import { useLazyTransparencyArtifacts } from "./useMessageArtifacts";
import {
  transformConversationMessages,
  handleToolApproval,
  handleToolRejection,
} from "../lib/dashboardUtils";
import { STREAM_TIMEOUT_MS } from "../config/constants";

export interface UseChatV2Props {
  conversationId: string;
  user: User | null;
  currentConversation: Conversation;
  conversationMessages: MessageWithStreaming[];
  refetchMessages: () => Promise<unknown>;
  lockedAgentMode: AgentMode;
  isAgentLocked: boolean;
  canSubmit: boolean;
  onDisabledInteraction: () => void;
  salesforceInstanceUrl?: string;
  isSlashCommandsEnabled: boolean;
  isActionsEnabled: boolean;
  isDeepLinksEnabled: boolean;
  isSourcesEnabled: boolean;
  isFileUploadEnabled: boolean;
  syncAgentModeToBackend: (mode: AgentMode) => Promise<void>;
}

export function useChatV2(props: UseChatV2Props) {
  const {
    conversationId,
    user,
    currentConversation,
    conversationMessages,
    refetchMessages,
    lockedAgentMode,
    isAgentLocked,
    syncAgentModeToBackend,
  } = props;

  const chatType: ConversationMode = currentConversation.mode || "auto";
  const isDeepResearchMode =
    lockedAgentMode === "deep-research" && isAgentLocked;

  // Pusher connection (single instance)
  const pusherConfig = useMemo(
    () => ({
      conversationId,
      tenantId: user?.tenantId,
      userId: user?.id,
    }),
    [conversationId, user?.tenantId, user?.id],
  );

  const { channel, pusherRef } = usePusherChannel(pusherConfig);

  // Compute initial run events from conversation messages (for page refresh seeding)
  const v2InitialRunEvents = useMemo(() => {
    if (!conversationMessages.length) return undefined;
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
      const msg = conversationMessages[i];
      if (msg.role === "assistant" && msg.events && msg.events.length > 0) {
        return msg.events;
      }
    }
    return undefined;
  }, [conversationMessages]);

  // V2 event processing (AGUI events → timeline steps)
  const v2Processor = useV2EventProcessor(
    channel,
    conversationId,
    v2InitialRunEvents,
  );

  // User message + error processing (writes to chatStore)
  useUserMessageProcessor(channel, conversationId);

  // Chat-type-aware reconciliation
  useReconciliation({
    conversationId,
    chatType,
    isThinking: v2Processor.isThinking,
    pusherRef,
    eventsRef: v2Processor.eventsRef,
    finishedRunsRef: v2Processor.finishedRunsRef,
    lastEventTimeRef: v2Processor.lastEventTimeRef,
    stoppedRef: v2Processor.stoppedRef,
    onStateUpdate: v2Processor.applyTransformResult,
    onReconcile: refetchMessages as () => void,
  });

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
        console.error("[useChatV2] Failed to get download URL:", err);
      } finally {
        setIsFilePreviewLoading(false);
      }
    },
    [conversationId],
  );

  // Artifacts
  const { artifactState, handleArtifactClick, closeArtifact } =
    useArtifactState();

  // Transparency drawer
  const [isTransparencyOpen, setIsTransparencyOpen] = useState(false);
  const [transparencyRunId, setTransparencyRunId] = useState<string | null>(
    null,
  );

  const {
    artifactSummaries: transparencyArtifactSummaries,
    isLoading: isTransparencyLoading,
  } = useLazyTransparencyArtifacts(
    isTransparencyOpen ? conversationId : null,
    isTransparencyOpen ? transparencyRunId : null,
  );

  // Auto-populate input on error
  const [autoPopulatedInput, setAutoPopulatedInput] = useState("");
  const lastUserMessageRef = useRef("");

  // Stream timeout guard
  const getMessages = useCallback(
    () => conversationMessages,
    [conversationMessages],
  );

  const handleForceComplete = useCallback(
    (messageId: string) => {
      useChatStore.getState().forceCompleteMessage(conversationId, messageId);
    },
    [conversationId],
  );

  const handleStreamTimeout = useCallback(
    async (messageId: string) => {
      useChatStore.getState().markMessageTimeout(conversationId, messageId);
      await refetchMessages();
    },
    [conversationId, refetchMessages],
  );

  useStreamGuard(conversationId, getMessages, {
    timeoutMs: STREAM_TIMEOUT_MS,
    onTimeout: handleStreamTimeout,
    onForceComplete: handleForceComplete,
  });

  // When V2 processor marks run complete (isThinking: true → false),
  // force-complete store messages so useStreamGuard stops tracking them.
  // Uses wasThinkingRef to only fire on actual true→false transitions,
  // not during initialization or intermediate state flushes.
  const wasThinkingRef = useRef(false);
  useEffect(() => {
    if (v2Processor.isThinking) {
      wasThinkingRef.current = true;
      return;
    }
    if (!wasThinkingRef.current) return;
    if (!v2Processor.currentRunId) return;

    wasThinkingRef.current = false;

    const messages =
      useChatStore.getState().messages[conversationId] || [];
    for (const msg of messages) {
      if (msg.role === "assistant" && msg.isStreaming) {
        useChatStore.getState().forceCompleteMessage(conversationId, msg.id);
      }
    }
  }, [v2Processor.isThinking, v2Processor.currentRunId, conversationId]);

  // Transform messages to Chat component format (V2 path with live data overlay)
  const {
    messages: transformedMessages,
    researchResults: effectiveResearchResults,
  } = useMemo(
    () =>
      transformConversationMessages(conversationMessages, true, {
        timelineSteps: v2Processor.timelineSteps,
        isThinking: v2Processor.isThinking,
        elapsedTime: v2Processor.elapsedTime,
        finalResponse: v2Processor.finalResponse,
        isFinalResponseStreaming: v2Processor.isFinalResponseStreaming,
        researchResults: v2Processor.researchResults,
        stoppedByUser: v2Processor.stoppedByUser,
        runErrorMessage: v2Processor.runErrorMessage,
        currentRunId: v2Processor.currentRunId,
      }),
    [
      conversationMessages,
      v2Processor.timelineSteps,
      v2Processor.isThinking,
      v2Processor.elapsedTime,
      v2Processor.finalResponse,
      v2Processor.isFinalResponseStreaming,
      v2Processor.researchResults,
      v2Processor.stoppedByUser,
      v2Processor.runErrorMessage,
      v2Processor.currentRunId,
    ],
  );

  // Message filtering state
  const showMessagesFromIndex = useChatStore(
    (state) => state.showMessagesFromIndex[conversationId] ?? 0,
  );

  // Tool approval/rejection
  const handleApproval = useCallback(
    async (toolCallId: string, runId: string) => {
      await handleToolApproval(toolCallId, runId, conversationId);
    },
    [conversationId],
  );

  const handleRejection = useCallback(
    async (toolCallId: string, runId: string) => {
      await handleToolRejection(toolCallId, runId, conversationId);
    },
    [conversationId],
  );

  // Transparency handler
  const handleTransparencyClick = useCallback(
    (messageId: string) => {
      const message = transformedMessages.find((m) => m.id === messageId);
      if (message?.runId) {
        setTransparencyRunId(message.runId);
        setIsTransparencyOpen(true);
      }
    },
    [transformedMessages],
  );

  const handleCloseTransparency = useCallback(() => {
    setIsTransparencyOpen(false);
    setTransparencyRunId(null);
  }, []);

  // Send message handler
  const handleSendMessage = useCallback(
    async (
      content: string,
      _attachments?: FileAttachment[],
      options?: SendMessageOptions,
    ) => {
      lastUserMessageRef.current = content;

      const currentMessages =
        useChatStore.getState().messages[conversationId] || [];
      if (currentMessages.length === 0 && options?.agentMode) {
        await syncAgentModeToBackend(options.agentMode);
      }

      let fileAttachments;
      if (hasFileAttachments) {
        try {
          fileAttachments = await uploadPendingFiles(conversationId);
        } catch (error) {
          console.error("[useChatV2] File upload failed:", error);
          return;
        }
      }

      sendMessage({ content, fileAttachments });
      clearFileAttachments();
    },
    [
      conversationId,
      syncAgentModeToBackend,
      hasFileAttachments,
      uploadPendingFiles,
      sendMessage,
      clearFileAttachments,
    ],
  );

  // Stop streaming handler
  const { markStopped } = v2Processor;
  const handleStopStreaming = useCallback(
    (convId: string) => {
      markStopped();
      stopStreaming(convId);
    },
    [stopStreaming, markStopped],
  );

  return {
    // Mode
    isDeepResearchMode,

    // V2 live data
    isDeepResearchRunning: v2Processor.isDeepResearchRunning,

    // Messages
    transformedMessages,
    effectiveResearchResults,
    showMessagesFromIndex,

    // Input
    autoPopulatedInput,
    setAutoPopulatedInput,

    // Handlers
    handleSendMessage,
    handleStopStreaming,
    handleApproval,
    handleRejection,

    // Transparency
    isTransparencyOpen,
    transparencyRunId,
    transparencyArtifactSummaries,
    isTransparencyLoading,
    handleTransparencyClick,
    handleCloseTransparency,

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
    canSubmitFinal: props.canSubmit && (!hasFileAttachments || allUploaded),
  };
}
