import React, { useMemo, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatMarkdown } from './ChatMarkdown';
import { MarkdownActionCard } from './DeepResearch/MarkdownActionCard';
import { DataTablesCard } from './DeepResearch/DataTablesCard';
import { DeepResearchResults } from './DeepResearch/DeepResearchResults';
import { ExpensiveOperationModal } from '../popups/ExpensiveOperationModal';
import { TimelineThinkingProcess } from '../TimelineThinkingProcess';
import { MessageActions } from './MessageActions';
import { DashboardPanel } from './DashboardPanel';
import type { Message } from './types';
import type { ResearchResultsMetadata } from './DeepResearch/types';

/**
 * Von Logo Avatar component - shared across deep research UI
 */
const VonLogoAvatar: React.FC = () => (
  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
        fill="url(#paint0_radial_deep_research_chat)"
      />
      <path
        d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
        stroke="white"
        strokeWidth="1.33"
      />
      <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
      <defs>
        <radialGradient
          id="paint0_radial_deep_research_chat"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)"
        >
          <stop stopColor="#FFF3EB" />
          <stop offset="0.26" stopColor="#FF9042" />
          <stop offset="1" stopColor="#854FFF" />
        </radialGradient>
      </defs>
    </svg>
  </div>
);

export interface DashboardMetadata {
  dashboard_id: string;
  dashboard_name: string;
  dashboard_version: number;
  panel_count: number;
  query_count: number;
}

export interface DeepResearchChatProps {
  /** Messages to display */
  messages: Message[];
  /** User name for display */
  userName?: string;
  /** User email for avatar */
  userEmail?: string;
  /** Research results state */
  researchResults?: {
    isStreaming: boolean;
    isCompleted: boolean;
    content: string;
    metadata: ResearchResultsMetadata | null;
    messageId: string | null;
  };
  /** Whether deep research is currently running */
  isDeepResearchRunning?: boolean;
  /** Data tables info for the approval card */
  dataTablesInfo?: {
    tableCount: number;
    processedRecords?: number;
    totalRecords?: number;
  };
  /** Whether data tables info is loading */
  isDataTablesLoading?: boolean;
  /** Dashboard metadata (when dashboard is created) */
  dashboard?: DashboardMetadata;
  /** Callback when send message is triggered */
  onSendMessage?: (content: string) => void;
  /** Callback when skip button is clicked (should focus input without sending message) */
  onSkip?: () => void;
  /** Whether the user has skipped the approval flow */
  hasSkipped?: boolean;
  /** Callback when data tables card is clicked (opens DataTablesDrawer) */
  onDataTablesClick?: () => void;
  /** Callback when sources button is clicked (opens TransparencyDrawer) */
  onSourcesClick?: () => void;
  /** Callback when artifact is clicked */
  onArtifactClick?: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;
  /** Callback when approval is triggered */
  onApprove?: (stepId: string, runId: string) => void;
  /** Callback when rejection is triggered */
  onReject?: (stepId: string, runId: string) => void;
  /** Callback when thumbs up is clicked */
  onLike?: (messageId: string) => void;
  /** Callback when thumbs down is clicked */
  onDislike?: (messageId: string) => void;
  /** Optional navigation callback for dashboard links — provide React Router's navigate for SPA navigation */
  onNavigate?: (url: string) => void;
}

/**
 * DeepResearchChat - Specialized chat component for deep research mode
 *
 * This component handles the unique UI flow for deep research:
 * 1. User messages rendered normally
 * 2. Assistant thinking process (TimelineThinkingProcess)
 * 3. Either approval card OR research results
 *
 * Keeps the main Chat component clean by separating deep research logic.
 */
