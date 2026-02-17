import React, { useRef, useLayoutEffect, useMemo } from 'react';
import {
  FileMagnifyingGlassIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  CopyIcon,
  DownloadSimpleIcon,
  FileDocIcon,
  PresentationChartIcon,
  TableIcon,
  ChartBarIcon,
  ArrowsOutIcon,
} from '@phosphor-icons/react';
import driveLogo from '../../assets/drive-logo.svg';
import { PrimaryButton } from '../forms/buttons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TimelineThinkingProcess, type TimelineStep } from '../TimelineThinkingProcess';
import { CommandChip } from '../Commands';
import type { Command } from '../Commands/types';

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

export interface DocumentArtifact {
  type: 'document';
  title: string;
  description: string;
  content: string;
}

export interface SlidesArtifact {
  type: 'slides';
  title: string;
  description: string;
  slides: Array<{ id: string; title: string; content: string; notes?: string }>;
}

export interface SpreadsheetArtifact {
  type: 'spreadsheet';
  title: string;
  description: string;
  columns: Array<{ id: string; label: string }>;
  rows: Record<string, string | number>[];
}

export type Artifact = DashboardArtifact | DocumentArtifact | SlidesArtifact | SpreadsheetArtifact;

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  command?: Command;
  thinkingSteps?: ThinkingStep[];
  /** Elapsed time in seconds for thinking steps */
  thinkingElapsedTime?: number;
  showBuildButton?: boolean;
  plan?: DashboardPlan;
  artifact?: Artifact;
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
  /** Callback when artifact download is requested */
  onArtifactDownload?: (artifact: Artifact) => void;
  /** Compact mode — hides avatars/logos so messages use full width. Used in sidebar (Pane 3). */
  compact?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

const toTimelineSteps = (steps: ThinkingStep[]): TimelineStep[] =>
  steps.map((step) => ({
    id: step.id,
    text: step.text,
    status: step.status,
    type: 'tool_call',
    description: step.subtitle || step.detail,
  }));

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
        <h3 className="text-sm font-medium text-gray-900">{plan.title}</h3>
        <p className="text-sm text-gray-700 mt-1">{plan.description}</p>
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
  command?: Command;
  onCommandClick?: (command: Command) => void;
  compact?: boolean;
}

const UserMessage: React.FC<UserMessageProps> = ({ content, command, onCommandClick, compact }) => {
  return (
    <div className="flex items-start gap-2 justify-end">
      <div
        className={`${compact ? 'max-w-full' : 'max-w-[80%]'} bg-gray-50 rounded-2xl px-3 py-2 min-w-[180px]`}
      >
        {command && (
          <div className="mb-1.5">
            <CommandChip command={command} onRemove={() => onCommandClick?.(command)} />
          </div>
        )}
        {content && <p className="text-sm text-gray-900">{content}</p>}
      </div>
      {!compact && <UserAvatar size={24} />}
    </div>
  );
};

// ============================================================================
// Artifact Card Component
// ============================================================================

const ARTIFACT_CARD_CONFIG: Record<Artifact['type'], { icon: React.ReactNode }> = {
  dashboard: {
    icon: <ChartBarIcon size={20} weight="regular" className="text-gray-500" />,
  },
  document: {
    icon: <FileDocIcon size={20} weight="regular" className="text-gray-500" />,
  },
  slides: {
    icon: <PresentationChartIcon size={20} weight="regular" className="text-gray-500" />,
  },
  spreadsheet: {
    icon: <TableIcon size={20} weight="regular" className="text-gray-500" />,
  },
};

interface ArtifactCardProps {
  artifact: Artifact;
  onClick?: () => void;
  onDownload?: () => void;
}

