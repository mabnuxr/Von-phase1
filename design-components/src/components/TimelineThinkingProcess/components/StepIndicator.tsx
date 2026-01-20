import React from 'react';
import type { StepIndicatorProps } from '../types';

// ============================================================================
// Component
// ============================================================================

/**
 * StepIndicator - Clean dot indicator for step status
 *
 * Displays a simple colored dot based on step status.
 * Used consistently across StepRow, CollapsedStepRow, and sub-steps.
 */
export const StepIndicator = React.memo<StepIndicatorProps>(({ status }) => {
  if (status === 'in-progress') {
    return <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-indigo-200" />;
  }
  if (status === 'complete') {
    return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-emerald-200" />;
  }
  if (status === 'awaiting-approval') {
    return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-amber-200" />;
  }
  if (status === 'warning') {
    return <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-orange-200" />;
  }
  if (status === 'error') {
    return <span className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-red-200" />;
  }
  // pending
  return <span className="w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-gray-100" />;
});

StepIndicator.displayName = 'StepIndicator';
