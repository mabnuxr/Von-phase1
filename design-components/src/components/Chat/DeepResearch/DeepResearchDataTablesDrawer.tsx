import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X as XIcon, Database as DatabaseIcon } from '@phosphor-icons/react';
import { ReportTable } from '../../ReportTable';
import type { ReportColumn, AIReasoningData } from '../../ReportTable/ReportTable';
import { useHorizontalResize, useDynamicPageSize } from '../../ArtifactViewer/hooks';

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

export interface DeepResearchDataTablesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tables: DataTableConfig[];
  title?: string;
  /** Total records count for display in header */
  totalRecords?: number;
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
        px-4 py-1.5 text-[13px] font-medium rounded-full
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

/**
 * DeepResearchDataTablesDrawer - Drawer for viewing IQ artifact data tables
 *
 * This is a simplified version of the DataTablesDrawer specifically for
 * Deep Research mode. Key differences:
 * - No search bar
 * - No filter functionality
 * - No row selection in the table
 * - Uses ReportTable with showRowActions=false
 */
export const DeepResearchDataTablesDrawer: React.FC<DeepResearchDataTablesDrawerProps> = ({
  isOpen,
  onClose,
  tables,
  title = 'Data Reference',
  totalRecords,
}) => {
  const [activeTableId, setActiveTableId] = useState<string>(tables[0]?.id || '');

  const activeTable = useMemo(
    () => tables.find((t) => t.id === activeTableId) || tables[0],
    [tables, activeTableId]
  );

  // Update active table when tables change
  React.useEffect(() => {
    if (tables.length > 0 && !tables.find((t) => t.id === activeTableId)) {
      setActiveTableId(tables[0].id);
    }
  }, [tables, activeTableId]);

  const handleSelectTable = useCallback((tableId: string) => {
    setActiveTableId(tableId);
  }, []);

  // Calculate display stats
  const displayedRows = activeTable?.data?.length ?? 0;
  const totalRows = totalRecords ?? tables.reduce((sum, t) => sum + t.rowCount, 0);

  // Horizontal resize functionality
  const { width, handleProps } = useHorizontalResize({
    initialWidth: 900,
    minWidth: 500,
    storageKey: 'deep-research-data-tables-drawer-width',
  });

  // Dynamic page size based on container height
  const { rowsPerPage, containerRef } = useDynamicPageSize({
    additionalOverhead: 0, // No query section in this drawer
  });

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
            style={{ width: `${width}px` }}
            className="fixed right-0 top-0 h-full max-w-[95vw] pr-2 py-2 z-[9999]"
          >
            {/* Resize Handle */}
            <div
              {...handleProps}
              className="absolute left-0 top-0 bottom-0 w-3 z-10 cursor-ew-resize"
            />

            <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-100">
                    <DatabaseIcon size={16} weight="duotone" className="text-gray-600" />
                  </div>
                  <h2 className="text-[15px] font-medium text-gray-900">{title}</h2>
                  <span className="text-[13px] text-gray-500">·</span>
                  <span className="text-[13px] text-gray-500">
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

              {/* Table Tabs - Always shown for consistency */}
              {tables.length > 0 && (
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
                        onClick={() => handleSelectTable(table.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Table Content - Using ReportTable without row actions */}
              <div ref={containerRef} className="flex-1 overflow-hidden">
                {activeTable ? (
                  <ReportTable
                    columns={activeTable.columns}
                    data={activeTable.data}
                    pageSize={rowsPerPage}
                    showPagination={true}
                    aiReasoningKey="_aiReasoning"
                    nameKey="name"
                    showRowActions={false}
                    frozenColumns={1}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <DatabaseIcon size={48} weight="duotone" className="text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No data tables available</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeepResearchDataTablesDrawer;
