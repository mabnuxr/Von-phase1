import React from 'react';
import type { QueryTabProps } from '../types';

// ============================================================================
// Component
// ============================================================================

/**
 * QueryTab - Pill-shaped navigation button for query selection
 *
 * Features:
 * - Icon + name + row count
 * - Active/inactive styling
 * - Truncates long names
 */
export const QueryTab = React.memo<QueryTabProps>(({ query, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full
        transition-colors duration-150 cursor-pointer whitespace-nowrap border
        ${
          isActive
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      <span className="truncate max-w-[120px]">{query.name}</span>
    </button>
  );
});

QueryTab.displayName = 'QueryTab';
