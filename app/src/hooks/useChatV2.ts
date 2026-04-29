/**
 * useChatV2 - Orchestrator hook for V2 chat container
 *
 * Composes all V2-specific hooks and returns everything
 * chat leaf components need to render. Business logic only — no JSX.
 *
 * Handles both regular V2 chat and deep research mode.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "./useToast";
import { useFileDownload } from "./useFileDownload";
import type {
  SendMessageOptions,
  FileAttachment,
  MessageFileAttachment,
} from "@vonlabs/design-components";

import type {
  MessageWithStreaming,
  Conversation,
  MessageReference,
} from "../types/conversation";
import { buildMentionReferences } from "../lib/messageReferenceUtils";
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
import { useAgentArtifacts, agentArtifactKeys } from "./useAgentArtifacts";
import { useArtifactCreatedEvent } from "./useArtifactCreatedEvent";
import { useWriteBlockedEvent } from "./useWriteBlockedEvent";
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
  canSubmit: boolean;
  onDisabledInteraction: () => void;
  salesforceInstanceUrl?: string;
  isSlashCommandsEnabled: boolean;
  isActionsEnabled: boolean;
  isDeepLinksEnabled: boolean;
  isSourcesEnabled: boolean;
  isFileUploadEnabled: boolean;
  onCollapseSidebar: () => void;
  /** References (dashboard/widget context) to send with each message */
  references?: MessageReference[];
}

