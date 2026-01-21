import React from 'react';
import {
  Database as DatabaseIcon,
  ArrowRight as ArrowRightIcon,
  Eye as EyeIcon,
} from '@phosphor-icons/react';
import type { DataTableConfig } from './DataTablesDrawer';

// ============================================================================
// Types
// ============================================================================

export interface DataTablesCardProps {
  /**
   * Tables to display in the card preview
   */
  tables: DataTableConfig[];
  /**
   * Called when the card is clicked to open the drawer
   */
  onClick: () => void;
}

// ============================================================================
// Main Component - Prominent card to encourage data review
// ============================================================================

export const DataTablesCard: React.FC<DataTablesCardProps> = ({ tables, onClick }) => {
  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-4 py-3 bg-white border border-gray-100 shadow-xs rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 bg-white rounded-lg border border-gray-200 shadow-xs">
          <DatabaseIcon size={18} weight="duotone" className="text-gray-600" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium text-gray-900">
              Review source data
            </span>
            {/* Pulsing badge */}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded animate-pulse">
              Needs review
            </span>
          </div>
          <div className="text-[12px] text-gray-500">
            {tables.length} tables · {totalRows.toLocaleString()} rows queried
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-lg text-[12px] font-medium text-white group-hover:bg-red-700 transition-all duration-200">
        {/* <EyeIcon size={14} weight="bold" /> */}
        <span>Review</span>
        <ArrowRightIcon size={12} weight="bold" />
      </div>
    </button>
  );
};

export default DataTablesCard;
