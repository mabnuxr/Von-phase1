import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import type { StepStatus } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface StatusIconProps {
  status: StepStatus;
  size?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * StatusIcon - Displays an icon based on step status
 *
 * Used within ThinkingDrawer for showing step completion state.
 * This is a simplified version supporting only pending, in-progress, and complete states.
 */
export const StatusIcon = React.memo<StatusIconProps>(({ status, size = 16 }) => {
  switch (status) {
    case 'complete':
      return <CheckCircleIcon size={size} weight="fill" className="text-emerald-600" />;
    case 'in-progress':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <SpinnerGapIcon size={size - 2} weight="regular" className="text-indigo-600" />
        </motion.div>
      );
    case 'pending':
    default:
      return <div className="w-2 h-2 rounded-full bg-gray-300" />;
  }
});

StatusIcon.displayName = 'StatusIcon';
