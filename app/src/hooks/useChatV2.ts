/**
 * useChatV2 - Orchestrator hook for V2 chat container
 *
 * Composes all V2-specific hooks and returns everything
 * the ChatV2Container needs to render. Business logic only — no JSX.
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
  EmailDraftArtifact,
} from "@vonlabs/design-components";

import { ConversationMode } from "@vonlabs/design-components";
import { ReferenceType } from "../types/conversation";
import type {
  MessageWithStreaming,
  Conversation,
  MessageReference,
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
import { useAgentArtifacts, agentArtifactKeys } from "./useAgentArtifacts";
import { useArtifactCreatedEvent } from "./useArtifactCreatedEvent";
import { useWriteBlockedEvent } from "./useWriteBlockedEvent";
import { useEmailDraftArtifact } from "./useEmailDraftArtifact";
import { useEmailDraftCreatedEvent } from "./useEmailDraftCreatedEvent";
import { useEmlDraftArtifacts } from "./useEmlDraftArtifacts";
import { useMessagesWithEmailDraft } from "./useMessagesWithEmailDraft";
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
  lockedConversationMode: ConversationMode;
  isAgentLocked: boolean;
  canSubmit: boolean;
  onDisabledInteraction: () => void;
  salesforceInstanceUrl?: string;
  isSlashCommandsEnabled: boolean;
  isActionsEnabled: boolean;
  isDeepLinksEnabled: boolean;
  isSourcesEnabled: boolean;
  isFileUploadEnabled: boolean;
  syncConversationModeToBackend: (mode: ConversationMode) => Promise<void>;
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
    lockedConversationMode,
    syncConversationModeToBackend,
    onCollapseSidebar,
    references,
  } = props;

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { downloadBlob } = useFileDownload();

  const chatType: ConversationMode =
    currentConversation.mode || ConversationMode.Auto;

  // Deep research mode is active if:
  // 1. Agent is locked to dashboard-builder (has messages), OR
  // 2. Conversation mode is dashboard-builder (backend confirmed)
  const isDeepResearchMode =
    (lockedConversationMode === ConversationMode.DashboardBuilder ||
      chatType === ConversationMode.DashboardBuilder) &&
    conversationMessages.length > 0;

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

    // Invalidate artifact cache for the current run so the query re-fires.
    // At this point notify_pending_artifacts has already written to Redis,
    // so the re-query will find inflight data and start polling.
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

  // Collect email draft refs from artifact_created Pusher events (live path)
  const emailDraftCreatedRefs = useEmailDraftCreatedEvent(channel, conversationId);

  // Merge refs from both sources: TOOL_CALL_RESULT events (page refresh / replay)
  // and artifact_created Pusher events (live path), deduped by artifactId.
  const emailDraftRefs = useMemo(() => {
    const seen = new Set<string>();
    const merged: { artifactId: string; runId: string }[] = [];
    for (const ref of [
      ...v2Processor.emailDraftArtifactRefs,
      ...emailDraftCreatedRefs,
    ]) {
      if (!seen.has(ref.artifactId)) {
        seen.add(ref.artifactId);
        merged.push(ref);
      }
    }
    return merged;
  }, [v2Processor.emailDraftArtifactRefs, emailDraftCreatedRefs]);

  // Fetch all email draft artifacts in parallel (draft_card path — backward compat)
  const fetchedEmailDraftArtifacts = useEmailDraftArtifact(
    conversationId,
    emailDraftRefs,
  );

  // Extract .eml file refs from agent artifacts (EML file path).
  // Skip pending artifacts — their IDs are fake placeholders that would fail getDownloadUrl.
  const emlFileRefs = useMemo(() => {
    if (!agentArtifactsByRunId) return [];
    const refs: { fileId: string; runId: string }[] = [];
    for (const [runId, files] of agentArtifactsByRunId) {
      for (const f of files) {
        if (
          (f.artifactType === "email_draft" || f.fileName?.endsWith(".eml")) &&
          !f.isPending
        ) {
          refs.push({ fileId: f.id, runId });
        }
      }
    }
    return refs;
  }, [agentArtifactsByRunId]);

  // Fetch and parse EML file content from S3
  const emlDraftArtifacts = useEmlDraftArtifacts(conversationId, emlFileRefs);

  // Group EML-based artifacts by runId (draftId === fileId, so look up via emlFileRefs)
  const emlDraftsByRunId = useMemo(() => {
    const map = new Map<string, EmailDraftArtifact[]>();
    for (const artifact of emlDraftArtifacts) {
      const ref = emlFileRefs.find((r) => r.fileId === artifact.draftId);
      if (!ref) continue;
      const existing = map.get(ref.runId) ?? [];
      map.set(ref.runId, [...existing, artifact]);
    }
    return map;
  }, [emlDraftArtifacts, emlFileRefs]);

  // Group draft_card-based artifacts by runId (draftId === artifactId)
  const fetchedDraftsByRunId = useMemo(() => {
    const map = new Map<string, EmailDraftArtifact[]>();
    for (const artifact of fetchedEmailDraftArtifacts) {
      const ref = emailDraftRefs.find((r) => r.artifactId === artifact.draftId);
      if (!ref) continue;
      const existing = map.get(ref.runId) ?? [];
      map.set(ref.runId, [...existing, artifact]);
    }
    return map;
  }, [fetchedEmailDraftArtifacts, emailDraftRefs]);

  // Merge both maps, deduped by draftId within each runId
  const allDraftsByRunId = useMemo(() => {
    const merged = new Map(emlDraftsByRunId);
    for (const [runId, artifacts] of fetchedDraftsByRunId) {
      const existing = merged.get(runId) ?? [];
      const seen = new Set(existing.map((a) => a.draftId));
      const toAdd = artifacts.filter((a) => !seen.has(a.draftId));
      if (toAdd.length > 0) merged.set(runId, [...existing, ...toAdd]);
    }
    return merged;
  }, [emlDraftsByRunId, fetchedDraftsByRunId]);

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
        isAwaitingApproval: v2Processor.isAwaitingApproval,
        researchResults: v2Processor.researchResults,
        stoppedByUser: v2Processor.stoppedByUser,
        runErrorMessage: v2Processor.runErrorMessage,
        currentRunId: v2Processor.currentRunId,
        agentArtifactsByRunId,
        phase: v2Processor.phase,
        dashboard: v2Processor.dashboard,
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
      v2Processor.phase,
      v2Processor.dashboard,
    ],
  );

  const messages = useMessagesWithEmailDraft(
    transformedMessages,
    allDraftsByRunId,
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

  // Transparency handler
  const handleTransparencyClick = useCallback(
    (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (message?.runId) {
        setTransparencyRunId(message.runId);
        setIsTransparencyOpen(true);
      }
    },
    [messages],
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

      // If awaiting approval, invalidate the old run so its events don't interfere
      if (v2Processor.isAwaitingApproval) {
        v2Processor.invalidateApproval();
      }

      // Persist any in-flight V2 state before sending a new message
      forceCompleteStreamingMessages();

      const currentMessages =
        useChatStore.getState().messages[conversationId] || [];
      if (currentMessages.length === 0 && options?.agentMode) {
        // Update conversation mode before sending first message
        await syncConversationModeToBackend(options.agentMode);
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

      // Merge static references (e.g. dashboard page) with dynamic mention references
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
            }
          : undefined,
      });
      clearFileAttachments();
    },
    [
      v2Processor,
      forceCompleteStreamingMessages,
      conversationId,
      hasFileAttachments,
      sendMessage,
      clearFileAttachments,
      syncConversationModeToBackend,
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
    // Mode
    isDeepResearchMode,

    // V2 live data
    isDeepResearchRunning: v2Processor.isDeepResearchRunning,
    phase: v2Processor.phase,
    dashboard: v2Processor.dashboard,

    // Messages
    transformedMessages: messages,
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

    // Write-blocked banner
    writeBlocked,
    dismissWriteBlocked,

    // Submit guard
    canSubmitFinal: props.canSubmit && (!hasFileAttachments || allUploaded),
  };
}
