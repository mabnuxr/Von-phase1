import { UserMessage } from './UserMessage';
import { AssistantMessageV1 } from './AssistantMessageV1';
import { AssistantMessageV2 } from './AssistantMessageV2';
import { MessageStatusIndicators } from './MessageStatusIndicators';
import { FileArtifactsSection } from './FileArtifactsSection';
import { IntegrationBlockSection } from './IntegrationBlockSection';
import { MessageActions } from './MessageActions';
import type { TimelineStep } from '../TimelineThinkingProcess';
import type { MessageFileAttachment, MessageStatus } from './types';
import type { MentionItem } from '../Mentions/types';
import type { FileArtifact } from './ArtifactCards';
import type { Command } from '../Commands/types';

export interface ChatMessageProps {
  type: 'user' | 'assistant';
  content: string;
  attachments?: MessageFileAttachment[];
  mentions?: MentionItem[];
  thoughtContent?: string;
  reasoningContent?: string;
  timestamp?: Date;
  isLoading?: boolean;
  activeTab?: 'output' | 'sources' | 'thought';
  isStreaming?: boolean;
  isReasoningStreaming?: boolean;
  userName?: string;
  userEmail?: string;
  status?: MessageStatus;
  errorMessage?: string;
  events?: import('./types').AguiEventWrapper[];
  /** @deprecated Use stepMessages with tool calls instead */
  toolCalls?: import('./types').ToolCall[];
  stepMessages?: import('./types').StepMessage[];
  isCompressed?: boolean;
  messageId?: string;
  conversationId?: string;
  onArtifactClick?: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;
  stoppedByUser?: boolean;
  onApprove?: (toolCallId: string, runId: string) => void;
  onReject?: (toolCallId: string, runId: string) => void;
  /** Callback when an approval expires (TTL reached) */
  onExpire?: (stepId: string) => void;
  runId?: string;
  isLatestMessage?: boolean;
  enableActions?: boolean;
  onConvertToDashboard?: (messageId: string) => void;
  onTransparencyClick?: (messageId: string) => void;
  showTransparency?: boolean;
  salesforceInstanceUrl?: string;
  enableDeepLinks?: boolean;
  // Dashboard Builder / Plan Approval
  dashboards?: import('./types').DashboardMetadata[];
  executionId?: string | null;
  isDashboardBuilderMode?: boolean;
  onApprovePlan?: (runId: string, executionId: string) => Promise<void> | void;
  onRejectPlan?: (runId: string, executionId: string) => void;
  onDashboardPreview?: (dashboardId: string, dashboardVersion: number) => void;
  onMentionClick?: (mention: MentionItem) => void;
  // V2 Thinking Process
  thinkingProcessVersion?: 'v1' | 'v2';
  timelineSteps?: TimelineStep[];
  thinkingElapsedTime?: number;
  v2FinalResponse?: string;
  onFileClick?: (attachment: MessageFileAttachment) => void;
  /** When true, file attachments and command data sources render with reduced opacity */
  disableFileAttachments?: boolean;
  // File artifacts
  artifacts?: FileArtifact[];
  onFileArtifactClick?: (
    fileId: string,
    fileName: string,
    artifactType: string,
    mimeType: string,
    pdfPreviewFileId?: string
  ) => void;
  onArtifactDownload?: (fileId: string) => void;
  onGoogleDriveClick?: (fileId: string) => void;
  isDriveEnabled?: boolean;
  isDriveConnected?: boolean;
  driveTooltip?: string;
  driveLoadingFileId?: string | null;
  onBoxClick?: (fileId: string) => void;
  isBoxEnabled?: boolean;
  isBoxConnected?: boolean;
  boxTooltip?: string;
  boxLoadingFileId?: string | null;
  renderArtifactCard?: (artifact: FileArtifact) => React.ReactNode | null;
  groupedArtifactRenderers?: Record<string, (artifacts: FileArtifact[]) => React.ReactNode | null>;
  command?: Command;
  onRequestFilePreviewUrl?: (s3Key: string) => Promise<string>;
  integrationBlocks?: Array<{
    blockCode?: string;
    message: string;
    integrationType: string;
  }>;
  isIntegrationConnected?: (integrationType: string) => boolean;
  onIntegrate?: (integrationType: string) => void;
  getIntegrationMetadata?: (integrationType: string) => {
    name: string;
    logoPath: string;
    description?: string;
  } | null;
  compact?: boolean;
  researchResults?: {
    isStreaming: boolean;
    isCompleted: boolean;
    content: string;
    metadata: import('./DeepResearch/types').ResearchResultsMetadata | null;
    messageId: string | null;
  } | null;
  onSourcesClick?: () => void;
  /** 1-based count of assistant messages at this position (for analytics) */
  messageIndex?: number;
  onCopyMessage?: (messageIndex: number) => void;
  onDownloadMessage?: (messageIndex: number) => void;
  onThumbsUp?: (messageIndex: number) => void;
  onThumbsDown?: (messageIndex: number) => void;
  onThinkingStepExpanded?: (
    stepName: string,
    toolName: string | null,
    messageIndex: number
  ) => void;
  onResponseLinkClicked?: (linkType: string, linkText: string, messageIndex: number) => void;
  onResponseSectionCopied?: (sectionType: string, messageIndex: number) => void;
}

