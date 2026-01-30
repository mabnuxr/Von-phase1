import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretDownIcon,
  CaretRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon,
  XIcon,
} from '@phosphor-icons/react';
import type { ApprovalData, BulkOperation } from '../types';

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
// Truncated Text with Tooltip
// ============================================================================

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

const TruncatedText: React.FC<TruncatedTextProps> = ({ text, maxLength = 40, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate ? `${text.slice(0, maxLength)}...` : text;

  if (!shouldTruncate) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="cursor-help">{displayText}</span>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 top-full mt-1 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg"
            style={{ maxWidth: '480px', width: 'max-content' }}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

// ============================================================================
// Bulk Operation Item Row
// ============================================================================

interface BulkOperationItemRowProps {
  operation: BulkOperation;
  isExpanded: boolean;
  onToggle: () => void;
  isFirst: boolean;
}

const BulkOperationItemRow: React.FC<BulkOperationItemRowProps> = ({
  operation,
  isExpanded,
  onToggle,
  isFirst,
}) => {
  const operationLabel =
    operation.operation === 'delete'
      ? 'delete'
      : operation.operation === 'create'
        ? 'create'
        : 'update';

  // Count fields from either changes array or fields object
  const fieldCount = operation.changes?.length || Object.keys(operation.fields || {}).length;

  // Get fields to display - either from changes or from fields object
  const displayFields: Array<{ field: string; before?: unknown; after: unknown }> =
    operation.changes ||
    Object.entries(operation.fields || {}).map(([field, value]) => ({
      field,
      after: value,
    }));

  return (
    <div className={`${!isFirst ? 'border-t border-gray-100' : ''}`}>
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-1.5 px-2 py-2 text-left hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'border-b border-gray-100' : ''}`}
      >
        <span className="flex-shrink-0 text-gray-400">
          {isExpanded ? (
            <CaretDownIcon size={12} weight="bold" />
          ) : (
            <CaretRightIcon size={12} weight="bold" />
          )}
        </span>

        {/* Record name and field count */}
        <div className="flex-1 min-w-0">
          <span className="text-[13px] text-gray-900">
            {operation.record_name} – {operationLabel} {fieldCount} field
            {fieldCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Object type badge */}
        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
          {operation.sobject_type}
        </span>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-2 py-2 bg-gray-50/50">
              {/* Fields List */}
              <div className="divide-y divide-gray-100">
                {displayFields.map((field, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-[12px] py-2 first:pt-0 last:pb-0"
                  >
                    <span className="text-gray-800 min-w-[80px] font-medium flex-shrink-0">
                      {field.field}
                    </span>
                    {field.before !== undefined && field.before !== null && (
                      <TruncatedText
                        text={String(field.before)}
                        maxLength={40}
                        className="text-red-500 line-through"
                      />
                    )}
                    {field.before !== undefined && field.before !== null && (
                      <span className="text-gray-300 flex-shrink-0">→</span>
                    )}
                    <TruncatedText
                      text={String(field.after ?? '')}
                      maxLength={40}
                      className="text-gray-900 font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

    const operations = approval.operations || [];
    const recordCount = operations.length;

    // Get the operation type from first operation
    const operationType = operations[0]?.operation || 'update';
    const operationLabel =
      operationType === 'delete' ? 'delete' : operationType === 'create' ? 'create' : 'update';

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

    const handleToggleItem = useCallback((index: number) => {
      setExpandedIndex((prev) => (prev === index ? null : index));
    }, []);

    // Auto-scroll to bottom on mount
    useEffect(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, []);

    // Show approved/rejected state
    if (isApproved || isRejected) {
      return (
        <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <SalesforceIcon size={16} />
            {isApproved ? (
              <>
                <CheckCircleIcon size={14} weight="fill" className="text-emerald-600" />
                <span className="text-[12px] font-medium text-emerald-700">
                  {recordCount} record{recordCount !== 1 ? 's' : ''} approved
                </span>
              </>
            ) : (
              <>
                <XCircleIcon size={14} weight="fill" className="text-red-500" />
                <span className="text-[12px] font-medium text-red-600">
                  {recordCount} record{recordCount !== 1 ? 's' : ''} rejected
                </span>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
        {/* Header with Salesforce icon */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <SalesforceIcon size={18} />
            <span className="text-[13px] font-medium text-gray-900">
              {recordCount} Salesforce record{recordCount !== 1 ? 's' : ''} to {operationLabel}
            </span>
          </div>
        </div>

        {/* Summary text */}
        {approval.summary && <p className="text-xs text-gray-700 mb-2">{approval.summary}</p>}

        {/* Operations List - scrollable with max height */}
        <div
          ref={listRef}
          className="border border-gray-200 rounded-lg overflow-hidden overflow-y-auto bg-white"
          style={{ maxHeight: '300px' }}
        >
          {operations.map((operation, idx) => (
            <BulkOperationItemRow
              key={idx}
              operation={operation}
              isExpanded={expandedIndex === idx}
              onToggle={() => handleToggleItem(idx)}
              isFirst={idx === 0}
            />
          ))}
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-amber-200">
          <button
            onClick={handleReject}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <XIcon size={12} weight="bold" />
            Reject All
          </button>
          <button
            onClick={handleApprove}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <CheckIcon size={12} weight="bold" />
            Accept All
          </button>
        </div>
      </div>
    );
  }
);

BulkApprovalCard.displayName = 'BulkApprovalCard';
