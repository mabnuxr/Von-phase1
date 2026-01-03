import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  CaretRight,
  CaretDown,
  Database,
  MagnifyingGlass,
  ChartBar,
  ChartLine,
  ChartPie,
  ChartDonut,
  NumberSquareOne,
  Rows,
} from '@phosphor-icons/react';
import type { DataTable, DataViewTab, DragItem } from './types';

export interface DataExplorerProps {
  /**
   * List of data tables
   */
  tables: DataTable[];

  /**
   * Currently selected table ID
   */
  selectedTableId?: string;

  /**
   * Callback when a table is selected
   */
  onTableSelect?: (tableId: string) => void;

  /**
   * Current view mode (data or dashboard)
   */
  viewMode: DataViewTab;

  /**
   * Callback when view mode changes
   */
  onViewModeChange?: (mode: DataViewTab) => void;

  /**
   * Callback when an operation is triggered
   */
  onOperation?: (operation: string, tableId: string) => void;

  /**
   * Callback when a visualization is dragged
   */
  onVisualizationDragStart?: (type: string) => void;
}

const visualizations = [
  { type: 'bar', label: 'Bar Chart', icon: ChartBar },
  { type: 'line', label: 'Line Chart', icon: ChartLine },
  { type: 'pie', label: 'Pie Chart', icon: ChartPie },
  { type: 'donut', label: 'Donut', icon: ChartDonut },
  { type: 'metric', label: 'Metric', icon: NumberSquareOne },
  { type: 'table', label: 'Table', icon: Rows },
];

/**
 * DataExplorer - Left panel showing data tables and visualization palette
 */
export const DataExplorer: React.FC<DataExplorerProps> = ({
  tables,
  selectedTableId,
  onTableSelect,
  viewMode,
  onViewModeChange,
  onVisualizationDragStart,
}) => {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTableExpand = (tableId: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) {
        next.delete(tableId);
      } else {
        next.add(tableId);
      }
      return next;
    });
  };

  const filteredTables = tables.filter(
    (table) =>
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header - Title only */}
      <div className="h-14 px-3 border-b border-gray-200 flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Database size={16} weight="duotone" className="text-gray-500" />
            <span className="text-sm font-medium text-gray-900">
              {viewMode === 'data' ? 'Data Sources' : 'Components'}
            </span>
          </div>
          {/* View Mode Toggle */}
          <button
            onClick={() => onViewModeChange?.(viewMode === 'data' ? 'dashboard' : 'data')}
            className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            {viewMode === 'data' ? 'Dashboard' : 'Data'}
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlass
            size={14}
            weight="duotone"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={viewMode === 'data' ? 'Search tables...' : 'Search components...'}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'data' ? (
          /* Data Tables List */
          <div className="p-2">
            {filteredTables.map((table) => {
              const isExpanded = expandedTables.has(table.id);
              const isSelected = table.id === selectedTableId;

              return (
                <div key={table.id} className="mb-0.5">
                  {/* Table Row */}
                  <div
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onTableSelect?.(table.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTableExpand(table.id);
                      }}
                      className="p-0.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <CaretDown size={12} weight="bold" className="text-gray-400" />
                      ) : (
                        <CaretRight size={12} weight="bold" className="text-gray-400" />
                      )}
                    </button>

                    <Table size={14} weight="duotone" className="text-gray-400 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{table.name}</p>
                    </div>

                    <span className="text-[10px] text-gray-400">{table.rowCount}</span>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-6 pl-3 border-l border-gray-100 py-1.5">
                          {/* Columns Preview */}
                          <div className="flex flex-wrap gap-1">
                            {table.columns.slice(0, 5).map((col) => (
                              <span
                                key={col.key}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                              >
                                {col.label}
                              </span>
                            ))}
                            {table.columns.length > 5 && (
                              <span className="text-[10px] text-gray-400">
                                +{table.columns.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          /* Visualization Palette */
          <>
            {/* Drag to add section */}
            <div className="px-3 py-2 border-b border-gray-200">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                Drag to add
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {visualizations.map((viz) => {
                  const Icon = viz.icon;
                  return (
                    <div
                      key={viz.type}
                      draggable
                      onDragStart={(e) => {
                        const dragData: DragItem = {
                          type: 'visualization',
                          visualizationType: viz.type as DragItem['visualizationType'],
                        };
                        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                        e.dataTransfer.effectAllowed = 'copy';
                        onVisualizationDragStart?.(viz.type);
                      }}
                      className="flex flex-col items-center gap-1 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
                    >
                      <Icon size={20} weight="duotone" className="text-gray-500" />
                      <span className="text-[10px] text-gray-600">{viz.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tables Section */}
            <div className="p-2">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">
                Tables
              </p>
              {tables.slice(0, 3).map((table) => (
                <div
                  key={table.id}
                  draggable
                  onDragStart={(e) => {
                    const dragData: DragItem = {
                      type: 'table',
                      visualizationType: 'table',
                      tableId: table.id,
                      tableName: table.name,
                    };
                    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-grab active:cursor-grabbing"
                >
                  <Table size={12} weight="duotone" className="text-gray-400" />
                  <span className="text-xs text-gray-600 truncate">{table.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataExplorer;
