import React from 'react';
import { motion } from 'framer-motion';
import type { ApprovalState } from '../ChatSidebarV2';

export interface ApprovalDotProps {
  state: ApprovalState;
  /** Extra Tailwind classes (typically positioning). */
  className?: string;
}

/**
 * Corner-badge dot for pending or expired approvals.
 *
 * - `pending` — purple, quick confident pulse (actionable).
 * - `expired` — orange→red gradient, slower softer pulse (overdue).
 *
 * Always rendered with a white ring so it reads cleanly regardless of what
 * sits behind it (conversation row, icon button, hover tint).
 */
export const ApprovalDot: React.FC<ApprovalDotProps> = ({ state, className = '' }) => {
  const isExpired = state === 'expired';
  return (
    <motion.span
      aria-label={isExpired ? 'Approval expired' : 'Pending approval'}
      className={`
        w-2 h-2 rounded-full ring-2 ring-white pointer-events-none
        ${isExpired ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-purple-500'}
        ${className}
      `}
      animate={
        isExpired
          ? { scale: [1, 1.15, 1], opacity: [0.9, 1, 0.9] }
          : { scale: [1, 1.25, 1], opacity: [1, 0.7, 1] }
      }
      transition={{
        duration: isExpired ? 2.8 : 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

export default ApprovalDot;
