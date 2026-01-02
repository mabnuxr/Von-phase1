import React, { useState, useMemo } from 'react';
import { Table } from 'rsuite';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Funnel,
  SortAscending,
  SortDescending,
  MagnifyingGlass,
  X,
  GitMerge,
  Download,
  CaretUpDown,
} from '@phosphor-icons/react';
import type { DataTable, DataColumn } from './types';

const { Column, HeaderCell, Cell } = Table;

export interface TableViewerProps {
  /**
   * The data table to display
   */
  table: DataTable;

  /**
   * Callback when a column operation is triggered
   */
  onColumnOperation?: (operation: string, columnKey: string) => void;

  /**
   * Callback when export is clicked
   */
  onExport?: () => void;

  /**
   * Current view mode
   */
  viewMode?: 'data' | 'dashboard';

  /**
   * Callback when view mode changes
   */
  onViewModeChange?: (mode: 'data' | 'dashboard') => void;

  /**
   * Callback when filter is applied
   */
  onFilterApply?: (filters: Record<string, string>) => void;
}

// Format cell value based on column type
const formatCellValue = (value: unknown, column: DataColumn): string => {
  if (value === null || value === undefined) return '-';

  switch (column.type) {
    case 'currency': {
      const numVal = Number(value);
      if (numVal >= 1000000) return `$${(numVal / 1000000).toFixed(2)}M`;
      if (numVal >= 1000) return `$${(numVal / 1000).toFixed(0)}K`;
      return `$${numVal.toLocaleString()}`;
    }

    case 'percentage': {
      const pctVal = Number(value);
      if (pctVal <= 1) return `${(pctVal * 100).toFixed(0)}%`;
      return `${pctVal.toFixed(0)}%`;
    }

    case 'number':
      return Number(value).toLocaleString();

    case 'boolean':
      return value ? 'Yes' : 'No';

    case 'date':
      return new Date(String(value)).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    default:
      return String(value);
  }
};

// Get risk level badge styles
const getRiskBadgeStyles = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

/**
 * TableViewer - Full-featured table view with operations
 */
