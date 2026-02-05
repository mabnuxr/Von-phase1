import React, { useMemo, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, CaretDownIcon } from '@phosphor-icons/react';
import type { ApprovalData, BulkApprovalRecord } from '../types';
import { CompactApprovalCard } from './CompactApprovalCard';

// ============================================================================
// Completed Bulk Card - Expandable summary when all records are processed
// ============================================================================

interface CompletedBulkCardProps {
  records: BulkApprovalRecord[];
  approval: ApprovalData;
  approvedRecordIds: Set<string>;
  rejectedRecordIds: Set<string>;
  approvedCount: number;
  rejectedCount: number;
  allApproved: boolean;
}

const CompletedBulkCard: React.FC<CompletedBulkCardProps> = ({
  records,
  approval,
  approvedRecordIds,
  rejectedRecordIds,
  approvedCount,
  rejectedCount,
  allApproved,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-2 bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
      {/* Collapsed header - clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isExpanded ? (
            <CaretDownIcon size={14} weight="bold" className="text-gray-500 flex-shrink-0" />
          ) : allApproved ? (
            <CheckCircleIcon size={16} weight="fill" className="text-emerald-600 flex-shrink-0" />
          ) : (
            <XCircleIcon size={16} weight="fill" className="text-red-500 flex-shrink-0" />
          )}
          <span className="text-sm text-gray-900 truncate">
            {allApproved ? 'Bulk update complete' : 'Bulk update stopped'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs flex-shrink-0 ml-2">
          {approvedCount > 0 && <span className="text-emerald-700">{approvedCount} approved</span>}
          {rejectedCount > 0 && <span className="text-red-600">{rejectedCount} rejected</span>}
        </div>
      </button>

      {/* Expanded content - Show all records with their status */}
      {isExpanded && (
        <div className="border-t border-gray-100 max-h-[400px] overflow-y-auto px-3 py-2 space-y-2">
          {records.map((record) => {
            const isApproved = approvedRecordIds.has(record.recordId);
            const isRejected = rejectedRecordIds.has(record.recordId);

            // Convert bulk record to ApprovalData format for CompactApprovalCard
            const recordApproval: ApprovalData = {
              toolCallId: record.recordId,
              summary: `Update ${record.recordName}`,
              objectType: approval.objectType,
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
                isRejected={isRejected}
                defaultExpanded={false}
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

    // All done state - expandable to show individual record statuses
    if (pendingCount === 0 && records.length > 0) {
      const allApproved = rejectedCount === 0;
      return (
        <CompletedBulkCard
          records={records}
          approval={approval}
          approvedRecordIds={approvedRecordIds}
          rejectedRecordIds={rejectedRecordIds}
          approvedCount={approvedCount}
          rejectedCount={rejectedCount}
          allApproved={allApproved}
        />
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
