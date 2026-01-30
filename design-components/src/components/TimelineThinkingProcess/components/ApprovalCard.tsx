import React from 'react';
import type { CompactApprovalCardProps } from '../types';
import { CompactApprovalCard } from './CompactApprovalCard';
import { BulkApprovalCard } from './BulkApprovalCard';

// ============================================================================
// Component
// ============================================================================

/**
 * ApprovalCard - Wrapper component that renders the appropriate approval UI
 *
 * Renders:
 * - BulkApprovalCard for bulk operations (multiple records)
 * - CompactApprovalCard for single record operations
 */
export const ApprovalCard = React.memo<CompactApprovalCardProps>(
  ({ approval, onApprove, onReject, isApproved, isRejected }) => {
    // Render BulkApprovalCard for bulk operations
    if (approval.approvalType === 'bulk' && approval.operations && approval.operations.length > 0) {
      return (
        <BulkApprovalCard
          approval={approval}
          onApprove={onApprove}
          onReject={onReject}
          isApproved={isApproved}
          isRejected={isRejected}
        />
      );
    }

    // Render CompactApprovalCard for single record operations
    return (
      <CompactApprovalCard
        approval={approval}
        onApprove={onApprove}
        onReject={onReject}
        isApproved={isApproved}
        isRejected={isRejected}
      />
    );
  }
);

ApprovalCard.displayName = 'ApprovalCard';
