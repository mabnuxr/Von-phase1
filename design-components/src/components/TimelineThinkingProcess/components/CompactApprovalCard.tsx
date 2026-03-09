import React, { useCallback, useMemo, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { CompactApprovalCardProps, ApprovalFieldType, FieldChange } from '../types';
import { useVisibilityToggle } from '../../../hooks/useVisibilityToggle';

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Renders a picklist value as a pill/tag
 */
const PicklistValue: React.FC<{ value: string; isStrikethrough?: boolean }> = ({
  value,
  isStrikethrough,
}) => (
  <span
    className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 ${isStrikethrough ? 'line-through opacity-60' : ''}`}
  >
    {value}
  </span>
);

/**
 * Renders multi-picklist values as multiple pills
 */
const MultiPicklistValue: React.FC<{ values: string[]; isStrikethrough?: boolean }> = ({
  values,
  isStrikethrough,
}) => (
  <div className="flex flex-wrap gap-1">
    {values.map((value, idx) => (
      <PicklistValue key={idx} value={value} isStrikethrough={isStrikethrough} />
    ))}
  </div>
);

/**
 * Renders long text with truncation and tooltip on hover
 */
const LongTextValue: React.FC<{ value: string; isStrikethrough?: boolean }> = ({
  value,
  isStrikethrough,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const lines = value.split('\n');
  const shouldTruncate = lines.length > 2 || value.length > 100;
  const truncatedValue = shouldTruncate
    ? lines.slice(0, 2).join('\n').slice(0, 100) + '...'
    : value;

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.bottom + 4,
      left: rect.left,
    });
    setShowTooltip(true);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span
        className={`text-sm whitespace-pre-wrap ${isStrikethrough ? 'line-through text-gray-500' : 'text-gray-900'} ${shouldTruncate ? 'cursor-help' : ''}`}
      >
        {truncatedValue}
      </span>
      {/* Tooltip - fixed position to escape overflow containers */}
      {shouldTruncate && showTooltip && (
        <div
          className="fixed z-9999 max-w-75 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-pre-wrap pointer-events-none"
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
        >
          {value}
        </div>
      )}
    </div>
  );
};

/**
 * Renders a field value based on its type
 */
const FieldValue: React.FC<{
  value: string | number | boolean | Record<string, unknown> | null | undefined;
  fieldType?: ApprovalFieldType;
  isStrikethrough?: boolean;
}> = ({ value, fieldType, isStrikethrough }) => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return <span className="text-gray-400">&mdash;</span>;
  }

  // Handle objects (e.g. Tooling API Metadata) — stringify for display
  const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

  // Render based on field type
  switch (fieldType) {
    case 'long_text':
      return <LongTextValue value={stringValue} isStrikethrough={isStrikethrough} />;

    case 'picklist':
      return <PicklistValue value={stringValue} isStrikethrough={isStrikethrough} />;

    case 'multi_picklist': {
      // Split by semicolon (Salesforce convention) or comma
      const values = stringValue.includes(';')
        ? stringValue.split(';').map((v) => v.trim())
        : stringValue.split(',').map((v) => v.trim());
      return <MultiPicklistValue values={values} isStrikethrough={isStrikethrough} />;
    }

    case 'boolean':
      return (
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
            value === true || stringValue.toLowerCase() === 'true'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-gray-100 text-gray-600'
          } ${isStrikethrough ? 'line-through opacity-60' : ''}`}
        >
          {value === true || stringValue.toLowerCase() === 'true' ? 'Yes' : 'No'}
        </span>
      );

    case 'currency':
      return (
        <span
          className={`text-sm ${isStrikethrough ? 'line-through text-gray-500' : 'text-gray-900'}`}
        >
          {stringValue.startsWith('$') ? stringValue : `$${stringValue}`}
        </span>
      );

    case 'date':
    case 'number':
    case 'text':
    default:
      return (
        <span
          className={`text-sm ${isStrikethrough ? 'line-through text-gray-500' : 'text-gray-900'}`}
        >
          {stringValue}
        </span>
      );
  }
};

