import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  SpinnerGapIcon,
  CaretDownIcon,
  CaretRightIcon,
  WrenchIcon,
  FileTextIcon,
  CloudIcon,
  PhoneIcon,
  EnvelopeIcon,
  SparkleIcon,
  CalendarIcon,
  WarningCircleIcon,
  CircleIcon,
  XCircleIcon,
  BellIcon,
  CheckIcon,
  XIcon,
} from '@phosphor-icons/react';
import { ThinkingDrawer, type ThinkingStepDetail } from './ThinkingDrawer';
import type { QueryResult } from './TransparencyDrawer';

// ============================================================================
// Types
// ============================================================================

export type StepType = 'reasoning' | 'tool_call' | 'code_execution' | 'output' | 'approval';

export type SourceType = 'salesforce' | 'gong' | 'email' | 'voniq' | 'calendar' | 'generic';

export type StepStatus =
  | 'pending'
  | 'in-progress'
  | 'complete'
  | 'warning'
  | 'error'
  | 'awaiting-approval';

export interface ApprovalData {
  summary: string;
  objectType: string;
  recordName?: string;
  operation: 'create' | 'update' | 'delete';
  changes?: Array<{
    field: string;
    before?: string | number | boolean | null;
    after: string | number | boolean | null;
  }>;
}

export interface TimelineStep {
  id: string;
  text: string;
  status: StepStatus;
  /**
   * Type of step: reasoning, tool_call, code_execution, output, approval
   */
  type?: StepType;
  /**
   * Source type for tool calls: salesforce, gong, email, voniq, calendar
   */
  source?: SourceType;
  /**
   * Detailed description paragraph for the thinking process
   */
  description?: string;
  /**
   * Optional code content for code execution steps
   */
  code?: string;
  /**
   * Optional query ID that links to a query in the TransparencyDrawer
   */
  queryId?: string;
  /**
   * Optional artifact/file reference for output steps
   */
  artifactName?: string;
  /**
   * Sub-steps for grouped operations
   */
  subSteps?: Array<{
    id: string;
    text: string;
    status: StepStatus;
  }>;
  /**
   * Approval data for approval steps
   */
  approval?: ApprovalData;
}

export interface TimelineThinkingProcessProps {
  /**
   * List of thinking steps
   */
  steps: TimelineStep[];

  /**
   * Whether the thinking is still in progress
   */
  isThinking?: boolean;

  /**
   * Elapsed time in seconds (for display)
   */
  elapsedTime?: number;

  /**
   * Callback when a query link is clicked in the thinking drawer
   */
  onQueryClick?: (queryId: string) => void;

  /**
   * Available queries for the thinking drawer links
   */
  queries?: QueryResult[];

  /**
   * Title displayed at the top (when collapsed, shows step count)
   */
  title?: string;

  /**
   * Whether the thinking block is collapsed (hides the step details)
   */
  isCollapsed?: boolean;

  /**
   * Callback when collapse state changes
   */
  onToggleCollapse?: () => void;

  /**
   * Callback when a step is expanded to show full details
   */
  onExpandStep?: (step: TimelineStep) => void;

  /**
   * Callback when an approval is approved
   */
  onApprove?: (stepId: string) => void;

