import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
} from './icons';

/**
 * Single operation in a Salesforce CRUD approval request
 * Field names match backend API (approval_tools.py)
 */
export interface SalesforceOperation {
  /** Type of operation: create, update, or delete */
  operation: string;
  /** Salesforce object type (e.g., Account, Contact, Opportunity) */
  sobject_type: string;
  /** Record ID (for update/delete operations) */
  record_id?: string;
  /** Record name for display (optional) */
  record_name?: string;
  /** Fields being changed with before/after values */
  changes: Array<{
    field: string;
    before: string | number | boolean | null;
    after: string | number | boolean | null;
  }>;
}

/**
 * Arguments for the request_salesforce_approval tool
 */
export interface ApprovalToolArgs {
  /** Brief summary of the operation(s) */
  summary: string;
  /** List of operations to be performed */
  operations: SalesforceOperation[];
}

/**
 * Props for ApprovalCard component
 */
export interface ApprovalCardProps {
  /** Tool call ID for tracking */
  toolCallId: string;
  /** Run ID of the interrupted workflow (required to resume) */
  runId: string;
  /** Approval request arguments */
  args: ApprovalToolArgs;
  /** Whether the card is waiting for user response */
  isPending: boolean;
  /** Callback when user approves (backend looks up message by run_id) */
  onApprove: (toolCallId: string, runId: string) => void;
  /** Callback when user rejects (backend looks up message by run_id) */
  onReject: (toolCallId: string, runId: string) => void;
  /** Whether approval/rejection is being processed */
  isProcessing?: boolean;
  /** Result of the approval (after user decision) */
  result?: {
    approved: boolean;
    message?: string;
  };
}

/**
 * Format field name from snake_case to Title Case
 */
function formatFieldName(field: string): string {
  return field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Format value for display
 */
function formatValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    if (value >= 1000) {
      return new Intl.NumberFormat('en-US').format(value);
    }
    return String(value);
  }
  if (typeof value === 'string' && value.length === 0) {
    return '—';
  }
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 97) + '...';
  }
  return String(value);
}

/**
 * Get icon and label for operation type (all use gray styling)
 * Normalizes action to lowercase for case-insensitive matching
 */
function getOperationStyle(operationType: string) {
  const normalized = operationType?.toLowerCase();
  switch (normalized) {
    case 'create':
      return { icon: PlusIcon, label: 'Create' };
    case 'update':
      return { icon: EditIcon, label: 'Update' };
    case 'delete':
      return { icon: TrashIcon, label: 'Delete' };
    default:
      return { icon: EditIcon, label: 'Operation' };
  }
}

/**
 * Render content for CREATE operation - simple field → value list
 */
const CreateContent: React.FC<{ operation: SalesforceOperation }> = ({ operation }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Field
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Value
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {operation.changes.map((change, idx) => (
          <tr key={idx}>
            <td className="px-3 py-2 text-gray-600">{formatFieldName(change.field)}</td>
            <td className="px-3 py-2 text-gray-900 font-medium">{formatValue(change.after)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * Render content for UPDATE operation - diff view with before → after
 */
const UpdateContent: React.FC<{ operation: SalesforceOperation }> = ({ operation }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Field
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Before
          </th>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            After
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {operation.changes.map((change, idx) => (
          <tr key={idx}>
            <td className="px-3 py-2 text-gray-600">{formatFieldName(change.field)}</td>
            <td className="px-3 py-2 text-gray-500">
              <span className="line-through">{formatValue(change.before)}</span>
            </td>
            <td className="px-3 py-2 text-gray-900 font-medium">{formatValue(change.after)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * Simple non-expandable card for DELETE operations
 * Shows trash icon with record name - no expansion needed
 */
const DeleteOperationCard: React.FC<{ operation: SalesforceOperation }> = ({ operation }) => (
  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
    <div className="p-1.5 rounded-md bg-gray-100">
      <TrashIcon className="text-gray-600" size={16} />
    </div>
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Delete</span>
        <span className="text-sm font-medium text-gray-900">{operation.sobject_type}</span>
      </div>
      {operation.record_name && (
        <span className="text-xs text-gray-500">{operation.record_name}</span>
      )}
    </div>
  </div>
);

/**
 * Single operation card with action-specific content
 */
const OperationCard: React.FC<{
  operation: SalesforceOperation;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ operation, isExpanded, onToggle }) => {
  const style = getOperationStyle(operation.operation);
  const IconComponent = style.icon;

  const renderContent = () => {
    const normalized = operation.operation?.toLowerCase();
    switch (normalized) {
      case 'create':
        return <CreateContent operation={operation} />;
      case 'update':
        return <UpdateContent operation={operation} />;
      default:
        // Default to simple field→value view (better than diff view for unknown actions)
        return <CreateContent operation={operation} />;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Operation header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-gray-100">
            <IconComponent className="text-gray-600" size={16} />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {style.label}
              </span>
              <span className="text-sm font-medium text-gray-900">{operation.sobject_type}</span>
            </div>
            {operation.record_name && (
              <span className="text-xs text-gray-500 truncate max-w-[200px]">
                {operation.record_name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {operation.changes.length} field{operation.changes.length !== 1 ? 's' : ''}
          </span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDownIcon className="text-gray-400" size={16} />
          </motion.div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">{renderContent()}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * ApprovalCard Component
 *
 * Displays a Salesforce CRUD approval request with action-specific views.
 * - Create: Simple field → value list
 * - Update: Diff view with before → after
 * - Delete: Record summary with key fields
 */
export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  toolCallId,
  runId,
  args,
  isPending,
  onApprove,
  onReject,
  isProcessing = false,
  result,
}) => {
  // Track which operations are expanded (first one expanded by default)
  const [expandedOps, setExpandedOps] = useState<Set<number>>(new Set([0]));

  const toggleOperation = (index: number) => {
    setExpandedOps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Determine card state
  const isApproved = result?.approved === true;
  const isRejected = result?.approved === false;
  const showButtons = isPending && !result;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="my-4"
    >
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Approval Required</h3>
          <p className="text-sm text-gray-600 mt-0.5">{args.summary}</p>
        </div>

        {/* Operations list */}
        <div className="p-4 space-y-3">
          {args.operations.map((operation, index) => {
            // Use simple non-expandable card for delete operations
            if (operation.operation?.toLowerCase() === 'delete') {
              return <DeleteOperationCard key={index} operation={operation} />;
            }
            return (
              <OperationCard
                key={index}
                operation={operation}
                isExpanded={expandedOps.has(index)}
                onToggle={() => toggleOperation(index)}
              />
            );
          })}
        </div>

        {/* Action buttons or result status */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          {showButtons ? (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => onReject(toolCallId, runId)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
              <button
                onClick={() => onApprove(toolCallId, runId)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M21 12a9 9 0 11-6.219-8.56"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </motion.div>
                    Processing...
                  </>
                ) : (
                  'Approve'
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isApproved && (
                <>
                  <CheckCircleIcon className="text-gray-600" size={16} />
                  <span className="text-sm text-gray-600">Approved</span>
                </>
              )}
              {isRejected && (
                <>
                  <XCircleIcon className="text-gray-600" size={16} />
                  <span className="text-sm text-gray-600">Rejected</span>
                </>
              )}
              {result?.message && (
                <span className="text-xs text-gray-400 ml-1">— {result.message}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ApprovalCard;
