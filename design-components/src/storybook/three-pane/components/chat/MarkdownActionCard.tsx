import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretDownIcon,
  CaretRightIcon,
  XIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  VideoCameraIcon,
  ArrowsClockwiseIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react';
import { Streamdown } from 'streamdown';
import { PrimaryButton, SecondaryButton } from '../../../../components/forms/buttons/ActionButtons';

// ============================================================================
// Types
// ============================================================================

export type MarkdownActionCardVariant =
  | 'plan-approval'
  | 'analysis-request'
  | 'salesforce-single'
  | 'salesforce-bulk'
  | 'calendar';

export interface ActionButton {
  label: string;
  onClick: () => void;
}

export interface BulkItemChange {
  field: string;
  before?: string | number | null;
  after: string | number | null;
}

export interface BulkItem {
  id: string;
  summary: string;
  /** Changes to display as a table */
  changes: BulkItemChange[];
}

export type CalendarOperationType = 'create' | 'update' | 'delete';

export interface CalendarEvent {
  id: string;
  operation: CalendarOperationType;
  summary: string;
  startTime: string;
  endTime?: string;
  duration?: string;
  location?: string;
  attendees?: string[];
  hasVideoCall?: boolean;
  recurrence?: string;
  description?: string;
  /** For update operations - field changes */
  changes?: BulkItemChange[];
}

export interface MarkdownActionCardProps {
  /**
   * Variant determines the visual style and default behavior
   */
  variant: MarkdownActionCardVariant;

  /**
   * Markdown content to display
   */
  markdown: string;

  /**
   * Primary action button (e.g., "Approve", "Run Full Analysis", "Update")
   */
  primaryAction: ActionButton;

  /**
   * Secondary action button (e.g., "Reject", "Cancel", "Skip")
   */
  secondaryAction?: ActionButton;

  /**
   * For bulk variant - list of items to update
   */
  items?: BulkItem[];

  /**
   * For calendar variant - list of calendar events
   */
  calendarEvents?: CalendarEvent[];

  /**
   * Whether the content should be streaming (animated)
   * @default false
   */
  isStreaming?: boolean;

  /**
   * Content to render above the separator/action buttons
   */
  beforeActions?: React.ReactNode;
}

// ============================================================================
// Helper Components - Bulk Items
// ============================================================================

interface BulkItemRowProps {
  item: BulkItem;
  isExpanded: boolean;
  onToggle: () => void;
}

