import React, { useEffect, useRef } from 'react';
import { ChartBarIcon, ColumnsIcon } from '@phosphor-icons/react';
import type { MentionItem } from './types';
import { Tooltip } from '../Tooltip';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMentionIcon(item: MentionItem) {
  if (item.type === 'ai_field') {
    return <ColumnsIcon size={16} weight="fill" className="text-gray-500 flex-shrink-0" />;
  }
  return <ChartBarIcon size={16} weight="regular" className="text-gray-800 flex-shrink-0" />;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MentionItemRowProps {
  item: MentionItem;
  onSelect: (item: MentionItem) => void;
  onMouseEnter?: () => void;
  isHighlighted?: boolean;
  disabled?: boolean;
  disabledTooltip?: string;
}

const MentionItemRow: React.FC<MentionItemRowProps> = ({
  item,
  onSelect,
  onMouseEnter,
  isHighlighted,
  disabled,
  disabledTooltip,
}) => (
  <Tooltip
    content={disabledTooltip}
    enabled={!!disabled && !!disabledTooltip}
    wrapperClassName="w-full"
  >
    <div
      className={`flex items-center gap-2.5 px-2 h-8 rounded-xl border border-transparent transition-colors duration-150 w-full ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : `cursor-pointer hover:bg-gray-50 hover:border-gray-200 hover:shadow-xs ${
              isHighlighted ? 'bg-gray-50 border-gray-200 shadow-xs' : ''
            }`
      }`}
      onClick={disabled ? undefined : () => onSelect(item)}
      onMouseEnter={disabled ? undefined : onMouseEnter}
    >
      {getMentionIcon(item)}
      <span className="text-sm text-gray-800 truncate">{item.name}</span>
    </div>
  </Tooltip>
);

const SKELETON_WIDTHS = [100, 72, 120, 88, 64];

const SkeletonRow: React.FC<{ index: number }> = ({ index }) => (
  <div className="flex items-center gap-2.5 px-2 h-8">
    <div className="w-4 h-4 rounded bg-gray-100 animate-pulse flex-shrink-0" />
    <div
      className="h-3.5 rounded bg-gray-100 animate-pulse"
      style={{ width: `${SKELETON_WIDTHS[index % SKELETON_WIDTHS.length]}px` }}
    />
  </div>
);

const SkeletonLoading: React.FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <SkeletonRow key={i} index={i} />
    ))}
  </>
);

const EmptyState: React.FC = () => (
  <div className="px-4 py-8 text-sm text-gray-500 text-center">No results found.</div>
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
  /** When true, all items are shown in a disabled state */
  disabled?: boolean;
  /** Tooltip shown on disabled items */
  disabledTooltip?: string;
}

export const MentionsList: React.FC<MentionsListProps> = ({
  items,
  isLoading,
  onSelect,
  maxHeight = 300,
  highlightedIndex = -1,
  onHoverIndex,
  disabled,
  disabledTooltip,
}) => {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  return (
    <div className="w-full max-w-xs bg-white border border-gray-100 shadow-sm overflow-hidden rounded-xl">
      <div className="overflow-y-auto px-1.5 py-1.5 flex flex-col gap-0.5" style={{ maxHeight }}>
        {isLoading && items.length === 0 ? (
          <SkeletonLoading />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((item, index) => {
            const prevItem = items[index - 1];
            const showCurrentHeader = item.isCurrent && index === 0;
            const isDashboard = item.type === 'dashboard';
            const isAiField = item.type === 'ai_field';
            const prevIsAiField = prevItem?.type === 'ai_field';
            const showOthersHeader =
              isDashboard && !item.isCurrent && (index === 0 || prevItem?.isCurrent);
            const showAiFieldsHeader = isAiField && !prevIsAiField;
            return (
              <React.Fragment key={item.id}>
                {showCurrentHeader && (
                  <div className="px-2 py-1 text-xs font-medium text-gray-500">
                    Currently viewing
                  </div>
                )}
                {showOthersHeader && (
                  <>
                    {index > 0 && <div className="mx-2 border-t border-gray-100" />}
                    <div className="px-2 py-1 text-xs font-medium text-gray-500">Dashboards</div>
                  </>
                )}
                {showAiFieldsHeader && (
                  <>
                    {index > 0 && <div className="mx-2 border-t border-gray-100" />}
                    <div className="px-2 py-1 text-xs font-medium text-gray-500">AI Fields</div>
                  </>
                )}
                <div
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                >
                  <MentionItemRow
                    item={item}
                    onSelect={onSelect}
                    onMouseEnter={() => onHoverIndex?.(index)}
                    isHighlighted={index === highlightedIndex}
                    disabled={disabled}
                    disabledTooltip={disabledTooltip}
                  />
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
