import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CalendarIcon } from '@phosphor-icons/react';
import type { ApprovalData, BulkOperation } from '../types';
import { BulkUpdateItemRow } from './BulkUpdateItemRow';

// ============================================================================
// Salesforce Icon
// ============================================================================

const SalesforceIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.02 5.64c.72-.78 1.74-1.26 2.88-1.26 1.5 0 2.82.84 3.48 2.1.54-.24 1.14-.36 1.74-.36 2.46 0 4.44 2.04 4.44 4.56s-1.98 4.56-4.44 4.56c-.36 0-.72-.06-1.08-.12-.54 1.26-1.8 2.16-3.24 2.16-.66 0-1.26-.18-1.8-.48-.6 1.38-1.98 2.34-3.54 2.34-1.86 0-3.42-1.32-3.78-3.06-.18.06-.42.06-.6.06-1.86 0-3.36-1.56-3.36-3.48 0-1.38.78-2.58 1.92-3.12-.12-.42-.18-.84-.18-1.32 0-2.52 2.04-4.56 4.56-4.56.96 0 1.86.3 2.58.84z"
      fill="#00A1E0"
    />
  </svg>
);

// ============================================================================
// Bulk Approval Type Detection
// ============================================================================

type BulkApprovalSource = 'salesforce' | 'calendar' | 'generic';

function detectBulkApprovalSource(approval: ApprovalData): BulkApprovalSource {
  // Check objectType first (set by transform)
  if (approval.objectType?.toLowerCase().includes('calendar')) {
    return 'calendar';
  }
  // Check first operation's sobject_type
  const firstOpType = approval.operations?.[0]?.sobject_type?.toLowerCase();
  if (firstOpType?.includes('calendar')) {
    return 'calendar';
  }
  // Default to Salesforce for other bulk operations
  return 'salesforce';
}

function getBulkApprovalLabel(source: BulkApprovalSource): string {
  switch (source) {
    case 'calendar':
      return 'calendar event';
    case 'salesforce':
    default:
      return 'Salesforce record';
  }
}

// ============================================================================
// Bulk Approval Card Props
// ============================================================================

export interface BulkApprovalCardProps {
  approval: ApprovalData;
  onApprove: () => void;
  onReject: () => void;
  isApproved?: boolean;
  isRejected?: boolean;
}

// ============================================================================
// Bulk Approval Card Component
// ============================================================================

