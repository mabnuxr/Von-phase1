/**
 * DeepResearchConversation - Complete conversation UI for Deep Research mode
 *
 * Encapsulates all deep research specific components:
 * - DeepResearchChat for message rendering
 * - DeepResearchNotificationBar for running status
 * - ChatInputSelector for user input
 * - DataTablesDrawer for VonIQ artifact viewing
 *
 * This component is rendered instead of Chat when in deep research mode.
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  DeepResearchChat,
  DeepResearchNotificationBar,
  ChatInputSelector,
  DeepResearchDataTablesDrawer,
} from "@vonlabs/design-components";
import type { Message, SendMessageOptions } from "@vonlabs/design-components";
import { useDataTablesDrawer } from "../hooks/useDataTablesDrawer";
import { useDeepResearchArtifacts } from "../hooks/useMessageArtifacts";

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
    attachments?: unknown[],
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
}) => {
  // DataTables drawer state
  const [isDataTablesOpen, setIsDataTablesOpen] = useState(false);
  const [dataTablesRunId, setDataTablesRunId] = useState<string | null>(null);

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

  // Fetch IQ artifact summaries for dataTablesInfo only after sample run completes
  const { dataTablesInfo: vonIqDataTablesInfo, isLoading: isArtifactsLoading } =
    useDeepResearchArtifacts(
      conversationId,
      lastAssistantRunId,
      isSampleRunComplete,
    );

  // DataTablesDrawer hook for content loading
  const {
    tables: dataTablesTables,
    isLoading: isDrawerLoading,
    isTableLoading,
  } = useDataTablesDrawer({
    isOpen: isDataTablesOpen,
    conversationId,
    runId: dataTablesRunId,
  });

  // Handle DataTablesCard click - opens DataTables drawer
  const handleDataTablesClick = useCallback(() => {
    if (lastAssistantRunId) {
      setDataTablesRunId(lastAssistantRunId);
      setIsDataTablesOpen(true);
    }
  }, [lastAssistantRunId]);

  // Handle closing the DataTables drawer
  const handleCloseDataTables = useCallback(() => {
    setIsDataTablesOpen(false);
    setDataTablesRunId(null);
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

  return (
    <div className="relative flex flex-col overflow-hidden bg-white antialiased font-sf rounded-lg border border-gray-200 shadow-xs w-full h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto flex flex-col bg-white chat-messages-wrapper">
        <DeepResearchChat
          messages={messages}
          userName={userName}
          userEmail={userEmail}
          researchResults={researchResults}
          isDeepResearchRunning={isDeepResearchRunning}
          dataTablesInfo={vonIqDataTablesInfo ?? undefined}
          isDataTablesLoading={isArtifactsLoading}
          onSendMessage={(content) => onSendMessage?.(content)}
          onDataTablesClick={handleDataTablesClick}
          onArtifactClick={onArtifactClick}
          onApprove={onApprove}
          onReject={onReject}
        />
      </div>

      {/* Deep Research Notification Bar */}
      <div className="px-4 max-w-4xl mx-auto w-full">
        <DeepResearchNotificationBar isVisible={isDeepResearchRunning} />
      </div>

      {/* Chat Input */}
      {messages.length > 0 && (
        <ChatInputSelector
          useStandardInput={true}
          enableCommands={enableCommands}
          placeholder={placeholder}
          onSend={onSendMessage}
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

      {/* DataTables Drawer */}
      <DeepResearchDataTablesDrawer
        isOpen={isDataTablesOpen}
        onClose={handleCloseDataTables}
        title="Data Reference"
        tables={dataTablesTables}
        totalRecords={vonIqDataTablesInfo?.totalRecords}
        isLoading={isDrawerLoading}
        isTableLoading={isTableLoading}
      />
    </div>
  );
};

export default DeepResearchConversation;