/**
 * Layout mode for the changes table:
 * - 'create': 2-column (Field | Value) showing `after` values
 * - 'delete': 2-column (Field | Value) showing `before` values with strikethrough
 * - 'update': 3-column (Field | Before | After) showing both
 */
type ChangesLayout = 'create' | 'delete' | 'update';

/**
 * Renders the changes/fields diff table used in both approved/rejected and pending states.
 */
const ChangesTable: React.FC<{
  displayChanges: Array<{
    field: string;
    display_name?: string;
    before?: string | number | boolean | Record<string, unknown> | null;
    after?: string | number | boolean | Record<string, unknown> | null;
    fieldType?: ApprovalFieldType;
  }>;
  layout: ChangesLayout;
}> = ({ displayChanges, layout }) => (
  <div className="border-t border-gray-100">
    {layout === 'update' ? (
      <div className="grid grid-cols-[1fr_1fr_1fr] px-4 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-700 tracking-wide">Field</span>
        <span className="text-xs font-medium text-gray-700 tracking-wide">Before</span>
        <span className="text-xs font-medium text-gray-700 tracking-wide">After</span>
      </div>
    ) : (
      <div className="grid grid-cols-[1fr_1fr] px-4 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-700 tracking-wide">Field</span>
        <span className="text-xs font-medium text-gray-700 tracking-wide">Value</span>
      </div>
    )}

    {displayChanges.map((change, idx) =>
      layout === 'update' ? (
        <div
          key={idx}
          className="grid grid-cols-[1fr_1fr_1fr] px-3 py-2 border-b border-gray-100 last:border-b-0 items-start"
        >
          <span className="text-sm text-gray-900">{change.display_name || change.field}</span>
          <div className="text-sm">
            <FieldValue value={change.before} fieldType={change.fieldType} isStrikethrough={true} />
          </div>
          <div className="text-sm">
            <FieldValue value={change.after} fieldType={change.fieldType} />
          </div>
        </div>
      ) : (
        <div
          key={idx}
          className="grid grid-cols-[1fr_1fr] px-3 py-2 border-b border-gray-100 last:border-b-0 items-start"
        >
          <span className="text-sm text-gray-900">{change.display_name || change.field}</span>
          <div className="text-sm">
            <FieldValue
              value={layout === 'delete' ? change.before : change.after}
              fieldType={change.fieldType}
              isStrikethrough={layout === 'delete'}
            />
          </div>
        </div>
      )
    )}
  </div>
);

// ============================================================================
// Component
// ============================================================================

/**
 * CompactApprovalCard - Inline approval widget for single-record approval steps
 *
 * Features:
 * - Shows operation type (UPDATE) with object type (Opportunity)
 * - Displays record name with external link icon
 * - Table layout: FIELD | BEFORE | AFTER
 * - Before values are struck through
 * - Accordion for multiple records in bulk updates
 * - Approve/Reject buttons
 * - Status feedback (approved/rejected state)
 *
 * Note: For bulk operations, use ApprovalCard wrapper which delegates to BulkApprovalCard
 */
