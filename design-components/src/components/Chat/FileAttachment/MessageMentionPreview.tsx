import React from 'react';
import { ChartBar } from '@phosphor-icons/react';
import type { MentionItem } from '../../Mentions/types';

export interface MessageMentionPreviewProps {
  /** The mention items to display */
  mentions: MentionItem[];
}

/**
 * MessageMentionPreview — read-only mention cards shown in sent messages,
 * matching the visual style of MessageFilePreview.
 */
export const MessageMentionPreview: React.FC<MessageMentionPreviewProps> = ({ mentions }) => {
  if (!mentions || mentions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {mentions.map((mention) => (
        <div
          key={mention.id}
          className="relative flex items-center gap-2.5 p-2 pr-3 rounded-xl border border-gray-200 bg-white shadow-xs max-w-[240px] flex-shrink-0"
        >
          {/* Dashboard icon */}
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <ChartBar size={18} weight="duotone" className="text-indigo-600" />
          </div>

          {/* Dashboard name — truncated */}
          <span
            className="text-[13px] font-medium text-gray-800 truncate min-w-0"
            title={mention.name}
          >
            {mention.name}
          </span>
        </div>
      ))}
    </div>
  );
};
