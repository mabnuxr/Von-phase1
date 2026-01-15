import React, { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SpinnerGapIcon,
  CheckCircleIcon,
  CaretDownIcon,
  CaretRightIcon,
  CloudIcon,
  TableIcon,
  ChartBarIcon,
  DatabaseIcon,
} from '@phosphor-icons/react';
import { PrimaryButton } from '../forms/buttons';

// ============================================================================
// Types
// ============================================================================

export type MessageType = 'user' | 'assistant';

export interface ThinkingStep {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'complete';
  icon?: 'salesforce' | 'database' | 'chart' | 'table';
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
// Thinking Step Icon
// ============================================================================

const StepIcon: React.FC<{ icon?: string; status: string }> = ({ icon, status }) => {
  const iconClass = status === 'in-progress' ? 'text-indigo-600' : 'text-gray-500';
  const size = 16;

  switch (icon) {
    case 'salesforce':
      return <CloudIcon size={size} weight="regular" className={iconClass} />;
    case 'database':
      return <DatabaseIcon size={size} weight="regular" className={iconClass} />;
    case 'chart':
      return <ChartBarIcon size={size} weight="regular" className={iconClass} />;
    case 'table':
      return <TableIcon size={size} weight="regular" className={iconClass} />;
    default:
      return <DatabaseIcon size={size} weight="regular" className={iconClass} />;
  }
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

const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ steps, isThinking, elapsedTime, defaultCollapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const totalCount = steps.length;
  const allComplete = completedCount === totalCount && totalCount > 0 && !isThinking;

  const visibleSteps = steps.filter((s) => s.status !== 'pending');

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
                {steps.find((s) => s.status === 'in-progress')?.text || `${completedCount}/${totalCount} steps`}
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

      {/* Steps */}
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
              <div className="px-3 py-3 space-y-2">
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
                    <div className={`flex-1 flex items-center justify-between ${idx < visibleSteps.length - 1 ? 'pb-2' : ''}`}>
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
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">KPI Cards</p>
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
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Data Table</p>
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
// User Message Component
// ============================================================================

interface UserMessageProps {
  content: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ content }) => {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-gray-100 rounded-2xl rounded-br-md px-3 py-2">
        <p className="text-[13px] text-gray-900">{content}</p>
      </div>
    </div>
  );
};

// ============================================================================
// Artifact Card Component
// ============================================================================

interface ArtifactCardProps {
  artifact: DashboardArtifact;
}

const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 w-full justify-between">
            <h3 className="text-[13px] font-medium text-gray-900">{artifact.title}</h3>
            <span className="text-[11px] text-gray-400">·</span>
            <span className="text-[11px] text-gray-500 underline">View</span>
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
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({
  content,
  thinkingSteps,
  isThinking = false,
  elapsedTime = 0,
  plan,
  onBuildDashboard,
  artifact,
}) => {
  // Auto-collapse thinking block when all steps are complete
  const allStepsComplete = thinkingSteps?.every((s) => s.status === 'complete') ?? false;

  return (
    <div className="space-y-3">
      {/* Thinking Block */}
      {thinkingSteps && thinkingSteps.length > 0 && (
        <ThinkingBlock
          steps={thinkingSteps}
          isThinking={isThinking}
          elapsedTime={elapsedTime}
          defaultCollapsed={allStepsComplete && !isThinking}
        />
      )}

      {/* Message Content */}
      {content && (
        <div className="text-[13px] text-gray-900 leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      )}

      {/* Artifact Card */}
      {artifact && <ArtifactCard artifact={artifact} />}

      {/* Plan Card with Build Button */}
      {plan && onBuildDashboard && (
        <PlanCard plan={plan} onBuild={onBuildDashboard} />
      )}
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
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === 'user' ? (
              <UserMessage content={message.content} />
            ) : (
              <AssistantMessage
                content={message.content}
                thinkingSteps={message.thinkingSteps}
                isThinking={isThinking && message.id === messages[messages.length - 1]?.id}
                elapsedTime={elapsedTime}
                plan={message.plan}
                onBuildDashboard={message.showBuildButton ? onBuildDashboard : undefined}
                artifact={message.artifact}
              />
            )}
          </div>
        ))}

        {/* Active thinking (for streaming) */}
        {isThinking && thinkingSteps.length > 0 && !messages.some(m => m.thinkingSteps?.length) && (
          <ThinkingBlock steps={thinkingSteps} isThinking={isThinking} elapsedTime={elapsedTime} />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatViewV2;