export const CompactApprovalCard = React.memo<CompactApprovalCardProps>(
  ({
    approval,
    onApprove,
    onReject,
    isApproved,
    isRejected,
    defaultExpanded = true,
    hideActions = false,
  }) => {
    const { isVisible: isExpanded, toggleVisibility: toggleExpanded } =
      useVisibilityToggle(defaultExpanded);

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

    // changes is the universal display format for all operations:
    // CREATE: after only. DELETE: before only. UPDATE: both before and after.
    const displayChanges: FieldChange[] = useMemo(() => {
      return approval.changes && approval.changes.length > 0 ? approval.changes : [];
    }, [approval.changes]);

    // Use the operation type as the authoritative layout signal. An UPDATE that
    // sets a previously-empty field has before: null, which the old data-shape
    // heuristic misclassified as 'create'. Fall back to data-shape inference
    // only for unknown operation values.
    const changesLayout: ChangesLayout = useMemo(() => {
      const op = approval.operation;
      if (op === 'update' || op === 'delete' || op === 'create') return op;
      const hasBefore = displayChanges.some((c) => c.before !== undefined && c.before !== null);
      const hasAfter = displayChanges.some((c) => c.after !== undefined && c.after !== null);
      if (hasBefore && hasAfter) return 'update';
      if (hasBefore) return 'delete';
      return 'create';
    }, [approval.operation, displayChanges]);

    const hasExpandableContent = displayChanges.length > 0;

    // Completed state - collapsible card that can expand to show details
    if (isApproved || isRejected) {
      return (
        <div className="mt-2 bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden min-w-0">
          {/* Collapsed header - clickable to expand only when there's content */}
          <button
            onClick={hasExpandableContent ? toggleExpanded : undefined}
            className={`w-full px-3 py-2 flex items-center justify-between transition-colors ${hasExpandableContent ? 'hover:bg-gray-50/50 cursor-pointer' : 'cursor-default'}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {hasExpandableContent &&
                (isExpanded ? (
                  <CaretDownIcon size={14} weight="bold" className="text-gray-500 shrink-0" />
                ) : (
                  <CaretRightIcon size={14} weight="bold" className="text-gray-500 shrink-0" />
                ))}
              {/* IMPORTANT: Always check isRejected first, not isApproved.
                 During a rejection flow, both isApproved and isRejected can briefly
                 be true at the same time due to a Pusher event race condition — the
                 backend reuses sequence numbers and tool_call_id when the run resumes
                 after rejection, so the "awaiting-approval" → "complete" transition
                 (which makes isApproved true) can land before the TOOL_CALL_RESULT
                 with rejectionReason arrives. Checking isRejected first ensures
                 rejection always takes visual priority during this window. */}
              {isRejected ? (
                <XCircleIcon size={14} weight="fill" className="text-red-500 shrink-0" />
              ) : (
                <CheckCircleIcon size={14} weight="fill" className="text-emerald-600 shrink-0" />
              )}
              {approval.recordUrl ? (
                <a
                  href={approval.recordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-gray-900 truncate hover:text-indigo-600 hover:underline transition-colors"
                >
                  {approval.recordName || approval.label || 'Record'}
                </a>
              ) : (
                <span className="text-sm text-gray-900 truncate">
                  {approval.recordName || approval.label || 'Record'}
                </span>
              )}
            </div>
            <span
              className={`text-xs shrink-0 ml-2 ${isRejected ? 'text-red-600' : 'text-emerald-700'}`}
            >
              {isRejected ? 'Rejected' : 'Approved'}
            </span>
          </button>

          {/* Expanded content - Changes/Fields table (read-only) */}
          {isExpanded && displayChanges.length > 0 && (
            <ChangesTable displayChanges={displayChanges} layout={changesLayout} />
          )}
        </div>
      );
    }

    // In pending state, only allow collapsing when inside a bulk card (hideActions=true).
    // Standalone pending cards must stay expanded so approve/reject buttons remain visible.
    const allowCollapse = hideActions && hasExpandableContent;

    return (
      <div className="mt-2 bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden min-w-0">
        {/* Header - Single row: accordion | deal name | action type */}
        <div
          onClick={allowCollapse ? toggleExpanded : undefined}
          className={`w-full px-3 py-2.5 flex items-center justify-between transition-colors ${allowCollapse ? 'hover:bg-gray-50/50 cursor-pointer' : 'cursor-default'}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {allowCollapse &&
              (isExpanded ? (
                <CaretDownIcon size={14} weight="bold" className="text-gray-700 shrink-0" />
              ) : (
                <CaretRightIcon size={14} weight="bold" className="text-gray-700 shrink-0" />
              ))}
            {approval.recordUrl ? (
              <a
                href={approval.recordUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-gray-900 truncate hover:text-indigo-600 hover:underline transition-colors"
              >
                {approval.recordName || approval.label || 'Record'}
              </a>
            ) : (
              <span className="text-sm text-gray-900 truncate">
                {approval.recordName || approval.label || 'Record'}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-600 shrink-0 ml-2">
            {operationLabel} {approval.label}
          </span>
        </div>

        {/* Expanded content - Changes/Fields table */}
        {isExpanded && displayChanges.length > 0 && (
          <ChangesTable displayChanges={displayChanges} layout={changesLayout} />
        )}

        {/* Action buttons - only shown when expanded and not hidden (hidden in bulk context) */}
        {isExpanded && !hideActions && (
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
