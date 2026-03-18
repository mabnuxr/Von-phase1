import React from 'react';
import type { CompactApprovalCardProps } from '../types';
import { CompactApprovalCard } from './CompactApprovalCard';

// ============================================================================
// Component
// ============================================================================

/**
 * ApprovalCard - Wrapper component that renders the appropriate approval UI
 *
 * Renders CompactApprovalCard for single record operations
 */
export const ApprovalCard = React.memo<CompactApprovalCardProps>(
  ({ approval, onApprove, onReject, isApproved, isRejected, isExpired, isError }) => {
    return (
      <CompactApprovalCard
        approval={approval}
        onApprove={onApprove}
        onReject={onReject}
        isApproved={isApproved}
        isRejected={isRejected}
        isExpired={isExpired}
        isError={isError}
      />
    );
  }
);

ApprovalCard.displayName = 'ApprovalCard';
