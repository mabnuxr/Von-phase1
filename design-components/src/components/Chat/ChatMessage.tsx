import { useState, useRef, useLayoutEffect, useEffect, Fragment } from 'react';
import { InfoIcon, CopyIcon, CheckIcon } from '@phosphor-icons/react';
import { Streamdown } from 'streamdown';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallItem } from './ToolCallItem';
import { MessageAreaError } from './MessageAreaError';
import { MessageActions } from './MessageActions';
import { MessageFilePreview } from './FileAttachment/MessageFilePreview';
import { MessageMentionPreview } from './FileAttachment/MessageMentionPreview';
import { SalesforceLink } from './SalesforceLink';
import { MarkdownActionCard } from './DeepResearch/MarkdownActionCard';
import { DataTablesCard } from './DeepResearch/DataTablesCard';
import { DeepResearchResults } from './DeepResearch/DeepResearchResults';
import { DashboardArtifactCard } from './ArtifactCards';
import { ExpensiveOperationModal } from '../popups/ExpensiveOperationModal';
import { TiptapViewer } from '../TiptapEditor';
import { Tooltip } from '../Tooltip';
import { TimelineThinkingProcess } from '../TimelineThinkingProcess';
import type { TimelineStep } from '../TimelineThinkingProcess';
import type { MessageFileAttachment, MessageStatus } from './types';
import type { MentionItem } from '../Mentions/types';
import { FileArtifactCard, type FileArtifact } from './ArtifactCards';
import { IntegrationCard } from '../IntegrationCard';
import { CommandPreview } from '../Commands/CommandPreview';
import type { Command } from '../Commands/types';
import { DEFAULT_EXPIRED_APPROVAL_MESSAGE } from '../../utils/constants';

/**
 * Format message timestamp: time only if within 24h, date only otherwise
 */
