import React, { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SpinnerGapIcon,
  CheckCircleIcon,
  CaretDownIcon,
  CaretRightIcon,
  FileMagnifyingGlassIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  CopyIcon,
  DownloadSimpleIcon,
} from '@phosphor-icons/react';
import { PrimaryButton } from '../forms/buttons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ============================================================================
// Types
// ============================================================================

export type MessageType = 'user' | 'assistant';

export interface ThinkingStep {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'complete';
  icon?: 'salesforce' | 'database' | 'chart' | 'table';
  /** Optional subtitle/detail shown below the main text */
  subtitle?: string;
  /** Alias for subtitle for compatibility */
  detail?: string;
}

export interface DashboardArtifact {
  type: 'dashboard';
  title: string;
  description: string;
  items?: { label: string; value: string }[];
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  thinkingSteps?: ThinkingStep[];
  /** Elapsed time in seconds for thinking steps */
  thinkingElapsedTime?: number;
  showBuildButton?: boolean;
  plan?: DashboardPlan;
  artifact?: DashboardArtifact;
}

export interface DashboardPlan {
  title: string;
  description: string;
  kpis: string[];
  charts: string[];
  table: string;
}

export interface ChatViewV2Props {
  messages: ChatMessage[];
  isThinking?: boolean;
  thinkingSteps?: ThinkingStep[];
  elapsedTime?: number;
  onBuildDashboard?: () => void;
  userName?: string;
  /** Callback when sources button is clicked */
  onSourcesClick?: () => void;
  /** Callback when an artifact card is clicked (e.g., to open report modal) */
  onArtifactClick?: (artifactId: string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatElapsedTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

// ============================================================================
// Thinking Step Icon (indigo indicator circle - matches DeepResearch style)
// ============================================================================

const StepIcon: React.FC<{ icon?: string; status: string }> = ({ status }) => {
  // Use indigo indicator circles like DeepResearch
  if (status === 'in-progress') {
    return <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-indigo-200" />;
  }
  if (status === 'complete') {
    return <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-indigo-200" />;
  }
  // pending
  return <span className="w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-gray-100" />;
};

// ============================================================================
// Status Icon
// ============================================================================

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'complete':
      return <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />;
    case 'in-progress':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <SpinnerGapIcon size={14} weight="regular" className="text-indigo-600" />
        </motion.div>
      );
    default:
      return <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />;
  }
};

// ============================================================================
// Thinking Block Component
// ============================================================================

interface ThinkingBlockProps {
  steps: ThinkingStep[];
  isThinking: boolean;
  elapsedTime: number;
  defaultCollapsed?: boolean;
}