const BulkItemRow: React.FC<BulkItemRowProps> = ({ item, isExpanded, onToggle }) => {
  // Generate markdown table from changes
  const generateMarkdownTable = () => {
    const rows = item.changes.map((change) => {
      const before =
        change.before !== undefined && change.before !== null ? String(change.before) : '—';
      const after = `**${String(change.after)}**`;
      return `| ${change.field} | ${before} | ${after} |`;
    });

    return `| Field | Current Value | New Value |
|-------|---------------|-----------|
${rows.join('\n')}`;
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <span className="flex-shrink-0 text-gray-400">
          {isExpanded ? (
            <CaretDownIcon size={12} weight="bold" />
          ) : (
            <CaretRightIcon size={12} weight="bold" />
          )}
        </span>
        <span className="flex-1 text-[13px] text-gray-900">{item.summary}</span>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-4">
              <div className="prose-xs markdown-body max-w-none [&_table]:my-0 [&_th]:py-1.5 [&_th]:px-2 [&_td]:py-1.5 [&_td]:px-2 [&>div]:my-0 [&_.my-4]:my-0">
                <Streamdown
                  parseIncompleteMarkdown={false}
                  isAnimating={false}
                  controls={{ table: true }}
                >
                  {generateMarkdownTable()}
                </Streamdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Helper Components - Calendar Events
// ============================================================================

const getOperationLabel = (operation: CalendarOperationType) => {
  switch (operation) {
    case 'create':
      return 'Create';
    case 'update':
      return 'Update';
    case 'delete':
      return 'Delete';
  }
};

interface CalendarEventRowProps {
  event: CalendarEvent;
  isExpanded: boolean;
  onToggle: () => void;
}

const CalendarEventRow: React.FC<CalendarEventRowProps> = ({ event, isExpanded, onToggle }) => {
  const isExpandable = event.operation !== 'delete';

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={isExpandable ? onToggle : undefined}
        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
          isExpandable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
        }`}
      >
        <span className="flex-shrink-0 text-gray-400">
          {event.operation === 'delete' ? (
            <XIcon size={12} weight="bold" />
          ) : isExpanded ? (
            <CaretDownIcon size={12} weight="bold" />
          ) : (
            <CaretRightIcon size={12} weight="bold" />
          )}
        </span>
        <span className="flex-1 text-[13px] text-gray-900 truncate">{event.summary}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs font-medium text-gray-700">
            {getOperationLabel(event.operation)}
          </span>
          <span className="text-xs text-gray-800">·</span>
          <span className="text-xs text-gray-800">{event.startTime}</span>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && isExpandable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100">
              {/* Update operation - show changes with strikethrough */}
              {event.operation === 'update' && event.changes && event.changes.length > 0 && (
                <div className="space-y-2 py-2 px-3">
                  {event.changes.map((change, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 min-w-[80px]">{change.field}</span>
                      <span className="text-xs text-gray-400 line-through">
                        {change.before !== undefined && change.before !== null
                          ? String(change.before)
                          : '—'}
                      </span>
                      <ArrowRightIcon size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-900 font-medium">
                        {String(change.after)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Create operation - show event details */}
              {event.operation === 'create' && (
                <div className="space-y-2 py-2 px-3">
                  {/* Time & Duration */}
                  <div className="flex items-start gap-2">
                    <ClockIcon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-800">{event.startTime}</p>
                      {event.duration && (
                        <p className="text-xs text-gray-800">{event.duration}</p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start gap-2">
                      <MapPinIcon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-800">{event.location}</p>
                    </div>
                  )}

                  {/* Video call */}
                  {event.hasVideoCall && (
                    <div className="flex items-start gap-2">
                      <VideoCameraIcon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-800">Video call will be created</p>
                    </div>
                  )}

                  {/* Attendees */}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-start gap-2">
                      <UsersIcon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-800">
                          {event.attendees.length} attendee
                          {event.attendees.length !== 1 ? 's' : ''}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {event.attendees.map((email, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-700"
                            >
                              {email}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recurrence */}
                  {event.recurrence && (
                    <div className="flex items-start gap-2">
                      <ArrowsClockwiseIcon
                        size={14}
                        className="text-gray-400 mt-0.5 flex-shrink-0"
                      />
                      <p className="text-xs text-gray-800">{event.recurrence}</p>
                    </div>
                  )}

                  {/* Description */}
                  {event.description && (
                    <div className="pt-2 border-t border-gray-100 mt-2">
                      <p className="text-xs text-gray-800">{event.description}</p>
                    </div>
                  )}
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
// Main Component
// ============================================================================

export const MarkdownActionCard: React.FC<MarkdownActionCardProps> = ({
  variant,
  markdown,
  primaryAction,
  secondaryAction,
  items,
  calendarEvents,
  isStreaming = false,
  beforeActions,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const isBulkVariant = variant === 'salesforce-bulk';
  const isCalendarVariant = variant === 'calendar';

  return (
    <div className="overflow-hidden">
      {/* Custom content at start */}
      {beforeActions && <div className="mb-4">{beforeActions}</div>}

      {/* Markdown Content */}
      <div className="py-1">
        <div className="prose-sm markdown-body max-w-none">
          <Streamdown
            parseIncompleteMarkdown={isStreaming}
            isAnimating={isStreaming}
            controls={{ table: true }}
          >
            {markdown}
          </Streamdown>
        </div>
      </div>

      {/* Bulk Items List (for salesforce-bulk variant) */}
      {isBulkVariant && items && items.length > 0 && (
        <div className="mt-3">
          <div className="mb-2">
            <span className="text-[12px] font-medium text-gray-700">
              {items.length} record{items.length !== 1 ? 's' : ''} to update
            </span>
          </div>
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {items.map((item) => (
              <BulkItemRow
                key={item.id}
                item={item}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => toggleItem(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Calendar Events List (for calendar variant) */}
      {isCalendarVariant && calendarEvents && calendarEvents.length > 0 && (
        <div className="mt-3">
          <div className="mb-2">
            <span className="text-[12px] font-medium text-gray-700">
              {calendarEvents.length} event{calendarEvents.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            {calendarEvents.map((event) => (
              <CalendarEventRow
                key={event.id}
                event={event}
                isExpanded={expandedItems.has(event.id)}
                onToggle={() => toggleItem(event.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Separator and Action Buttons */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
        {secondaryAction && (
          <SecondaryButton onClick={secondaryAction.onClick}>{secondaryAction.label}</SecondaryButton>
        )}
        <PrimaryButton onClick={primaryAction.onClick}>{primaryAction.label}</PrimaryButton>
      </div>
    </div>
  );
};

export default MarkdownActionCard;
