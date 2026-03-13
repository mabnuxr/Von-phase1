import React from 'react';
import { ChartBarIcon, XIcon } from '@phosphor-icons/react';
import type { MentionItem } from './types';

export interface MentionStripProps {
  item: MentionItem;
  onRemove: () => void;
}

export const MentionStrip: React.FC<MentionStripProps> = ({ item, onRemove }) => (
  <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1">
    <ChartBarIcon size={14} className="text-indigo-500 shrink-0" />
    <span className="text-sm text-gray-900 truncate">{item.name}</span>
    <button
      type="button"
      onClick={onRemove}
      className="ml-0.5 p-0.5 rounded hover:bg-indigo-100 transition-colors cursor-pointer"
    >
      <XIcon size={12} className="text-gray-500" />
    </button>
  </div>
);
