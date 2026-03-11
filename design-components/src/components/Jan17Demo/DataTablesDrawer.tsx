import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X as XIcon,
  Database as DatabaseIcon,
  MagnifyingGlass as MagnifyingGlassIcon,
} from '@phosphor-icons/react';
import { ReportTable, buildGridOptions } from '../ReportTable';
import type { ReportColumn, AIReasoningData } from '../ReportTable/ReportTable';
import { FilterButton, type FilterGroup, type FilterField } from '../forms/filter';

// ============================================================================
// Types
// ============================================================================

export interface DataTableConfig {
  id: string;
  name: string;
  description: string;
  columns: ReportColumn[];
  data: Record<string, unknown>[];
  aiReasoningData?: Record<string, AIReasoningData>;
  rowCount: number;
}

export interface DataTablesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tables: DataTableConfig[];
  title?: string;
}

// ============================================================================
// Table Tab Component
// ============================================================================

interface TableTabProps {
  table: DataTableConfig;
  isActive: boolean;
  onClick: () => void;
}

const TableTab: React.FC<TableTabProps> = ({ table, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-1.5 text-sm font-medium rounded-full
        transition-colors duration-150 cursor-pointer whitespace-nowrap border
        ${
          isActive
            ? 'bg-green-50 text-gray-900 border-green-300'
            : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      {table.name}
    </button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

// Default pre-applied filters for each table type
const getDefaultFiltersForTable = (tableId: string): FilterGroup[] => {
  switch (tableId) {
    case 'opportunities':
      return [
        {
          id: 'opp-filter-1',
          conditions: [
            { id: 'opp-cond-1', field: 'stage', operator: 'contains', value: 'Negotiation' },
            { id: 'opp-cond-2', field: 'amount', operator: 'greater_than', value: '100000' },
          ],
          connector: 'and',
        },
      ];
    case 'gong-calls':
      return [
        {
          id: 'gong-filter-1',
          conditions: [
            { id: 'gong-cond-1', field: 'sentiment', operator: 'equals', value: 'Positive' },
          ],
          connector: 'and',
        },
      ];
    case 'emails':
      return [
        {
          id: 'email-filter-1',
          conditions: [
            { id: 'email-cond-1', field: 'status', operator: 'equals', value: 'Replied' },
          ],
          connector: 'and',
        },
      ];
    case 'accounts':
      return [
        {
          id: 'account-filter-1',
          conditions: [
            { id: 'account-cond-1', field: 'healthScore', operator: 'greater_than', value: '70' },
          ],
          connector: 'and',
        },
      ];
    default:
      return [
        {
          id: 'default',
          conditions: [{ id: 'cond1', field: '', operator: 'contains', value: '' }],
          connector: 'and',
        },
      ];
  }
};

export const DataTablesDrawer: React.FC<DataTablesDrawerProps> = ({
  isOpen,
  onClose,
  tables,
  title = 'Data Reference',
}) => {
  const [activeTableId, setActiveTableId] = useState<string>(tables[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Store filters per table - initialized with pre-applied filters
  const [filterGroupsByTable, setFilterGroupsByTable] = useState<Record<string, FilterGroup[]>>(
    () => {
      const initial: Record<string, FilterGroup[]> = {};
      tables.forEach((table) => {
        initial[table.id] = getDefaultFiltersForTable(table.id);
      });
      return initial;
    }
  );

  // Get current table's filter groups
  const filterGroups =
    filterGroupsByTable[activeTableId] || getDefaultFiltersForTable(activeTableId);

  // Update filter groups for current table
  const setFilterGroups = (groups: FilterGroup[]) => {
    setFilterGroupsByTable((prev) => ({
      ...prev,
      [activeTableId]: groups,
    }));
  };

  const activeTable = tables.find((t) => t.id === activeTableId);

  // Convert columns to filter fields
  const filterFields: FilterField[] = useMemo(() => {
    if (!activeTable) return [];
    return activeTable.columns.map((col) => ({
      value: col.id,
      label: col.label,
      type:
        col.type === 'number' || col.type === 'currency' || col.type === 'percentage'
          ? 'number'
          : col.type === 'date'
            ? 'date'
            : 'text',
    }));
  }, [activeTable]);

  // Filter data based on search query and filter groups
  const filteredData = useMemo(() => {
    if (!activeTable) return [];

    let result = [...activeTable.data];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) => {
        return Object.values(row).some((value) => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    // Apply filter groups
    filterGroups.forEach((group) => {
      group.conditions.forEach((condition) => {
        if (!condition.field || !condition.value) return;

        result = result.filter((row) => {
          const value = row[condition.field];
          if (value === null || value === undefined) return false;

          const strValue = String(value).toLowerCase();
          const filterValue = condition.value.toLowerCase();

          switch (condition.operator) {
            case 'equals':
              return strValue === filterValue;
            case 'not_equals':
              return strValue !== filterValue;
            case 'contains':
              return strValue.includes(filterValue);
            case 'not_contains':
              return !strValue.includes(filterValue);
            case 'starts_with':
              return strValue.startsWith(filterValue);
            case 'ends_with':
              return strValue.endsWith(filterValue);
            case 'greater_than':
              return Number(value) > Number(condition.value);
            case 'less_than':
              return Number(value) < Number(condition.value);
            case 'greater_or_equal':
              return Number(value) >= Number(condition.value);
            case 'less_or_equal':
              return Number(value) <= Number(condition.value);
            case 'is_null':
              return value === null || value === undefined || value === '';
            case 'is_not_null':
              return value !== null && value !== undefined && value !== '';
            default:
              return strValue.includes(filterValue);
          }
        });
      });
    });

    return result;
  }, [activeTable, searchQuery, filterGroups]);

  // Reset search when switching tables
  React.useEffect(() => {
    setSearchQuery('');
  }, [activeTableId]);

  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);
  const displayedRows = Math.min(30, filteredData.length);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-[9998]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 h-full w-[900px] max-w-[95vw] pr-2 py-2 z-[9999]"
          >
            <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-100">
                    <DatabaseIcon size={16} weight="duotone" className="text-gray-600" />
                  </div>
                  <h2 className="text-sm font-medium text-gray-900">{title}</h2>
                  <span className="text-sm text-gray-500">·</span>
                  <span className="text-sm text-gray-500">
                    Showing {displayedRows} of {totalRows.toLocaleString()} records
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <XIcon size={18} weight="bold" />
                </button>
              </div>

              {/* Table Tabs */}
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <div
                  className="flex items-center gap-2 overflow-x-auto"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {tables.map((table) => (
                    <TableTab
                      key={table.id}
                      table={table}
                      isActive={table.id === activeTableId}
                      onClick={() => setActiveTableId(table.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  {/* Search Bar - Left */}
                  <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlassIcon
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 bg-white border border-gray-100 rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-shadow"
                    />
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Filter Button */}
                  <FilterButton
                    fields={filterFields}
                    groups={filterGroups}
                    onGroupsChange={setFilterGroups}
                    showAIPrompt={true}
                    aiPromptPlaceholder="e.g., Deals > $100K in West region"
                  />
                </div>
              </div>

              {/* Table Content - Using ReportTable */}
              <div className="flex-1 overflow-hidden">
                {activeTable && (
                  <ReportTable
                    options={buildGridOptions(
                      activeTable.columns,
                      filteredData.slice(0, 30) as Record<string, unknown>[],
                      {
                        pageSize: 25,
                        showPagination: filteredData.length > 25,
                      }
                    )}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DataTablesDrawer;
