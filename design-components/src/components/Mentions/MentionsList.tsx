import React, { useEffect, useRef } from 'react';
import { ChartBar } from '@phosphor-icons/react';
import type { MentionItem } from './types';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MentionItemRowProps {
  item: MentionItem;
  onSelect: (item: MentionItem) => void;
  onMouseEnter?: () => void;
  isHighlighted?: boolean;
}

const MentionItemRow: React.FC<MentionItemRowProps> = ({
  item,
  onSelect,
  onMouseEnter,
  isHighlighted,
}) => (
  <div
    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors cursor-pointer border border-transparent hover:bg-gray-100 ${isHighlighted ? 'bg-gray-100' : ''}`}
    onClick={() => onSelect(item)}
    onMouseEnter={onMouseEnter}
  >
    <ChartBar size={16} className="text-gray-400 shrink-0" />
    <span className="text-sm text-gray-900 truncate">{item.name}</span>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="px-4 py-8 text-sm text-gray-500 text-center">No dashboards found.</div>
);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface MentionsListProps {
  items: MentionItem[];
  isLoading: boolean;
  onSelect: (item: MentionItem) => void;
  maxHeight?: number;
  highlightedIndex?: number;
  onHoverIndex?: (index: number) => void;
}

export const MentionsList: React.FC<MentionsListProps> = ({
  items,
  isLoading,
  onSelect,
  maxHeight = 300,
  highlightedIndex = -1,
  onHoverIndex,
}) => {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  if (isLoading && items.length === 0) {
    return (
      <div className="w-full max-w-xs bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-8 text-sm text-gray-400 text-center">
        Loading dashboards…
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs bg-white border border-gray-100 shadow-sm overflow-hidden rounded-xl">
      <div className="overflow-y-auto px-1.5 py-2 flex flex-col gap-0.5" style={{ maxHeight }}>
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
            >
              <MentionItemRow
                item={item}
                onSelect={onSelect}
                onMouseEnter={() => onHoverIndex?.(index)}
                isHighlighted={index === highlightedIndex}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
