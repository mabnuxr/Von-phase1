import React, { useMemo, useCallback } from 'react';
import { EnvelopeIcon } from '@phosphor-icons/react';
import type { EmailTranscript } from '../types';
import { useCallsExpansion } from '../hooks';
import { EmailItem } from './EmailItem';

export interface EmailsTabContentProps {
  emails: EmailTranscript[];
}

/**
 * Groups email transcripts by month for timeline display
 */
const groupEmailsByMonth = (emails: EmailTranscript[]): Record<string, EmailTranscript[]> => {
  const groups: Record<string, EmailTranscript[]> = {};

  emails.forEach((email) => {
    const date = new Date(email.date);
    const monthYear = date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(email);
  });

  return groups;
};

/**
 * EmailsTabContent - Timeline view of email conversations
 *
 * Features:
 * - Groups emails by month (chronological browsing)
 * - Flat list by relevance (semantic search)
 * - Expandable email items
 * - Email metadata (sender, recipients, CRM object info)
 * - Full email content rendering
 */
export const EmailsTabContent = React.memo<EmailsTabContentProps>(({ emails }) => {
  const { toggleExpanded, isExpanded } = useCallsExpansion(emails[0]?.id);

  // Check if emails have relevance scores (semantic search results)
  const hasRelevanceScores = useMemo(() => {
    return emails.some((email) => email.relevanceScore !== undefined && email.relevanceScore > 0);
  }, [emails]);

  const handleToggle = useCallback(
    (id: string) => {
      toggleExpanded(id);
    },
    [toggleExpanded]
  );

  // Empty state
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <EnvelopeIcon size={48} weight="duotone" className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No emails available</p>
      </div>
    );
  }

  // If relevance scores exist, show flat list sorted by relevance (semantic search)
  // Otherwise, group by month for chronological browsing
  if (hasRelevanceScores) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden px-4 py-4">
        <div className="relative">
          {emails.map((email, idx) => (
            <EmailItem
              key={email.id}
              email={email}
              isExpanded={isExpanded(email.id)}
              onToggle={() => handleToggle(email.id)}
              isLast={idx === emails.length - 1}
            />
          ))}
        </div>
      </div>
    );
  }

  // Fallback: Group by month for chronological viewing (when no relevance scores)
  const grouped = groupEmailsByMonth(emails);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden px-4 py-4">
      {Object.entries(grouped).map(([monthYear, monthEmails]) => (
        <div key={monthYear} className="mb-6 last:mb-0">
          {/* Month Header */}
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            {monthYear}
          </h3>

          {/* Timeline Items */}
          <div className="relative">
            {monthEmails.map((email, idx) => (
              <EmailItem
                key={email.id}
                email={email}
                isExpanded={isExpanded(email.id)}
                onToggle={() => handleToggle(email.id)}
                isLast={idx === monthEmails.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

EmailsTabContent.displayName = 'EmailsTabContent';
