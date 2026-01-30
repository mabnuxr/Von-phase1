import React, { useCallback } from 'react';
import { CheckCircleIcon, XCircleIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import type { CompactApprovalCardProps } from '../types';

// ============================================================================
// Component
// ============================================================================

/**
 * CompactApprovalCard - Inline approval widget for single-record approval steps
 *
 * Features:
 * - Shows operation type (Create/Update/Delete)
 * - Displays object type and record name
 * - Summary text
 * - Field changes preview (up to 2, counts rest)
 * - Approve/Reject buttons
 * - Status feedback (approved/rejected state)
 *
 * Note: For bulk operations, use ApprovalCard wrapper which delegates to BulkApprovalCard
 */
export const CompactApprovalCard = React.memo<CompactApprovalCardProps>(
  ({ approval, onApprove, onReject, isApproved, isRejected }) => {
    const handleApprove = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onApprove();
      },
      [onApprove]
    );

    const handleReject = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onReject();
      },
      [onReject]
    );

    const operationLabel =
      approval.operation === 'create'
        ? 'Create'
        : approval.operation === 'update'
          ? 'Update'
          : 'Delete';

    if (isApproved || isRejected) {
      return (
        <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            {isApproved ? (
              <>
                <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />
                <span className="text-[12px] font-medium text-emerald-700">Approved</span>
              </>
            ) : (
              <>
                <XCircleIcon size={14} weight="fill" className="text-red-500" />
                <span className="text-[12px] font-medium text-red-600">Rejected</span>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 px-3 py-2.5 bg-amber-50 rounded-lg border border-amber-200">
        {/* Summary */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wide">
                {operationLabel}
              </span>
              <span className="text-[11px] text-amber-600 bg-amber-100 border border-amber-200 px-1 rounded">
                {approval.objectType}
              </span>
            </div>
            {approval.recordName && (
              <p className="text-sm font-medium text-gray-900 truncate">{approval.recordName}</p>
            )}
            <p className="text-xs text-gray-800 mt-0.5">{approval.summary}</p>
          </div>
        </div>

        {/* Changes preview */}
        {approval.changes && approval.changes.length > 0 && (
          <div className="mt-2 pt-2 border-t border-amber-200">
            {approval.changes.slice(0, 2).map((change, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px]">
                <span className="text-gray-700 min-w-[60px]">{change.field}:</span>
                {change.before !== undefined && (
                  <span className="text-gray-700 line-through">{String(change.before ?? '—')}</span>
                )}
                <span className="text-gray-700">→</span>
                <span className="text-gray-700 font-medium">{String(change.after ?? '—')}</span>
              </div>
            ))}
            {approval.changes.length > 2 && (
              <p className="text-[10px] text-gray-500 mt-1">
                +{approval.changes.length - 2} more changes
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={handleReject}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <XIcon size={12} weight="bold" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <CheckIcon size={12} weight="bold" />
            Approve
          </button>
        </div>
      </div>
    );
  }
);

CompactApprovalCard.displayName = 'CompactApprovalCard';