const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onClick, onDownload }) => {
  const config = ARTIFACT_CARD_CONFIG[artifact.type];

  return (
    <div className="border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-gray-300 transition-colors">
      {/* Icon */}
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
        {config.icon}
      </div>

      {/* Title + Description */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{artifact.title}</h4>
        <p className="text-xs text-gray-500 truncate mt-0.5">{artifact.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('Save to Google Drive');
          }}
          className="w-8 h-8 rounded-lg border border-gray-100 text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
          title="Save to Google Drive"
        >
          <img src={driveLogo} alt="Google Drive" width={16} height={16} />
        </button>
        {onDownload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="w-8 h-8 rounded-lg border border-gray-100 text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
            title="Download"
          >
            <DownloadSimpleIcon size={16} weight="regular" />
          </button>
        )}
        {onClick && (
          <button
            onClick={onClick}
            className="w-8 h-8 rounded-lg border border-gray-100 text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
            title="Open"
          >
            <ArrowsOutIcon size={16} weight="regular" />
          </button>
        )}
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
  artifact?: Artifact;
  /** Callback when sources button is clicked */
  onSourcesClick?: () => void;
  /** Whether to show the feedback row (thumbs up/down + sources) */
  showFeedbackRow?: boolean;
  /** Callback when artifact is clicked */
  onArtifactClick?: () => void;
  /** Callback when artifact download is requested */
  onArtifactDownload?: () => void;
  compact?: boolean;
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
  onArtifactDownload,
  compact,
}) => {
  // Auto-collapse thinking block when all steps are complete
  const allStepsComplete = thinkingSteps?.every((s) => s.status === 'complete') ?? false;
  const timelineSteps = useMemo(
    () => (thinkingSteps ? toTimelineSteps(thinkingSteps) : []),
    [thinkingSteps]
  );

  return (
    <div className={`flex items-start ${compact ? '' : 'gap-2'}`}>
      {!compact && <VonLogo size={24} />}
      <div className="flex-1 space-y-3 min-w-0">
        {/* Thinking Block */}
        {timelineSteps.length > 0 && (
          <TimelineThinkingProcess
            steps={timelineSteps}
            isThinking={isThinking}
            elapsedTime={elapsedTime}
            autoCollapse={allStepsComplete && !isThinking}
            initiallyCollapsed={allStepsComplete && !isThinking}
            title="Thinking"
          />
        )}

        {/* Message Content - rendered as markdown */}
        {content && (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}

        {/* Artifact Card */}
        {artifact && (
          <ArtifactCard
            artifact={artifact}
            onClick={onArtifactClick}
            onDownload={onArtifactDownload}
          />
        )}

        {/* Plan Card with Build Button */}
        {plan && onBuildDashboard && <PlanCard plan={plan} onBuild={onBuildDashboard} />}

        {/* Action icons row - Copy, Download, Thumbs up/down, Sources */}
        {showFeedbackRow && (
          <div className="flex items-center gap-1 pt-1">
            <button
              className="p-1.5 text-gray-700 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
              title="Copy"
            >
              <CopyIcon size={14} weight="regular" />
            </button>
            <button
              className="p-1.5 text-gray-700 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
              title="Download"
            >
              <DownloadSimpleIcon size={14} weight="regular" />
            </button>
            <button
              className="p-1.5 text-gray-700 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
              title="Good response"
            >
              <ThumbsUpIcon size={14} weight="regular" />
            </button>
            <button
              className="p-1.5 text-gray-700 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
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
  onArtifactDownload,
  compact = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTimelineSteps = useMemo(() => toTimelineSteps(thinkingSteps), [thinkingSteps]);

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
                <UserMessage
                  content={message.content}
                  command={message.command}
                  compact={compact}
                />
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
                  onArtifactDownload={
                    message.artifact && onArtifactDownload
                      ? () => onArtifactDownload(message.artifact!)
                      : undefined
                  }
                  compact={compact}
                />
              )}
            </div>
          );
        })}

        {/* Active thinking (for streaming) */}
        {isThinking &&
          thinkingSteps.length > 0 &&
          !messages.some((m) => m.thinkingSteps?.length) && (
            <TimelineThinkingProcess
              steps={activeTimelineSteps}
              isThinking={true}
              elapsedTime={elapsedTime}
              title="Thinking"
            />
          )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatViewV2;