/**
 * Individual chat message component - delegates to UserMessage or assistant rendering
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
  onExpire,
  runId = '',
  enableActions = false,
  onConvertToDashboard,
  onTransparencyClick,
  showTransparency = true,
  salesforceInstanceUrl,
  thinkingProcessVersion = 'v1',
  timelineSteps,
  thinkingElapsedTime,
  v2FinalResponse,
  onFileClick,
  disableFileAttachments,
  artifacts,
  onFileArtifactClick,
  onArtifactDownload,
  onGoogleDriveClick,
  isDriveEnabled,
  isDriveConnected,
  driveTooltip,
  driveLoadingFileId,
  onBoxClick,
  isBoxEnabled,
  isBoxConnected,
  boxTooltip,
  boxLoadingFileId,
  renderArtifactCard,
  groupedArtifactRenderers,
  command,
  onRequestFilePreviewUrl,
  integrationBlocks,
  isIntegrationConnected,
  onIntegrate,
  getIntegrationMetadata,
  compact = false,
  dashboards,
  executionId,
  isDashboardBuilderMode = false,
  onApprovePlan,
  onRejectPlan,
  onDashboardPreview,
  onMentionClick,
  researchResults,
  messageIndex = 0,
  onCopyMessage,
  onDownloadMessage,
  onThumbsUp,
  onThumbsDown,
  onThinkingStepExpanded,
  onResponseLinkClicked,
  onResponseSectionCopied,
}) => {
  const isUser = type === 'user';

  // Shared condition for dashboard builder approval visibility
  const showDashboardBuilderApproval =
    (isDashboardBuilderMode || executionId) &&
    executionId &&
    isLatestMessage &&
    status !== 'expired' &&
    status !== 'skipped' &&
    status !== 'timeout' &&
    status !== 'failed';

  const showResearchResults =
    isLatestMessage &&
    researchResults &&
    (researchResults.isStreaming || researchResults.isCompleted) &&
    researchResults.content;

  return (
    <div className="w-full group ">
      <div
        className={`
          w-full transition-all duration-300
          ${isUser ? `${compact ? 'pt-3' : 'pt-6'} bg-white` : `${compact ? 'pt-3' : 'pt-6'} ${isStreaming ? 'min-h-112.5' : ''} bg-white`}
        `}
      >
        <div className={compact ? 'px-6' : 'px-4'}>
          <div className={`max-w-4xl mx-auto ${isUser ? 'flex justify-end' : ''}`}>
            <div className={`${isUser ? 'max-w-3xl' : 'w-full'}`}>
              {isUser ? (
                <UserMessage
                  content={content}
                  userName={userName}
                  userEmail={userEmail}
                  timestamp={timestamp}
                  attachments={attachments}
                  mentions={mentions}
                  command={command}
                  onFileClick={onFileClick}
                  onMentionClick={onMentionClick}
                  onRequestFilePreviewUrl={onRequestFilePreviewUrl}
                  disableFileAttachments={disableFileAttachments}
                  compact={compact}
                />
              ) : (
                /* Assistant message layout */
                <div className={compact ? 'flex flex-col gap-2' : 'flex gap-3 items-start'}>
                  {/* Avatar — hidden in compact mode */}
                  {!compact && (
                    <div className="flex items-start gap-2 shrink-0 @max-[550px]/chat:hidden">
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
                    </div>
                  )}

                  {/* Content Column */}
                  <div className={compact ? 'w-full min-w-0' : 'flex-1 min-w-0 -mt-0.5'}>
                    {thinkingProcessVersion === 'v2' ? (
                      <AssistantMessageV2
                        content={content}
                        v2FinalResponse={v2FinalResponse}
                        isStreaming={isStreaming}
                        status={status}
                        errorMessage={errorMessage}
                        timelineSteps={timelineSteps}
                        thinkingElapsedTime={thinkingElapsedTime}
                        stoppedByUser={stoppedByUser}
                        isLatestMessage={isLatestMessage}
                        runId={runId}
                        salesforceInstanceUrl={salesforceInstanceUrl}
                        onApprove={onApprove}
                        onReject={onReject}
                        onExpire={onExpire}
                        onArtifactClick={onArtifactClick}
                        dashboards={dashboards}
                        executionId={executionId}
                        isDashboardBuilderMode={isDashboardBuilderMode}
                        onApprovePlan={onApprovePlan}
                        onRejectPlan={onRejectPlan}
                        onDashboardPreview={onDashboardPreview}
                        researchResults={researchResults}
                        messageIndex={messageIndex}
                        onThinkingStepExpanded={onThinkingStepExpanded}
                        onResponseLinkClicked={
                          onResponseLinkClicked
                            ? (linkType, linkText) =>
                                onResponseLinkClicked(linkType, linkText, messageIndex)
                            : undefined
                        }
                        onResponseSectionCopied={
                          onResponseSectionCopied
                            ? (sectionType) => onResponseSectionCopied(sectionType, messageIndex)
                            : undefined
                        }
                      />
                    ) : (
                      <AssistantMessageV1
                        content={content}
                        reasoningContent={reasoningContent}
                        isStreaming={isStreaming}
                        isReasoningStreaming={isReasoningStreaming}
                        status={status}
                        errorMessage={errorMessage}
                        stepMessages={stepMessages}
                        messageId={messageId}
                        isLatestMessage={isLatestMessage}
                        onApprove={onApprove}
                        onReject={onReject}
                        runId={runId}
                        salesforceInstanceUrl={salesforceInstanceUrl}
                        onArtifactClick={onArtifactClick}
                      />
                    )}

                    {/* File artifact cards (agent-generated documents) */}
                    {artifacts && artifacts.length > 0 && !isStreaming && (
                      <FileArtifactsSection
                        artifacts={artifacts}
                        onFileArtifactClick={onFileArtifactClick}
                        onArtifactDownload={onArtifactDownload}
                        onGoogleDriveClick={onGoogleDriveClick}
                        isDriveEnabled={isDriveEnabled}
                        isDriveConnected={isDriveConnected}
                        driveTooltip={driveTooltip}
                        driveLoadingFileId={driveLoadingFileId}
                        onBoxClick={onBoxClick}
                        isBoxEnabled={isBoxEnabled}
                        isBoxConnected={isBoxConnected}
                        boxTooltip={boxTooltip}
                        boxLoadingFileId={boxLoadingFileId}
                        renderArtifactCard={renderArtifactCard}
                        groupedArtifactRenderers={groupedArtifactRenderers}
                      />
                    )}

                    {/* Integration write blocked cards */}
                    {integrationBlocks &&
                      integrationBlocks.length > 0 &&
                      !isStreaming &&
                      integrationBlocks.map((block, index) => (
                        <IntegrationBlockSection
                          key={`${block.integrationType}-${index}`}
                          integrationBlock={block}
                          isIntegrationConnected={isIntegrationConnected}
                          onIntegrate={onIntegrate}
                          getIntegrationMetadata={getIntegrationMetadata}
                        />
                      ))}

                    {/* Status indicators (stopped, timeout, expired) */}
                    <MessageStatusIndicators
                      stoppedByUser={stoppedByUser}
                      status={status}
                      errorMessage={errorMessage}
                    />

                    {/* Message Actions - show for completed/stopped assistant messages */}
                    {!isStreaming &&
                      !timelineSteps?.some((s) => s.status === 'awaiting-approval') &&
                      !showDashboardBuilderApproval &&
                      (!showResearchResults || researchResults?.isCompleted) && (
                        <MessageActions
                          messageContent={
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
                          onCopyIcon={onCopyMessage ? () => onCopyMessage(messageIndex) : undefined}
                          onDownload={
                            onDownloadMessage ? () => onDownloadMessage(messageIndex) : undefined
                          }
                          onLike={onThumbsUp ? () => onThumbsUp(messageIndex) : undefined}
                          onDislike={onThumbsDown ? () => onThumbsDown(messageIndex) : undefined}
                        />
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
