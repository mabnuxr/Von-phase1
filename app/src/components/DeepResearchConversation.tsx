/**
 * DeepResearchConversation - Complete conversation UI for Deep Research mode
 *
 * Encapsulates all deep research specific components:
 * - DeepResearchChat for message rendering
 * - DeepResearchNotificationBar for running status
 * - ChatInputSelector for user input
 * - DataTablesDrawer for viewing IQ artifacts during approval flow
 * - TransparencyDrawer for viewing all artifacts (Data, Calls, Deep Research tabs) after completion
 *
 * This component is rendered instead of Chat when in deep research mode.
 */

import React, { useCallback, useMemo, useState, useRef } from "react";
import {
  DeepResearchChat,
  DeepResearchNotificationBar,
  ChatInputSelector,
  DeepResearchDataTablesDrawer,
  useAutoScroll,
  ScrollToBottomButton,
} from "@vonlabs/design-components";
import type {
  Message,
  SendMessageOptions,
  FileAttachment,
} from "@vonlabs/design-components";

/** Ref handle for ChatInputSelector */
interface ChatInputSelectorRef {
  focus: () => void;
}
import { useDeepResearchArtifacts } from "../hooks/useMessageArtifacts";
import { useDataTablesDrawer } from "../hooks/useDataTablesDrawer";
import { LazyTransparencyDrawer } from "./LazyTransparencyDrawer";

export interface ResearchResultsState {
  isStreaming: boolean;
  isCompleted: boolean;
  content: string;
  metadata: {
    plan_id?: string;
    execution_id?: string;
    status?: "completed" | "partial_failure";
    total_records?: number;
    data_sources?: Array<{
      name: string;
      record_count: number;
      description?: string;
    }>;
    requires_approval?: boolean;
    estimated_time?: string;
    run_id?: string;
  } | null;
  messageId: string | null;
}

export interface DeepResearchConversationProps {
  /** Messages to display */
  messages: Message[];
  /** User's first name for display */
  userName?: string;
  /** User's email for avatar */
  userEmail?: string;
  /** Conversation ID for API calls */
  conversationId: string | null;
  /** Research results state from Pusher */
  researchResults?: ResearchResultsState;
  /** Whether deep research is currently running */
  isDeepResearchRunning?: boolean;
  /** Callback when message is sent */
  onSendMessage?: (
    content: string,
    attachments?: FileAttachment[],
    options?: SendMessageOptions,
  ) => void;
  /** Callback when stop streaming is requested */
  onStopStreaming?: (conversationId: string) => void;
  /** Callback when artifact is clicked */
  onArtifactClick?: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string,
  ) => void;
  /** Callback when approval is triggered */
  onApprove?: (stepId: string, runId: string) => void;
  /** Callback when rejection is triggered */
  onReject?: (stepId: string, runId: string) => void;
  /** Placeholder text for input */
  placeholder?: string;
  /** Whether submission is disabled */
  disableSubmit?: boolean;
  /** Callback when input while disabled */
  onInputWhileDisabled?: () => void;
  /** Whether slash commands are enabled */
  enableCommands?: boolean;
  /** Callback when thumbs up is clicked */
  onLike?: (messageId: string) => void;
  /** Callback when thumbs down is clicked */
  onDislike?: (messageId: string) => void;
}

export const DeepResearchConversation: React.FC<
  DeepResearchConversationProps
