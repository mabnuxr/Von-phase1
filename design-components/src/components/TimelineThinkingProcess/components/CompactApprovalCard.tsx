import React, { useCallback, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { CompactApprovalCardProps } from '../types';
import { formatValue } from '../utils/formatValue';

// ============================================================================
// Component
// ============================================================================

/**
 * CompactApprovalCard - Inline approval widget for single-record approval steps
 *
 * Features:
 * - Shows operation type (UPDATE) with object type (Opportunity)
 * - Displays record name with deep link support
 * - Table layout: FIELD | BEFORE | AFTER
 * - Before values are struck through
 * - Simple V1-style value formatting
 * - Accordion for expand/collapse
 * - Approve/Reject buttons
 * - Status feedback (approved/rejected state)
 *
 * Note: For bulk operations, use ApprovalCard wrapper which delegates to BulkApprovalCard
 */
export const CompactApprovalCard = React.memo<CompactApprovalCardProps>(
  ({ approval, onApprove, onReject, isApproved, isRejected, defaultExpanded = true }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

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
        ? 'CREATE'
        : approval.operation === 'update'
          ? 'UPDATE'
          : 'DELETE';

    // Completed state - collapsible card that can expand to show details
    if (isApproved || isRejected) {
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
              ) : (
                <CaretRightIcon size={14} weight="bold" className="text-gray-500 flex-shrink-0" />
              )}
              {isApproved ? (
                <CheckCircleIcon
                  size={14}
                  weight="fill"
                  className="text-emerald-600 flex-shrink-0"
                />
              ) : (
                <XCircleIcon size={14} weight="fill" className="text-red-500 flex-shrink-0" />
              )}
              {approval.recordUrl ? (
                <a
                  href={approval.recordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-gray-900 truncate hover:text-indigo-600 hover:underline transition-colors"
                  title={`Open ${approval.recordName} in Salesforce`}
                >
                  {approval.recordName}
                </a>
              ) : (
                <span className="text-sm text-gray-900 truncate">{approval.recordName}</span>
              )}
            </div>
            <span
              className={`text-xs flex-shrink-0 ml-2 ${isApproved ? 'text-emerald-700' : 'text-red-600'}`}
            >
              {isApproved ? 'Approved' : 'Rejected'}
            </span>
          </button>

          {/* Expanded content - Changes table (read-only) */}
          {isExpanded && approval.changes && approval.changes.length > 0 && (
            <div className="border-t border-gray-100">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_1fr_1fr] px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-700 tracking-wide">Field</span>
                <span className="text-xs font-medium text-gray-700 tracking-wide">Before</span>
                <span className="text-xs font-medium text-gray-700 tracking-wide">After</span>
              </div>

              {/* Table rows */}
              {approval.changes.map((change, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_1fr_1fr] px-3 py-2 border-b border-gray-100 last:border-b-0 items-start"
                >
                  <span className="text-sm text-gray-900">{change.field}</span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatValue(change.before)}
                  </span>
                  <span className="text-sm text-gray-900 font-medium">
                    {formatValue(change.after)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="mt-2 bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Header - Single row: accordion | deal name | action type */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            {isExpanded ? (
              <CaretDownIcon size={14} weight="bold" className="text-gray-700 flex-shrink-0" />
            ) : (
              <CaretRightIcon size={14} weight="bold" className="text-gray-700 flex-shrink-0" />
            )}
            {approval.recordUrl ? (
              <a
                href={approval.recordUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-gray-900 truncate hover:text-indigo-600 hover:underline transition-colors"
                title={`Open ${approval.recordName} in Salesforce`}
              >
                {approval.recordName}
              </a>
            ) : (
              <span className="text-sm text-gray-900 truncate">{approval.recordName}</span>
            )}
          </div>
          <span className="text-xs text-gray-600 flex-shrink-0 ml-2">
            {operationLabel} {approval.objectType}
          </span>
        </div>

        {/* Expanded content - Changes or Fields table */}
        {isExpanded && (
          <>
            {/* Render changes if they exist (UPDATE/DELETE operations) */}
            {approval.changes && approval.changes.length > 0 && (
              <div className="border-t border-gray-100">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_1fr_1fr] px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-700 tracking-wide">Field</span>
                  <span className="text-xs font-medium text-gray-700 tracking-wide">Before</span>
                  <span className="text-xs font-medium text-gray-700 tracking-wide">After</span>
                </div>

                {/* Table rows */}
                {approval.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_1fr_1fr] px-3 py-2 border-b border-gray-100 last:border-b-0 items-start"
                  >
                    <span className="text-sm text-gray-900">{change.field}</span>
                    <span className="text-sm text-gray-500 line-through">
                      {formatValue(change.before)}
                    </span>
                    <span className="text-sm text-gray-900 font-medium">
                      {formatValue(change.after)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Render fields if changes don't exist (CREATE operations) */}
            {(!approval.changes || approval.changes.length === 0) && approval.fields && (
              <div className="border-t border-gray-100">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_2fr] px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-700 tracking-wide">Field</span>
                  <span className="text-xs font-medium text-gray-700 tracking-wide">Value</span>
                </div>

                {/* Table rows */}
                {Object.entries(approval.fields).map(([field, value], idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_2fr] px-3 py-2 border-b border-gray-100 last:border-b-0 items-start"
                  >
                    <span className="text-sm text-gray-900">{field}</span>
                    <span className="text-sm text-gray-900 font-medium">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Show message if neither changes nor fields exist */}
            {(!approval.changes || approval.changes.length === 0) && !approval.fields && (
              <div className="px-3 py-4 text-center text-sm text-gray-500 border-t border-gray-100">
                No details available for this approval
              </div>
            )}
          </>
        )}

        {/* Action buttons - only shown when expanded */}
        {isExpanded && (
          <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-gray-100">
            <button
              onClick={handleReject}
              className="px-2.5 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              className="px-2.5 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Approve
            </button>
          </div>
        )}
      </div>
    );
  }
);

CompactApprovalCard.displayName = 'CompactApprovalCard';
