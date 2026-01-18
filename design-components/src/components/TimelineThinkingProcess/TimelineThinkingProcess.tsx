import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  CaretDownIcon,
  CaretRightIcon,
  BellIcon,
} from '@phosphor-icons/react';
import type { TimelineThinkingProcessProps } from './types';
import { CONTAINER_HEIGHT } from './constants';
import { formatElapsedTime } from './utils';
import { useTimelineState } from './hooks';
import { StepRow } from './components';
import { ThinkingDrawer, type ThinkingStepDetail } from '../ThinkingDrawer';
import { EngagingMessage } from '../Chat/EngagingMessage';

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
 * - Code preview with "click to expand"
 * - Sub-steps support for grouped operations
 * - Elapsed time display with formatting
 */
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
  // Use custom hook for state management
  const {
    isDrawerOpen,
    isCollapsed,
    selectedStepForDrawer,
    scrollContainerRef,
    setIsDrawerOpen,
    setSelectedStepForDrawer,
    handleToggleCollapse,
    toggleStep,
    handleExpandStep,
    focusOnStep,
    allComplete,
    visibleSteps,
    awaitingApprovalStep,
    getStepDisplayMode,
  } = useTimelineState({
    steps,
    isThinking,
    controlledCollapsed,
    onToggleCollapse,
    onExpandStep,
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

  // Compute content signature for EngagingMessage - changes when steps update
  const contentSignature = useMemo(() => {
    const stepCount = steps.length;
    const lastStepDescription = steps[steps.length - 1]?.description?.length || 0;
    return `${stepCount}-${lastStepDescription}`;
  }, [steps]);

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

            {/* Status indicator and title */}
            {allComplete ? (
              <>
                <CheckCircleIcon size={16} weight="fill" className="text-emerald-600 flex-shrink-0" />
                <span className="text-[13px] text-gray-700">
                  {title} · {formatElapsedTime(elapsedTime)}
                </span>
              </>
            ) : (
              <EngagingMessage
                isActive={isThinking}
                spinnerSize="sm"
                textSize="xs"
                contentSignature={contentSignature}
                showDelay={0}
                className="flex-shrink-0"
              />
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

            {/* Elapsed time when in progress */}
            {!allComplete && (
              <span className="text-[11px] text-gray-500 tabular-nums">
                {formatElapsedTime(elapsedTime)}
              </span>
            )}
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
                        const isExpanded = displayMode === 'expanded';

                        // Always use StepRow - description is always visible outside expanded block
                        // The isExpanded prop controls whether code/approval/sub-steps are shown
                        return (
                          <StepRow
                            key={step.id}
                            step={step}
                            isExpanded={isExpanded}
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
