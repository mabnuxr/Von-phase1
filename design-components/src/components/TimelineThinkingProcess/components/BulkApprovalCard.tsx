import React, { useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import type { ApprovalData } from '../types';
import { CompactApprovalCard } from './CompactApprovalCard';

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
  }) => {
    const records = useMemo(() => approval.bulkRecords || [], [approval.bulkRecords]);

    const pendingCount = useMemo(
      () =>
        records.filter(
          (r) => !approvedRecordIds.has(r.recordId) && !rejectedRecordIds.has(r.recordId)
        ).length,
      [records, approvedRecordIds, rejectedRecordIds]
    );

    const approvedCount = useMemo(
      () => records.filter((r) => approvedRecordIds.has(r.recordId)).length,
      [records, approvedRecordIds]
    );

    const rejectedCount = useMemo(
      () => records.filter((r) => rejectedRecordIds.has(r.recordId)).length,
      [records, rejectedRecordIds]
    );

    // All done state - different message based on whether all approved or some rejected
    if (pendingCount === 0 && records.length > 0) {
      const allApproved = rejectedCount === 0;
      return (
        <div className="mt-2 px-3 py-2 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {allApproved ? (
                <>
                  <CheckCircleIcon size={16} weight="fill" className="text-emerald-600" />
                  <span className="text-sm text-gray-900">Bulk update complete</span>
                </>
              ) : (
                <>
                  <XCircleIcon size={16} weight="fill" className="text-red-500" />
                  <span className="text-sm text-gray-900">Bulk update stopped</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs">
              {approvedCount > 0 && (
                <span className="text-emerald-700">{approvedCount} approved</span>
              )}
              {rejectedCount > 0 && <span className="text-red-600">{rejectedCount} rejected</span>}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2">
        {/* Header with count */}
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-900">
            {records.length}{' '}
            {records.length === 1
              ? approval.objectType
              : approval.objectType.endsWith('y')
                ? approval.objectType.slice(0, -1) + 'ies'
                : approval.objectType + 's'}{' '}
            to update
          </span>
        </div>

        {/* Scrollable stacked cards - reusing CompactApprovalCard */}
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {records.map((record, idx) => {
            const isApproved = approvedRecordIds.has(record.recordId);
            const isRejected = rejectedRecordIds.has(record.recordId);

            // Convert bulk record to ApprovalData format for CompactApprovalCard
            const recordApproval: ApprovalData = {
              toolCallId: record.recordId,
              summary: `Update ${record.recordName}`,
              objectType: approval.objectType,
              recordName: record.recordName,
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
              />
            );
          })}
        </div>

        {/* Bulk action buttons at the bottom */}
        {pendingCount > 0 && (
          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onRejectAll}
              className="px-2.5 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Reject All
            </button>
            <button
              type="button"
              onClick={onApproveAll}
              className="px-2.5 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Approve All
            </button>
          </div>
        )}
      </div>
    );
  }
);

BulkApprovalCard.displayName = 'BulkApprovalCard';
