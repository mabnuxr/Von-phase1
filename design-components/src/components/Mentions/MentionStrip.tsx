import React from 'react';
import { ChartBarIcon, X } from '@phosphor-icons/react';
import type { MentionItem } from './types';
import { AiFieldGlyph } from './AiFieldGlyph';

export interface MentionStripProps {
  item: MentionItem;
  onRemove: () => void;
}

function getChipIcon(item: MentionItem) {
  if (item.type === 'ai_field') {
    return <AiFieldGlyph size={14} className="text-indigo-500 shrink-0" />;
  }
  return <ChartBarIcon size={14} weight="regular" className="text-indigo-500 shrink-0" />;
}

export const MentionStrip: React.FC<MentionStripProps> = ({ item, onRemove }) => {
  return (
    <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1">
      {getChipIcon(item)}
      <span className="text-sm text-gray-900 truncate">{item.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 p-0.5 rounded hover:bg-indigo-100 transition-colors cursor-pointer"
      >
        <X size={12} className="text-gray-500" />
      </button>
    </div>
  );
};
