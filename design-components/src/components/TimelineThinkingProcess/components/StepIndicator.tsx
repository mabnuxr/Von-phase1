import React from 'react';
import { motion } from 'framer-motion';
import {
  SpinnerGapIcon,
  CheckCircleIcon,
  HourglassIcon,
  WarningIcon,
  XCircleIcon,
  CircleIcon,
} from '@phosphor-icons/react';
import type { StepIndicatorProps } from '../types';

// ============================================================================
// Component
// ============================================================================

/**
 * StepIndicator - Icon indicator for step status
 *
 * Displays appropriate icons based on step status:
 * - in-progress: spinning loader
 * - complete: checkmark
 * - awaiting-approval: hourglass
 * - warning: warning triangle
 * - error: X circle
 * - pending: empty circle
 *
 * Used consistently across StepRow, CollapsedStepRow, and sub-steps.
 */
export const StepIndicator = React.memo<StepIndicatorProps>(({ status }) => {
  if (status === 'in-progress') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="flex items-center justify-center"
      >
        <SpinnerGapIcon size={14} weight="regular" className="text-indigo-600" />
      </motion.div>
    );
  }
  if (status === 'complete') {
    return <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />;
  }
  if (status === 'awaiting-approval') {
    return <HourglassIcon size={14} weight="fill" className="text-amber-500" />;
  }
  if (status === 'warning') {
    return <WarningIcon size={14} weight="fill" className="text-orange-500" />;
  }
  if (status === 'error') {
    return <XCircleIcon size={14} weight="fill" className="text-red-500" />;
  }
  // pending
  return <CircleIcon size={14} weight="regular" className="text-gray-400" />;
});

StepIndicator.displayName = 'StepIndicator';
