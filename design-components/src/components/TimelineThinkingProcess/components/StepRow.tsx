import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretDownIcon,
  FileTextIcon,
  GearIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  LightbulbIcon,
  ShieldCheckIcon,
  CodeIcon,
  ChatTextIcon,
  CloudIcon,
} from '@phosphor-icons/react';
import { Streamdown } from 'streamdown';
import type { StepRowProps } from '../types';
import type { StepType, SourceType } from '../types';
import { SOURCE_LABELS } from '../constants';
import { StepIndicator } from './StepIndicator';
import { CompactApprovalCard } from './CompactApprovalCard';

// Get appropriate icon component based on step type and source
const getStepIcon = (type?: StepType, source?: SourceType) => {
  if (type === 'tool_call') {
    switch (source) {
      case 'salesforce':
        return CloudIcon;
      case 'gong':
        return PhoneIcon;
      case 'email':
        return EnvelopeIcon;
      case 'calendar':
        return CalendarIcon;
      default:
        return GearIcon;
    }
  }
  if (type === 'reasoning') return LightbulbIcon;
  if (type === 'approval') return ShieldCheckIcon;
  if (type === 'code_execution') return CodeIcon;
  if (type === 'output') return ChatTextIcon;
  return GearIcon; // default
};

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
  ({ step, isExpanded, onToggle, onExpand, isLast, onApprove, onReject, onArtifactClick }) => {
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

    const isInProgress = step.status === 'in-progress';
    const isComplete = step.status === 'complete';

    // Get source label for tool calls
    const sourceLabel = useMemo(() => {
      if ((step.type === 'tool_call' || step.type === 'approval') && step.source) {
        return SOURCE_LABELS[step.source];
      }
      return null;
    }, [step.type, step.source]);

    // Get the icon component for this step
    const IconComponent = useMemo(
      () => getStepIcon(step.type, step.source),
      [step.type, step.source]
    );

    return (
      <div className="relative flex gap-3 overflow-hidden">
        {/* Timeline line and icon - matching CallsTabContent style */}
        <div className="flex flex-col items-center">
          <button
            onClick={hasExpandableContent ? onToggle : undefined}
            className={`
              relative z-10 w-7 h-7 flex items-center justify-center rounded-full border bg-white
              transition-colors duration-150
              ${hasExpandableContent ? 'cursor-pointer' : 'cursor-default'}
              ${
                isExpanded
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <IconComponent
              size={14}
              weight={isExpanded ? 'duotone' : 'regular'}
              className={isExpanded ? 'text-indigo-600' : 'text-gray-600'}
            />
          </button>
          {!isLast && <div className="w-px flex-1 bg-gray-200 min-h-[16px]" />}
        </div>

        {/* Content */}
        <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-4'}`}>
          {/* Header row */}
          <div className="flex items-center gap-2 overflow-hidden">
            <button
              onClick={hasExpandableContent ? onToggle : undefined}
              className={`flex items-center gap-1.5 flex-1 min-w-0 group ${hasExpandableContent ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {hasExpandableContent && (
                <CaretDownIcon
                  size={12}
                  weight="bold"
                  className={`text-gray-400 group-hover:text-indigo-600 flex-shrink-0 transition-transform duration-150 ${
                    isExpanded ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              )}
              <span
                className={`text-sm font-medium min-w-0 truncate text-left transition-colors ${
                  isInProgress
                    ? 'text-gray-900'
                    : isComplete
                      ? 'text-gray-900 group-hover:text-indigo-600'
                      : 'text-gray-600'
                }`}
              >
                {step.text}
              </span>
            </button>
            {/* Source badge */}
            {sourceLabel && (
              <span className="flex-shrink-0 text-[11px] text-gray-600 px-1.5 py-0.5 bg-gray-100 rounded">
                {sourceLabel}
              </span>
            )}
          </div>

          {/* Expanded content - card style matching CallsTabContent */}
          <AnimatePresence>
            {isExpanded && hasExpandableContent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2 overflow-hidden">
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

                  {/* Sub-steps */}
                  {step.subSteps && step.subSteps.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-gray-200">
                      {step.subSteps.map((subStep) => (
                        <div key={subStep.id} className="flex items-center gap-2 text-xs">
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
                      className="flex items-center gap-2 pt-2 border-t border-gray-200 cursor-pointer hover:text-indigo-600 transition-colors"
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
                      <FileTextIcon size={12} className="text-gray-500" />
                      <span className="text-xs text-gray-600 hover:text-indigo-600">
                        View {step.artifact.tool_name} results
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
