import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretDownIcon,
  CaretRightIcon,
  CheckCircleIcon,
  XIcon,
  BellIcon,
  SpinnerIcon,
} from '@phosphor-icons/react';

// ============================================================================
// Types
// ============================================================================

type UpdateItemStatus = 'pending' | 'updating' | 'success' | 'rejected';

interface FieldChange {
  field: string;
  before?: string | number | null;
  after: string | number | null;
}

interface BulkUpdateItem {
  id: string;
  summary: string;
  objectType: string;
  recordName: string;
  changes: FieldChange[];
  status: UpdateItemStatus;
}

interface ThinkingStep {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'complete' | 'awaiting-approval';
  description?: string;
  code?: string;
}

type FlowState =
  | 'thinking-initial'
  | 'awaiting-approval'
  | 'updating'
  | 'thinking-continue'
  | 'complete';

// ============================================================================
// Decorator
// ============================================================================

const FullScreenDecorator: Decorator = (Story) => (
  <div
    style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f9fafb',
      padding: '24px',
    }}
  >
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <Story />
    </div>
  </div>
);

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
// Step Indicator Component
// ============================================================================

const StepIndicator: React.FC<{ status: ThinkingStep['status'] }> = ({ status }) => {
  if (status === 'in-progress') {
    return (
      <motion.span
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-2.5 h-2.5 rounded-full bg-indigo-400 border-2 border-indigo-200"
      />
    );
  }
  if (status === 'complete') {
    return <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-emerald-200" />;
  }
  if (status === 'awaiting-approval') {
    return <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-amber-200" />;
  }
  return <span className="w-2.5 h-2.5 rounded-full bg-gray-400 border-2 border-gray-100" />;
};

// ============================================================================
// Bulk Update Item Row Component
// ============================================================================

type OperationType = 'update' | 'delete' | 'create';

interface BulkUpdateItemRowProps {
  item: BulkUpdateItem;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
  onReject: () => void;
  isFirst: boolean;
  operation?: OperationType;
}