const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  steps,
  isThinking,
  elapsedTime,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const prevAllCompleteRef = useRef(false);

  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const totalCount = steps.length;
  const allComplete = completedCount === totalCount && totalCount > 0 && !isThinking;

  const visibleSteps = steps.filter((s) => s.status !== 'pending');

  // Auto-collapse when thinking completes (like DeepResearch)
  useLayoutEffect(() => {
    if (allComplete && !prevAllCompleteRef.current) {
      // Delay collapse slightly so user sees the completion state
      const timeout = setTimeout(() => {
        setIsCollapsed(true);
      }, 500);
      return () => clearTimeout(timeout);
    }
    prevAllCompleteRef.current = allComplete;
  }, [allComplete]);

  return (
    <div className="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden p-1">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-2 py-1.5 flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {isCollapsed ? (
            <CaretRightIcon size={12} weight="bold" className="text-gray-500 flex-shrink-0" />
          ) : (
            <CaretDownIcon size={12} weight="bold" className="text-gray-500 flex-shrink-0" />
          )}

          {allComplete ? (
            <CheckCircleIcon size={16} weight="fill" className="text-emerald-600 flex-shrink-0" />
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="flex-shrink-0"
            >
              <SpinnerGapIcon size={16} weight="regular" className="text-indigo-600" />
            </motion.div>
          )}

          {allComplete ? (
            <span className="text-[13px] text-gray-700">
              Thinking · {formatElapsedTime(elapsedTime)}
            </span>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-[13px] font-medium text-gray-900 flex-shrink-0">Thinking</span>
              <span className="text-[13px] text-gray-500">·</span>
              <span className="text-[13px] text-gray-700 truncate">
                {steps.find((s) => s.status === 'in-progress')?.text ||
                  `${completedCount}/${totalCount} steps`}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {!allComplete && (
            <span className="text-[11px] text-gray-500 tabular-nums">
              {formatElapsedTime(elapsedTime)}
            </span>
          )}
        </div>
      </button>

      {/* Steps - Timeline style */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border border-gray-100 bg-white rounded-lg">
              <div className="px-3 py-3 space-y-0">
                {visibleSteps.map((step, idx) => (
                  <div key={step.id} className="relative flex">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center mr-3 flex-shrink-0">
                      <div
                        className={`
                          w-6 h-6 rounded-full flex items-center justify-center
                          ${step.status === 'in-progress' ? 'bg-indigo-50' : 'bg-gray-50'}
                        `}
                      >
                        <StepIcon icon={step.icon} status={step.status} />
                      </div>
                      {idx < visibleSteps.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 min-h-[8px]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 ${idx < visibleSteps.length - 1 ? 'pb-3' : ''}`}>
                      <div className="flex items-center justify-between">
                        <span
                          className={`
                            text-[13px]
                            ${step.status === 'in-progress' ? 'text-gray-900 font-medium' : step.status === 'complete' ? 'text-gray-800' : 'text-gray-700'}
                          `}
                        >
                          {step.text}
                        </span>
                        <StatusIcon status={step.status} />
                      </div>
                      {/* Subtitle/detail - shown below main text */}
                      {(step.subtitle || step.detail) && (
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          {step.subtitle || step.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Plan Card Component
// ============================================================================

interface PlanCardProps {
  plan: DashboardPlan;
  onBuild: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onBuild }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-[13px] font-medium text-gray-900">{plan.title}</h3>
        <p className="text-[13px] text-gray-700 mt-1">{plan.description}</p>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* KPIs */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            KPI Cards
          </p>
          <div className="flex flex-wrap gap-1.5">
            {plan.kpis.map((kpi, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 text-xs text-gray-700 bg-gray-100 rounded"
              >
                {kpi}
              </span>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Charts</p>
          <div className="flex flex-wrap gap-1.5">
            {plan.charts.map((chart, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 text-xs text-gray-700 bg-gray-100 rounded"
              >
                {chart}
              </span>
            ))}
          </div>
        </div>

        {/* Table */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Data Table
          </p>
          <span className="inline-flex items-center px-2 py-0.5 text-xs text-gray-700 bg-gray-100 rounded">
            {plan.table}
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="px-4 py-3 border-t border-gray-100">
        <PrimaryButton onClick={onBuild} className="w-full">
          Build Dashboard
        </PrimaryButton>
      </div>
    </div>
  );
};

// ============================================================================
// Von Logo Component - Uses the official Von logo with radial gradient
// ============================================================================

const VonLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0"
  >
    <circle cx="14" cy="14" r="14" fill="url(#vonLogoChatGradient)" />
    <path
      d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
      stroke="white"
      strokeWidth="1.33"
    />
    <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
    <defs>
      <radialGradient
        id="vonLogoChatGradient"
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
);

// ============================================================================
// User Avatar Component - Shows initials with purple gradient
// ============================================================================

const UserAvatar: React.FC<{ size?: number; initials?: string }> = ({
  size = 24,
  initials = 'JD',
}) => (
  <div
    className="rounded-full bg-indigo-600 mt-1 flex items-center justify-center flex-shrink-0"
    style={{ width: size, height: size }}
  >
    <span className="text-[10px] font-medium text-white">{initials}</span>
  </div>
);

// ============================================================================
// User Message Component
// ============================================================================

interface UserMessageProps {
  content: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ content }) => {
  return (
    <div className="flex items-start gap-2 justify-end">
      <div className="max-w-[80%] bg-gray-50 rounded-2xl px-3 py-2">
        <p className="text-[13px] text-gray-900">{content}</p>
      </div>
      <UserAvatar size={24} />
    </div>
  );
};

// ============================================================================
// Artifact Card Component
// ============================================================================

interface ArtifactCardProps {
  artifact: DashboardArtifact;
  onClick?: () => void;
}

const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onClick }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${onClick ? 'cursor-pointer hover:border-gray-200 transition-colors' : ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 w-full justify-between">
            <h3 className="text-[13px] font-medium text-gray-900">{artifact.title}</h3>
            <span className="text-[11px] text-indigo-600 hover:text-indigo-700 cursor-pointer">
              View
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Assistant Message Component
// ============================================================================

interface AssistantMessageProps {
  content: string;
  thinkingSteps?: ThinkingStep[];
  isThinking?: boolean;
  elapsedTime?: number;
  plan?: DashboardPlan;
  onBuildDashboard?: () => void;
  artifact?: DashboardArtifact;
  /** Callback when sources button is clicked */
  onSourcesClick?: () => void;
  /** Whether to show the feedback row (thumbs up/down + sources) */
  showFeedbackRow?: boolean;
  /** Callback when artifact is clicked */
  onArtifactClick?: () => void;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  thinkingSteps,
  isThinking = false,
  elapsedTime = 0,
  plan,
  onBuildDashboard,
  artifact,
  onSourcesClick,
  showFeedbackRow = false,
  onArtifactClick,
}) => {
  // Auto-collapse thinking block when all steps are complete
  const allStepsComplete = thinkingSteps?.every((s) => s.status === 'complete') ?? false;

  return (
    <div className="flex items-start gap-2">
      <VonLogo size={24} />
      <div className="flex-1 space-y-3 min-w-0">
        {/* Thinking Block */}
        {thinkingSteps && thinkingSteps.length > 0 && (
          <ThinkingBlock
            steps={thinkingSteps}
            isThinking={isThinking}
            elapsedTime={elapsedTime}
            defaultCollapsed={allStepsComplete && !isThinking}
          />
        )}

        {/* Message Content - rendered as markdown */}
        {content && (
          <div className="markdown-content text-[13px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}

        {/* Artifact Card */}
        {artifact && <ArtifactCard artifact={artifact} onClick={onArtifactClick} />}

        {/* Plan Card with Build Button */}
        {plan && onBuildDashboard && <PlanCard plan={plan} onBuild={onBuildDashboard} />}

        {/* Action icons row - Copy, Download, Thumbs up/down, Sources */}
        {showFeedbackRow && (
          <div className="flex items-center gap-1 pt-1">
            <button
              className="p-1.5 text-gray-700 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              title="Copy"
            >
              <CopyIcon size={14} weight="regular" />
            </button>
            <button
              className="p-1.5 text-gray-700 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              title="Download"
            >
              <DownloadSimpleIcon size={14} weight="regular" />
            </button>
            <button
              className="p-1.5 text-gray-700 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              title="Good response"
            >
              <ThumbsUpIcon size={14} weight="regular" />
            </button>
            <button
              className="p-1.5 text-gray-700 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              title="Bad response"
            >
              <ThumbsDownIcon size={14} weight="regular" />
            </button>
            {onSourcesClick && (
              <>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <button
                  onClick={onSourcesClick}
                  className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-gray-700 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                  title="View sources"
                >
                  <FileMagnifyingGlassIcon size={14} weight="regular" />
                  <span>Sources</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ChatViewV2: React.FC<ChatViewV2Props> = ({
  messages,
  isThinking = false,
  thinkingSteps = [],
  elapsedTime = 0,
  onBuildDashboard,
  onSourcesClick,
  onArtifactClick,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useLayoutEffect(() => {
    if (messagesEndRef.current && containerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {messages.map((message) => {
          // Show feedback row on assistant messages that have an artifact or plan (completed responses)
          const showFeedback = message.type === 'assistant' && !!(message.artifact || message.plan);

          return (
            <div key={message.id}>
              {message.type === 'user' ? (
                <UserMessage content={message.content} />
              ) : (
                <AssistantMessage
                  content={message.content}
                  thinkingSteps={message.thinkingSteps}
                  isThinking={isThinking && message.id === messages[messages.length - 1]?.id}
                  elapsedTime={message.thinkingElapsedTime ?? elapsedTime}
                  plan={message.plan}
                  onBuildDashboard={message.showBuildButton ? onBuildDashboard : undefined}
                  artifact={message.artifact}
                  onSourcesClick={onSourcesClick}
                  showFeedbackRow={showFeedback}
                  onArtifactClick={
                    message.artifact && onArtifactClick
                      ? () => onArtifactClick(message.id)
                      : undefined
                  }
                />
              )}
            </div>
          );
        })}

        {/* Active thinking (for streaming) */}
        {isThinking &&
          thinkingSteps.length > 0 &&
          !messages.some((m) => m.thinkingSteps?.length) && (
            <ThinkingBlock
              steps={thinkingSteps}
              isThinking={isThinking}
              elapsedTime={elapsedTime}
            />
          )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatViewV2;
