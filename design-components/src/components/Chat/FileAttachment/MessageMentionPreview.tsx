import React from 'react';
import { ChartBar } from '@phosphor-icons/react';
import type { MentionItem } from '../../Mentions/types';

export interface MessageMentionPreviewProps {
  /** The mention items to display */
  mentions: MentionItem[];
  /** Called when a mention chip is clicked (e.g. navigate to dashboard) */
  onMentionClick?: (mention: MentionItem) => void;
}

/**
 * MessageMentionPreview — read-only mention cards shown in sent messages,
 * matching the visual style of MessageFilePreview.
 */
export const MessageMentionPreview: React.FC<MessageMentionPreviewProps> = ({
  mentions,
  onMentionClick,
}) => {
  if (!mentions || mentions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {mentions.map((mention) => (
        <button
          key={mention.id}
          type="button"
          onClick={() => onMentionClick?.(mention)}
          className="relative flex items-center gap-2.5 p-2 pr-3 rounded-xl border border-gray-200 bg-white shadow-xs max-w-[240px] flex-shrink-0 transition-colors hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
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
        </button>
      ))}
    </div>
  );
};
