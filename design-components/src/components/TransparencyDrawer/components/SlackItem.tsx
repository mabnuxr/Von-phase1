import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatCircleDotsIcon, HashIcon, CaretDownIcon } from '@phosphor-icons/react';
import type { SlackTranscript } from '../types';
import { ChatMarkdown } from '../../Chat/ChatMarkdown';

interface SlackItemProps {
  slack: SlackTranscript;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}

const formatTimelineTs = (ts?: number): string => {
  if (!ts) return '';
  const date = new Date(ts * 1000);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const SlackItem = React.memo<SlackItemProps>(({ slack, isExpanded, onToggle, isLast }) => {
  const channelLabel = slack.channelName ? `#${slack.channelName}` : '#channel';
  const isThread = slack.type === 'slack_thread';
  const headerLabel = isThread ? `${channelLabel} · thread` : channelLabel;
  const preview = slack.chunkText?.slice(0, 200);
  const hasTimeline = slack.timeline && slack.timeline.length > 0;
  const hasDetails = slack.chunkText || slack.participants?.length || hasTimeline;

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
          {isThread ? (
            <ChatCircleDotsIcon
              size={14}
              weight={isExpanded ? 'duotone' : 'regular'}
              className={isExpanded ? 'text-indigo-600' : 'text-gray-600'}
            />
          ) : (
            <HashIcon
              size={14}
              weight={isExpanded ? 'bold' : 'regular'}
              className={isExpanded ? 'text-indigo-600' : 'text-gray-600'}
            />
          )}
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
              {headerLabel}
            </span>
          </button>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {new Date(slack.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Preview (collapsed) */}
        {!isExpanded && preview && (
          <div className="mt-1 text-xs text-gray-600 truncate">{preview}</div>
        )}

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && hasDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2 overflow-hidden">
                {/* Channel */}
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Channel:</span> {channelLabel}
                </div>

                {/* Participants */}
                {slack.participants && slack.participants.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Participants:</span>{' '}
                    {slack.participants.slice(0, 5).join(', ')}
                    {slack.participants.length > 5 && ` +${slack.participants.length - 5}`}
                  </div>
                )}

                {/* Thread ts */}
                {slack.threadTs && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Thread:</span>{' '}
                    <span className="font-mono">{slack.threadTs}</span>
                  </div>
                )}

                {/* Message count (for thread rows) */}
                {slack.messageCount && slack.messageCount > 1 && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Messages:</span> {slack.messageCount}
                  </div>
                )}

                {/* Timeline (from fetch_conversation) takes precedence over chunkText */}
                {hasTimeline ? (
                  <div className="pt-2 mt-2 border-t border-gray-200 space-y-2 max-h-80 overflow-y-auto overflow-x-hidden">
                    {slack.timeline!.map((entry, idx) => (
                      <div key={idx} className="text-xs text-gray-700">
                        {entry.startTs && (
                          <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">
                            {formatTimelineTs(entry.startTs)}
                            {entry.type === 'slack_thread' ? ' · thread' : ''}
                          </div>
                        )}
                        <ChatMarkdown
                          content={entry.chunkText || ''}
                          className="text-xs text-gray-700 leading-relaxed break-words [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:break-words"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  slack.chunkText && (
                    <div className="pt-2 mt-2 border-t border-gray-200 max-h-80 overflow-y-auto overflow-x-hidden">
                      <ChatMarkdown
                        content={slack.chunkText}
                        className="text-xs text-gray-700 leading-relaxed break-words [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:break-words"
                      />
                    </div>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

SlackItem.displayName = 'SlackItem';