const BulkUpdateItemRow: React.FC<BulkUpdateItemRowProps> = ({
  item,
  isExpanded,
  onToggle,
  onUpdate,
  onReject,
  isFirst,
  operation = 'update',
}) => {
  const isPending = item.status === 'pending';
  const isUpdating = item.status === 'updating';
  const isSuccess = item.status === 'success';
  const isRejected = item.status === 'rejected';

  // Get operation label for header (lowercase for inline text)
  const operationLabel =
    operation === 'delete' ? 'delete' : operation === 'create' ? 'create' : 'update';

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
            {item.recordName} – {operationLabel} {item.changes.length} field
            {item.changes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Object type tag + Status indicator on right */}
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
          {isPending && (
            <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-full">
              {item.objectType}
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
                {item.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-[12px] py-2 first:pt-0 last:pb-0"
                  >
                    <span className="text-gray-800 min-w-[90px] font-medium">{change.field}</span>
                    {change.before !== undefined && change.before !== null && (
                      <span className="text-red-500 line-through">{String(change.before)}</span>
                    )}
                    <span className="text-gray-300">→</span>
                    <span className="text-gray-900 font-medium">{String(change.after)}</span>
                  </div>
                ))}
              </div>

              {/* Individual Action Buttons (only when pending) */}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Bulk Approval Card Component
// ============================================================================

interface BulkApprovalCardProps {
  items: BulkUpdateItem[];
  expandedItemId: string | null;
  onToggleItem: (id: string) => void;
  onUpdateItem: (id: string) => void;
  onRejectItem: (id: string) => void;
  onUpdateAll: () => void;
  onRejectAll: () => void;
}

const BulkApprovalCard: React.FC<BulkApprovalCardProps> = ({
  items,
  expandedItemId,
  onToggleItem,
  onUpdateItem,
  onRejectItem,
  onUpdateAll,
  onRejectAll,
}) => {
  const pendingItems = items.filter((item) => item.status === 'pending');
  const hasPendingItems = pendingItems.length > 0;
  const allDone = pendingItems.length === 0;

  return (
    <div className="mt-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
      {/* Header with Salesforce icon and bulk actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <SalesforceIcon size={18} />
          <span className="text-[13px] font-medium text-gray-900">
            {items.length} Salesforce record{items.length !== 1 ? 's' : ''} to update
          </span>
          {allDone && (
            <span className="text-[11px] text-emerald-600 font-medium">All processed</span>
          )}
        </div>
        {hasPendingItems && (
          <div className="flex items-center gap-2">
            <button
              onClick={onRejectAll}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Reject All
            </button>
            <button
              onClick={onUpdateAll}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Update All
            </button>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {items.map((item, idx) => (
          <BulkUpdateItemRow
            key={item.id}
            item={item}
            isExpanded={expandedItemId === item.id}
            onToggle={() => onToggleItem(item.id)}
            onUpdate={() => onUpdateItem(item.id)}
            onReject={() => onRejectItem(item.id)}
            isFirst={idx === 0}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Completed Summary Card Component (collapsible)
// ============================================================================

interface CompletedSummaryCardProps {
  items: BulkUpdateItem[];
}

const CompletedSummaryCard: React.FC<CompletedSummaryCardProps> = ({ items }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const successCount = items.filter((item) => item.status === 'success').length;
  const skippedCount = items.filter((item) => item.status === 'rejected').length;

  return (
    <div className="mt-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <SalesforceIcon size={18} />
          <CheckCircleIcon size={16} weight="fill" className="text-emerald-600" />
          <span className="text-[13px] font-medium text-gray-900">
            {successCount} update{successCount !== 1 ? 's' : ''} completed
            {skippedCount > 0 && (
              <span className="text-gray-500 font-normal">
                {' '}· {skippedCount} skipped
              </span>
            )}
          </span>
        </div>
        <span className="text-gray-400">
          {isExpanded ? (
            <CaretDownIcon size={12} weight="bold" />
          ) : (
            <CaretRightIcon size={12} weight="bold" />
          )}
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
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`px-3 py-2 flex items-center justify-between ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <span className="text-[13px] text-gray-900">
                    {item.recordName} – {item.changes.length} field
                    {item.changes.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    {item.status === 'success' && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircleIcon size={14} weight="fill" />
                        <span className="text-xs font-medium">Done</span>
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <XIcon size={12} weight="bold" />
                        <span className="text-xs font-medium">Skipped</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Thinking Step Row Component
// ============================================================================

interface ThinkingStepRowProps {
  step: ThinkingStep;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  /** Content that renders inside the step (with left margin) */
  children?: React.ReactNode;
  /** Content that renders full-width below the step (no left margin) */
  fullWidthContent?: React.ReactNode;
}

const ThinkingStepRow: React.FC<ThinkingStepRowProps> = ({
  step,
  isLast,
  isExpanded,
  onToggle,
  children,
  fullWidthContent,
}) => {
  const hasExpandableContent = step.description || step.code || children || fullWidthContent;

  return (
    <div className={`${isLast ? '' : 'pb-2'}`}>
      <div className="relative flex">
        {/* Timeline connector */}
        <div className="flex flex-col items-center mr-3 flex-shrink-0">
          <div className="w-6 h-6 rounded-full flex items-center justify-center">
            <StepIndicator status={step.status} />
          </div>
          {(!isLast || (isExpanded && fullWidthContent)) && (
            <div className="w-px flex-1 bg-gray-200 min-h-[8px]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <button
            onClick={hasExpandableContent ? onToggle : undefined}
            className={`w-full flex items-center gap-2 text-left group ${hasExpandableContent ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {hasExpandableContent && (
              <span className="flex-shrink-0">
                {isExpanded ? (
                  <CaretDownIcon size={12} weight="bold" className="text-gray-500" />
                ) : (
                  <CaretRightIcon size={12} weight="bold" className="text-gray-400" />
                )}
              </span>
            )}
            <span className="flex-1 min-w-0 text-[15px] text-gray-900 truncate">{step.text}</span>
          </button>

          {/* Expanded content - with left margin */}
          <AnimatePresence>
            {isExpanded && (step.description || step.code || children) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="mt-1 ml-5">
                  {step.description && (
                    <p className="text-xs italic text-gray-700 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                  {step.code && (
                    <div className="relative rounded-lg bg-gray-900 overflow-hidden my-2">
                      <div className="px-3 py-2 border-b border-gray-700">
                        <span className="text-[11px] text-gray-400 font-mono">Code</span>
                      </div>
                      <pre className="px-3 py-2 text-[11px] text-gray-300 font-mono overflow-hidden max-h-[120px]">
                        <code>{step.code}</code>
                      </pre>
                    </div>
                  )}
                  {children}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Full-width content - renders outside timeline, uses full width */}
      <AnimatePresence>
        {isExpanded && fullWidthContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="mt-2">{fullWidthContent}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Main Interactive Prototype Component
// ============================================================================

const SalesforceBulkUpdatePrototype: React.FC = () => {
  // Flow state management
  const [flowState, setFlowState] = useState<FlowState>('thinking-initial');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Thinking steps
  const [steps, setSteps] = useState<ThinkingStep[]>([]);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // Bulk update items
  const [bulkItems, setBulkItems] = useState<BulkUpdateItem[]>([
    {
      id: '1',
      summary: 'TechStart Enterprise - Move to Discovery',
      objectType: 'Opportunity',
      recordName: 'TechStart Enterprise Deal',
      changes: [
        { field: 'Stage', before: 'Qualification', after: 'Discovery' },
        { field: 'Close Date', before: 'Mar 15', after: 'Apr 30' },
        { field: 'Next Step', before: null, after: 'Schedule demo with technical team' },
      ],
      status: 'pending',
    },
    {
      id: '2',
      summary: 'Global Retail - Update Amount & Stage',
      objectType: 'Opportunity',
      recordName: 'Global Retail Expansion',
      changes: [
        { field: 'Amount', before: '$180,000', after: '$220,000' },
        { field: 'Stage', before: 'Proposal', after: 'Negotiation' },
        { field: 'Notes', before: null, after: 'Scope expanded to include APAC region' },
      ],
      status: 'pending',
    },
    {
      id: '3',
      summary: 'FinServ Platform - Extend Close Date',
      objectType: 'Opportunity',
      recordName: 'FinServ Platform Deal',
      changes: [
        { field: 'Close Date', before: 'Mar 30', after: 'May 15' },
        { field: 'Notes', before: null, after: 'Legal review taking longer than expected' },
      ],
      status: 'pending',
    },
    {
      id: '4',
      summary: 'Healthcare Plus - Stage Progression',
      objectType: 'Opportunity',
      recordName: 'Healthcare Plus Upgrade',
      changes: [
        { field: 'Stage', before: 'Discovery', after: 'Qualification' },
        { field: 'Probability', before: '20%', after: '40%' },
        { field: 'Champion', before: null, after: 'Sarah Chen (VP Operations)' },
      ],
      status: 'pending',
    },
    {
      id: '5',
      summary: 'Acme Corp - Update Amount',
      objectType: 'Opportunity',
      recordName: 'Acme Corp Enterprise',
      changes: [
        { field: 'Amount', before: '$320,000', after: '$385,000' },
        { field: 'Probability', before: '60%', after: '75%' },
      ],
      status: 'pending',
    },
    {
      id: '6',
      summary: 'DataFlow Inc - Move to Negotiation',
      objectType: 'Opportunity',
      recordName: 'DataFlow Analytics Platform',
      changes: [
        { field: 'Stage', before: 'Proposal', after: 'Negotiation' },
        { field: 'Close Date', before: 'Apr 15', after: 'May 30' },
      ],
      status: 'pending',
    },
    {
      id: '7',
      summary: 'CloudNine Systems - Add Risk Flag',
      objectType: 'Opportunity',
      recordName: 'CloudNine Migration Project',
      changes: [
        { field: 'Deal Risk', before: 'Low', after: 'Medium' },
        { field: 'Notes', before: null, after: 'Budget approval delayed' },
      ],
      status: 'pending',
    },
    {
      id: '8',
      summary: 'Metro Bank - Stage Update',
      objectType: 'Opportunity',
      recordName: 'Metro Bank Digital Transformation',
      changes: [
        { field: 'Stage', before: 'Discovery', after: 'Proposal' },
        { field: 'Amount', before: '$450,000', after: '$520,000' },
        { field: 'Probability', before: '30%', after: '50%' },
      ],
      status: 'pending',
    },
    {
      id: '9',
      summary: 'Sunrise Hotels - Extend Timeline',
      objectType: 'Opportunity',
      recordName: 'Sunrise Hospitality Suite',
      changes: [
        { field: 'Close Date', before: 'Mar 31', after: 'Jun 15' },
        { field: 'Notes', before: null, after: 'Procurement process longer than expected' },
      ],
      status: 'pending',
    },
    {
      id: '10',
      summary: 'TechVentures - Champion Change',
      objectType: 'Opportunity',
      recordName: 'TechVentures Platform Deal',
      changes: [
        { field: 'Champion', before: 'John Smith', after: 'Maria Garcia (CTO)' },
        { field: 'Probability', before: '40%', after: '55%' },
      ],
      status: 'pending',
    },
    {
      id: '11',
      summary: 'Pinnacle Manufacturing - Amount Increase',
      objectType: 'Opportunity',
      recordName: 'Pinnacle ERP Integration',
      changes: [
        { field: 'Amount', before: '$275,000', after: '$340,000' },
        { field: 'Notes', before: null, after: 'Added warehouse module' },
      ],
      status: 'pending',
    },
    {
      id: '12',
      summary: 'BlueSky Airlines - Move to Closed Won',
      objectType: 'Opportunity',
      recordName: 'BlueSky Booking System',
      changes: [
        { field: 'Stage', before: 'Negotiation', after: 'Closed Won' },
        { field: 'Close Date', before: 'Apr 1', after: 'Mar 28' },
      ],
      status: 'pending',
    },
    {
      id: '13',
      summary: 'Evergreen Energy - Risk Escalation',
      objectType: 'Opportunity',
      recordName: 'Evergreen Smart Grid',
      changes: [
        { field: 'Deal Risk', before: 'Medium', after: 'High' },
        { field: 'Notes', before: null, after: 'Competitor pricing pressure' },
        { field: 'Probability', before: '45%', after: '25%' },
      ],
      status: 'pending',
    },
    {
      id: '14',
      summary: 'Pacific Logistics - Stage Progression',
      objectType: 'Opportunity',
      recordName: 'Pacific Fleet Management',
      changes: [
        { field: 'Stage', before: 'Qualification', after: 'Discovery' },
        { field: 'Next Step', before: null, after: 'Technical deep-dive scheduled' },
      ],
      status: 'pending',
    },
    {
      id: '15',
      summary: 'Quantum Labs - Budget Confirmation',
      objectType: 'Opportunity',
      recordName: 'Quantum Research Platform',
      changes: [
        { field: 'Amount', before: '$890,000', after: '$950,000' },
        { field: 'Probability', before: '55%', after: '70%' },
        { field: 'Notes', before: null, after: 'Budget approved by board' },
      ],
      status: 'pending',
    },
    {
      id: '16',
      summary: 'Summit Insurance - Timeline Update',
      objectType: 'Opportunity',
      recordName: 'Summit Claims Automation',
      changes: [
        { field: 'Close Date', before: 'May 15', after: 'Jul 30' },
        { field: 'Notes', before: null, after: 'Regulatory review required' },
      ],
      status: 'pending',
    },
    {
      id: '17',
      summary: 'Redwood Healthcare - Contact Update',
      objectType: 'Opportunity',
      recordName: 'Redwood Patient Portal',
      changes: [
        { field: 'Champion', before: 'Dr. James Wilson', after: 'Dr. Emily Chen (CMO)' },
        { field: 'Stage', before: 'Discovery', after: 'Proposal' },
      ],
      status: 'pending',
    },
    {
      id: '18',
      summary: 'Atlas Shipping - Deal Expansion',
      objectType: 'Opportunity',
      recordName: 'Atlas Container Tracking',
      changes: [
        { field: 'Amount', before: '$165,000', after: '$245,000' },
        { field: 'Notes', before: null, after: 'Added international routes' },
        { field: 'Probability', before: '50%', after: '65%' },
      ],
      status: 'pending',
    },
    {
      id: '19',
      summary: 'Nova Telecom - Competitive Win',
      objectType: 'Opportunity',
      recordName: 'Nova Network Upgrade',
      changes: [
        { field: 'Stage', before: 'Proposal', after: 'Negotiation' },
        { field: 'Notes', before: null, after: 'Selected over competitor' },
        { field: 'Probability', before: '45%', after: '80%' },
      ],
      status: 'pending',
    },
    {
      id: '20',
      summary: 'Vertex Pharma - Final Approval',
      objectType: 'Opportunity',
      recordName: 'Vertex Clinical Trial System',
      changes: [
        { field: 'Stage', before: 'Negotiation', after: 'Contract Sent' },
        { field: 'Close Date', before: 'Apr 30', after: 'Apr 15' },
        { field: 'Amount', before: '$1,200,000', after: '$1,350,000' },
      ],
      status: 'pending',
    },
  ]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>('1'); // First item expanded by default

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial thinking animation
  useEffect(() => {
    if (flowState !== 'thinking-initial') return;

    const initialSteps: ThinkingStep[] = [
      {
        id: 'step-1',
        text: 'Analyzing pipeline review notes',
        status: 'complete',
        description:
          'Parsing the meeting transcript to extract action items and deal updates mentioned during the review.',
      },
      {
        id: 'step-2',
        text: 'Querying Salesforce opportunities',
        status: 'complete',
        description: 'Fetching current opportunity data to compare with proposed changes.',
        code: `SELECT Id, Name, StageName, Amount, CloseDate
FROM Opportunity
WHERE Id IN ('006...', '006...', '006...', '006...')`,
      },
      {
        id: 'step-3',
        text: 'Preparing bulk update request',
        status: 'awaiting-approval',
        description: 'Ready to update 20 opportunities based on pipeline review decisions.',
      },
    ];

    // Simulate steps appearing
    const addSteps = async () => {
      for (let i = 0; i < initialSteps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSteps((prev) => {
          const updated = prev.map((s) => ({ ...s, status: 'complete' as const }));
          const isLast = i === initialSteps.length - 1;
          return [
            ...updated,
            { ...initialSteps[i], status: isLast ? 'awaiting-approval' : ('in-progress' as const) },
          ];
        });
      }
      // Expand the approval step and transition to awaiting-approval state
      await new Promise((resolve) => setTimeout(resolve, 300));
      setExpandedStepId('step-3');
      setFlowState('awaiting-approval');
    };

    addSteps();
  }, [flowState]);

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Handle item toggle
  const handleToggleItem = useCallback((id: string) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  }, []);

  // Handle single item update
  const handleUpdateItem = useCallback((id: string) => {
    setBulkItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'updating' } : item))
    );

    // Simulate update delay
    setTimeout(() => {
      setBulkItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'success' } : item))
      );
      // Auto-expand next pending item
      setBulkItems((currentItems) => {
        const nextPending = currentItems.find((i) => i.status === 'pending' && i.id !== id);
        if (nextPending) {
          setExpandedItemId(nextPending.id);
        }
        return currentItems;
      });
    }, 1000);
  }, []);

  // Handle single item reject
  const handleRejectItem = useCallback((id: string) => {
    setBulkItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
    );
    // Auto-expand next pending item
    setBulkItems((currentItems) => {
      const nextPending = currentItems.find((i) => i.status === 'pending' && i.id !== id);
      if (nextPending) {
        setExpandedItemId(nextPending.id);
      }
      return currentItems;
    });
  }, []);

  // Handle update all
  const handleUpdateAll = useCallback(() => {
    setFlowState('updating');

    // Update items sequentially
    const pendingItems = bulkItems.filter((item) => item.status === 'pending');
    let delay = 0;

    pendingItems.forEach((item, idx) => {
      setTimeout(() => {
        setBulkItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'updating' } : i))
        );
      }, delay);

      setTimeout(() => {
        setBulkItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'success' } : i))
        );

        // After last item, continue thinking
        if (idx === pendingItems.length - 1) {
          setTimeout(() => {
            setFlowState('thinking-continue');
          }, 500);
        }
      }, delay + 800);

      delay += 1000;
    });
  }, [bulkItems]);

  // Handle reject all
  const handleRejectAll = useCallback(() => {
    setBulkItems((prev) =>
      prev.map((item) => (item.status === 'pending' ? { ...item, status: 'rejected' } : item))
    );
    setFlowState('thinking-continue');
  }, []);

  // Continue thinking after updates
  useEffect(() => {
    if (flowState !== 'thinking-continue') return;

    const continueSteps = async () => {
      // Mark approval step as complete
      setSteps((prev) =>
        prev.map((s) => (s.id === 'step-3' ? { ...s, status: 'complete' as const } : s))
      );

      // Add continuation steps
      await new Promise((resolve) => setTimeout(resolve, 500));

      const successCount = bulkItems.filter((i) => i.status === 'success').length;
      const rejectedCount = bulkItems.filter((i) => i.status === 'rejected').length;

      setSteps((prev) => [
        ...prev,
        {
          id: 'step-4',
          text:
            successCount > 0
              ? `Updated ${successCount} opportunities in Salesforce`
              : 'Skipped all updates',
          status: 'in-progress' as const,
          description:
            successCount > 0
              ? `Successfully updated ${successCount} record${successCount !== 1 ? 's' : ''}${rejectedCount > 0 ? `, skipped ${rejectedCount}` : ''}.`
              : 'No changes were made to Salesforce.',
        },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 800));

      setSteps((prev) =>
        prev.map((s) => (s.id === 'step-4' ? { ...s, status: 'complete' as const } : s))
      );

      await new Promise((resolve) => setTimeout(resolve, 400));

      setSteps((prev) => [
        ...prev,
        {
          id: 'step-5',
          text: 'Generating summary report',
          status: 'in-progress' as const,
          description: 'Creating a summary of all changes made during this session.',
        },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSteps((prev) =>
        prev.map((s) => (s.id === 'step-5' ? { ...s, status: 'complete' as const } : s))
      );

      setFlowState('complete');
    };

    continueSteps();
  }, [flowState, bulkItems]);

  // Check if all items are processed
  const allItemsProcessed = bulkItems.every(
    (item) => item.status === 'success' || item.status === 'rejected'
  );

  // Auto-continue when all items processed via individual actions
  useEffect(() => {
    if (flowState === 'awaiting-approval' && allItemsProcessed) {
      setFlowState('thinking-continue');
    }
  }, [flowState, allItemsProcessed]);

  const allComplete = flowState === 'complete';
  const awaitingApproval = flowState === 'awaiting-approval';

  return (
    <div className="bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden p-1">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-2 py-1.5 flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isCollapsed ? (
            <CaretRightIcon size={12} weight="bold" className="text-gray-500 flex-shrink-0" />
          ) : (
            <CaretDownIcon size={12} weight="bold" className="text-gray-500 flex-shrink-0" />
          )}

          {allComplete ? (
            <>
              <CheckCircleIcon size={16} weight="fill" className="text-emerald-600 flex-shrink-0" />
              <span className="text-[15px] text-gray-700">Thinking completed</span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="text-indigo-500"
              >
                <SpinnerIcon size={16} />
              </motion.span>
              <span className="text-[15px] text-gray-700">
                {awaitingApproval ? 'Waiting for approval...' : 'Thinking...'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {awaitingApproval && (
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full"
            >
              <BellIcon size={12} weight="fill" />
              <span className="text-xs font-medium">Approval</span>
            </motion.div>
          )}
          <span className="text-xs text-gray-500 tabular-nums">{formatTime(elapsedTime)}</span>
        </div>
      </button>

      {/* Steps Container */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border border-gray-200 bg-white shadow-xs rounded-lg">
              <div className="overflow-y-auto px-3 py-3" style={{ maxHeight: '600px' }}>
                {steps.length === 0 ? (
                  <div className="flex items-center justify-center py-6 text-[15px] text-gray-500">
                    Starting...
                  </div>
                ) : (
                  <div className="space-y-0">
                    {steps.map((step, idx) => (
                      <ThinkingStepRow
                        key={step.id}
                        step={step}
                        isLast={idx === steps.length - 1}
                        isExpanded={expandedStepId === step.id}
                        onToggle={() =>
                          setExpandedStepId((prev) => (prev === step.id ? null : step.id))
                        }
                        fullWidthContent={
                          step.id === 'step-3' && step.status === 'awaiting-approval' ? (
                            <BulkApprovalCard
                              items={bulkItems}
                              expandedItemId={expandedItemId}
                              onToggleItem={handleToggleItem}
                              onUpdateItem={handleUpdateItem}
                              onRejectItem={handleRejectItem}
                              onUpdateAll={handleUpdateAll}
                              onRejectAll={handleRejectAll}
                            />
                          ) : undefined
                        }
                      >
                        {/* Show completed summary card for approval step */}
                        {step.id === 'step-3' && step.status === 'complete' && (
                          <CompletedSummaryCard items={bulkItems} />
                        )}
                      </ThinkingStepRow>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Meta & Stories
// ============================================================================

const meta = {
  title: '3-Pane/Experiments/SalesforceBulkUpdate',
  component: SalesforceBulkUpdatePrototype,
  decorators: [FullScreenDecorator],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'gray',
      values: [{ name: 'gray', value: '#f9fafb' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SalesforceBulkUpdatePrototype>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InteractivePrototype: Story = {
  render: () => <SalesforceBulkUpdatePrototype />,
};