export const BulkApprovalCard = React.memo<BulkApprovalCardProps>(
  ({ approval, onApprove, onReject, isApproved, isRejected }) => {
    const listRef = useRef<HTMLDivElement>(null);

    // Initialize operations with pending status
    const [operations, setOperations] = useState<BulkOperation[]>(() =>
      (approval.operations || []).map((op) => ({ ...op, status: op.status || 'pending' }))
    );

    // Resynchronize operations when approval.operations changes (e.g., new message arrives)
    useEffect(() => {
      setOperations(
        (approval.operations || []).map((op) => ({ ...op, status: op.status || 'pending' }))
      );
    }, [approval.operations]);

    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

    // Detect the source type (Salesforce vs Calendar)
    const source = detectBulkApprovalSource(approval);
    const sourceLabel = getBulkApprovalLabel(source);

    // Derive operation label - handle mixed operations (create/update/delete in same batch)
    const uniqueOperations = new Set(operations.map((op) => op.operation));
    const operationLabel =
      uniqueOperations.size === 1
        ? uniqueOperations.has('delete')
          ? 'delete'
          : uniqueOperations.has('create')
            ? 'create'
            : 'update'
        : 'make changes to';

    // Render the appropriate icon based on source
    const SourceIcon =
      source === 'calendar'
        ? ({ size }: { size: number }) => (
            <CalendarIcon size={size} weight="fill" className="text-blue-600" />
          )
        : SalesforceIcon;

    // Count pending operations
    const pendingCount = operations.filter((op) => op.status === 'pending').length;
    const hasNoPending = pendingCount === 0;

    // Individual item handlers
    const handleUpdateItem = useCallback(
      (index: number) => {
        setOperations((prev) =>
          prev.map((op, idx) => (idx === index ? { ...op, status: 'success' as const } : op))
        );

        // Auto-expand next pending item
        const nextPendingIndex = operations.findIndex(
          (op, idx) => idx > index && op.status === 'pending'
        );
        if (nextPendingIndex !== -1) {
          setExpandedIndex(nextPendingIndex);
        }
      },
      [operations]
    );

    const handleRejectItem = useCallback(
      (index: number) => {
        setOperations((prev) =>
          prev.map((op, idx) => (idx === index ? { ...op, status: 'rejected' as const } : op))
        );

        // Auto-expand next pending item
        const nextPendingIndex = operations.findIndex(
          (op, idx) => idx > index && op.status === 'pending'
        );
        if (nextPendingIndex !== -1) {
          setExpandedIndex(nextPendingIndex);
        }
      },
      [operations]
    );

    // Bulk handlers
    const handleApproveAll = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      // Mark all pending items as success
      setOperations((prev) =>
        prev.map((op) => (op.status === 'pending' ? { ...op, status: 'success' as const } : op))
      );
    }, []);

    const handleRejectAll = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      // Mark all pending items as rejected
      setOperations((prev) =>
        prev.map((op) => (op.status === 'pending' ? { ...op, status: 'rejected' as const } : op))
      );
    }, []);

    const handleToggleItem = useCallback((index: number) => {
      setExpandedIndex((prev) => (prev === index ? null : index));
    }, []);

    // When all items are processed, call the main approval/rejection handler
    useEffect(() => {
      if (hasNoPending && !isApproved && !isRejected) {
        const hasAnySuccess = operations.some((op) => op.status === 'success');
        const allRejected = operations.every((op) => op.status === 'rejected');

        if (allRejected) {
          // All items were rejected/skipped
          onReject();
        } else if (hasAnySuccess) {
          // At least one item was approved
          onApprove();
        }
      }
    }, [hasNoPending, operations, isApproved, isRejected, onApprove, onReject]);

    // Show approved/rejected state (final state from backend)
    if (isApproved || isRejected) {
      const recordCount = operations.length;
      return (
        <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <SourceIcon size={16} />
            <span className="text-[12px] font-medium text-gray-700">
              {recordCount} {sourceLabel}
              {recordCount !== 1 ? 's' : ''} {isApproved ? 'processed' : 'skipped'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
        {/* Header with source icon */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <SourceIcon size={18} />
            <span className="text-[13px] font-medium text-gray-900">
              {operations.length} {sourceLabel}
              {operations.length !== 1 ? 's' : ''} to {operationLabel}
            </span>
          </div>
        </div>

        {/* Summary text */}
        {approval.summary && <p className="text-xs text-gray-700 mb-2">{approval.summary}</p>}

        {/* Operations List - scrollable with max height */}
        <div
          ref={listRef}
          className="border border-gray-200 rounded-lg overflow-hidden overflow-y-auto bg-white"
          style={{ maxHeight: '400px' }}
        >
          {operations.map((operation, idx) => (
            <BulkUpdateItemRow
              key={idx}
              operation={operation}
              isExpanded={expandedIndex === idx}
              onToggle={() => handleToggleItem(idx)}
              _onUpdate={() => handleUpdateItem(idx)}
              _onReject={() => handleRejectItem(idx)}
              isFirst={idx === 0}
            />
          ))}
        </div>

        {/* Bulk Action Buttons - only show when there are pending items */}
        {pendingCount > 0 && (
          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-amber-200">
            <button
              onClick={handleRejectAll}
              className="px-3 py-1.5 text-[11px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Reject All
            </button>
            <button
              onClick={handleApproveAll}
              className="px-3 py-1.5 text-[11px] font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
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
