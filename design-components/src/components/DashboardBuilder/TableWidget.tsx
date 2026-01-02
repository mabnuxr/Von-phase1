import React, { useMemo, useState } from 'react';
import { Table } from 'rsuite';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PencilSimple,
  ArrowsOut,
  DotsThree,
  SortAscending,
  SortDescending,
  Trash,
} from '@phosphor-icons/react';
import type { DashboardWidget, TableWidgetConfig, DataColumn } from './types';
import { mockDataTables } from './mockData';

const { Column, HeaderCell, Cell } = Table;

export interface TableWidgetProps {
  /**
   * Widget configuration
   */
  widget: DashboardWidget;

  /**
   * Callback when widget is clicked
   */
  onClick?: () => void;

  /**
   * Callback when edit is clicked
   */
  onEdit?: () => void;

  /**
   * Callback when expand is clicked
   */
  onExpand?: () => void;

  /**
   * Callback when delete is clicked
   */
  onDelete?: () => void;
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
 * TableWidget - Renders a data table with Von styling
 */
export const TableWidget: React.FC<TableWidgetProps> = ({
  widget,
  onClick,
  onEdit,
  onExpand,
  onDelete,
}) => {
  const config = widget.config as TableWidgetConfig;
  const [showMenu, setShowMenu] = useState(false);

  // Find the data table
  const dataTable = mockDataTables.find((t) => t.id === config.dataTableId);

  const { columns, data } = useMemo(() => {
    if (!dataTable) return { columns: [], data: [] };

    // Filter to visible columns if specified
    const visibleCols = config.visibleColumns
      ? dataTable.columns.filter((c) => config.visibleColumns?.includes(c.key))
      : dataTable.columns;

    // Sort data if specified
    const sortedData = [...dataTable.data] as Record<string, unknown>[];
    if (config.sortBy) {
      const sortKey = config.sortBy;
      sortedData.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null || bVal == null) return 0;
        const comparison =
          (aVal as string | number) > (bVal as string | number)
            ? 1
            : (aVal as string | number) < (bVal as string | number)
              ? -1
              : 0;
        return config.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return { columns: visibleCols, data: sortedData };
  }, [dataTable, config]);

  if (!dataTable) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Table not found</p>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{widget.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{dataTable.rowCount} records</p>
          </div>
          {config.sortBy && (
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {config.sortOrder === 'desc' ? (
                <SortDescending size={12} weight="duotone" />
              ) : (
                <SortAscending size={12} weight="duotone" />
              )}
              Sorted by {config.sortBy}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <PencilSimple size={14} weight="duotone" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand?.();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowsOut size={14} weight="duotone" />
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <DotsThree size={14} weight="bold" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete?.();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash size={14} weight="duotone" />
                      Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table
          data={data}
          autoHeight
          rowHeight={48}
          headerHeight={44}
          bordered={false}
          cellBordered={false}
          hover
        >
          {columns.map((column) => (
            <Column
              key={column.key}
              width={column.type === 'string' ? 150 : 120}
              flexGrow={column.key === 'accountName' ? 1 : 0}
            >
              <HeaderCell>
                <span className="text-xs font-medium text-gray-700">{column.label}</span>
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

                  // Special rendering for churn probability (show as progress bar)
                  if (column.key === 'churnProbability') {
                    const pct = Number(value) * 100;
                    return (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[60px]">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 70
                                ? 'bg-red-500'
                                : pct >= 50
                                  ? 'bg-orange-500'
                                  : 'bg-yellow-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{formattedValue}</span>
                      </div>
                    );
                  }

                  // Special rendering for health score
                  if (column.key === 'healthScore') {
                    const score = Number(value);
                    return (
                      <span
                        className={`font-medium ${
                          score >= 70
                            ? 'text-green-600'
                            : score >= 40
                              ? 'text-yellow-600'
                              : 'text-red-600'
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
    </div>
  );
};

export default TableWidget;