> = ({
  messages,
  userName,
  userEmail,
  conversationId,
  researchResults,
  isDeepResearchRunning = false,
  onSendMessage,
  onStopStreaming,
  onArtifactClick,
  onApprove,
  onReject,
  placeholder = "Ask von anything",
  disableSubmit = false,
  onInputWhileDisabled,
  enableCommands = false,
  onLike,
  onDislike,
}) => {
  // DataTables drawer state (for approval flow)
  const [isDataTablesOpen, setIsDataTablesOpen] = useState(false);
  const [dataTablesRunId, setDataTablesRunId] = useState<string | null>(null);

  // Transparency drawer state (for Sources button after completion)
  const [isTransparencyDrawerOpen, setIsTransparencyDrawerOpen] =
    useState(false);

  // Track if user has skipped the approval flow
  const [hasSkipped, setHasSkipped] = useState(false);

  // Ref for the chat input to focus on skip
  const chatInputRef = useRef<ChatInputSelectorRef>(null);

  // Get runId from the last assistant message (works for both sample run and full analysis)
  // Also check if the sample run is complete (has v2FinalResponse and not streaming)
  const { lastAssistantRunId, isSampleRunComplete } = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.type === "assistant" && msg.runId) {
        // Sample run is complete when v2FinalResponse exists and not streaming
        const isComplete = !!msg.v2FinalResponse && !msg.isStreaming;
        return {
          lastAssistantRunId: msg.runId,
          isSampleRunComplete: isComplete,
        };
      }
    }
    return { lastAssistantRunId: null, isSampleRunComplete: false };
  }, [messages]);

  // Full analysis is complete when researchResults.isCompleted is true
  const isFullAnalysisComplete = researchResults?.isCompleted ?? false;

  // Can open drawers when either sample run or full analysis is complete
  const canOpenDrawers = isSampleRunComplete || isFullAnalysisComplete;

  // Fetch artifact summaries for both drawers when either sample run or full analysis completes
  const {
    dataTablesInfo: vonIqDataTablesInfo,
    allArtifacts: artifactSummaries,
    isLoading: isArtifactsLoading,
  } = useDeepResearchArtifacts(
    conversationId,
    lastAssistantRunId,
    canOpenDrawers,
  );

  // DataTablesDrawer hook for content loading (for approval flow)
  const {
    tables: dataTablesTables,
    isLoading: isDrawerLoading,
    isTableLoading,
  } = useDataTablesDrawer({
    isOpen: isDataTablesOpen,
    conversationId,
    runId: dataTablesRunId,
    enabled: canOpenDrawers,
  });

  // Handle DataTablesCard click - opens DataTables drawer (during approval flow)
  const handleDataTablesClick = useCallback(() => {
    if (lastAssistantRunId && isSampleRunComplete) {
      setDataTablesRunId(lastAssistantRunId);
      setIsDataTablesOpen(true);
    }
  }, [lastAssistantRunId, isSampleRunComplete]);

  // Handle closing the DataTables drawer
  const handleCloseDataTables = useCallback(() => {
    setIsDataTablesOpen(false);
    setDataTablesRunId(null);
  }, []);

  // Handle Sources click - opens Transparency drawer (after research completes)
  const handleSourcesClick = useCallback(() => {
    if (lastAssistantRunId && canOpenDrawers) {
      setIsTransparencyDrawerOpen(true);
    }
  }, [lastAssistantRunId, canOpenDrawers]);

  // Handle skip click - focus the chat input without sending a message
  const handleSkip = useCallback(() => {
    // Hide the approval buttons
    setHasSkipped(true);
    // Focus the chat input using ref
    chatInputRef.current?.focus();
  }, []);

  // Handle closing the Transparency drawer
  const handleCloseTransparencyDrawer = useCallback(() => {
    setIsTransparencyDrawerOpen(false);
  }, []);

  // Handle stop streaming
  const handleStop = useCallback(() => {
    const lastMessage = messages[messages.length - 1];
    const msgConversationId = lastMessage?.conversationId;
    if (msgConversationId && onStopStreaming) {
      onStopStreaming(msgConversationId);
    }
  }, [messages, onStopStreaming]);

  // Check if currently streaming
  const isStreaming = messages.some(
    (m) => m.type === "assistant" && m.isStreaming === true,
  );

  // Auto-scroll hook for chat-style scroll behavior
  const { containerRef, scrollToBottom, showScrollButton, onBeforeSend } =
    useAutoScroll([messages], isStreaming);

  // Wrap onSendMessage to trigger scroll before sending
  const handleSendMessage = useCallback(
    (
      content: string,
      attachments?: FileAttachment[],
      options?: SendMessageOptions,
    ) => {
      onBeforeSend();
      onSendMessage?.(content, attachments, options);
    },
    [onBeforeSend, onSendMessage],
  );

  return (
    <div className="relative flex flex-col overflow-hidden bg-white antialiased font-sf rounded-lg border border-gray-200 shadow-xs w-full h-full">
      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto flex flex-col bg-white chat-messages-wrapper"
      >
        <DeepResearchChat
          messages={messages}
          userName={userName}
          userEmail={userEmail}
          researchResults={researchResults}
          isDeepResearchRunning={isDeepResearchRunning}
          dataTablesInfo={vonIqDataTablesInfo ?? undefined}
          isDataTablesLoading={isArtifactsLoading}
          onSendMessage={(content) => handleSendMessage(content)}
          onSkip={handleSkip}
          hasSkipped={hasSkipped}
          onDataTablesClick={handleDataTablesClick}
          onSourcesClick={handleSourcesClick}
          onArtifactClick={onArtifactClick}
          onApprove={onApprove}
          onReject={onReject}
          onLike={onLike}
          onDislike={onDislike}
        />

        {/* Scroll to bottom button */}
        <ScrollToBottomButton
          visible={showScrollButton && messages.length > 0}
          onClick={() => scrollToBottom("smooth")}
        />
      </div>

      {/* Deep Research Notification Bar */}
      <div className="px-4 max-w-4xl mx-auto w-full">
        <DeepResearchNotificationBar isVisible={isDeepResearchRunning} />
      </div>

      {/* Chat Input */}
      {messages.length > 0 && (
        <ChatInputSelector
          ref={chatInputRef}
          useStandardInput={true}
          enableCommands={enableCommands}
          placeholder={placeholder}
          onSend={handleSendMessage}
          onStop={handleStop}
          disabled={isStreaming}
          isStreaming={isStreaming}
          disableSubmit={disableSubmit}
          onDisabledInput={onInputWhileDisabled}
          isAgentLocked={true}
          lockedAgentMode="deep-research"
          showPlusMenu={true}
        />
      )}

      {/* DataTables Drawer - for approval flow (shows IQ artifacts) */}
      <DeepResearchDataTablesDrawer
        isOpen={isDataTablesOpen}
        onClose={handleCloseDataTables}
        title="Data Reference"
        tables={dataTablesTables}
        totalRecords={vonIqDataTablesInfo?.totalRecords}
        isLoading={isDrawerLoading}
        isTableLoading={isTableLoading}
      />

      {/* Transparency Drawer - shows Data, Calls, and Deep Research tabs */}
      <LazyTransparencyDrawer
        isOpen={isTransparencyDrawerOpen}
        onClose={handleCloseTransparencyDrawer}
        title="Sources"
        conversationId={conversationId}
        runId={lastAssistantRunId}
        artifactSummaries={artifactSummaries}
        isListLoading={isArtifactsLoading}
      />
    </div>
  );
};

export default DeepResearchConversation;
