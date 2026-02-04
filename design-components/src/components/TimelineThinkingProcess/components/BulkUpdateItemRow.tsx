import React from 'react';
import {
  CaretDownIcon,
  CaretRightIcon,
  CheckCircleIcon,
  XIcon,
  SpinnerIcon,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BulkOperation } from '../types';
import { formatValue } from '../utils/formatValue';

// ============================================================================
// BulkUpdateItemRow Component
// ============================================================================

export interface BulkUpdateItemRowProps {
  operation: BulkOperation;
  isExpanded: boolean;
  onToggle: () => void;
  _onUpdate: () => void;
  _onReject: () => void;
  isFirst: boolean;
}

export const BulkUpdateItemRow: React.FC<BulkUpdateItemRowProps> = ({
  operation,
  isExpanded,
  onToggle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _onUpdate,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _onReject,
  isFirst,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _isPending = operation.status === 'pending';
  const isUpdating = operation.status === 'updating';
  const isSuccess = operation.status === 'success';
  const isRejected = operation.status === 'rejected';

  // Get operation label for header (lowercase for inline text)
  const operationLabel =
    operation.operation === 'delete'
      ? 'delete'
      : operation.operation === 'create'
        ? 'create'
        : 'update';

  // For CREATE operations, convert fields to changes format for display
  const displayData =
    operation.changes && operation.changes.length > 0
      ? operation.changes
      : operation.operation === 'create' && operation.fields
        ? Object.entries(operation.fields).map(([field, value]) => ({
            field,
            after: value,
            before: undefined,
          }))
        : [];

  return (
    <div className={`${!isFirst ? 'border-t border-gray-100' : ''}`}>
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'border-b border-gray-100' : ''}`}
      >
        <span className="flex-shrink-0 text-gray-400">
          {isExpanded ? (
            <CaretDownIcon size={12} weight="bold" />
          ) : (
            <CaretRightIcon size={12} weight="bold" />
          )}
        </span>

        {/* Record name – update X fields */}
        <div className="flex-1 min-w-0">
          <span className="text-[13px] text-gray-900">
            {operation.record_name} – {operationLabel} {displayData.length} field
            {displayData.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Status indicator on right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isSuccess && (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircleIcon size={14} weight="fill" />
              <span className="text-xs font-medium">Done</span>
            </span>
          )}
          {isRejected && (
            <span className="flex items-center gap-1 text-gray-400">
              <XIcon size={12} weight="bold" />
              <span className="text-xs font-medium">Skipped</span>
            </span>
          )}
          {isUpdating && (
            <span className="flex items-center gap-1 text-indigo-600">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <SpinnerIcon size={14} />
              </motion.span>
            </span>
          )}
        </div>
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
            <div className="px-3 py-3 bg-gray-50/50">
              {/* Changes List */}
              <div className="divide-y divide-gray-100">
                {displayData.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-[12px] py-2 first:pt-0 last:pb-0"
                  >
                    <span className="text-gray-800 min-w-[90px] font-medium flex-shrink-0">
                      {change.field}
                    </span>
                    {change.before !== undefined && change.before !== null && (
                      <>
                        <span className="text-red-500 line-through truncate">
                          {formatValue(change.before)}
                        </span>
                        <span className="text-gray-300 flex-shrink-0">→</span>
                      </>
                    )}
                    <span className="text-gray-900 font-medium truncate">
                      {formatValue(change.after)}
                    </span>
                  </div>
                ))}
              </div>

              {/* TODO: Individual Skip/Update buttons - not yet supported
                  Will be implemented later with proper backend support
              {isPending && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReject();
                    }}
                    className="px-3 py-1.5 text-[11px] font-medium text-gray-700 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate();
                    }}
                    className="px-3 py-1.5 text-[11px] font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              )}
              */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
