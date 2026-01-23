import React from 'react';
import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react';
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
// Main Component - Simplified card to encourage data review
// ============================================================================

export const DataTablesCard: React.FC<DataTablesCardProps> = ({ tables, onClick }) => {
  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);
  // Show a sample of records processed (30 per table as a representative sample)
  const sampledRecords = tables.length * 30;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer group"
    >
      <div className="text-left">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-gray-900">Review source data</span>
          <span className="inline-flex items-center px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-medium rounded">
            Needs review
          </span>
        </div>
        <div className="text-[13px] text-gray-500 mt-0.5">
          {tables.length} tables · 30 of 900 records processed. Please review.
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 rounded-xl text-[13px] font-medium text-white group-hover:bg-gray-800 transition-colors">
        <span>Review</span>
        <ArrowRightIcon size={14} weight="bold" />
      </div>
    </button>
  );
};

export default DataTablesCard;
