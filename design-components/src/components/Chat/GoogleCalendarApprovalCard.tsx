import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  LoaderIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  VideoIcon,
  RepeatIcon,
  EditIcon,
} from './icons';
import type { GoogleCalendarOperation, GoogleCalendarApprovalToolArgs } from './types';

/**
 * Props for GoogleCalendarApprovalCard component
 */
export interface GoogleCalendarApprovalCardProps {
  /** Tool call ID for tracking */
  toolCallId: string;
  /** Run ID of the interrupted workflow (required to resume) */
  runId: string;
  /** Approval request arguments */
  args: GoogleCalendarApprovalToolArgs;
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
  /** Whether this is the latest message in the conversation */
  isLatestMessage?: boolean;
}

/**
 * Format ISO datetime to human-readable format
 */
function formatDateTime(isoString: string, timezone?: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format duration from hours and minutes
 */
function formatDuration(hours?: string, minutes?: number): string {
  const h = parseInt(hours || '0', 10);
  const m = minutes || 0;

  if (h === 0 && m === 0) return '';

  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hour${h !== 1 ? 's' : ''}`);
  if (m > 0) parts.push(`${m} min${m !== 1 ? 's' : ''}`);

  return parts.join(' ');
}

/**
 * Parse recurrence rule to human-readable format
 */
function formatRecurrence(rrule?: string): string {
  if (!rrule) return '';

  // Parse RRULE format like "FREQ=DAILY;COUNT=5"
  const parts = rrule.split(';').reduce(
    (acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const freq = parts.FREQ?.toLowerCase();
  const count = parts.COUNT ? parseInt(parts.COUNT, 10) : null;
  const interval = parts.INTERVAL ? parseInt(parts.INTERVAL, 10) : 1;

  let freqText = '';
  switch (freq) {
    case 'daily':
      freqText = interval === 1 ? 'Daily' : `Every ${interval} days`;
      break;
    case 'weekly':
      freqText = interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      break;
    case 'monthly':
      freqText = interval === 1 ? 'Monthly' : `Every ${interval} months`;
      break;
    case 'yearly':
      freqText = interval === 1 ? 'Yearly' : `Every ${interval} years`;
      break;
    default:
      return rrule;
  }

  if (count) {
    return `${freqText}, ${count} times`;
  }

  return freqText;
}

/**
 * Parse comma-separated emails to array
 */
function parseAttendees(attendeesEmails?: string): string[] {
  if (!attendeesEmails) return [];
  return attendeesEmails
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

/**
 * Render content for CREATE operation
 */
const CreateEventContent: React.FC<{ operation: GoogleCalendarOperation }> = ({ operation }) => {
  const attendees = parseAttendees(operation.attendees_emails);
  const duration = formatDuration(operation.event_duration_hour, operation.event_duration_minutes);
  const recurrence = formatRecurrence(operation.recurrence);

  return (
    <div className="space-y-3">
      {/* Date & Time */}
      <div className="flex items-start gap-3">
        <ClockIcon className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
        <div>
          <p className="text-sm text-gray-900">
            {formatDateTime(operation.start_datetime, operation.timezone)}
          </p>
          {duration && <p className="text-xs text-gray-500">{duration}</p>}
        </div>
      </div>

      {/* Location */}
      {operation.location && (
        <div className="flex items-start gap-3">
          <MapPinIcon className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
          <p className="text-sm text-gray-900">{operation.location}</p>
        </div>
      )}

      {/* Google Meet */}
      {operation.create_meeting_room && (
        <div className="flex items-start gap-3">
          <VideoIcon className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
          <p className="text-sm text-gray-900">Google Meet video call will be created</p>
        </div>
      )}

      {/* Attendees */}
      {attendees.length > 0 && (
        <div className="flex items-start gap-3">
          <UsersIcon className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
          <div>
            <p className="text-sm text-gray-900">
              {attendees.length} attendee{attendees.length !== 1 ? 's' : ''}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {attendees.map((email, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                >
                  {email}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recurrence */}
      {recurrence && (
        <div className="flex items-start gap-3">
          <RepeatIcon className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
          <p className="text-sm text-gray-900">{recurrence}</p>
        </div>
      )}

      {/* Description */}
      {operation.description && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-600">{operation.description}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Simple non-expandable card for DELETE operations
 */
const DeleteEventCard: React.FC<{ operation: GoogleCalendarOperation }> = ({ operation }) => (
  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center gap-3">
    <div className="p-1.5 rounded-md bg-gray-100">
      <TrashIcon className="text-gray-600" size={16} />
    </div>
    <div className="flex flex-col items-start">
      <span className="text-sm font-medium text-gray-900">{operation.summary}</span>
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Delete</span>
        <span className="text-xs text-gray-500">
          {formatDateTime(operation.start_datetime, operation.timezone)}
        </span>
      </div>
    </div>
  </div>
);

/**
 * Format field name to be more human-readable
 */
function formatFieldName(field: string): string {
  const fieldMappings: Record<string, string> = {
    summary: 'Title',
    start_datetime: 'Start Time',
    end_datetime: 'End Time',
    description: 'Description',
    location: 'Location',
    attendees_emails: 'Attendees',
    timezone: 'Timezone',
    create_meeting_room: 'Google Meet',
    recurrence: 'Recurrence',
    event_duration_hour: 'Duration (hours)',
    event_duration_minutes: 'Duration (minutes)',
  };
  return fieldMappings[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format change value for display
 */
function formatChangeValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return formatDateTime(value);
  }
  return String(value);
}

/**
 * Render content for UPDATE operation - shows before/after changes
 */
const UpdateEventContent: React.FC<{ operation: GoogleCalendarOperation }> = ({ operation }) => {
  const changes = operation.changes || [];

  if (changes.length === 0) {
    return <div className="text-sm text-gray-500 italic">No changes specified</div>;
  }

  return (
    <div className="space-y-2">
      {changes.map((change, idx) => (
        <div key={idx} className="rounded-md border border-gray-100 bg-gray-50/50 p-3">
          <div className="text-xs font-medium text-gray-500 mb-2">
            {formatFieldName(change.field)}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 line-through">{formatChangeValue(change.before)}</span>
            <span className="text-gray-400">→</span>
            <span className="text-gray-900 font-medium">{formatChangeValue(change.after)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Card for UPDATE operations with expandable changes
 */
const UpdateEventCard: React.FC<{
  operation: GoogleCalendarOperation;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ operation, isExpanded, onToggle }) => {
  const changeCount = operation.changes?.length || 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Operation header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-gray-100">
            <EditIcon className="text-gray-600" size={16} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
              {operation.summary}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Update
              </span>
              <span className="text-xs text-gray-500">Event</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {changeCount > 0 && (
            <span className="text-xs text-gray-400">
              {changeCount} change{changeCount !== 1 ? 's' : ''}
            </span>
          )}
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
            <div className="px-4 pb-4 pt-1">
              <UpdateEventContent operation={operation} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Single operation card for CREATE events
 */
const EventOperationCard: React.FC<{
  operation: GoogleCalendarOperation;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ operation, isExpanded, onToggle }) => {
  const attendees = parseAttendees(operation.attendees_emails);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Operation header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-gray-100">
            <PlusIcon className="text-gray-600" size={16} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
              {operation.summary}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Create
              </span>
              <span className="text-xs text-gray-500">Event</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {attendees.length > 0 && (
            <span className="text-xs text-gray-400">
              {attendees.length} attendee{attendees.length !== 1 ? 's' : ''}
            </span>
          )}
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
            <div className="px-4 pb-4 pt-1">
              <CreateEventContent operation={operation} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * GoogleCalendarApprovalCard Component
 *
 * Displays a Google Calendar approval request with calendar-specific formatting.
 * - Create: Shows event details (time, attendees, location, etc.)
 * - Delete: Simple card with event summary
 */
export const GoogleCalendarApprovalCard: React.FC<GoogleCalendarApprovalCardProps> = ({
  toolCallId,
  runId,
  args,
  isPending,
  onApprove,
  onReject,
  isProcessing = false,
  result,
  isLatestMessage,
}) => {
  // Track which operations are expanded (first one expanded by default)
  const [expandedOps, setExpandedOps] = useState<Set<number>>(new Set([0]));

  // Track pending action for intermediate state (Approving.../Rejecting...)
  const [pendingAction, setPendingAction] = useState<'approving' | 'rejecting' | null>(null);

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

  // Button click handlers - set intermediate state immediately
  const handleApprove = () => {
    setPendingAction('approving');
    onApprove(toolCallId, runId);
  };

  const handleReject = () => {
    setPendingAction('rejecting');
    onReject(toolCallId, runId);
  };

  // Determine card state
  const isConfirmedApproved = result?.approved === true;
  const isConfirmedRejected = result?.approved === false;
  const showButtons = isPending && !result && !pendingAction;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="my-4"
    >
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
          <CalendarIcon className="text-gray-500" size={18} />
          <div>
            <h3 className="text-sm font-medium text-gray-900">Calendar Approval Required</h3>
            <p className="text-sm text-gray-600 mt-0.5">{args.summary}</p>
          </div>
        </div>

        {/* Operations list */}
        <div className="p-4 space-y-3">
          {args.operations.map((operation, index) => {
            // Use simple non-expandable card for delete operations
            if (operation.operation === 'delete') {
              return <DeleteEventCard key={index} operation={operation} />;
            }
            // Use update card for update operations
            if (operation.operation === 'update') {
              return (
                <UpdateEventCard
                  key={index}
                  operation={operation}
                  isExpanded={expandedOps.has(index)}
                  onToggle={() => toggleOperation(index)}
                />
              );
            }
            // Default to create card
            return (
              <EventOperationCard
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
          {showButtons && isLatestMessage ? (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Approve
              </button>
            </div>
          ) : showButtons && !isLatestMessage ? (
            <div className="flex items-center">
              <span className="text-sm text-gray-500 italic">
                This approval request is no longer active
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Intermediate state: Approving... */}
              {pendingAction === 'approving' && !isConfirmedApproved && (
                <>
                  <LoaderIcon className="text-amber-500 animate-spin" size={16} />
                  <span className="text-sm font-medium text-amber-600">Approving...</span>
                </>
              )}

              {/* Intermediate state: Rejecting... */}
              {pendingAction === 'rejecting' && !isConfirmedRejected && (
                <>
                  <LoaderIcon className="text-amber-500 animate-spin" size={16} />
                  <span className="text-sm font-medium text-amber-600">Rejecting...</span>
                </>
              )}

              {/* Final state: Approved (green) */}
              {isConfirmedApproved && (
                <>
                  <CheckCircleIcon className="text-green-600" size={16} />
                  <span className="text-sm font-medium text-green-600">Approved</span>
                </>
              )}

              {/* Final state: Rejected (red) */}
              {isConfirmedRejected && (
                <>
                  <XCircleIcon className="text-red-600" size={16} />
                  <span className="text-sm font-medium text-red-600">Rejected</span>
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

export default GoogleCalendarApprovalCard;
