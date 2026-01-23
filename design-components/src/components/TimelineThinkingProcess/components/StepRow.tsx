import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDownIcon, CaretRightIcon, FileTextIcon } from '@phosphor-icons/react';
import { Streamdown } from 'streamdown';
import type { StepRowProps } from '../types';
import { SOURCE_LABELS } from '../constants';
import { StepIndicator } from './StepIndicator';
import { CompactApprovalCard } from './CompactApprovalCard';

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
  }) => {
    // Don't show expandable content for final response steps (shown below timeline)
    const isFinalResponse = (step as unknown as { isFinalResponse?: boolean }).isFinalResponse;

    const hasExpandableContent = useMemo(
      () =>
        !isFinalResponse &&
        (step.description ||
          step.code ||
          (step.subSteps && step.subSteps.length > 0) ||
          step.approval ||
          step.artifact),
      [isFinalResponse, step.description, step.code, step.subSteps, step.approval, step.artifact]
    );

    // Compute effective status - when locally approved/rejected, show as complete/error
    // This ensures the indicator turns green after approval even before backend updates
    const effectiveStatus = useMemo(() => {
      if (isLocallyApproved) return 'complete';
      if (isLocallyRejected) return 'error';
      return step.status;
    }, [isLocallyApproved, isLocallyRejected, step.status]);

    const isInProgress = effectiveStatus === 'in-progress';
    const isComplete = effectiveStatus === 'complete';

    // Get source label for tool calls
    const sourceLabel = useMemo(() => {
      if ((step.type === 'tool_call' || step.type === 'approval') && step.source) {
        return SOURCE_LABELS[step.source];
      }
      return null;
    }, [step.type, step.source]);

    return (
      <div className="relative flex">
        {/* Timeline connector - small dot indicator */}
        <div className="flex flex-col items-center mr-3 flex-shrink-0">
          <div className="w-6 h-6 rounded-full flex items-center justify-center">
            <StepIndicator status={effectiveStatus} />
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

            {/* Step text */}
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
                  {/* Description - with markdown support */}
                  {step.description && (
                    <div className="text-xs text-gray-700 leading-relaxed">
                      <Streamdown parseIncompleteMarkdown={true}>{step.description}</Streamdown>
                    </div>
                  )}

                  {/* Approval card */}
                  {step.approval && (
                    <CompactApprovalCard
                      approval={step.approval}
                      onApprove={onApprove || (() => {})}
                      onReject={onReject || (() => {})}
                      isApproved={isLocallyApproved || step.status === 'complete'}
                      isRejected={isLocallyRejected || step.status === 'error'}
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

                  {/* Sub-steps */}
                  {step.subSteps && step.subSteps.length > 0 && (
                    <div className="space-y-1.5 mt-1">
                      {step.subSteps.map((subStep) => (
                        <div key={subStep.id} className="flex items-center gap-2 text-[12px]">
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
                      className="flex items-center gap-2 mt-2 px-2.5 py-1.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
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
                      <FileTextIcon size={14} className="text-gray-600" />
                      <span className="text-[12px] text-gray-800">
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
