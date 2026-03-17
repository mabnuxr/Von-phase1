import React from 'react';
import { motion } from 'framer-motion';
import type { MessageStatus } from './types';

interface MessageStatusBadgeProps {
  status?: MessageStatus;
  errorMessage?: string;
  className?: string;
}

/**
 * Badge component to display message status
 *
 * Shows visual indicators for different message states:
 * - streaming: Animated pulsing indicator
 * - failed: Error badge with error message
 * - created/completed: No badge (normal state)
 *
 * Note: Stuck/timed-out messages are soft-deleted by backend,
 * so they disappear from the list rather than showing a timeout badge.
 */
export const MessageStatusBadge: React.FC<MessageStatusBadgeProps> = ({
  status,
  errorMessage,
  className = '',
}) => {
  // Don't show badge for normal states or timeout (timeout is internal recovery, not user-facing)
  if (
    !status ||
    status === 'created' ||
    status === 'completed' ||
    status === 'timeout' ||
    status === 'expired'
  ) {
    return null;
  }

  // Streaming state - show pulsing animation
  if (status === 'streaming') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium  ${className}`}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-1.5 h-1.5 rounded-full bg-blue-500"
        />
        Streaming
      </motion.div>
    );
  }

  // Failed state
  if (status === 'failed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-800 text-xs font-medium  ${className}`}
        title={errorMessage || 'An error occurred'}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {errorMessage ? <span className="max-w-[200px] truncate">{errorMessage}</span> : 'Failed'}
      </motion.div>
    );
  }

  // Timeout state is handled silently (no badge shown)
  // The timeout mechanism still works to recover stuck inputs,
  // but we don't show it to users as it's an internal recovery mechanism
  return null;
};
