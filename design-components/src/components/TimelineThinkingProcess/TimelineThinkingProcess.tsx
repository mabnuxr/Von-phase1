import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  CaretDownIcon,
  CaretRightIcon,
  BellIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react';
import type { TimelineThinkingProcessProps } from './types';
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
 * - Code preview with "click to expand" (disabled)
 * - Sub-steps support for grouped operations
 * - Elapsed time display with formatting
 */
export const TimelineThinkingProcess: React.FC<TimelineThinkingProcessProps> = ({
  steps,
  isThinking = false,
  isStreaming = false,
  autoCollapse = false,
  elapsedTime = 0,
  onQueryClick,
  queries = [],
  title = 'Thinking',
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  onExpandStep,
  onApprove,
  onReject,
  onArtifactClick,
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
    focusOnStep,
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
    controlledCollapsed,
    onToggleCollapse,
    onExpandStep,
  });

  // Dynamic max-height: fill from the steps container's top to the bottom
  // of the chat scroll container (.chat-messages-wrapper), so the thinking
  // process is scrollable within the visible chat area.
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<Element | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);

  const updateMaxHeight = useCallback((el: HTMLDivElement) => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const elRect = el.getBoundingClientRect();
    const chatRect = chatContainer.getBoundingClientRect();
    // Distance from the steps container top to the chat container bottom, minus padding
    const available = Math.max(chatRect.bottom - elRect.top - 24, 120);
    el.style.maxHeight = `${available}px`;
  }, []);

  // Merged callback ref: assigns to both stepsContainerRef (for max-height)
  // and scrollContainerRef (for auto-scroll tracking in useTimelineState)
  const stepsContainerCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Clean up previous observer and scroll listener
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (scrollHandlerRef.current && chatContainerRef.current) {
        chatContainerRef.current.removeEventListener('scroll', scrollHandlerRef.current);
        scrollHandlerRef.current = null;
      }

      stepsContainerRef.current = node;
      // Also assign to scrollContainerRef so auto-scroll targets the scrollable element
      (scrollContainerRef as React.RefObject<HTMLDivElement | null>).current = node;
      if (!node) return;

      // Find the chat scroll container once
      chatContainerRef.current = node.closest('.chat-messages-wrapper');

      // Initial measurement
      updateMaxHeight(node);

      if (chatContainerRef.current) {
        // Re-measure when the chat container resizes
        observerRef.current = new ResizeObserver(() => {
          updateMaxHeight(node);
        });
        observerRef.current.observe(chatContainerRef.current);

        // Re-measure on scroll so maxHeight updates when user scrolls back
        // to the thinking block after it was mounted off-screen
        scrollHandlerRef.current = () => updateMaxHeight(node);
        chatContainerRef.current.addEventListener('scroll', scrollHandlerRef.current, {
          passive: true,
        });
      }
    },
    [updateMaxHeight, scrollContainerRef]
  );

  // Re-measure on window resize
  useEffect(() => {
    const handleResize = () => {
      if (stepsContainerRef.current) {
        updateMaxHeight(stepsContainerRef.current);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateMaxHeight]);

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

    // When not thinking, show completed/total count
    const completedCount = steps.filter(
      (s) => s.status === 'complete' || s.status === 'warning' || s.status === 'error'
    ).length;
    return `${completedCount}/${steps.length}`;
  }, [steps, isThinking]);

  return (
    <>
      <div className="bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden p-1">
        {/* Header - always visible */}
        <button
          onClick={handleToggleCollapse}
          className="w-full px-2 py-1.5 flex items-center justify-between cursor-pointer"
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
                <span className="text-sm text-gray-700">{title} completed</span>
                {summary && <span className="text-sm text-gray-400 ml-1">({summary})</span>}
              </>
            ) : isThinking ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="flex-shrink-0"
                >
                  <SpinnerGapIcon size={16} weight="regular" className="text-indigo-600" />
                </motion.div>
                <span className="text-sm text-gray-700 truncate">
                  {summary ? `${title}: ${summary}` : title}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-700">
                {summary ? `${title} (${summary})` : title}
              </span>
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
                <span className="text-xs font-medium">Approval</span>
              </motion.div>
            )}

            {/* Elapsed time - always shown */}
            <span className="text-xs text-gray-500 tabular-nums">
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
                className="border border-gray-200 bg-white shadow-xs rounded-lg overflow-y-auto px-3 py-3"
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

                    return (
                      <StepRow
                        key={step.id}
                        step={step}
                        isExpanded={isExpanded}
                        onToggle={() => toggleStep(step.id)}
                        onExpand={() => handleExpandStep(step)}
                        isLast={idx === visibleSteps.length - 1}
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
                      />
                    );
                  })}
                  {isThinking &&
                    !awaitingApprovalStep &&
                    (visibleSteps.length === 0 || !isStreaming) && (
                      <div className="flex items-center gap-3 pt-2 ml-1">
                        <EngagingMessage
                          isActive={isThinking}
                          spinnerSize="sm"
                          textSize="sm"
                          contentSignature={contentSignature}
                          showDelay={2000}
                          initialText="Processing"
                          className="text-gray-600"
                        />
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
