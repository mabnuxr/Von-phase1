import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneIcon,
  ClockIcon,
  UsersIcon,
  ArrowSquareOutIcon,
  TableIcon,
  VideoCameraIcon,
  CaretDownIcon,
} from '@phosphor-icons/react';
import type { CallsTabContentProps, CallTranscript } from '../types';
import { useCallsExpansion } from '../hooks';
import { groupCallsByMonth, getSentimentIcon, getSentimentLabel } from '../utils';
import { ChatMarkdown } from '../../Chat/ChatMarkdown';

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
        <div className="flex items-center gap-2 overflow-hidden">
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 flex-1 min-w-0 group cursor-pointer"
          >
            <CaretDownIcon
              size={12}
              weight="bold"
              className={`text-gray-400 group-hover:text-indigo-600 flex-shrink-0 transition-transform duration-150 ${
                isExpanded ? 'rotate-0' : '-rotate-90'
              }`}
            />
            <span className="text-sm font-medium text-gray-900 min-w-0 truncate text-left group-hover:text-indigo-600 transition-colors">
              {call.title}
            </span>
            {call.meetingUrl && (
              <a
                href={call.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="ml-1 text-gray-500 hover:text-indigo-600 flex-shrink-0 transition-colors"
                title="Open meeting"
              >
                <ArrowSquareOutIcon size={16} weight="bold" />
              </a>
            )}
          </button>
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
                  <div className="pt-2 mt-2 border-t border-gray-200 max-h-80 overflow-y-auto overflow-x-hidden">
                    <ChatMarkdown
                      content={call.summary}
                      className="text-xs text-gray-700 leading-relaxed break-words [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:break-words [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-medium"
                    />
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

  // Empty state
  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <PhoneIcon size={48} weight="duotone" className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No call recordings available</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden px-4 py-4">
      {Object.entries(grouped).map(([monthYear, monthCalls]) => (
        <div key={monthYear} className="mb-6 last:mb-0">
          {/* Month Header */}
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            {monthYear}
          </h3>

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