  /**
   * Callback when an approval is rejected
   */
  onReject?: (stepId: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const CONTAINER_HEIGHT = 320;

const SOURCE_CONFIG: Record<SourceType, { icon: React.ElementType; label: string; color: string }> =
  {
    salesforce: { icon: CloudIcon, label: 'Salesforce', color: 'text-blue-600' },
    gong: { icon: PhoneIcon, label: 'Gong', color: 'text-purple-600' },
    email: { icon: EnvelopeIcon, label: 'Email', color: 'text-gray-600' },
    voniq: { icon: SparkleIcon, label: 'VonIQ', color: 'text-teal-600' },
    calendar: { icon: CalendarIcon, label: 'Calendar', color: 'text-orange-500' },
    generic: { icon: WrenchIcon, label: 'Tool', color: 'text-gray-600' },
  };

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
// Sub-components
// ============================================================================

const StatusIcon: React.FC<{ status: StepStatus; size?: number }> = ({ status, size = 14 }) => {
  switch (status) {
    case 'complete':
      return <CheckCircleIcon size={size} weight="fill" className="text-emerald-600" />;
    case 'in-progress':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <SpinnerGapIcon size={size} weight="regular" className="text-indigo-600" />
        </motion.div>
      );
    case 'awaiting-approval':
      return <BellIcon size={size} weight="fill" className="text-amber-500" />;
    case 'warning':
      return <WarningCircleIcon size={size} weight="fill" className="text-amber-500" />;
    case 'error':
      return <XCircleIcon size={size} weight="fill" className="text-red-500" />;
    case 'pending':
    default:
      return <CircleIcon size={size} weight="regular" className="text-gray-300" />;
  }
};

const StepIndicator: React.FC<{
  status: StepStatus;
}> = ({ status }) => {
  if (status === 'in-progress') {
    return <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-indigo-200" />;
  }
  if (status === 'complete') {
    return <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-indigo-200" />;
  }
  if (status === 'awaiting-approval') {
    return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-amber-200" />;
  }
  if (status === 'warning') {
    return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-amber-200" />;
  }
  if (status === 'error') {
    return <span className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-red-200" />;
  }
  // pending
  return <span className="w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-gray-100" />;
};

// Compact Approval Card for inline use
const CompactApprovalCard: React.FC<{
  approval: ApprovalData;
  onApprove: () => void;
  onReject: () => void;
  isApproved?: boolean;
  isRejected?: boolean;
}> = ({ approval, onApprove, onReject, isApproved, isRejected }) => {
  const operationLabel =
    approval.operation === 'create'
      ? 'Create'
      : approval.operation === 'update'
        ? 'Update'
        : 'Delete';

  if (isApproved || isRejected) {
    return (
      <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          {isApproved ? (
            <>
              <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />
              <span className="text-[12px] font-medium text-emerald-700">Approved</span>
            </>
          ) : (
            <>
              <XCircleIcon size={14} weight="fill" className="text-red-500" />
              <span className="text-[12px] font-medium text-red-600">Rejected</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 px-3 py-2.5 bg-amber-50 rounded-lg border border-amber-200">
      {/* Summary */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wide">
              {operationLabel}
            </span>
            <span className="text-[11px] text-amber-600">{approval.objectType}</span>
          </div>
          {approval.recordName && (
            <p className="text-[12px] font-medium text-gray-900 truncate">{approval.recordName}</p>
          )}
          <p className="text-[11px] text-gray-600 mt-0.5">{approval.summary}</p>
        </div>
      </div>

      {/* Changes preview */}
      {approval.changes && approval.changes.length > 0 && (
        <div className="mt-2 pt-2 border-t border-amber-200">
          {approval.changes.slice(0, 2).map((change, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px]">
              <span className="text-gray-500 min-w-[60px]">{change.field}:</span>
              {change.before !== undefined && (
                <span className="text-gray-400 line-through">{String(change.before ?? '—')}</span>
              )}
              <span className="text-gray-400">→</span>
              <span className="text-gray-900 font-medium">{String(change.after ?? '—')}</span>
            </div>
          ))}
          {approval.changes.length > 2 && (
            <p className="text-[10px] text-gray-500 mt-1">
              +{approval.changes.length - 2} more changes
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-2.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReject();
          }}
          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <XIcon size={12} weight="bold" />
          Reject
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onApprove();
          }}
          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <CheckIcon size={12} weight="bold" />
          Approve
        </button>
      </div>
    </div>
  );
};

interface StepRowProps {
  step: TimelineStep;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand?: () => void;
  isLast: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

const StepRow: React.FC<StepRowProps> = ({
  step,
  isExpanded,
  onToggle,
  onExpand,
  isLast,
  onApprove,
  onReject,
}) => {
  const hasExpandableContent =
    step.description || step.code || (step.subSteps && step.subSteps.length > 0) || step.approval;
  const isInProgress = step.status === 'in-progress';
  const isComplete = step.status === 'complete';

  // Get source label for tool calls
  const getSourceLabel = () => {
    if ((step.type === 'tool_call' || step.type === 'approval') && step.source) {
      return SOURCE_CONFIG[step.source].label;
    }
    return null;
  };

  const sourceLabel = getSourceLabel();

  return (
    <div className="relative flex">
      {/* Timeline connector */}
      <div className="flex flex-col items-center mr-3 flex-shrink-0">
        <div className="w-6 h-6 rounded-full flex items-center justify-center">
          <StepIndicator status={step.status} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-200 min-h-[8px]" />}
      </div>

      {/* Content */}
      <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-3'}`}>
        {/* Header */}
        <button
          onClick={hasExpandableContent ? onToggle : undefined}
          className={`
            w-full flex items-center gap-2 text-left group
            ${hasExpandableContent ? 'cursor-pointer' : 'cursor-default'}
          `}
        >
          {/* Expand caret */}
          {hasExpandableContent && (
            <span className="flex-shrink-0">
              {isExpanded ? (
                <CaretDownIcon size={12} weight="bold" className="text-gray-500" />
              ) : (
                <CaretRightIcon size={12} weight="bold" className="text-gray-400" />
              )}
            </span>
          )}

          {/* Step text - improved contrast */}
          <span
            className={`
              flex-1 text-[13px] truncate
              ${isInProgress ? 'text-gray-900 font-medium' : isComplete ? 'text-gray-800' : 'text-gray-600'}
            `}
          >
            {step.text}
          </span>

          {/* Source badge */}
          {sourceLabel && (
            <span className="flex-shrink-0 text-[11px] text-gray-600 px-1.5 py-0.5 bg-gray-100 rounded">
              {sourceLabel}
            </span>
          )}

          {/* Status icon */}
          <span className="flex-shrink-0">
            <StatusIcon status={step.status} size={14} />
          </span>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && hasExpandableContent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mt-2 ml-4">
                {/* Description - improved contrast */}
                {step.description && (
                  <p className="text-[12px] text-gray-700 leading-relaxed mb-2">
                    {step.description}
                  </p>
                )}

                {/* Approval card */}
                {step.approval && (
                  <CompactApprovalCard
                    approval={step.approval}
                    onApprove={onApprove || (() => {})}
                    onReject={onReject || (() => {})}
                    isApproved={step.status === 'complete'}
                    isRejected={step.status === 'error'}
                  />
                )}

                {/* Code block preview */}
                {step.code && (
                  <div
                    className="relative rounded-lg bg-gray-900 overflow-hidden cursor-pointer group/code"
                    onClick={onExpand}
                  >
                    <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 font-mono">Code</span>
                      <span className="text-[10px] text-gray-500 group-hover/code:text-gray-300 transition-colors">
                        Click to expand
                      </span>
                    </div>
                    <pre className="px-3 py-2 text-[11px] text-gray-300 font-mono overflow-hidden max-h-[80px]">
                      <code>
                        {step.code.slice(0, 200)}
                        {step.code.length > 200 ? '...' : ''}
                      </code>
                    </pre>
                  </div>
                )}

                {/* Sub-steps - improved contrast */}
                {step.subSteps && step.subSteps.length > 0 && (
                  <div className="space-y-1.5 mt-1">
                    {step.subSteps.map((subStep) => (
                      <div key={subStep.id} className="flex items-center gap-2 text-[12px]">
                        <StatusIcon status={subStep.status} size={12} />
                        <span
                          className={
                            subStep.status === 'complete' ? 'text-gray-700' : 'text-gray-500'
                          }
                        >
                          {subStep.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Artifact reference */}
                {step.artifactName && (
                  <div
                    className="flex items-center gap-2 mt-2 px-2.5 py-1.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={onExpand}
                  >
                    <FileTextIcon size={14} className="text-gray-600" />
                    <span className="text-[12px] text-gray-800">{step.artifactName}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Collapsed step row - minimal view
const CollapsedStepRow: React.FC<{
  step: TimelineStep;
  onClick: () => void;
}> = ({ step, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 py-1.5 text-left hover:bg-gray-50 rounded transition-colors cursor-pointer"
    >
      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
        <StepIndicator status={step.status} />
      </div>
      <span className="flex-1 text-[12px] text-gray-700 truncate">{step.text}</span>
      <StatusIcon status={step.status} size={12} />
    </button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const TimelineThinkingProcess: React.FC<TimelineThinkingProcessProps> = ({
  steps,
  isThinking = false,
  elapsedTime = 0,
  onQueryClick,
  queries = [],
  title = 'Thinking',
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  onExpandStep,
  onApprove,
  onReject,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [selectedStepForDrawer, setSelectedStepForDrawer] = useState<TimelineStep | null>(null);
  const [focusedStepId, setFocusedStepId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isCollapsed = controlledCollapsed ?? internalCollapsed;

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const handleExpandStep = (step: TimelineStep) => {
    setSelectedStepForDrawer(step);
    setIsDrawerOpen(true);
    onExpandStep?.(step);
  };

  const focusOnStep = (stepId: string) => {
    setFocusedStepId(stepId);
    setExpandedSteps((prev) => new Set(prev).add(stepId));
  };

  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const totalCount = steps.length;
  const allComplete = completedCount === totalCount && totalCount > 0 && !isThinking;

  // Get visible steps (completed + in-progress + awaiting-approval)
  const visibleSteps = steps.filter((s) => s.status !== 'pending');

  // Check if there's any step awaiting approval
  const awaitingApprovalStep = steps.find((s) => s.status === 'awaiting-approval');

  // Get the indices of steps that should be shown expanded during thinking
  const getExpandedStepIndices = (): Set<number> => {
    const expandedIndices = new Set<number>();

    // Find the current in-progress or awaiting-approval step
    const currentIdx = visibleSteps.findIndex(
      (s) => s.status === 'in-progress' || s.status === 'awaiting-approval'
    );

    if (currentIdx !== -1) {
      // Add current step
      expandedIndices.add(currentIdx);
      // Add the one before it (last completed)
      if (currentIdx > 0) {
        expandedIndices.add(currentIdx - 1);
      }
    }

    return expandedIndices;
  };

  // Determine which steps to show expanded vs collapsed
  // When thinking: show only last completed + current in-progress as expanded
  // When complete: show all collapsed unless manually expanded
  const getStepDisplayMode = (step: TimelineStep, index: number): 'expanded' | 'collapsed' => {
    // If user clicked to focus on a specific step, show it expanded
    if (focusedStepId === step.id) {
      return 'expanded';
    }

    // During thinking process
    if (isThinking) {
      const expandedIndices = getExpandedStepIndices();
      if (expandedIndices.has(index)) {
        return 'expanded';
      }
      return 'collapsed';
    }

    // When complete, default to collapsed
    return 'collapsed';
  };

  // Auto-scroll to keep current step in view
  useEffect(() => {
    if (scrollContainerRef.current && !isCollapsed && isThinking) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      });
    }
  }, [visibleSteps.length, isCollapsed, isThinking, steps]);

  // Auto-expand current in-progress or awaiting-approval step
  useEffect(() => {
    const currentStep = steps.find(
      (s) => s.status === 'in-progress' || s.status === 'awaiting-approval'
    );
    if (currentStep) {
      setExpandedSteps((prev) => new Set(prev).add(currentStep.id));
    }
  }, [steps]);

  // Clear focused step when thinking state changes
  useEffect(() => {
    if (isThinking) {
      setFocusedStepId(null);
    }
  }, [isThinking]);

  // Summary for header
  const getSummary = (): string => {
    if (allComplete) {
      return `${totalCount} steps`;
    }
    const inProgressStep = steps.find((s) => s.status === 'in-progress');
    if (inProgressStep) {
      return inProgressStep.text;
    }
    return `${completedCount}/${totalCount} steps`;
  };

  // Convert steps to drawer format
  const drawerSteps: ThinkingStepDetail[] = steps.map((step) => ({
    id: step.id,
    title: step.text,
    description: step.description || step.text,
    status:
      step.status === 'warning' || step.status === 'error' || step.status === 'awaiting-approval'
        ? 'complete'
        : step.status,
    queryId: step.queryId,
  }));

  return (
    <>
      <div className="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden p-1">
        {/* Header - always visible */}
        <button
          onClick={handleToggleCollapse}
          className="w-full px-2 py-1.5 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Collapse/Expand Caret */}
            {isCollapsed ? (
              <CaretRightIcon size={12} weight="bold" className="text-gray-500 flex-shrink-0" />
            ) : (
              <CaretDownIcon size={12} weight="bold" className="text-gray-500 flex-shrink-0" />
            )}

            {/* Status indicator */}
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

            {/* Title and summary */}
            {allComplete ? (
              <span className="text-[13px] text-gray-700">{title}</span>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-[13px] font-medium text-gray-900 flex-shrink-0">{title}</span>
                <span className="text-[13px] text-gray-500">·</span>
                <span className="text-[13px] text-gray-600 truncate">{getSummary()}</span>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {/* Approval indicator with bell + shake animation */}
            {awaitingApprovalStep && (
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  focusOnStep(awaitingApprovalStep.id);
                }}
                className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full cursor-pointer hover:bg-amber-200 transition-colors"
              >
                <BellIcon size={12} weight="fill" />
                <span className="text-[10px] font-medium">Approval</span>
              </motion.div>
            )}

            {/* Elapsed time - always on far right */}
            <span className="text-[11px] text-gray-500 tabular-nums">
              {formatElapsedTime(elapsedTime)}
            </span>
          </div>
        </button>

        {/* Steps container */}
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
                <div
                  ref={scrollContainerRef}
                  className="overflow-y-auto px-3 py-3"
                  style={{ maxHeight: CONTAINER_HEIGHT }}
                >
                  {visibleSteps.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-[13px] text-gray-500">
                      Starting...
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {visibleSteps.map((step, idx) => {
                        const displayMode = getStepDisplayMode(step, idx);

                        if (
                          displayMode === 'collapsed' &&
                          !expandedSteps.has(step.id) &&
                          focusedStepId !== step.id
                        ) {
                          return (
                            <CollapsedStepRow
                              key={step.id}
                              step={step}
                              onClick={() => focusOnStep(step.id)}
                            />
                          );
                        }

                        return (
                          <StepRow
                            key={step.id}
                            step={step}
                            isExpanded={expandedSteps.has(step.id) || displayMode === 'expanded'}
                            onToggle={() => toggleStep(step.id)}
                            onExpand={() => handleExpandStep(step)}
                            isLast={idx === visibleSteps.length - 1}
                            onApprove={onApprove ? () => onApprove(step.id) : undefined}
                            onReject={onReject ? () => onReject(step.id) : undefined}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Thinking Drawer - for expanded step view */}
      <ThinkingDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedStepForDrawer(null);
        }}
        steps={drawerSteps}
        onQueryClick={onQueryClick}
        queries={queries}
        selectedStep={selectedStepForDrawer}
      />
    </>
  );
};

export default TimelineThinkingProcess;
