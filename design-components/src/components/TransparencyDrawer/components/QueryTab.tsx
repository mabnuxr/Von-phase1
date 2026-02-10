import React from 'react';
import type { QueryTabProps } from '../types';
import { useIsTruncated } from '../../../hooks';
import { Tooltip } from '../../Tooltip';

// ============================================================================
// Component
// ============================================================================

/**
 * QueryTab - Pill-shaped navigation button for query selection
 *
 * Features:
 * - Icon + name + row count
 * - Active/inactive styling
 * - Truncates long names with smart tooltip (only shown when text is truncated)
 */
export const QueryTab = React.memo<QueryTabProps>(({ query, isActive, onClick }) => {
  const { ref, isTruncated } = useIsTruncated<HTMLSpanElement>();

  return (
    <Tooltip content={query.name} enabled={isTruncated}>
      <button
        onClick={onClick}
        className={`
          flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full
          transition-colors duration-150 cursor-pointer whitespace-nowrap border
          ${
            isActive
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
          }
        `}
      >
        <span ref={ref} className="truncate max-w-[120px]">
          {query.name}
        </span>
      </button>
    </Tooltip>
  );
});

QueryTab.displayName = 'QueryTab';
