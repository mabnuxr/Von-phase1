import React, { useMemo, useCallback } from 'react';
import { ChatCircleDotsIcon } from '@phosphor-icons/react';
import type { SlackTranscript } from '../types';
import { useCallsExpansion } from '../hooks';
import { SlackItem } from './SlackItem';

export interface SlackTabContentProps {
  slack: SlackTranscript[];
}

/**
 * Groups Slack hits by month for timeline display
 */
const groupSlackByMonth = (slack: SlackTranscript[]): Record<string, SlackTranscript[]> => {
  const groups: Record<string, SlackTranscript[]> = {};

  slack.forEach((entry) => {
    const date = new Date(entry.date);
    const monthYear = isNaN(date.getTime())
      ? 'Unknown'
      : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (!groups[monthYear]) groups[monthYear] = [];
    groups[monthYear].push(entry);
  });

  return groups;
};

/**
 * SlackTabContent - Timeline view of Slack messages and threads.
 *
 * Mirrors the EmailsTabContent UX:
 * - Flat list sorted by relevance when search results carry relevance scores
 * - Chronological grouping by month otherwise
 * - Expandable rows showing the full chunk + channel/participant/thread metadata
 */
export const SlackTabContent = React.memo<SlackTabContentProps>(({ slack }) => {
  const { toggleExpanded, isExpanded } = useCallsExpansion(slack[0]?.id);

  const hasRelevanceScores = useMemo(
    () => slack.some((s) => s.relevanceScore !== undefined && s.relevanceScore > 0),
    [slack]
  );

  const handleToggle = useCallback(
    (id: string) => {
      toggleExpanded(id);
    },
    [toggleExpanded]
  );

  if (slack.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <ChatCircleDotsIcon size={48} weight="duotone" className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No Slack messages available</p>
      </div>
    );
  }

  if (hasRelevanceScores) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden px-4 py-4">
        <div className="relative">
          {slack.map((entry, idx) => (
            <SlackItem
              key={entry.id}
              slack={entry}
              isExpanded={isExpanded(entry.id)}
              onToggle={() => handleToggle(entry.id)}
              isLast={idx === slack.length - 1}
            />
          ))}
        </div>
      </div>
    );
  }

  const grouped = groupSlackByMonth(slack);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden px-4 py-4">
      {Object.entries(grouped).map(([monthYear, monthSlack]) => (
        <div key={monthYear} className="mb-6 last:mb-0">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            {monthYear}
          </h3>
          <div className="relative">
            {monthSlack.map((entry, idx) => (
              <SlackItem
                key={entry.id}
                slack={entry}
                isExpanded={isExpanded(entry.id)}
                onToggle={() => handleToggle(entry.id)}
                isLast={idx === monthSlack.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

SlackTabContent.displayName = 'SlackTabContent';
