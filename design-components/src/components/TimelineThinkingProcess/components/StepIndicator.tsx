import React from 'react';
import { motion } from 'framer-motion';
import {
  SpinnerGapIcon,
  CaretRightIcon,
  CaretDownIcon,
  ExclamationMarkIcon,
  XIcon,
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
 * - in-progress: spinning loader (gray)
 * - complete: accordion caret (clickable to expand/collapse)
 * - awaiting-approval: spinning loader in gray circle
 * - warning: exclamation mark in gray circle
 * - error: X icon in gray circle
 * - pending: empty circle
 *
 * Used consistently across StepRow, CollapsedStepRow, and sub-steps.
 */
export const StepIndicator = React.memo<StepIndicatorProps>(
  ({ status, isExpanded, onToggle, hasExpandableContent }) => {
    if (status === 'in-progress') {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="flex items-center justify-center"
        >
          <SpinnerGapIcon size={14} weight="regular" className="text-gray-800" />
        </motion.div>
      );
    }
    if (status === 'complete') {
      // For complete status with expandable content, show clickable accordion caret
      if (hasExpandableContent && onToggle) {
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="flex items-center justify-center w-[14px] h-[14px] rounded-full bg-gray-50 border border-gray-100 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <CaretDownIcon size={10} weight="bold" className="text-gray-700" />
            ) : (
              <CaretRightIcon size={10} weight="bold" className="text-gray-700" />
            )}
          </button>
        );
      }
      // No expandable content - show static dot
      return (
        <div className="flex items-center justify-center w-[14px] h-[14px] rounded-full bg-gray-50 border border-gray-100">
          <div className="w-[6px] h-[6px] rounded-full bg-transparent border border-gray-700" />
        </div>
      );
    }
    if (status === 'awaiting-approval') {
      // Same spinner as in-progress
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="flex items-center justify-center"
        >
          <SpinnerGapIcon size={14} weight="regular" className="text-gray-800" />
        </motion.div>
      );
    }
    if (status === 'warning') {
      // Exclamation mark inside gray bordered circle
      return (
        <div className="flex items-center justify-center w-[14px] h-[14px] rounded-full bg-gray-50 border border-gray-100">
          <ExclamationMarkIcon size={10} weight="bold" className="text-orange-500" />
        </div>
      );
    }
    if (status === 'error') {
      // Simple X icon inside gray bordered circle
      return (
        <div className="flex items-center justify-center w-[14px] h-[14px] rounded-full bg-gray-50 border border-gray-100">
          <XIcon size={10} weight="bold" className="text-red-500" />
        </div>
      );
    }
    // pending
    return <CircleIcon size={14} weight="regular" className="text-gray-400" />;
  }
);

StepIndicator.displayName = 'StepIndicator';
