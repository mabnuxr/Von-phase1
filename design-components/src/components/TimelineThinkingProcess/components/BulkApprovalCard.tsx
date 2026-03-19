import React, { useMemo, useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  WarningCircleIcon,
  CaretDownIcon,
  CaretRightIcon,
} from '@phosphor-icons/react';
import type { ApprovalData, BulkApprovalRecord } from '../types';
import { CompactApprovalCard } from './CompactApprovalCard';

// ============================================================================
// Completed Bulk Card - Collapsed summary when approved/rejected
// ============================================================================

interface CompletedBulkCardProps {
  records: BulkApprovalRecord[];
  approval: ApprovalData;
  isApproved: boolean;
}

const CompletedBulkCard: React.FC<CompletedBulkCardProps> = ({ records, approval, isApproved }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-2 bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden min-w-0">
      {/* Collapsed header - clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isExpanded ? (
            <CaretDownIcon size={14} weight="bold" className="text-gray-500 shrink-0" />
          ) : (
            <CaretRightIcon size={14} weight="bold" className="text-gray-500 shrink-0" />
          )}
          {isApproved ? (
            <CheckCircleIcon size={14} weight="fill" className="text-emerald-600 shrink-0" />
          ) : (
            <XCircleIcon size={14} weight="fill" className="text-red-500 shrink-0" />
          )}
          <span className="text-sm text-gray-900 truncate">{approval.label}</span>
        </div>
        <span
          className={`text-xs shrink-0 ml-2 ${isApproved ? 'text-emerald-700' : 'text-red-600'}`}
        >
          {isApproved ? 'Approved' : 'Rejected'}
        </span>
      </button>

      {/* Expanded content - Show all records */}
      {isExpanded && records.length > 0 && (
        <div className="border-t border-gray-100 max-h-100 overflow-y-auto px-3 py-2 space-y-2">
          {records.map((record) => {
            const recordApproval: ApprovalData = {
              toolCallId: record.recordId,
              summary: `Update ${record.recordName}`,
              label: record.label,
              recordName: record.recordName,
              recordUrl: record.recordUrl,
              operation: approval.operation,
              changes: record.changes,
            };

            return (
              <CompactApprovalCard
                key={record.recordId}
                approval={recordApproval}
                onApprove={() => {}}
                onReject={() => {}}
                isApproved={isApproved}
                isRejected={!isApproved}
                defaultExpanded={false}
                hideActions
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export interface BulkApprovalCardProps {
  approval: ApprovalData;
  onApproveRecord: (recordId: string) => void;
  onRejectRecord: (recordId: string) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
  approvedRecordIds?: Set<string>;
  rejectedRecordIds?: Set<string>;
  /** Whether the entire bulk operation was approved (from backend state on reload) */
  isApproved?: boolean;
  /** Whether the entire bulk operation was rejected (from backend state on reload) */
  isRejected?: boolean;
  /** Whether the approval was invalidated (user sent new message without approving) */
  isExpired?: boolean;
  /** Whether the approval tool encountered a system/validation error */
  isError?: boolean;
}

/**
 * BulkApprovalCard - Simple vertical stack of CompactApprovalCard components
 *
 * Features:
 * - Header with record count
 * - Scrollable container with stacked CompactApprovalCards
 * - Bulk approve/reject buttons at the bottom
 */
export const BulkApprovalCard = React.memo<BulkApprovalCardProps>(
  ({
    approval,
    onApproveRecord,
    onRejectRecord,
    onApproveAll,
    onRejectAll,
    approvedRecordIds = new Set(),
    rejectedRecordIds = new Set(),
    isApproved = false,
    isRejected = false,
    isExpired = false,
    isError = false,
  }) => {
    const records = useMemo(() => approval.bulkRecords || [], [approval.bulkRecords]);

    // Local state for bulk approve/reject (optimistic UI collapse)
    const [bulkAction, setBulkAction] = useState<'approved' | 'rejected' | null>(null);

    const handleApproveAll = () => {
      if (import.meta.env.DEV) {
        console.log('[BulkApprovalCard] handleApproveAll called');
      }
      setBulkAction('approved');
      onApproveAll();
    };

    const handleRejectAll = () => {
      if (import.meta.env.DEV) {
        console.log('[BulkApprovalCard] handleRejectAll called');
      }
      setBulkAction('rejected');
      onRejectAll();
    };

    // Expired/error state — approval was never resolved
    if (isExpired || isError) {
      const borderColor = isError ? 'border-red-200' : 'border-amber-200';
      const iconColor = isError ? 'text-red-400' : 'text-amber-500';
      const labelColor = isError ? 'text-red-500' : 'text-amber-600';
      const labelText = isError ? 'Failed' : 'Invalid';

      return (
        <div
          className={`mt-2 bg-white rounded-xl border ${borderColor} shadow-xs overflow-hidden min-w-0`}
        >
          <div className="w-full px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <WarningCircleIcon size={14} weight="fill" className={`${iconColor} shrink-0`} />
              <span className="text-sm text-gray-900 truncate">{approval.label}</span>
            </div>
            <span className={`text-xs shrink-0 ml-2 ${labelColor}`}>{labelText}</span>
          </div>
        </div>
      );
    }

    // Show completed state when bulk action was taken locally OR from backend (on reload)
    if (bulkAction || isApproved || isRejected) {
      const showAsApproved = bulkAction === 'approved' || (isApproved && !isRejected);
      return (
        <CompletedBulkCard records={records} approval={approval} isApproved={showAsApproved} />
      );
    }

    return (
      <div className="mt-2 min-w-0">
        {/* Header with count */}
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-900">
            {approval.label} to {approval.operation}
          </span>
        </div>

        {/* Scrollable stacked cards - reusing CompactApprovalCard */}
        <div className="max-h-100 overflow-y-auto space-y-2">
          {records.map((record, idx) => {
            const isApproved = approvedRecordIds.has(record.recordId);
            const isRejected = rejectedRecordIds.has(record.recordId);

            // Convert bulk record to ApprovalData format for CompactApprovalCard
            const recordApproval: ApprovalData = {
              toolCallId: record.recordId,
              summary: `Update ${record.recordName}`,
              label: record.label,
              recordName: record.recordName,
              recordUrl: record.recordUrl,
              operation: approval.operation,
              changes: record.changes,
            };

            return (
              <CompactApprovalCard
                key={record.recordId}
                approval={recordApproval}
                onApprove={() => onApproveRecord(record.recordId)}
                onReject={() => onRejectRecord(record.recordId)}
                isApproved={isApproved}
                isRejected={isRejected}
                defaultExpanded={idx === 0}
                hideActions
              />
            );
          })}
        </div>

        {/* Bulk action buttons at the bottom */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handleRejectAll}
            className="px-2.5 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={handleApproveAll}
            className="px-2.5 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Approve
          </button>
        </div>
      </div>
    );
  }
);

BulkApprovalCard.displayName = 'BulkApprovalCard';
