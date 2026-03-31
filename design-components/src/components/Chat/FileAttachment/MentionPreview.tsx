import React from 'react';
import { X, ChalkboardTeacher, Chalkboard } from '@phosphor-icons/react';
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
 * MentionPreview component — small rounded chip with chalkboard icon
 */
export const MentionPreview: React.FC<MentionPreviewProps> = ({
  mention,
  onRemove,
  removable = true,
}) => {
  const Icon = mention.dashboardVariant === 'user' ? ChalkboardTeacher : Chalkboard;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-sm text-gray-800 transition-colors duration-150 hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs flex-shrink-0">
      <Icon size={14} weight="regular" className="text-gray-800 flex-shrink-0" />
      <span className="truncate max-w-[160px]" title={mention.name}>
        {mention.name}
      </span>
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(mention.id);
          }}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full hover:bg-gray-200 hover:cursor-pointer transition-colors"
          aria-label={`Remove ${mention.name}`}
        >
          <X size={12} weight="bold" className="text-gray-700" />
        </button>
      )}
    </div>
  );
};
