import { useState } from 'react';
import { Streamdown } from 'streamdown';
import { chatRemarkPlugins } from './chatRemarkPlugins';
import { TimelineThinkingProcess } from '../TimelineThinkingProcess';
import type { TimelineStep } from '../TimelineThinkingProcess';
import { MessageAreaError } from './MessageAreaError';
import { SalesforceLink } from './SalesforceLink';
import { MarkdownActionCard } from './DeepResearch/MarkdownActionCard';
import { DeepResearchResults } from './DeepResearch/DeepResearchResults';
import { DashboardArtifactCard } from './ArtifactCards';
import { ExpensiveOperationModal } from '../popups/ExpensiveOperationModal';
import type { MessageStatus, DashboardMetadata } from './types';

export interface AssistantMessageV2Props {
  content: string;
  v2FinalResponse?: string;
  isStreaming?: boolean;
  status?: MessageStatus;
  errorMessage?: string;
  timelineSteps?: TimelineStep[];
  thinkingElapsedTime?: number;
  stoppedByUser?: boolean;
  isLatestMessage?: boolean;
  runId: string;
  salesforceInstanceUrl?: string;
  onApprove?: (toolCallId: string, runId: string) => void;
  onReject?: (toolCallId: string, runId: string) => void;
  /** Callback when an approval expires (TTL reached) */
  onExpire?: (stepId: string) => void;
  onArtifactClick?: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;
  // Dashboard builder / plan approval
  dashboards?: DashboardMetadata[];
  executionId?: string | null;
  isDashboardBuilderMode?: boolean;
  onApprovePlan?: (runId: string, executionId: string) => Promise<void> | void;
  onRejectPlan?: (runId: string, executionId: string) => void;
  onDashboardPreview?: (dashboardId: string, dashboardVersion: number) => void;
  // Research results
  researchResults?: {
    isStreaming: boolean;
    isCompleted: boolean;
    content: string;
    metadata: import('./DeepResearch/types').ResearchResultsMetadata | null;
    messageId: string | null;
  } | null;
}

