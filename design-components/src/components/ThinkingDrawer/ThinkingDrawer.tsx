import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  BrainIcon,
  CheckCircleIcon,
  SpinnerGapIcon,
  ArrowSquareOutIcon,
  CodeIcon,
  FileTextIcon,
} from '@phosphor-icons/react';
import type { ThinkingDrawerProps, ThinkingStepDetail } from './types';
import { DrawerBackdrop, TypingText } from './components';

// ============================================================================
// Internal Components
// ============================================================================

interface StepTimelineItemProps {
  step: ThinkingStepDetail;
  isLast: boolean;
  typingSpeed: number;
  onQueryClick?: (queryId: string) => void;
  getQueryName: (queryId: string) => string;
}

const StepTimelineItem = React.memo<StepTimelineItemProps>(
  ({ step, isLast, typingSpeed, onQueryClick, getQueryName }) => {
    const isComplete = step.status === 'complete';
    const isInProgress = step.status === 'in-progress';
    const isPending = step.status === 'pending';

    const handleQueryClick = useCallback(() => {
      if (step.queryId && onQueryClick) {
        onQueryClick(step.queryId);
      }
    }, [step.queryId, onQueryClick]);

    // Don't render pending steps
    if (isPending) return null;

    return (
      <div className="relative flex gap-3">
        {/* Timeline line and icon */}
        <div className="flex flex-col items-center">
          <div
            className={`
              relative z-10 w-6 h-6 flex items-center justify-center rounded-full
              ${isComplete ? 'bg-emerald-50' : isInProgress ? 'bg-indigo-50' : 'bg-gray-100'}
            `}
          >
            {isComplete ? (
              <CheckCircleIcon size={16} weight="fill" className="text-emerald-600" />
            ) : isInProgress ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <SpinnerGapIcon size={14} weight="regular" className="text-indigo-600" />
              </motion.div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-300" />
            )}
          </div>
          {!isLast && <div className="w-px flex-1 bg-gray-200 min-h-[16px]" />}
        </div>

        {/* Content */}
        <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-sm font-medium ${
                isComplete ? 'text-gray-900' : isInProgress ? 'text-indigo-700' : 'text-gray-500'
              }`}
            >
              {step.title}
            </span>
          </div>

          {/* Description with typing animation */}
          <p className="text-xs text-gray-600 leading-relaxed mb-2">
            <TypingText text={step.description} typingSpeed={typingSpeed} isComplete={isComplete} />
          </p>

          {/* Query Link */}
          {step.queryId && isComplete && (
            <button
              onClick={handleQueryClick}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              <span className="underline underline-offset-2">
                query executed ({getQueryName(step.queryId)})
              </span>
              <ArrowSquareOutIcon size={12} />
            </button>
          )}
        </div>
      </div>
    );
  }
);

StepTimelineItem.displayName = 'StepTimelineItem';

// ============================================================================
// Main Component
// ============================================================================

/**
 * ThinkingDrawer - Shows the detailed thinking process in a drawer
 *
 * Features:
 * - Slide-in drawer from the right
 * - Timeline view of thinking steps
 * - Each step shows title + description with typing animation
 * - "Query executed" links that open TransparencyDrawer
 * - Code and artifact display for selected steps
 */
export const ThinkingDrawer: React.FC<ThinkingDrawerProps> = ({
  isOpen,
  onClose,
  steps,
  title = 'Thinking',
  onQueryClick,
  queries = [],
  typingSpeed = 15,
  selectedStep,
}) => {
  // Derived state
  const completedCount = useMemo(
    () => steps.filter((s) => s.status === 'complete').length,
    [steps]
  );
  const totalCount = steps.length;

  // Determine if we're showing a specific step's details
  const showStepDetails = selectedStep && (selectedStep.code || selectedStep.artifactName);

  // Get query name by ID
  const getQueryName = useCallback(
    (queryId: string): string => {
      const query = queries.find((q) => q.id === queryId);
      return query?.name || 'Query';
    },
    [queries]
  );

  // Filter visible steps (non-pending)
  const visibleSteps = useMemo(() => steps.filter((s) => s.status !== 'pending'), [steps]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <DrawerBackdrop onClose={onClose} />

          {/* Drawer Wrapper */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 h-full w-[480px] max-w-[90vw] pr-2 py-2 z-[9999]"
          >
            {/* Inner Container */}
            <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50">
                    {showStepDetails && selectedStep?.code ? (
                      <CodeIcon size={18} weight="regular" className="text-indigo-600" />
                    ) : showStepDetails && selectedStep?.artifactName ? (
                      <FileTextIcon size={18} weight="regular" className="text-indigo-600" />
                    ) : (
                      <BrainIcon size={18} weight="regular" className="text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {showStepDetails ? selectedStep?.text || title : title}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {showStepDetails
                        ? selectedStep?.code
                          ? 'Code execution'
                          : 'Output'
                        : `${completedCount}/${totalCount} steps completed`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <XIcon size={18} weight="bold" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {showStepDetails ? (
                  // Show selected step details (code or artifact)
                  <div className="h-full flex flex-col">
                    {/* Description */}
                    {selectedStep?.description && (
                      <div className="px-5 py-4 border-b border-gray-100">
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {selectedStep.description}
                        </p>
                      </div>
                    )}

                    {/* Code block */}
                    {selectedStep?.code && (
                      <div className="flex-1 bg-gray-900 overflow-auto">
                        <pre className="p-4 text-[13px] text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">
                          <code>{selectedStep.code}</code>
                        </pre>
                      </div>
                    )}

                    {/* Artifact display */}
                    {selectedStep?.artifactName && !selectedStep?.code && (
                      <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <FileTextIcon size={48} weight="regular" className="text-gray-300 mb-3" />
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {selectedStep.artifactName}
                        </p>
                        <p className="text-xs text-gray-500">File generated</p>
                      </div>
                    )}
                  </div>
                ) : steps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <BrainIcon size={48} weight="regular" className="text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No thinking steps recorded</p>
                  </div>
                ) : (
                  <div className="relative px-5 py-4">
                    {visibleSteps.map((step, idx) => (
                      <StepTimelineItem
                        key={step.id}
                        step={step}
                        isLast={idx === visibleSteps.length - 1}
                        typingSpeed={typingSpeed}
                        onQueryClick={onQueryClick}
                        getQueryName={getQueryName}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ThinkingDrawer;
