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
    return (
      <div className="flex items-center justify-center w-[14px] h-[14px] rounded-full bg-amber-500">
        <HourglassIcon size={10} weight="fill" className="text-white" />
      </div>
    );
  }
  if (status === 'warning') {
    return (
      <div className="flex items-center justify-center w-[14px] h-[14px] rounded-full bg-orange-500">
        <WarningIcon size={10} weight="fill" className="text-white" />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="flex items-center justify-center w-[14px] h-[14px] rounded-full bg-red-500">
        <XCircleIcon size={10} weight="fill" className="text-white" />
      </div>
    );
  }
  // pending
  return <CircleIcon size={14} weight="regular" className="text-gray-400" />;
});

StepIndicator.displayName = 'StepIndicator';