export const AssistantMessageV2: React.FC<AssistantMessageV2Props> = ({
  v2FinalResponse,
  isStreaming = false,
  status,
  errorMessage,
  timelineSteps,
  thinkingElapsedTime,
  stoppedByUser,
  isLatestMessage,
  runId,
  salesforceInstanceUrl,
  onApprove,
  onReject,
  onExpire,
  onArtifactClick,
  dashboards = [],
  executionId,
  isDashboardBuilderMode = false,
  onApprovePlan,
  onRejectPlan,
  onDashboardPreview,
  researchResults,
}) => {
  const [showSkipConfirmModal, setShowSkipConfirmModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const isStoppedImmediately = stoppedByUser && (!timelineSteps || timelineSteps.length === 0);

  // Dashboard builder approval is pending on this message
  const showDashboardBuilderApproval =
    (isDashboardBuilderMode || executionId) &&
    executionId &&
    isLatestMessage &&
    status !== 'expired' &&
    status !== 'timeout' &&
    status !== 'failed';

  // Whether research results are actively being shown
  const showResearchResults =
    isLatestMessage &&
    researchResults &&
    (researchResults.isStreaming || researchResults.isCompleted) &&
    researchResults.content;

  const handleArtifactClick = (
    artifactId: string,
    toolName: string,
    artifactType: string,
    clickRunId: string
  ) => {
    onArtifactClick?.(artifactId, toolName, artifactType, clickRunId);
  };

  return (
    <>
      {/* Timeline thinking process - skip entirely when stopped before any events arrived */}
      {!isStoppedImmediately && (
        <div className="mb-4">
          <TimelineThinkingProcess
            steps={timelineSteps || []}
            isThinking={isStreaming && !stoppedByUser}
            isStreaming={isStreaming && !stoppedByUser}
            autoCollapse={
              !!v2FinalResponse ||
              status === 'timeout' ||
              status === 'expired' ||
              (status === 'failed' && !!errorMessage) ||
              !!stoppedByUser
            }
            elapsedTime={thinkingElapsedTime}
            onApprove={onApprove ? (stepId) => onApprove(stepId, runId) : undefined}
            onReject={onReject ? (stepId) => onReject(stepId, runId) : undefined}
            onExpire={onExpire}
            onArtifactClick={handleArtifactClick}
            salesforceInstanceUrl={salesforceInstanceUrl}
          />
        </div>
      )}

      {/* Error - shown below thinking process (failed only; timeout has its own indicator) */}
      {status === 'failed' && errorMessage && <MessageAreaError message={errorMessage} />}

      {/* Final Response - rendered after timeline (not shown on error) */}
      {v2FinalResponse &&
        status !== 'timeout' &&
        status !== 'expired' &&
        !(status === 'failed' && errorMessage) &&
        // When dashboard builder approval pending, render inside MarkdownActionCard instead
        !(showDashboardBuilderApproval && !isStreaming) && (
          <div className="markdown-content max-w-none">
            <Streamdown
              parseIncompleteMarkdown={isStreaming}
              isAnimating={isStreaming}
              controls={{ table: true }}
              components={{ a: SalesforceLink }}
              remarkPlugins={chatRemarkPlugins}
            >
              {v2FinalResponse}
            </Streamdown>
          </div>
        )}

      {/* Dashboard Builder Approval Card - "Create Dashboard" / "Skip" */}
      {showDashboardBuilderApproval && !isStreaming && (
        <>
          <MarkdownActionCard
            variant="analysis-request"
            markdown={v2FinalResponse || 'Your dashboard is now updated and saved.'}
            isStreaming={false}
            primaryAction={{
              label: 'Confirm Changes',
              onClick: async () => {
                if (!isApproving && executionId && runId && onApprovePlan) {
                  setIsApproving(true);
                  try {
                    await onApprovePlan(runId, executionId);
                  } catch {
                    setIsApproving(false);
                  }
                }
              },
              disabled: !executionId || !onApprovePlan || isApproving,
            }}
            secondaryAction={{
              label: 'Skip',
              onClick: () => setShowSkipConfirmModal(true),
            }}
          />
          <ExpensiveOperationModal
            isOpen={showSkipConfirmModal}
            onConfirm={() => {
              setShowSkipConfirmModal(false);
              if (executionId && runId && onRejectPlan) {
                onRejectPlan(runId, executionId);
              }
            }}
            onCancel={() => setShowSkipConfirmModal(false)}
            operationName="Skip Changes"
            description="Are you sure you want to skip? The proposed changes will not be applied to the dashboard."
          />
        </>
      )}

      {/* Dashboard Artifact Cards - shown when dashboards were created */}
      {dashboards.length > 0 && !isStreaming && !showDashboardBuilderApproval && !showResearchResults && (
        <div className="space-y-2">
          {dashboards.map((db) => (
            <DashboardArtifactCard
              key={db.dashboard_id}
              title={db.dashboard_name}
              onPreview={
                onDashboardPreview
                  ? () => onDashboardPreview(db.dashboard_id, db.dashboard_version)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Deep Research Results - shown when research results are streaming/completed */}
      {showResearchResults && (
        <>
          {researchResults.isCompleted && (
            <p className="text-sm text-gray-700">
              I have completed the comprehensive analysis. Click on the card below to see the full
              details.
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
          {/* Dashboard Cards after research completes */}
          {researchResults.isCompleted && dashboards.length > 0 && (
            <div className="space-y-2">
              {dashboards.map((db) => (
                <DashboardArtifactCard
                  key={db.dashboard_id}
                  title={db.dashboard_name}
                  onPreview={
                    onDashboardPreview
                      ? () => onDashboardPreview(db.dashboard_id, db.dashboard_version)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
};
