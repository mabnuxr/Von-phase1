import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneIcon,
  ClockIcon,
  UsersIcon,
  ArrowSquareOutIcon,
  TableIcon,
} from '@phosphor-icons/react';
import type { CallsTabContentProps, CallTranscript } from '../types';
import { useCallsExpansion } from '../hooks';
import { groupCallsByMonth, getSentimentIcon, getSentimentLabel } from '../utils';

// ============================================================================
// Internal Components
// ============================================================================

interface CallItemProps {
  call: CallTranscript;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}

const CallItem = React.memo<CallItemProps>(({ call, isExpanded, onToggle, isLast }) => {
  return (
    <div className="relative flex gap-3 overflow-hidden">
      {/* Timeline line and icon */}
      <div className="flex flex-col items-center">
        <button
          onClick={onToggle}
          className={`
            relative z-10 w-7 h-7 flex items-center justify-center rounded-full border bg-white
            cursor-pointer transition-colors duration-150
            ${
              isExpanded
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          <PhoneIcon
            size={14}
            weight={isExpanded ? 'duotone' : 'regular'}
            className={isExpanded ? 'text-indigo-600' : 'text-gray-600'}
          />
        </button>
        {!isLast && <div className="w-px flex-1 bg-gray-200 min-h-[16px]" />}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-4'}`}>
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1 overflow-hidden">
          <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">
            {call.title}
          </span>
          {call.sourceUrl && (
            <a
              href={call.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-indigo-600 flex-shrink-0 transition-colors"
            >
              <ArrowSquareOutIcon size={14} />
            </a>
          )}
          <span className="text-xs text-gray-500 flex-shrink-0">
            {new Date(call.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2 overflow-hidden">
                {/* Time and Duration */}
                {(call.timeRange || call.duration) && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <ClockIcon size={12} className="text-gray-500" />
                    <span>
                      {call.timeRange && call.timeRange}
                      {call.timeRange && call.duration && ' · '}
                      {call.duration && call.duration}
                    </span>
                  </div>
                )}

                {/* Participants */}
                {call.participants && call.participants.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <UsersIcon size={12} className="text-gray-500 flex-shrink-0" />
                    <span className="truncate">{call.participants.join(', ')}</span>
                  </div>
                )}

                {/* Account / Opportunity */}
                {(call.accountName || call.opportunityName) && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <TableIcon size={12} className="text-gray-500 flex-shrink-0" />
                    <span className="truncate">
                      {call.accountName}
                      {call.accountName && call.opportunityName && ' · '}
                      {call.opportunityName}
                    </span>
                  </div>
                )}

                {/* Sentiment */}
                {call.sentiment && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    {getSentimentIcon(call.sentiment)}
                    <span>{getSentimentLabel(call.sentiment)} sentiment</span>
                  </div>
                )}

                {/* Summary */}
                {call.summary && (
                  <div className="pt-2 mt-2 border-t border-gray-200 overflow-hidden">
                    <p className="text-xs text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                      {call.summary}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

CallItem.displayName = 'CallItem';

// ============================================================================
// Main Component
// ============================================================================

/**
 * CallsTabContent - Timeline view of call recordings
 *
 * Features:
 * - Groups calls by month
 * - Expandable call items
 * - Call metadata (time, duration, participants, sentiment)
 * - Expandable summary
 * - Links to Gong recordings
 */
export const CallsTabContent = React.memo<CallsTabContentProps>(({ calls }) => {
  const { toggleExpanded, isExpanded } = useCallsExpansion(calls[0]?.id);

  const grouped = useMemo(() => groupCallsByMonth(calls), [calls]);

  const handleToggle = useCallback(
    (id: string) => {
      toggleExpanded(id);
    },
    [toggleExpanded]
  );

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <PhoneIcon size={48} weight="duotone" className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No call recordings available</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
      {Object.entries(grouped).map(([monthYear, monthCalls]) => (
        <div key={monthYear} className="mb-6 last:mb-0">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {monthYear}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <PhoneIcon size={12} weight="regular" />
              <span>{monthCalls.length}</span>
            </div>
          </div>

          {/* Timeline Items */}
          <div className="relative">
            {monthCalls.map((call, idx) => (
              <CallItem
                key={call.id}
                call={call}
                isExpanded={isExpanded(call.id)}
                onToggle={() => handleToggle(call.id)}
                isLast={idx === monthCalls.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

CallsTabContent.displayName = 'CallsTabContent';