export const TableViewer: React.FC<TableViewerProps> = ({
  table,
  onColumnOperation,
  onExport,
  viewMode = 'data',
  onViewModeChange,
  onFilterApply,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showMergePopover, setShowMergePopover] = useState(false);
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...table.data] as Record<string, unknown>[];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (sortColumn) {
      const sortKey = sortColumn;
      filtered.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null || bVal == null) return 0;
        const comparison = (aVal as string | number) > (bVal as string | number) ? 1 : (aVal as string | number) < (bVal as string | number) ? -1 : 0;
        return sortType === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [table.data, searchQuery, sortColumn, sortType]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortType(sortType === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortType('asc');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header Row 1: Data/Dashboard toggle + Table name */}
      <div className="h-14 px-4 border-b border-gray-200 flex items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => onViewModeChange?.('data')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all cursor-pointer ${
                viewMode === 'data'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Data
            </button>
            <button
              onClick={() => onViewModeChange?.('dashboard')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all cursor-pointer ${
                viewMode === 'dashboard'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </button>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <h2 className="text-sm font-medium text-gray-900">{table.name}</h2>
        </div>
      </div>

      {/* Header Row 2: Search + Operations (Merge, Filter, Export) */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass
              size={14}
              weight="duotone"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all columns..."
              className="w-full pl-9 pr-8 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          <div className="flex-1" />

          {/* Table Operations - far right */}
          <div className="relative flex items-center gap-1.5">
            <button
              onClick={() => setShowMergePopover(!showMergePopover)}
              className="flex items-center gap-1 text-xs px-2 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition-colors cursor-pointer"
            >
              <GitMerge size={12} weight="duotone" />
              Merge
            </button>
            <button
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className="flex items-center gap-1 text-xs px-2 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition-colors cursor-pointer"
            >
              <Funnel size={12} weight="duotone" />
              Filter
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-1 text-xs px-2 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition-colors cursor-pointer"
            >
              <Download size={12} weight="duotone" />
              Export
            </button>

            {/* Filter Popover */}
            <AnimatePresence>
              {showFilterPopover && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-900">Add Filter</span>
                    <button
                      onClick={() => setShowFilterPopover(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <select
                      value={filterColumn}
                      onChange={(e) => setFilterColumn(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                    >
                      <option value="">Select column...</option>
                      {table.columns.map((col) => (
                        <option key={col.key} value={col.key}>{col.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder="Filter value..."
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                    <button
                      onClick={() => {
                        if (filterColumn && filterValue) {
                          onFilterApply?.({ [filterColumn]: filterValue });
                          setShowFilterPopover(false);
                        }
                      }}
                      className="w-full py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg cursor-pointer"
                    >
                      Apply Filter
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Merge Popover */}
            <AnimatePresence>
              {showMergePopover && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-900">Merge Tables</span>
                    <button
                      onClick={() => setShowMergePopover(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <select className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300">
                      <option value="">Select table to merge...</option>
                      <option value="accounts">Accounts at Risk</option>
                      <option value="engagement">Engagement Timeline</option>
                      <option value="risk">Risk by Region</option>
                    </select>
                    <select className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300">
                      <option value="">Select join column...</option>
                      {table.columns.map((col) => (
                        <option key={col.key} value={col.key}>{col.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        onColumnOperation?.('merge', '');
                        setShowMergePopover(false);
                      }}
                      className="w-full py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg cursor-pointer"
                    >
                      Merge Tables
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table
          data={processedData}
          autoHeight={false}
          height={500}
          rowHeight={48}
          headerHeight={52}
          bordered={false}
          cellBordered={false}
          hover
        >
          {table.columns.map((column) => (
            <Column
              key={column.key}
              width={column.type === 'string' ? 160 : 130}
              flexGrow={column.key === 'accountName' ? 1 : 0}
            >
              <HeaderCell>
                <div
                  className="flex items-center gap-1.5 cursor-pointer select-none group"
                  onClick={() => handleSort(column.key)}
                >
                  <span className="text-xs font-medium text-gray-700">
                    {column.label}
                  </span>

                  {/* Sort indicator */}
                  {sortColumn === column.key ? (
                    sortType === 'asc' ? (
                      <SortAscending size={12} weight="bold" className="text-gray-700 flex-shrink-0" />
                    ) : (
                      <SortDescending size={12} weight="bold" className="text-gray-700 flex-shrink-0" />
                    )
                  ) : (
                    <CaretUpDown size={12} weight="bold" className="text-gray-500 flex-shrink-0 group-hover:text-gray-700 transition-colors" />
                  )}
                </div>
              </HeaderCell>
              <Cell dataKey={column.key}>
                {(rowData: Record<string, unknown>) => {
                  const value = rowData[column.key];
                  const formattedValue = formatCellValue(value, column);

                  // Special rendering for risk level
                  if (column.key === 'riskLevel') {
                    return (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${getRiskBadgeStyles(String(value))}`}
                      >
                        {formattedValue}
                      </span>
                    );
                  }

                  // Special rendering for churn probability
                  if (column.key === 'churnProbability') {
                    const pct = Number(value) * 100;
                    return (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[60px]">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 70 ? 'bg-red-500' : pct >= 50 ? 'bg-orange-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">{formattedValue}</span>
                      </div>
                    );
                  }

                  // Special rendering for health score
                  if (column.key === 'healthScore') {
                    const score = Number(value);
                    return (
                      <span
                        className={`font-medium ${
                          score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}
                      >
                        {formattedValue}
                      </span>
                    );
                  }

                  return <span className="text-sm text-gray-900">{formattedValue}</span>;
                }}
              </Cell>
            </Column>
          ))}
        </Table>
      </div>

      {/* Footer with row count */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          {processedData.length} of {table.rowCount} rows
        </div>
      </div>
    </div>
  );
};

export default TableViewer;