function formatMessageTimestamp(date: Date): string {
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Full date + time string for tooltip
 */
function formatFullTimestamp(date: Date): string {
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} · ${timeStr}`;
}

/**
 * Get user initials from name or email
 */
function getUserInitials(name?: string, email?: string): string {
  // Try to get initials from name first
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
      // First and last name
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      // Single name, take first character
      return parts[0][0].toUpperCase();
    }
  }

  // Fallback to email
  if (email && email.trim()) {
    const emailUsername = email.split('@')[0];
    if (emailUsername.length >= 2) {
      return emailUsername.substring(0, 2).toUpperCase();
    } else if (emailUsername.length === 1) {
      return emailUsername[0].toUpperCase();
    }
  }

  // Final fallback
  return 'U';
}

export interface ChatMessageProps {
  /**
   * Type of message
   */
  type: 'user' | 'assistant';

  /**
   * Message content
   */
  content: string;

  /**
   * File attachments for user messages
   */
  attachments?: MessageFileAttachment[];

  /**
   * Dashboard mentions for user messages
   */
  mentions?: MentionItem[];

  /**
   * Thought content (for assistant messages)
   */
  thoughtContent?: string;

  /**
   * Reasoning content from AI SDK (Claude thinking blocks)
   */
  reasoningContent?: string;

  /**
   * Timestamp of the message
   */
  timestamp?: Date;

  /**
   * Whether the message is in a loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * Active tab for assistant messages
   * @default 'output'
   */
  activeTab?: 'output' | 'sources' | 'thought';

  /**
   * Whether the message is currently streaming
   */
  isStreaming?: boolean;

  /**
   * Whether the reasoning is currently streaming
   */
  isReasoningStreaming?: boolean;

  /**
   * User's name (for user messages)
   */
  userName?: string;

  /**
   * User's email (for user messages)
   */
  userEmail?: string;

  /**
   * Message status from backend persistence
   * Includes 'timeout' for client-side timeout recovery
   * Includes 'expired' for expired approval requests
   */
  status?: MessageStatus;

  /**
   * Error message if status is 'failed'
   */
  errorMessage?: string;

  /**
   * Complete event stream from backend (event array architecture)
   * Enables event-driven rendering of agent execution
   */
  events?: import('./types').AguiEventWrapper[];

  /**
   * Tool calls made during this message (AGUI)
   * @deprecated Use stepMessages with tool calls instead
   */
  toolCalls?: import('./types').ToolCall[];

  /**
   * Multiple step messages (for multi-step agent responses)
   * Each step message contains its content and associated tool calls
   */
  stepMessages?: import('./types').StepMessage[];

  /**
   * Whether this message should be displayed in compressed form
   * @default false
   */
  isCompressed?: boolean;

  /**
   * Message ID (for artifact fetching)
   */
  messageId?: string;

  /**
   * Conversation ID (for artifact fetching)
   */
  conversationId?: string;

  /**
   * Callback when user clicks on an artifact (from either V1 or V2 thinking process)
   * The consumer should render the appropriate UI with fetched data
   */
  onArtifactClick?: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;

  /**
   * Whether the response was stopped by user
   */
  stoppedByUser?: boolean;

  /**
   * Callback when user approves a Salesforce CRUD operation
   */
  onApprove?: (toolCallId: string, runId: string) => void;

  /**
   * Callback when user rejects a Salesforce CRUD operation
   */
  onReject?: (toolCallId: string, runId: string) => void;

  /**
   * Run ID of the current streaming session (required for approval resume)
   */
  runId?: string;

  /**
   * Whether this is the latest message in the conversation
   * Used to control visibility of approval buttons
   */
  isLatestMessage?: boolean;

  /**
   * Enable additional actions menu (three dots with convert to dashboard, etc.)
   * Controlled by feature flag in parent component
   * @default false
   */
  enableActions?: boolean;

  /**
   * Callback when convert to dashboard is clicked
   */
  onConvertToDashboard?: (messageId: string) => void;

  /**
   * Callback when transparency (data sources) button is clicked
   */
  onTransparencyClick?: (messageId: string) => void;

  /**
   * Whether to show the transparency button
   * @default true
   */
  showTransparency?: boolean;

  /**
   * Salesforce instance URL for building deep links in approval cards
   * Example: "https://mycompany.my.salesforce.com"
   */
  salesforceInstanceUrl?: string;

  /**
   * Enable deep links for Salesforce URLs in artifact pane DataTable
   * When enabled, URLs are rendered as clickable links
   * @default false
   */
  enableDeepLinks?: boolean;

  // ============================================================================
  // Dashboard Builder / Plan Approval Props
  // ============================================================================

  /**
   * Dashboard metadata from RUN_FINISHED event.
   * Present when a dashboard was created during this run.
   */
  dashboard?: import('./types').DashboardMetadata | null;

  /**
   * execution_id from RUN_FINISHED for workflow execution approval.
   */
  executionId?: string | null;

  /**
   * Whether this run is a dashboard builder response.
   */
  isDashboardBuilderMode?: boolean;

  /**
   * Callback when "Create Dashboard" is clicked for workflow execution approval.
   */
  onApprovePlan?: (runId: string, executionId: string) => void;

  /**
   * Callback when "Skip" is clicked for workflow execution approval.
   */
  onRejectPlan?: (runId: string, executionId: string) => void;

  /**
   * Callback when dashboard expand button is clicked (opens preview pane).
   */
  onDashboardPreview?: (dashboardId: string, dashboardVersion: number) => void;

  // ============================================================================
  // V2 Thinking Process Props (TimelineThinkingProcess component)
  // ============================================================================

  /**
   * Version of thinking process component to use
   * @default 'v1'
   */
  thinkingProcessVersion?: 'v1' | 'v2';

  /**
   * Timeline steps for v2 thinking process visualization
   */
  timelineSteps?: TimelineStep[];

  /**
   * Elapsed time in seconds for v2 thinking process
   */
  thinkingElapsedTime?: number;

  /**
   * Final response content for v2 (separated from reasoning steps)
   * This is the content from TEXT_MESSAGE with parent_message_id
   */
  v2FinalResponse?: string;

  /**
   * Callback when a file attachment pill is clicked (for preview/download)
   */
  onFileClick?: (attachment: MessageFileAttachment) => void;

  /**
   * Agent-generated file artifacts associated with this message
   */
  artifacts?: FileArtifact[];

  /**
   * Callback when user clicks on a file artifact card to open the viewer
   */
  onFileArtifactClick?: (
    fileId: string,
    fileName: string,
    artifactType: string,
    mimeType: string,
    pdfPreviewFileId?: string
  ) => void;

  /**
   * Callback to download an agent-generated file artifact
   */
  onArtifactDownload?: (fileId: string) => void;

  /**
   * Callback when user clicks Google Drive button on an artifact card
   */
  onGoogleDriveClick?: (fileId: string) => void;

  /**
   * Whether Google Drive export is enabled (feature flag is on)
   */
  isDriveEnabled?: boolean;

  /**
   * Whether Google Drive is connected (user has authenticated)
   */
  isDriveConnected?: boolean;

  /**
   * Tooltip text for the Google Drive button
   */
  driveTooltip?: string;

  /**
   * File ID of the artifact currently being exported to Drive (shows spinner)
   */
  driveLoadingFileId?: string | null;

  /**
   * Custom renderer for artifact cards (e.g. email_draft → GmailDraftCard).
   * Return a ReactNode to override the default FileArtifactCard, or null to use the default.
   */
  renderArtifactCard?: (artifact: FileArtifact) => React.ReactNode | null;

  /**
   * Quick command used for this user message (shows expandable chip)
   */
  command?: Command;
  /** Fetches a presigned download URL for a command's data source file */
  onRequestFilePreviewUrl?: (s3Key: string) => Promise<string>;

  /**
   * Integration write block metadata (persisted on assistant messages).
   * When present, renders an integration card inline on the message.
   */
  integrationBlock?: {
    blockCode?: string;
    message: string;
    integrationType: string;
  };
  /** Check whether a given integration type is connected */
  isIntegrationConnected?: (integrationType: string) => boolean;
  /** Callback to open the integration connection flow for a given integration type */
  onIntegrate?: (integrationType: string) => void;
  /** Resolve integration metadata (name, logo, description) for a given backend integration type */
  getIntegrationMetadata?: (integrationType: string) => {
    name: string;
    logoPath: string;
    description?: string;
  } | null;

  /**
   * Compact mode for narrow sidepane layout.
   * - User messages: hides avatar
   * - Agent messages: stacks avatar above content (full-width content)
   * @default false
   */
  compact?: boolean;

  /**
   * Information for the DataTablesCard (number of tables, records processed, etc.)
   * Shown as beforeActions in the MarkdownActionCard during plan-proposed phase.
   */
  dataTablesInfo?: {
    tableCount: number;
    processedRecords?: number;
    totalRecords?: number;
  };

  /**
   * Whether data tables info is still loading
   */
  isDataTablesLoading?: boolean;

  /**
   * Callback when user clicks the DataTablesCard to review source data
   */
  onDataTablesClick?: () => void;

  /**
   * Research results from deep research workflow.
   * When streaming/completed, renders the DeepResearchResults card.
   */
  researchResults?: {
    isStreaming: boolean;
    isCompleted: boolean;
    content: string;
    metadata: import('./DeepResearch/types').ResearchResultsMetadata | null;
    messageId: string | null;
  } | null;

  /**
   * Callback when sources button is clicked after research completes
   */
  onSourcesClick?: () => void;
}

/**
 * Individual chat message component with full-width Claude-style layout
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content,
  attachments,
  mentions,
  reasoningContent,
  isStreaming = false,
  isReasoningStreaming = false,
  timestamp,
  userName,
  userEmail,
  stepMessages,
  status,
  errorMessage,
  messageId,
  onArtifactClick,
  stoppedByUser,
  isLatestMessage,
  onApprove,
  onReject,
  runId = '',
  enableActions = false,
  onConvertToDashboard,
  onTransparencyClick,
  showTransparency = true,
  salesforceInstanceUrl,
  // V2 Thinking Process props
  thinkingProcessVersion = 'v1',
  timelineSteps,
  thinkingElapsedTime,
  v2FinalResponse,
  onFileClick,
  // File artifacts
  artifacts,
  onFileArtifactClick,
  onArtifactDownload,
  onGoogleDriveClick,
  isDriveEnabled,
  isDriveConnected,
  driveTooltip,
  driveLoadingFileId,
  renderArtifactCard,
  command,
  onRequestFilePreviewUrl,
  integrationBlock,
  isIntegrationConnected,
  onIntegrate,
  getIntegrationMetadata,
  compact = false,
  // Dashboard builder / plan approval props
  dashboard,
  executionId,
  isDashboardBuilderMode = false,
  onApprovePlan,
  onRejectPlan,
  onDashboardPreview,
  // Data tables props (deep research approval flow)
  dataTablesInfo,
  isDataTablesLoading = false,
  onDataTablesClick,
  // Research results
  researchResults,
}) => {
  const isUser = type === 'user';
  const userInitials = isUser ? getUserInitials(userName, userEmail) : 'A';

  // Ref and state for measuring user message height (for alignment)
  const userMessageRef = useRef<HTMLDivElement>(null);
  const [isSingleLine, setIsSingleLine] = useState(true);
  const [copiedUser, setCopiedUser] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State for skip confirmation modal (dashboard builder approval flow)
  const [showSkipConfirmModal, setShowSkipConfirmModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Shared condition: dashboard builder approval is pending on this message
  // Fallback: treat presence of executionId as dashboard-builder mode
  // for rolling deploys or older RUN_FINISHED payloads that omit isDashboardBuilderMode
  const showDashboardBuilderApproval =
    (isDashboardBuilderMode || executionId) &&
    executionId &&
    isLatestMessage &&
    status !== 'expired' &&
    status !== 'timeout' &&
    status !== 'failed';

  // Whether research results are actively being shown on this message
  const showResearchResults =
    isLatestMessage &&
    researchResults &&
    (researchResults.isStreaming || researchResults.isCompleted) &&
    researchResults.content;

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Measure user message height to determine alignment
  useLayoutEffect(() => {
    if (isUser && userMessageRef.current) {
      // Single line threshold ~36px (accounts for line-height + padding)
      const height = userMessageRef.current.offsetHeight;
      setIsSingleLine(height <= 36);
    }
  }, [isUser, content]);

  // Handle artifact click (from either V1 ToolCallItem or V2 TimelineThinkingProcess)
  // Delegates to parent via callback - parent decides how to render the artifact UI
  const handleArtifactClick = (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => {
    onArtifactClick?.(artifactId, toolName, artifactType, runId);
  };

  const handleCopyUser = async () => {
    try {
      await navigator.clipboard.writeText(content);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setCopiedUser(true);
      copyTimeoutRef.current = setTimeout(() => setCopiedUser(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const isTimestampOlderThan24h =
    !!timestamp && (Date.now() - timestamp.getTime()) / (1000 * 60 * 60) >= 24;

  const isStoppedImmediately = stoppedByUser && (!timelineSteps || timelineSteps.length === 0);

  return (
    <div className="w-full group ">
      {/* Full-width section with alternating backgrounds */}
      <div
        className={`
          w-full transition-all duration-300
          ${isUser ? `${compact ? 'pt-3' : 'pt-6'} bg-white` : `${compact ? 'pt-3' : 'pt-6'} ${isStreaming ? 'min-h-112.5' : ''} bg-white`}
        `}
      >
        {/* Centered container */}
        <div className={compact ? 'px-6' : 'px-4'}>
          <div className={`max-w-4xl mx-auto ${isUser ? 'flex justify-end' : ''}`}>
            {/* Message layout */}
            <div className={`${isUser ? 'max-w-3xl' : 'w-full'}`}>
              {/* Horizontal layout: Avatar + Content (reversed for user) */}
              {/* Compact: user=no avatar, agent=stacked (avatar above, content full-width below) */}
              <div
                className={
                  compact
                    ? isUser
                      ? 'flex justify-end'
                      : 'flex flex-col gap-2'
                    : `flex gap-3 ${isUser ? `flex-row-reverse ${isSingleLine ? 'items-center' : 'items-start'}` : 'items-start'}`
                }
              >
                {/* Avatar — hidden for compact user messages */}
                {!(compact && isUser) && (
                  <div
                    className={`flex items-start gap-2 shrink-0 ${!compact ? '@max-[550px]/chat:hidden' : ''}`}
                  >
                    {isUser ? (
                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                        {userInitials}
                      </div>
                    ) : (
                      <>
                        <div
                          className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} rounded-full overflow-hidden shrink-0`}
                        >
                          <svg
                            width={compact ? '24' : '28'}
                            height={compact ? '24' : '28'}
                            viewBox="0 0 28 28"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
                              fill="url(#paint0_radial_chat_msg)"
                            />
                            <path
                              d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
                              stroke="white"
                              strokeWidth="1.33"
                            />
                            <circle
                              cx="13.9932"
                              cy="14"
                              r="7.835"
                              stroke="white"
                              strokeWidth="1.33"
                            />
                            <defs>
                              <radialGradient
                                id="paint0_radial_chat_msg"
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
                      </>
                    )}
                  </div>
                )}

                {/* Content Column */}
                <div
                  className={
                    compact && !isUser
                      ? 'w-full min-w-0'
                      : compact && isUser
                        ? 'w-fit ml-auto min-w-0 -mt-0.5'
                        : 'flex-1 min-w-0 -mt-0.5'
                  }
                >
                  {/* For V1 assistant messages: check for errors first (error replaces content) */}
                  {!isUser &&
                  status === 'failed' &&
                  errorMessage &&
                  thinkingProcessVersion !== 'v2' ? (
                    <MessageAreaError message={errorMessage} />
                  ) : !isUser ? (
                    <div>
                      {/* V2 Thinking Process - skip entirely when stopped before any events arrived */}
                      {thinkingProcessVersion === 'v2' && !isStoppedImmediately && (
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
                            onArtifactClick={handleArtifactClick}
                            salesforceInstanceUrl={salesforceInstanceUrl}
                          />
                        </div>
                      )}

                      {/* V2 Error - shown below thinking process (failed only; timeout has its own indicator) */}
                      {thinkingProcessVersion === 'v2' && status === 'failed' && errorMessage && (
                        <MessageAreaError message={errorMessage} />
                      )}

                      {/* V2 Final Response - rendered after timeline (not shown on error) */}
                      {thinkingProcessVersion === 'v2' &&
                        v2FinalResponse &&
                        status !== 'timeout' &&
                        status !== 'expired' &&
                        !(status === 'failed' && errorMessage) &&
                        // When dashboard builder approval pending on latest message, render inside MarkdownActionCard instead
                        !(showDashboardBuilderApproval && !isStreaming) && (
                          <div className="markdown-content max-w-none">
                            <Streamdown
                              parseIncompleteMarkdown={isStreaming}
                              isAnimating={isStreaming}
                              controls={{ table: true }}
                              components={{ a: SalesforceLink }}
                            >
                              {v2FinalResponse}
                            </Streamdown>
                          </div>
                        )}

                      {/* V2 Dashboard Builder Approval Card - "Create Dashboard" / "Skip" */}
                      {thinkingProcessVersion === 'v2' &&
                        showDashboardBuilderApproval &&
                        !isStreaming && (
                          <>
                            <MarkdownActionCard
                              variant="analysis-request"
                              markdown={
                                v2FinalResponse ||
                                'Your dashboard is ready to be created. Please review and approve.'
                              }
                              isStreaming={false}
                              primaryAction={{
                                label: 'Create Dashboard',
                                onClick: () => {
                                  if (!isApproving && executionId && runId && onApprovePlan) {
                                    setIsApproving(true);
                                    onApprovePlan(runId, executionId);
                                  }
                                },
                                disabled: !executionId || !onApprovePlan || isApproving,
                              }}
                              secondaryAction={{
                                label: 'Skip',
                                onClick: () => setShowSkipConfirmModal(true),
                              }}
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
                            <ExpensiveOperationModal
                              isOpen={showSkipConfirmModal}
                              onConfirm={() => {
                                setShowSkipConfirmModal(false);
                                if (executionId && runId && onRejectPlan) {
                                  onRejectPlan(runId, executionId);
                                }
                              }}
                              onCancel={() => setShowSkipConfirmModal(false)}
                              operationName="Skip Dashboard Creation"
                            />
                          </>
                        )}

                      {/* V2 Dashboard Artifact Card - shown when dashboard was created */}
                      {thinkingProcessVersion === 'v2' &&
                        dashboard &&
                        !isStreaming &&
                        !showDashboardBuilderApproval &&
                        !showResearchResults && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              The dashboard is currently saved as a <strong>draft</strong>. Save it
                              to make it accessible from the side panel.
                            </p>
                            <DashboardArtifactCard
                              title={dashboard.dashboard_name}
                              onPreview={
                                onDashboardPreview
                                  ? () =>
                                      onDashboardPreview(
                                        dashboard.dashboard_id,
                                        dashboard.dashboard_version
                                      )
                                  : undefined
                              }
                            />
                          </div>
                        )}

                      {/* V2 Deep Research Results - shown when research results are streaming/completed */}
                      {thinkingProcessVersion === 'v2' && showResearchResults && (
                        <>
                          {researchResults.isCompleted && (
                            <p className="text-sm text-gray-700">
                              I have completed the comprehensive analysis. Click on the card below
                              to see the full details.
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
                          {/* Dashboard Card after research completes */}
                          {researchResults.isCompleted && dashboard && (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">
                                The dashboard is currently saved as a <strong>draft</strong>. Save
                                it to make it accessible from the side panel.
                              </p>
                              <DashboardArtifactCard
                                title={dashboard.dashboard_name}
                                onPreview={
                                  onDashboardPreview
                                    ? () =>
                                        onDashboardPreview(
                                          dashboard.dashboard_id,
                                          dashboard.dashboard_version
                                        )
                                    : undefined
                                }
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* V1 Thinking Process - Original ThinkingBlock components */}
                      {thinkingProcessVersion === 'v1' && (
                        <>
                          {isStreaming &&
                            !content &&
                            !reasoningContent &&
                            (!stepMessages || stepMessages.length === 0) && (
                              <ThinkingBlock content="" isStreaming={true} status="streaming" />
                            )}

                          {/* Thinking Block - Show immediately when reasoning starts */}
                          {(isReasoningStreaming || reasoningContent) && (
                            <ThinkingBlock
                              content={reasoningContent || ''}
                              isStreaming={isReasoningStreaming}
                              status={status}
                              messageId={messageId}
                              isLatestMessage={isLatestMessage}
                              onApprove={onApprove}
                              onReject={onReject}
                              runId={runId}
                              salesforceInstanceUrl={salesforceInstanceUrl}
                            />
                          )}

                          {/* Render stepMessages if available (AGUI multi-step responses) */}
                          {stepMessages && stepMessages.length > 0 ? (
                            <div className="space-y-4">
                              {/* STREAMING STRATEGY: Split intermediate steps from final output */}
                              {isStreaming ? (
                                // While streaming: ALL steps go in ThinkingBlock (collapsed), summary shown in header
                                <ThinkingBlock
                                  key="thinking-block"
                                  isStreaming={isStreaming}
                                  status={status}
                                  stepMessages={stepMessages}
                                  onArtifactClick={handleArtifactClick}
                                  messageId={messageId}
                                  isLatestMessage={isLatestMessage}
                                  onApprove={onApprove}
                                  onReject={onReject}
                                  runId={runId}
                                  salesforceInstanceUrl={salesforceInstanceUrl}
                                />
                              ) : (
                                // After completion: Show intermediate steps in ThinkingBlock + final step outside
                                <>
                                  {stepMessages.length > 1 && (
                                    <ThinkingBlock
                                      key="thinking-block"
                                      messageId={messageId}
                                      isStreaming={false}
                                      status={status}
                                      stepMessages={stepMessages.slice(0, -1)}
                                      onArtifactClick={handleArtifactClick}
                                      isLatestMessage={isLatestMessage}
                                      onApprove={onApprove}
                                      onReject={onReject}
                                      runId={runId}
                                      salesforceInstanceUrl={salesforceInstanceUrl}
                                    />
                                  )}

                                  {/* Final Message - Rendered outside ThinkingBlock after completion */}
                                  {(() => {
                                    const finalStep = stepMessages[stepMessages.length - 1];
                                    return (
                                      <div className="space-y-3">
                                        {/* Final step content */}
                                        {finalStep.content && (
                                          <div className="markdown-content max-w-none">
                                            <Streamdown
                                              parseIncompleteMarkdown={false}
                                              isAnimating={false}
                                              controls={{ table: true }}
                                              components={{ a: SalesforceLink }}
                                            >
                                              {finalStep.content}
                                            </Streamdown>
                                          </div>
                                        )}

                                        {/* Tool calls for final step */}
                                        {finalStep.toolCalls && finalStep.toolCalls.length > 0 && (
                                          <div className="space-y-2">
                                            {finalStep.toolCalls.map((toolCall) => (
                                              <ToolCallItem
                                                key={toolCall.id}
                                                toolCall={toolCall}
                                                onArtifactClick={handleArtifactClick}
                                                isStreaming={false}
                                                isLatestMessage={isLatestMessage}
                                                onApprove={onApprove}
                                                onReject={onReject}
                                                runId={runId}
                                                salesforceInstanceUrl={salesforceInstanceUrl}
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </>
                              )}
                            </div>
                          ) : (
                            /* Fallback: render plain content if no stepMessages */
                            content && (
                              <div className="markdown-content max-w-none">
                                <Streamdown
                                  parseIncompleteMarkdown={isStreaming}
                                  isAnimating={isStreaming}
                                  controls={{ table: true }}
                                  components={{ a: SalesforceLink }}
                                >
                                  {content}
                                </Streamdown>
                              </div>
                            )
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    // User messages - with file attachments and text
                    <div
                      ref={userMessageRef}
                      className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2 overflow-hidden wrap-break-word"
                    >
                      {command && (
                        <CommandPreview
                          command={command}
                          onRequestFilePreviewUrl={onRequestFilePreviewUrl}
                          hasContentBelow={!!(content || (attachments && attachments.length > 0))}
                        />
                      )}
                      {attachments && attachments.length > 0 && (
                        <div className={command ? 'mt-2' : undefined}>
                          <MessageFilePreview attachments={attachments} onFileClick={onFileClick} />
                        </div>
                      )}
                      {mentions && mentions.length > 0 && (
                        <div
                          className={
                            command || (attachments && attachments.length > 0) ? 'mt-2' : undefined
                          }
                        >
                          <MessageMentionPreview mentions={mentions} />
                        </div>
                      )}
                      {/* Text content - render markdown using TiptapViewer */}
                      {content && (
                        <TiptapViewer
                          content={content}
                          className="markdown-content prose-sm max-w-none text-left"
                        />
                      )}
                    </div>
                  )}

                  {/* User message hover actions: timestamp + copy */}
                  {isUser && (
                    <div className="flex items-center justify-end gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {timestamp && (
                        <Tooltip
                          content={formatFullTimestamp(timestamp)}
                          enabled={isTimestampOlderThan24h}
                          placement="bottom"
                        >
                          <span className="text-xs text-gray-400 select-none">
                            {formatMessageTimestamp(timestamp)}
                          </span>
                        </Tooltip>
                      )}
                      {content && (
                        <button
                          onClick={handleCopyUser}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
                          title={copiedUser ? 'Copied!' : 'Copy message'}
                          aria-label={copiedUser ? 'Copied!' : 'Copy message'}
                        >
                          {copiedUser ? (
                            <CheckIcon size={14} className="text-green-500" weight="bold" />
                          ) : (
                            <CopyIcon size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* File artifact cards (agent-generated documents) */}
                  {!isUser && artifacts && artifacts.length > 0 && !isStreaming && (
                    <div className="mt-3 space-y-3">
                      {artifacts.map((artifact) => {
                        // Allow app layer to override rendering for specific artifact types (e.g. email_draft)
                        if (renderArtifactCard) {
                          const custom = renderArtifactCard(artifact);
                          if (custom) return <Fragment key={artifact.fileId}>{custom}</Fragment>;
                        }

                        const handleOpen = onFileArtifactClick
                          ? () =>
                              onFileArtifactClick(
                                artifact.fileId,
                                artifact.fileName,
                                artifact.artifactType,
                                artifact.mimeType,
                                artifact.pdfPreview?.id
                              )
                          : undefined;

                        return (
                          <FileArtifactCard
                            key={artifact.fileId}
                            artifact={artifact}
                            onClick={handleOpen}
                            onOpen={handleOpen}
                            onDownload={
                              onArtifactDownload
                                ? () => onArtifactDownload(artifact.fileId)
                                : undefined
                            }
                            onGoogleDriveClick={
                              onGoogleDriveClick
                                ? () => onGoogleDriveClick(artifact.fileId)
                                : undefined
                            }
                            isDriveEnabled={isDriveEnabled}
                            isDriveConnected={isDriveConnected}
                            driveTooltip={driveTooltip}
                            isDriveLoading={driveLoadingFileId === artifact.fileId}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Integration write blocked — inline card for connectable blocks */}
                  {!isUser &&
                    integrationBlock &&
                    !isStreaming &&
                    integrationBlock.blockCode !== 'org_read_only' &&
                    integrationBlock.blockCode !== 'admin_disabled' &&
                    (() => {
                      const metadata = getIntegrationMetadata?.(integrationBlock.integrationType);
                      if (!metadata) return null;
                      const isConnected =
                        isIntegrationConnected?.(integrationBlock.integrationType) ?? false;
                      return (
                        <div className="mt-3 w-full rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                          <IntegrationCard
                            name={metadata.name}
                            integrationLogoPath={metadata.logoPath}
                            description={integrationBlock.message}
                            isAvailable={!isConnected}
                            onToggle={
                              onIntegrate
                                ? () => onIntegrate(integrationBlock.integrationType)
                                : undefined
                            }
                            chips={isConnected ? ['connected'] : undefined}
                          />
                        </div>
                      );
                    })()}

                  {/* Show stopped indicator for assistant messages */}
                  {!isUser && stoppedByUser && (
                    <div className="max-w-fit flex items-start gap-2 py-2 px-2 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                      <div className="shrink-0 mt-0.5">
                        <InfoIcon size={20} className="text-indigo-600" />
                      </div>
                      <span className="text-sm text-gray-800 leading-relaxed flex-1">
                        Response stopped by the user
                      </span>
                    </div>
                  )}

                  {/* Show timeout indicator for assistant messages */}
                  {!isUser && status === 'timeout' && (
                    <div className="max-w-fit flex items-start gap-2 py-2 px-2 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                      <div className="shrink-0 mt-0.5">
                        <InfoIcon size={20} className="text-indigo-600" />
                      </div>
                      <span className="text-sm text-gray-800 leading-relaxed flex-1">
                        Request timed out
                      </span>
                    </div>
                  )}

                  {/* Show expired approval indicator for assistant messages */}
                  {!isUser && status === 'expired' && (
                    <div className="max-w-fit flex items-start gap-2 py-2 px-2 bg-gray-50/50 border border-gray-200 rounded-xl">
                      <div className="shrink-0 mt-0.5">
                        <InfoIcon size={20} className="text-gray-500" />
                      </div>
                      <span className="text-sm text-gray-800 leading-relaxed flex-1">
                        {errorMessage || DEFAULT_EXPIRED_APPROVAL_MESSAGE}
                      </span>
                    </div>
                  )}

                  {/* Message Actions - show for completed/stopped assistant messages (not during approval wait) */}
                  {!isUser &&
                    !isStreaming &&
                    !timelineSteps?.some((s) => s.status === 'awaiting-approval') &&
                    !showDashboardBuilderApproval &&
                    (!showResearchResults || researchResults?.isCompleted) && (
                      <MessageActions
                        messageContent={
                          // For v2 thinking process, only use the final response (not intermediate steps)
                          thinkingProcessVersion === 'v2' && v2FinalResponse
                            ? v2FinalResponse
                            : stepMessages && stepMessages.length > 0
                              ? stepMessages.map((s) => s.content).join('\n\n')
                              : content
                        }
                        messageId={messageId || ''}
                        enableActions={enableActions}
                        onConvertToDashboard={onConvertToDashboard}
                        onTransparencyClick={onTransparencyClick}
                        showTransparency={showTransparency}
                      />
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
