import React from 'react';
import type { ApprovalState } from '../ChatSidebarV2';

export interface ApprovalPillProps {
  state: ApprovalState;
  /** Extra Tailwind classes (typically trailing margin to clear an overlapping button). */
  className?: string;
}

/**
 * Inline labeled pill for pending or expired approvals on conversation rows.
 *
 * - `pending`  — purple, "Pending".
 * - `expired`  — orange, "Expired".
 *
 * Sits as a flex child on the trailing edge of a row; callers pass extra
 * classes (e.g. `mr-7`) when they need to make room for an overlapping
 * absolutely-positioned sibling like the row's `⋯` menu.
 */
export const ApprovalPill: React.FC<ApprovalPillProps> = ({ state, className = '' }) => {
  const isExpired = state === 'expired';
  return (
    <span
      aria-label={isExpired ? 'Approval expired' : 'Pending approval'}
      className={`flex-shrink-0 px-1.5 py-px rounded-full text-[10px] font-semibold leading-[14px] whitespace-nowrap ${
        isExpired ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
      } ${className}`}
    >
      {isExpired ? 'Expired' : 'Pending'}
    </span>
  );
};

export default ApprovalPill;
