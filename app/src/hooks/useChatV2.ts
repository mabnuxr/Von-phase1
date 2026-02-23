/**
 * useChatV2 - Orchestrator hook for V2 chat container
 *
 * Composes all V2-specific hooks and returns everything
 * the ChatV2Container needs to render. Business logic only — no JSX.
 *
 * Handles both regular V2 chat and deep research mode.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "./useToast";
import { useFileDownload } from "./useFileDownload";
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
import { useSendMessage } from "./useSendMessage";
import { useStopStreaming } from "./useStopStreaming";
import { useFileUploadPipeline } from "./useFileUploadPipeline";
import { useArtifactState } from "./useArtifactState";
import { useLazyTransparencyArtifacts } from "./useMessageArtifacts";
import { useAgentArtifacts } from "./useAgentArtifacts";
import { useArtifactCreatedEvent } from "./useArtifactCreatedEvent";
import {
  transformConversationMessages,
  handleToolApproval,
  handleToolRejection,
} from "../lib/dashboardUtils";

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
  onCollapseSidebar: () => void;
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
    onCollapseSidebar,
  } = props;

  const { showToast } = useToast();
  const { downloadBlob } = useFileDownload();

  const chatType: ConversationMode = currentConversation.mode || "auto";

  // Deep research mode is active if:
  // 1. Agent is locked to dashboard-builder (has messages), OR
  // 2. Conversation mode is dashboard-builder (backend confirmed)
  const isDeepResearchMode =
    lockedAgentMode === "dashboard-builder" || chatType === "dashboard-builder";

  // Pusher connection (single instance)
  const pusherConfig = useMemo(
    () => ({
      conversationId,
      tenantId: user?.tenantId,
      userId: user?.id,
    }),
    [conversationId, user?.tenantId, user?.id],
  );

  const { channel, isConnected, pusherRef } = usePusherChannel(pusherConfig);

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

  // Ref to access V2 processor state from callbacks (avoids stale closures)
  const v2ProcessorRef = useRef<ReturnType<typeof useV2EventProcessor> | null>(
    null,
  );

  // When V2 processor marks a run done: force-complete streaming messages
  // in chatStore with persisted V2 data, then refetch from backend to replace
  // optimistic messages with real ones (real IDs, events, messageContent).
  const handleV2RunComplete = useCallback(() => {
    const messages = useChatStore.getState().messages[conversationId] || [];
    const processor = v2ProcessorRef.current;

    for (const msg of messages) {
      if (msg.role === "assistant" && msg.isStreaming) {
        // Persist V2 state into the chatStore message so it survives the
        // transition from live overlay → persisted path
        const persistedContent = processor?.finalResponse || undefined;
        const persistedStopped = processor?.stoppedByUser;
        const currentRunId = processor?.currentRunId;
        const persistedEvents = currentRunId
          ? processor?.eventsRef.current.get(currentRunId)
          : undefined;

        useChatStore
          .getState()
          .forceCompleteMessage(
            conversationId,
            msg.id,
            persistedContent,
            persistedStopped,
            persistedEvents,
          );
      }
    }
    refetchMessages();
  }, [conversationId, refetchMessages]);

  // V2 event processing (AGUI events → timeline steps)
  const v2Processor = useV2EventProcessor(
    channel,
    conversationId,
    v2InitialRunEvents,
    handleV2RunComplete,
  );

  // Keep ref in sync with latest processor value
  v2ProcessorRef.current = v2Processor;

  // User message + error processing (writes to chatStore)
  useUserMessageProcessor(channel, conversationId);

  // Agent-generated file artifacts (React Query + Pusher invalidation)
  useArtifactCreatedEvent(channel, conversationId);

  // Extract unique runIds from assistant messages for per-run artifact fetching
  const assistantRunIds = useMemo(() => {
    const ids = new Set<string>();
    for (const msg of conversationMessages) {
      if (msg.role === "assistant" && msg.runId) {
        ids.add(msg.runId);
      }
    }
    return Array.from(ids);
  }, [conversationMessages]);

  const agentArtifactsByRunId = useAgentArtifacts(
    conversationId,
    assistantRunIds,
  );

  // Chat-type-aware reconciliation
  useReconciliation({
    conversationId,
    chatType,
    isThinking: v2Processor.isThinking,
    isFinalResponseStreaming: v2Processor.isFinalResponseStreaming,
    isConnected,
    pusherRef,
    eventsRef: v2Processor.eventsRef,
    finishedRunsRef: v2Processor.finishedRunsRef,
    lastEventTimeRef: v2Processor.lastEventTimeRef,
    onStateUpdate: v2Processor.applyTransformResult,
    onRunFinished: v2Processor.handleRunFinished,
    onReconcile: refetchMessages as () => void,
    onTimeout: v2Processor.markTimedOut,
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

  // Artifacts (transparency)
  const { artifactState, handleArtifactClick, closeArtifact } =
    useArtifactState();

  // File artifact viewer panel state
  const [fileArtifactPanel, setFileArtifactPanel] = useState<{
    isOpen: boolean;
    fileId?: string;
    fileName?: string;
    artifactType?: string;
    mimeType?: string;
    downloadUrl?: string;
    pdfDownloadUrl?: string;
  }>({ isOpen: false });

  const handleFileArtifactClick = useCallback(
    async (
      fileId: string,
      fileName: string,
      artifactType: string,
      mimeType: string,
      pdfPreviewFileId?: string,
    ) => {
      onCollapseSidebar();
      setFileArtifactPanel({
        isOpen: true,
        fileId,
        fileName,
        artifactType,
        mimeType,
      });
      // Fetch PPTX download URL and PDF preview URL in parallel
      const [pptxResult, pdfResult] = await Promise.allSettled([
        fileUploadService.getDownloadUrl(conversationId, fileId),
        pdfPreviewFileId
          ? fileUploadService.getDownloadUrl(conversationId, pdfPreviewFileId)
          : Promise.resolve(null),
      ]);
      if (pptxResult.status === "rejected") {
        console.error(
          "[useChatV2] Failed to get artifact download URL:",
          pptxResult.reason,
        );
      }
      if (pdfResult.status === "rejected") {
        console.error(
          "[useChatV2] Failed to get PDF preview URL:",
          pdfResult.reason,
        );
      }
      const downloadUrl =
        pptxResult.status === "fulfilled"
          ? pptxResult.value.downloadUrl
          : undefined;
      const pdfDownloadUrl =
        pdfResult.status === "fulfilled" && pdfResult.value
          ? pdfResult.value.downloadUrl
          : undefined;
      setFileArtifactPanel((prev) =>
        prev.fileId === fileId
          ? { ...prev, downloadUrl, pdfDownloadUrl }
          : prev,
      );
    },
    [conversationId, onCollapseSidebar],
  );

  const closeFileArtifactPanel = useCallback(() => {
    setFileArtifactPanel({ isOpen: false });
  }, []);

  const handleArtifactDownload = useCallback(
    async (fileId: string) => {
      try {
        const { downloadUrl, fileName } =
          await fileUploadService.getDownloadUrl(conversationId, fileId);
        await downloadBlob(downloadUrl, fileName);
        showToast({ message: "Download started", variant: "success" });
      } catch (err) {
        console.error("[useChatV2] Failed to download artifact:", err);
        showToast({ message: "Failed to download file", variant: "error" });
      }
    },
    [conversationId, showToast, downloadBlob],
  );

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
        agentArtifactsByRunId,
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
      agentArtifactsByRunId,
    ],
  );

  // Message filtering state
  const showMessagesFromIndex = useChatStore(
    (state) => state.showMessagesFromIndex[conversationId] ?? 0,
  );

  // Tool approval/rejection
  const handleApproval = useCallback(
    async (toolCallId: string, runId: string) => {
      const effectiveRunId = v2ProcessorRef.current?.currentRunId ?? runId;
      await handleToolApproval(toolCallId, effectiveRunId, conversationId);
    },
    [conversationId],
  );

  const handleRejection = useCallback(
    async (toolCallId: string, runId: string) => {
      const effectiveRunId = v2ProcessorRef.current?.currentRunId ?? runId;
      await handleToolRejection(toolCallId, effectiveRunId, conversationId);
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

  // Force-complete any streaming assistant messages before sending a new one
  // (back-to-back scenario: previous response must be persisted first)
  const forceCompleteStreamingMessages = useCallback(() => {
    const messages = useChatStore.getState().messages[conversationId] || [];
    const processor = v2ProcessorRef.current;

    for (const msg of messages) {
      if (msg.role === "assistant" && msg.isStreaming) {
        const persistedContent = processor?.finalResponse || undefined;
        const persistedStopped = processor?.stoppedByUser;
        const currentRunId = processor?.currentRunId;
        const persistedEvents = currentRunId
          ? processor?.eventsRef.current.get(currentRunId)
          : undefined;

        useChatStore
          .getState()
          .forceCompleteMessage(
            conversationId,
            msg.id,
            persistedContent,
            persistedStopped,
            persistedEvents,
          );
      }
    }
  }, [conversationId]);

  // Send message handler
  const handleSendMessage = useCallback(
    async (
      content: string,
      _attachments?: FileAttachment[],
      options?: SendMessageOptions,
    ) => {
      lastUserMessageRef.current = content;

      // Clear any stale pending-stop flag so the new run's events aren't swallowed
      v2Processor.clearPendingStop();

      // Persist any in-flight V2 state before sending a new message
      forceCompleteStreamingMessages();

      const currentMessages =
        useChatStore.getState().messages[conversationId] || [];
      if (currentMessages.length === 0 && options?.agentMode) {
        // Update conversation mode before sending first message
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

      sendMessage({ conversationId, content, fileAttachments });
      clearFileAttachments();
    },
    [
      conversationId,
      v2Processor.clearPendingStop,
      forceCompleteStreamingMessages,
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

    // Artifacts (transparency)
    artifactState,
    handleArtifactClick,
    closeArtifact,

    // File artifacts (agent-generated documents)
    fileArtifactPanel,
    handleFileArtifactClick,
    closeFileArtifactPanel,
    handleArtifactDownload,

    // Submit guard
    canSubmitFinal: props.canSubmit && (!hasFileAttachments || allUploaded),
  };
}
