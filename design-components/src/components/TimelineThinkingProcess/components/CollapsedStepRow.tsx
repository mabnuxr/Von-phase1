import React from 'react';
import type { CollapsedStepRowProps } from '../types';
import { StatusIcon } from './StatusIcon';
import { StepTypeIcon } from './StepTypeIcon';

// ============================================================================
// Component
// ============================================================================

/**
 * CollapsedStepRow - Minimal collapsed view of a step
 *
 * Shows icon, text, and status in a compact clickable row.
 */
export const CollapsedStepRow = React.memo<CollapsedStepRowProps>(({ step, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 py-1.5 text-left hover:bg-gray-50 rounded transition-colors cursor-pointer"
    >
      <div className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
        <StepTypeIcon type={step.type} source={step.source} status={step.status} />
      </div>
      <span className="flex-1 text-[12px] text-gray-700 truncate">{step.text}</span>
      <StatusIcon status={step.status} size={12} />
    </button>
  );
});

CollapsedStepRow.displayName = 'CollapsedStepRow';
