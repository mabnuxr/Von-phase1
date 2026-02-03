import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileTextIcon } from '@phosphor-icons/react';
import { Streamdown } from 'streamdown';
import type { StepRowProps } from '../types';
import { StepIndicator } from './StepIndicator';
import { CompactApprovalCard } from './CompactApprovalCard';
import { BulkApprovalCard } from './BulkApprovalCard';
import { TextShimmer } from './TextShimmer';

// ============================================================================
// Component
// ============================================================================

/**
 * StepRow - Main expandable step renderer
 *
 * Features:
 * - Timeline connector (icon + vertical line)
 * - Expandable header with caret
 * - Step text with status icon
 * - Source badge (for tool calls)
 * - Expandable content area with description, approval card, code block, sub-steps
 */
export const StepRow = React.memo<StepRowProps>(
  ({
    step,
    isExpanded,
    onToggle,
    onExpand,
    isLast,
    onApprove,
    onReject,
    onArtifactClick,
    isLocallyApproved,
    isLocallyRejected,
    defaultApprovalExpanded = true,
    onApproveRecord,
    onRejectRecord,
    onApproveAll,
    onRejectAll,
    approvedRecordIds,
    rejectedRecordIds,
  }) => {
    // Don't show expandable content for final response steps (shown below timeline)
    const isFinalResponse = (step as unknown as { isFinalResponse?: boolean }).isFinalResponse;

    const isReasoningStep = step.type === 'reasoning';

    const hasExpandableContent = useMemo(
      () =>
        !isFinalResponse &&
        !isReasoningStep &&
        (step.description ||
          // step.code || // Code preview disabled
          (step.subSteps && step.subSteps.length > 0) ||
          step.approval ||
          step.artifact),
      [
        isFinalResponse,
        isReasoningStep,
        step.description,
        step.subSteps,
        step.approval,
        step.artifact,
      ]
    );

    // Compute effective status - when locally approved/rejected, show as complete/error
    // This ensures the indicator turns green after approval even before backend updates
    // Backend status (error) takes precedence over local optimistic state
    const effectiveStatus = useMemo(() => {
      if (step.status === 'error') return 'error';
      if (isLocallyApproved) return 'complete';
      if (isLocallyRejected) return 'error';
      return step.status;
    }, [isLocallyApproved, isLocallyRejected, step.status]);

    // Determine if text should shimmer (in-progress or awaiting-approval)
    const shouldShimmer =
      effectiveStatus === 'in-progress' || effectiveStatus === 'awaiting-approval';

    return (
      <div className="relative flex gap-1">
        {/* Timeline connector - small dot indicator, centered with title */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-6 h-5 flex items-center justify-center">
            <StepIndicator
              status={effectiveStatus}
              isExpanded={isExpanded}
              onToggle={hasExpandableContent ? onToggle : undefined}
              hasExpandableContent={!!hasExpandableContent}
            />
          </div>
          {!isLast && <div className="w-px flex-1 bg-gray-100 min-h-[8px]" />}
        </div>

        {/* Content */}
        <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-6'}`}>
          {/* Header - use div for reasoning steps (allows text selection and links), div for other rows */}
          {isReasoningStep ? (
            <div className="w-full flex items-start text-left">
              {/* Reasoning text with full markdown support */}
              <div className="flex-1 min-w-0 text-sm leading-5 text-gray-900">
                <Streamdown parseIncompleteMarkdown={true}>{step.text}</Streamdown>
              </div>
            </div>
          ) : (
            <div
              onClick={hasExpandableContent ? onToggle : undefined}
              className={`
                w-full flex items-center text-left
                ${hasExpandableContent ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              {/* Step text - shimmer when in-progress or awaiting approval */}
              {shouldShimmer ? (
                <TextShimmer className="text-sm leading-5">{step.text}</TextShimmer>
              ) : (
                <span className="text-sm leading-5 text-gray-900">{step.text}</span>
              )}
            </div>
          )}

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
                <div className="mt-0.5">
                  {/* Description - with markdown support */}
                  {step.description && (
                    <div className="text-sm text-gray-800/80">
                      <Streamdown parseIncompleteMarkdown={true}>{step.description}</Streamdown>
                    </div>
                  )}

                  {/* Approval card - use BulkApprovalCard for bulk records */}
                  {step.approval &&
                    (step.approval.bulkRecords && step.approval.bulkRecords.length > 0 ? (
                      <BulkApprovalCard
                        approval={step.approval}
                        onApproveRecord={onApproveRecord || (() => {})}
                        onRejectRecord={onRejectRecord || (() => {})}
                        onApproveAll={onApproveAll || (() => {})}
                        onRejectAll={onRejectAll || (() => {})}
                        approvedRecordIds={approvedRecordIds}
                        rejectedRecordIds={rejectedRecordIds}
                      />
                    ) : (
                      <CompactApprovalCard
                        approval={step.approval}
                        onApprove={onApprove || (() => {})}
                        onReject={onReject || (() => {})}
                        isApproved={
                          (isLocallyApproved || step.status === 'complete') &&
                          step.status !== 'error'
                        }
                        isRejected={isLocallyRejected || step.status === 'error'}
                        defaultExpanded={defaultApprovalExpanded}
                      />
                    ))}

                  {/* Code block preview - disabled
                  {step.code && (
                    <div
                      className="relative rounded-lg bg-gray-900 overflow-hidden cursor-pointer group/code my-2"
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
                  */}

                  {/* Sub-steps */}
                  {step.subSteps && step.subSteps.length > 0 && (
                    <div className="pl-2 space-y-1.5 mt-1.5">
                      {step.subSteps.map((subStep) => (
                        <div key={subStep.id} className="flex items-center gap-2 text-sm">
                          <StepIndicator status={subStep.status} />
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

                  {/* Artifact reference - shown when artifact metadata is available */}
                  {step.artifact && (
                    <div
                      className="flex items-center gap-1.5 mt-2 mr-4 px-2.5 py-1.5 bg-gray-50 border border-gray-200  rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        if (onArtifactClick) {
                          onArtifactClick(
                            step.artifact!.artifact_id,
                            step.artifact!.tool_name,
                            step.artifact!.artifact_type,
                            step.artifact!.run_id
                          );
                        } else {
                          // Fallback to onExpand for backward compatibility
                          onExpand?.();
                        }
                      }}
                    >
                      <FileTextIcon size={14} className="text-gray-800" />
                      <span className="text-sm text-gray-900">
                        {step.artifact.tool_name} results
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }
);

StepRow.displayName = 'StepRow';
