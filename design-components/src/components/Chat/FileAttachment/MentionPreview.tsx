import React, { useState } from 'react';
import { X, ChartBar } from '@phosphor-icons/react';
import type { MentionItem } from '../../Mentions/types';

export interface MentionPreviewProps {
  /** The mention item to preview */
  mention: MentionItem;
  /** Callback when remove button is clicked */
  onRemove?: (id: string) => void;
  /** Whether the preview is removable */
  removable?: boolean;
}

/**
 * MentionPreview component — card-style mention chip matching FilePreview visual
 */
export const MentionPreview: React.FC<MentionPreviewProps> = ({
  mention,
  onRemove,
  removable = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative flex items-center gap-2.5 p-2 pr-3 rounded-xl border border-gray-200 bg-white shadow-xs max-w-[240px] flex-shrink-0 transition-colors duration-150 cursor-pointer ${
        isHovered ? 'bg-gray-50/50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dashboard icon */}
      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <ChartBar size={18} weight="duotone" className="text-indigo-600" />
      </div>

      {/* Dashboard name — truncated */}
      <span className="text-[13px] font-medium text-gray-800 truncate min-w-0" title={mention.name}>
        {mention.name}
      </span>

      {/* X icon — shown on hover */}
      {removable && isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(mention.id);
          }}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 hover:cursor-pointer transition-colors ml-auto"
          aria-label={`Remove ${mention.name}`}
        >
          <X size={12} weight="bold" className="text-gray-800" />
        </button>
      )}
    </div>
  );
};
