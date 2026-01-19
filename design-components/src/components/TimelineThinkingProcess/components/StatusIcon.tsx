import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircleIcon,
  SpinnerGapIcon,
  WarningCircleIcon,
  CircleIcon,
  XCircleIcon,
  BellIcon,
} from '@phosphor-icons/react';
import type { StatusIconProps } from '../types';

// ============================================================================
// Component
// ============================================================================

/**
 * StatusIcon - Displays an icon based on step status
 *
 * Supports all timeline status types including approval states.
 */
export const StatusIcon = React.memo<StatusIconProps>(({ status, size = 14 }) => {
  switch (status) {
    case 'complete':
      return <CheckCircleIcon size={size} weight="fill" className="text-emerald-600" />;
    case 'in-progress':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <SpinnerGapIcon size={size} weight="regular" className="text-indigo-600" />
        </motion.div>
      );
    case 'awaiting-approval':
      return <BellIcon size={size} weight="fill" className="text-amber-500" />;
    case 'warning':
      return <WarningCircleIcon size={size} weight="fill" className="text-amber-500" />;
    case 'error':
      return <XCircleIcon size={size} weight="fill" className="text-red-500" />;
    case 'pending':
    default:
      return <CircleIcon size={size} weight="regular" className="text-gray-300" />;
  }
});

StatusIcon.displayName = 'StatusIcon';
