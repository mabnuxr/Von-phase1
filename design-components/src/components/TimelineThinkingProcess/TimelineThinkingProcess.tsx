import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { TimelineThinkingProcessProps } from './types';
import { formatElapsedTime } from './utils';
import { useTimelineState } from './hooks';
import { StepRow, PlaceholderStepRow, VonShimmer, AnimatedDots } from './components';
import { ThinkingDrawer, type ThinkingStepDetail } from '../ThinkingDrawer';

// ============================================================================
// Main Component
// ============================================================================

/**
 * TimelineThinkingProcess - Displays a collapsible timeline of AI thinking steps
 *
 * Features:
 * - Real-time progress visualization during thinking
 * - Auto-expand current step during thinking
 * - Auto-scroll to latest step
 * - Approval workflow with inline approval cards
 * - Collapse/expand entire thinking block
 * - Click to expand individual steps
 * - Code preview with "click to expand" (disabled)
 * - Sub-steps support for grouped operations
 * - Elapsed time display with formatting
 */
export const TimelineThinkingProcess: React.FC<TimelineThinkingProcessProps> = ({
  steps,
  isThinking = false,
  // isStreaming - reserved for future use (active streaming vs waiting states)
  autoCollapse = false,
  initiallyCollapsed = false,
  elapsedTime = 0,
  onQueryClick,
  queries = [],
  title = 'Thinking',
  onExpandStep,
  onApprove,
  onReject,
  onArtifactClick,
  onApproveRecord,
  onRejectRecord,
  onApproveAll,
  onRejectAll,
  approvedRecordIds,
  rejectedRecordIds,
}) => {
  // Use custom hook for state management
  const {
    isDrawerOpen,
    isCollapsed,
    selectedStepForDrawer,
    scrollContainerRef,
    localApprovalState,
    setIsDrawerOpen,
    setSelectedStepForDrawer,
    handleToggleCollapse,
    toggleStep,
    handleExpandStep,
    markAsApproved,
    markAsRejected,
    allComplete,
    visibleSteps,
    awaitingApprovalStep,
    getStepDisplayMode,
  } = useTimelineState({
    steps,
    isThinking,
    autoCollapse,
    onExpandStep,
    initiallyCollapsed,
  });

  // Convert steps to drawer format
  const drawerSteps: ThinkingStepDetail[] = useMemo(
    () =>
      steps.map((step) => ({
        id: step.id,
        title: step.text,
        description: step.description || step.text,
        status:
          step.status === 'warning' ||
          step.status === 'error' ||
          step.status === 'awaiting-approval'
            ? 'complete'
            : step.status,
        queryId: step.queryId,
      })),
    [steps]
  );

  // Determine if we should show a placeholder step for the "next" step
  // Show placeholder when:
  // - We're thinking AND
  // - Either no steps yet, OR all current steps are complete (no in-progress step)
  // Don't show after approval steps (waiting for user action)
  const shouldShowPlaceholder = useMemo(() => {
    if (!isThinking) return false;

    // No steps yet - show placeholder
    if (visibleSteps.length === 0) return true;

    const lastStep = visibleSteps[visibleSteps.length - 1];

    // Don't show after approval steps (waiting for user action)
    if (lastStep?.status === 'awaiting-approval') return false;
    if (lastStep?.approval) return false;

    // If there's an in-progress step, don't show placeholder (that step has its own spinner)
    const hasInProgressStep = visibleSteps.some((s) => s.status === 'in-progress');
    if (hasInProgressStep) return false;

    // All steps complete, show placeholder for next expected step
    return true;
  }, [isThinking, visibleSteps]);

  // Compute summary for header - shows current activity or progress count
  const summary = useMemo(() => {
    if (steps.length === 0) return '';

    if (isThinking) {
      // Find the current in-progress step
      const inProgressStep = steps.find((s) => s.status === 'in-progress');
      if (inProgressStep) {
        return inProgressStep.text;
      }
      // If no in-progress step, show the last step
      const lastStep = steps[steps.length - 1];
      return lastStep?.text || '';
    }

    return '';
  }, [steps, isThinking]);

  return (
    <>
      <div className="bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden p-1">
        {/* Header - always visible */}
        <button
          onClick={handleToggleCollapse}
          className="w-full px-2 p-1 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Collapse/Expand Caret */}
            {isCollapsed ? (
              <CaretRightIcon size={12} weight="bold" className="text-gray-500 flex-shrink-0" />
            ) : (
              <CaretDownIcon size={12} weight="bold" className="text-gray-500 flex-shrink-0" />
            )}

            {/* Status indicator and title */}
            {allComplete ? (
              <>
                <CheckCircleIcon
                  size={16}
                  weight="fill"
                  className="text-emerald-600 flex-shrink-0"
                />
                <span className="text-sm text-gray-800">{title} completed</span>
                {summary && <span className="text-sm text-gray-600 ml-1">({summary})</span>}
              </>
            ) : isThinking ? (
              <VonShimmer className="text-sm truncate">
                {summary ? `${title}: ${summary}` : title}
                <AnimatedDots />
              </VonShimmer>
            ) : (
              <span className="text-sm text-gray-800">
                {summary ? `${title} (${summary})` : title}
              </span>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {/* Approval indicator */}
            {awaitingApprovalStep && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  focusOnStep(awaitingApprovalStep.id);
                }}
                className="flex items-center px-2 py-1 bg-gray-50 border border-gray-100 text-gray-800 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <span className="text-xs font-medium">Needs approval</span>
              </div>
            )}
            */}

            {/* Elapsed time - always shown */}
            <span className="text-xs text-gray-800 tabular-nums">
              {formatElapsedTime(elapsedTime)}
            </span>
          </div>
        </button>

        {/* Steps container - rendered for entire thinking window or when there are visible steps */}
        <AnimatePresence>
          {!isCollapsed && (visibleSteps.length > 0 || isThinking) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div
                ref={stepsContainerCallbackRef}
                className="mt-1 border border-gray-100 bg-white shadow-xs rounded-lg overflow-y-auto px-2 py-2"
              >
                <div className="space-y-0">
                  {visibleSteps.map((step, idx) => {
                    const displayMode = getStepDisplayMode(step, idx);
                    const isExpanded = displayMode === 'expanded';

                        // Always use StepRow - description is always visible outside expanded block
                        // The isExpanded prop controls whether code/approval/sub-steps are shown
                        // Get the actual toolCallId from approval data, fallback to step.id
                        const toolCallId = step.approval?.toolCallId || step.id;

                    // Check local approval state for optimistic UI update
                    const localState = localApprovalState.get(toolCallId);
                    const isLocallyApproved = localState === 'approved';
                    const isLocallyRejected = localState === 'rejected';

                    // For bulk approval scenarios, only expand the first approval card by default
                    const firstApprovalIdx = visibleSteps.findIndex((s) => s.approval);
                    const isFirstApproval = step.approval && idx === firstApprovalIdx;

                    return (
                      <StepRow
                        key={step.id}
                        step={step}
                        isExpanded={isExpanded}
                        onToggle={() => toggleStep(step.id)}
                        onExpand={() => handleExpandStep(step)}
                        isLast={idx === visibleSteps.length - 1 && !shouldShowPlaceholder}
                        onApprove={
                          onApprove
                            ? () => {
                                if (import.meta.env.DEV) {
                                  console.log('[TimelineThinkingProcess] onApprove called:', {
                                    toolCallId,
                                    stepId: step.id,
                                    stepStatus: step.status,
                                    approvalData: step.approval,
                                  });
                                }
                                markAsApproved(toolCallId);
                                onApprove(toolCallId);
                              }
                            : undefined
                        }
                        onReject={
                          onReject
                            ? () => {
                                if (import.meta.env.DEV) {
                                  console.log('[TimelineThinkingProcess] onReject called:', {
                                    toolCallId,
                                    stepId: step.id,
                                    stepStatus: step.status,
                                    approvalData: step.approval,
                                  });
                                }
                                markAsRejected(toolCallId);
                                onReject(toolCallId);
                              }
                            : undefined
                        }
                        onArtifactClick={onArtifactClick}
                        isLocallyApproved={isLocallyApproved}
                        isLocallyRejected={isLocallyRejected}
                        defaultApprovalExpanded={isFirstApproval}
                        onApproveRecord={onApproveRecord}
                        onRejectRecord={onRejectRecord}
                        onApproveAll={onApproveAll}
                        onRejectAll={onRejectAll}
                        approvedRecordIds={approvedRecordIds}
                        rejectedRecordIds={rejectedRecordIds}
                      />
                    );
                  })}
                  {/* Show placeholder step when thinking and expecting more steps */}
                  {shouldShowPlaceholder && <PlaceholderStepRow isLast={true} />}
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