export function useChatV2(props: UseChatV2Props) {
  const {
    conversationId,
    user,
    currentConversation,
    conversationMessages,
    refetchMessages,
    onCollapseSidebar,
    references,
  } = props;

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { downloadBlob } = useFileDownload();

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
  const handleV2RunComplete = useCallback(async () => {
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

    // Await the message refetch so assistantRunIds (derived from
    // conversationMessages) includes the new runId. Backend guarantees the
    // assistant message is durable in Mongo BEFORE RUN_FINISHED fires, so
    // this refetch is sufficient to register the per-run query subscription.
    try {
      await refetchMessages();
    } catch (err) {
      console.error("[handleV2RunComplete] refetchMessages failed:", err);
    }

    // Invalidate the artifact query so the per-run subscription pulls fresh
    // FileMetadata. Backend has already registered rows in `processing`, so
    // this returns immediately with skeleton-eligible data; rows transition
    // to `completed` via Pusher events or refetchInterval polling.
    const runId = processor?.currentRunId;
    if (runId) {
      queryClient.invalidateQueries({
        queryKey: agentArtifactKeys.run(conversationId, runId),
      });
    }
  }, [conversationId, refetchMessages, queryClient]);

  // V2 event processing (AGUI events → timeline steps)
  const v2Processor = useV2EventProcessor(
    channel,
    conversationId,
    v2InitialRunEvents,
    handleV2RunComplete,
  );

  // Keep ref in sync with latest processor value
  v2ProcessorRef.current = v2Processor;

  const chatType = v2Processor.isDashboardBuilderMode
    ? ("dashboard-builder" as const)
    : currentConversation.mode || "auto";

  // User message + error processing (writes to chatStore)
  useUserMessageProcessor(channel, conversationId);

  // Agent-generated file artifacts (React Query + Pusher invalidation)
  useArtifactCreatedEvent(channel, conversationId);

  // Surface write-blocked notifications as banner above chat input
  const { writeBlocked, dismissWriteBlocked } = useWriteBlockedEvent(channel);

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
        isAwaitingApproval: v2Processor.isAwaitingApproval,
        researchResults: v2Processor.researchResults,
        stoppedByUser: v2Processor.stoppedByUser,
        runErrorMessage: v2Processor.runErrorMessage,
        currentRunId: v2Processor.currentRunId,
        agentArtifactsByRunId,
        dashboards: v2Processor.dashboards,
        executionId: v2Processor.executionId,
        isDashboardBuilderMode: v2Processor.isDashboardBuilderMode,
      }),
    [
      conversationMessages,
      v2Processor.timelineSteps,
      v2Processor.isThinking,
      v2Processor.elapsedTime,
      v2Processor.finalResponse,
      v2Processor.isFinalResponseStreaming,
      v2Processor.isAwaitingApproval,
      v2Processor.researchResults,
      v2Processor.stoppedByUser,
      v2Processor.runErrorMessage,
      v2Processor.currentRunId,
      agentArtifactsByRunId,
      v2Processor.dashboards,
      v2Processor.executionId,
      v2Processor.isDashboardBuilderMode,
    ],
  );

  // Message filtering state
  const showMessagesFromIndex = useChatStore(
    (state) => state.showMessagesFromIndex[conversationId] ?? 0,
  );

  // Tool approval/rejection
  const { resumeTimer, pauseTimerOnApprovalFailure } = v2Processor;
  const handleApproval = useCallback(
    async (toolCallId: string, runId: string) => {
      const effectiveRunId = v2ProcessorRef.current?.currentRunId ?? runId;
      resumeTimer();
      try {
        await handleToolApproval(toolCallId, effectiveRunId, conversationId);
      } catch {
        pauseTimerOnApprovalFailure();
      }
    },
    [conversationId, resumeTimer, pauseTimerOnApprovalFailure],
  );

  const handleRejection = useCallback(
    async (toolCallId: string, runId: string) => {
      const effectiveRunId = v2ProcessorRef.current?.currentRunId ?? runId;
      await handleToolRejection(toolCallId, effectiveRunId, conversationId);
    },
    [conversationId],
  );

  const handleExpire = useCallback((stepId: string) => {
    v2ProcessorRef.current?.expireApprovalStep(stepId);
  }, []);

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

  // Workflow execution plan approval (execute_workflow dry_run completed)
  // The backend's /resume endpoint calls create_message internally when
  // execution_id is provided, which creates the user message, assistant
  // message, sends Pusher events, and triggers the Temporal workflow.
  // We just need to call the API and refetch to pick up the new messages.
  const handlePlanApproval = useCallback(
    async (runId: string, executionId: string) => {
      const effectiveRunId = v2ProcessorRef.current?.currentRunId ?? runId;

      // Clear stale pending-stop flag so the new run's events aren't swallowed
      v2Processor.clearPendingStop();

      // Persist any in-flight V2 state before the new execution run
      forceCompleteStreamingMessages();

      resumeTimer();
      try {
        await handleToolApproval(
          "", // No toolCallId for plan approvals
          effectiveRunId,
          conversationId,
          executionId,
        );
        // Backend's /resume creates user + assistant messages via
        // create_message. Refetch so they appear in chatStore immediately
        // instead of waiting for reconciliation.
        refetchMessages();
      } catch {
        pauseTimerOnApprovalFailure();
      }
    },
    [
      conversationId,
      resumeTimer,
      pauseTimerOnApprovalFailure,
      v2Processor,
      forceCompleteStreamingMessages,
      refetchMessages,
    ],
  );

  const handlePlanRejection = useCallback(
    async (runId: string, executionId: string) => {
      const effectiveRunId = v2ProcessorRef.current?.currentRunId ?? runId;
      await handleToolRejection(
        "", // No toolCallId for plan rejections
        effectiveRunId,
        conversationId,
        executionId,
      );
    },
    [conversationId],
  );

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

      // If awaiting approval, invalidate the old run so its events don't interfere.
      // skipRefetch=true: forceCompleteStreamingMessages() below handles event
      // persistence, and refetching now would overwrite the new message's optimistic state.
      if (v2Processor.isAwaitingApproval) {
        v2Processor.invalidateApproval(true);
      }

      // Persist any in-flight V2 state before sending a new message
      forceCompleteStreamingMessages();

      let fileAttachments;
      if (hasFileAttachments) {
        try {
          fileAttachments = await uploadPendingFiles(conversationId);
        } catch (error) {
          console.error("[useChatV2] File upload failed:", error);
          return false;
        }
      }

      const mentionRefs = buildMentionReferences(options?.mentions ?? []);
      const allReferences =
        mentionRefs.length > 0
          ? [...(references ?? []), ...mentionRefs]
          : references;

      sendMessage({
        conversationId,
        content,
        fileAttachments,
        references: allReferences,
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
              accessLevel:
                options.command.sharingScope === "org" ? "tenant" : "user",
            }
          : undefined,
      });
      clearFileAttachments();
      return true;
    },
    [
      v2Processor,
      forceCompleteStreamingMessages,
      conversationId,
      hasFileAttachments,
      sendMessage,
      clearFileAttachments,
      uploadPendingFiles,
      references,
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
    // V2 live data
    isDeepResearchRunning: v2Processor.isDeepResearchRunning,
    dashboards: v2Processor.dashboards,
    liveDashboardKey: v2Processor.liveDashboardKey,

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
    handleExpire,
    handlePlanApproval,
    handlePlanRejection,

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

    // Write-blocked banner
    writeBlocked,
    dismissWriteBlocked,

    // Submit guard
    canSubmitFinal: props.canSubmit && (!hasFileAttachments || allUploaded),
  };
}