export const DeepResearchChat: React.FC<DeepResearchChatProps> = ({
  messages,
  userName,
  userEmail,
  researchResults,
  isDeepResearchRunning,
  dataTablesInfo,
  isDataTablesLoading = false,
  dashboard,
  onSendMessage,
  onSkip,
  hasSkipped = false,
  onDataTablesClick,
  onSourcesClick,
  onArtifactClick,
  onApprove,
  onReject,
  onLike,
  onDislike,
  onNavigate,
}) => {
  // State for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Handle run full analysis click - show confirmation modal
  const handleRunFullAnalysisClick = () => {
    setShowConfirmModal(true);
  };

  // Handle confirmation - send the message and close modal
  const handleConfirmAnalysis = () => {
    setShowConfirmModal(false);
    onSendMessage?.('Run full analysis and create the dashboard');
  };

  // Handle cancel - just close the modal
  const handleCancelAnalysis = () => {
    setShowConfirmModal(false);
  };

  // Find the last assistant message for approval flow
  // SOLE CRITERIA: Show approval buttons only when phase === "plan-proposed"
  const approvalMessage = useMemo(() => {
    // Don't show approval if research results are streaming/completed
    if (researchResults?.isCompleted || researchResults?.isStreaming) return null;

    // Check if any assistant message is still streaming
    if (messages.some((m) => m.type === 'assistant' && m.isStreaming)) return null;

    // Find the last assistant message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.type !== 'assistant') return null;

    // Must have v2FinalResponse (sample analysis completed)
    if (!lastMessage.v2FinalResponse || lastMessage.isStreaming) return null;

    // Only show buttons when phase is "plan-proposed"
    if (lastMessage.phase !== 'plan-proposed') return null;

    return lastMessage;
  }, [messages, researchResults]);

  // Show research results when available
  const showResearchResults =
    researchResults &&
    (researchResults.isStreaming || researchResults.isCompleted) &&
    researchResults.content;

  return (
    <div className="flex flex-col">
      {/* Render all messages */}
      {messages.map((message) => {
        const isApprovalMessage =
          approvalMessage &&
          (message.id === approvalMessage.id || message.messageId === approvalMessage.messageId);

        // User messages - render normally
        if (message.type === 'user') {
          return (
            <div key={message.id} className="mb-4">
              <ChatMessage
                type="user"
                content={message.content}
                timestamp={message.timestamp}
                userName={userName}
                userEmail={userEmail}
                messageId={message.messageId || message.id}
                conversationId={message.conversationId}
              />
            </div>
          );
        }

        // Check if this is the last assistant message (the one associated with current research flow)
        const isLastAssistant = (() => {
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].type === 'assistant') {
              return messages[i].id === message.id;
            }
          }
          return false;
        })();

        // Special rendering for last assistant message with dashboard (no research results)
        if (
          isLastAssistant &&
          !showResearchResults &&
          dashboard &&
          message.v2FinalResponse &&
          !message.isStreaming
        ) {
          return (
            <div key={message.id} className="max-w-4xl mx-auto w-full">
              <div className="flex gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <VonLogoAvatar />
                </div>
                <div className="flex-1 space-y-3 min-w-0">
                  {message.timelineSteps && message.timelineSteps.length > 0 && (
                    <TimelineThinkingProcess
                      steps={message.timelineSteps}
                      isThinking={message.isStreaming}
                      initiallyCollapsed={!message.isStreaming && !!message.v2FinalResponse}
                      elapsedTime={message.thinkingElapsedTime}
                      onApprove={(stepId) => {
                        if (message.runId) onApprove?.(stepId, message.runId);
                      }}
                      onReject={(stepId) => {
                        if (message.runId) onReject?.(stepId, message.runId);
                      }}
                      onArtifactClick={onArtifactClick}
                    />
                  )}
                  <ChatMarkdown
                    content={message.v2FinalResponse}
                    isStreaming={false}
                    className="text-sm text-gray-700"
                  />
                  <DashboardPanel dashboard={dashboard} onNavigate={onNavigate} />
                  <MessageActions
                    messageContent={message.v2FinalResponse}
                    messageId={message.messageId || message.id}
                    onLike={onLike}
                    onDislike={onDislike}
                    showTransparency={false}
                  />
                </div>
              </div>
            </div>
          );
        }

        if (isApprovalMessage || (isLastAssistant && showResearchResults)) {
          return (
            <div key={message.id} className="max-w-4xl mx-auto w-full">
              <div className="flex gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <VonLogoAvatar />
                </div>
                <div className="flex-1 space-y-3 min-w-0">
                  {message.timelineSteps && message.timelineSteps.length > 0 && (
                    <TimelineThinkingProcess
                      steps={message.timelineSteps}
                      isThinking={message.isStreaming}
                      initiallyCollapsed={!message.isStreaming && !!message.v2FinalResponse}
                      elapsedTime={message.thinkingElapsedTime}
                      onApprove={(stepId) => {
                        if (message.runId) onApprove?.(stepId, message.runId);
                      }}
                      onReject={(stepId) => {
                        if (message.runId) onReject?.(stepId, message.runId);
                      }}
                      onArtifactClick={onArtifactClick}
                    />
                  )}
                  {/* Approval card with DataTablesCard as beforeActions */}
                  {isApprovalMessage && (
                    <MarkdownActionCard
                      variant="analysis-request"
                      markdown={
                        approvalMessage.v2FinalResponse ||
                        'Would you like me to proceed with the full comprehensive analysis?'
                      }
                      isStreaming={false}
                      primaryAction={
                        !hasSkipped
                          ? {
                              label: 'Create Dashboard',
                              onClick: handleRunFullAnalysisClick,
                              disabled: isDeepResearchRunning,
                              isLoading: isDeepResearchRunning,
                            }
                          : undefined
                      }
                      secondaryAction={
                        !hasSkipped
                          ? {
                              label: 'Skip',
                              onClick: () => {
                                // Call onReject to update backend phase to "plan-rejected"
                                if (approvalMessage?.messageId && approvalMessage?.runId) {
                                  onReject?.(approvalMessage.messageId, approvalMessage.runId);
                                }
                                // Also call onSkip to hide buttons and focus input
                                onSkip?.();
                              },
                              disabled: isDeepResearchRunning,
                            }
                          : undefined
                      }
                      beforeActions={
                        (dataTablesInfo || isDataTablesLoading) && onDataTablesClick ? (
                          <DataTablesCard
                            tableCount={dataTablesInfo?.tableCount ?? 0}
                            processedRecords={dataTablesInfo?.processedRecords}
                            totalRecords={dataTablesInfo?.totalRecords}
                            onClick={onDataTablesClick}
                            isLoading={isDataTablesLoading}
                          />
                        ) : undefined
                      }
                    />
                  )}
                  {/* Research Results - Show when streaming/completed (alongside thinking process) */}
                  {isLastAssistant && showResearchResults && researchResults && (
                    <>
                      {/* Summary text before the results card */}
                      {researchResults.isCompleted && (
                        <p className="text-sm text-gray-700">
                          I have completed the comprehensive analysis. Click on the card below to
                          see the full details.
                        </p>
                      )}
                      <DeepResearchResults
                        state={{
                          status: researchResults.isStreaming
                            ? 'streaming'
                            : researchResults.isCompleted
                              ? 'completed'
                              : 'idle',
                          messageId: researchResults.messageId,
                          metadata: researchResults.metadata,
                          content: researchResults.content,
                          totalLength: null,
                          checksum: null,
                          error: null,
                          startedAt: null,
                          completedAt: null,
                        }}
                      />
                      {/* Dashboard Panel - shown when dashboard is created */}
                      {researchResults.isCompleted && dashboard && (
                        <DashboardPanel dashboard={dashboard} onNavigate={onNavigate} />
                      )}
                      {/* Action buttons outside the card - using MessageActions for consistency */}
                      {researchResults.isCompleted && (
                        <MessageActions
                          messageContent={researchResults.content}
                          messageId={researchResults.messageId || ''}
                          onLike={onLike}
                          onDislike={onDislike}
                          onTransparencyClick={onSourcesClick}
                          showTransparency={!!onSourcesClick}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        }

        // Historical assistant messages - render with full ChatMessage (no sources action in deep research)
        return (
          <div key={message.id} className="mb-4">
            <ChatMessage
              type="assistant"
              content={message.content}
              timestamp={message.timestamp}
              isStreaming={message.isStreaming}
              messageId={message.messageId || message.id}
              conversationId={message.conversationId}
              timelineSteps={message.timelineSteps}
              thinkingProcessVersion="v2"
              v2FinalResponse={message.v2FinalResponse}
              onArtifactClick={onArtifactClick}
              onApprove={onApprove}
              onReject={onReject}
              runId={message.runId}
              showTransparency={false}
            />
          </div>
        );
      })}

      {/* Confirmation Modal */}
      <ExpensiveOperationModal
        isOpen={showConfirmModal}
        recordCount={dataTablesInfo?.totalRecords || researchResults?.metadata?.total_records || 0}
        estimatedTime={researchResults?.metadata?.estimated_time || '10-15 minutes'}
        onConfirm={handleConfirmAnalysis}
        onCancel={handleCancelAnalysis}
        operationName="Create Dashboard"
      />
    </div>
  );
};

export default DeepResearchChat;
