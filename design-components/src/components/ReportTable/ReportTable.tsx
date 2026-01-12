import React, { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
  type Row,
  type ColumnSizingState,
  type PaginationState,
} from '@tanstack/react-table';
import { CaretUp, CaretDown, ArrowSquareOut, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { TertiaryIconButton, SecondaryIconButton } from '../forms/buttons/IconButtons';
import { LOGO_STATIC_URL } from '../../constants';

// ============================================================================
// Types
// ============================================================================

export type ColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'boolean'
  | 'email'
  | 'phone'
  | 'url'
  | 'picklist';

export interface ReportColumn {
  /**
   * Unique identifier for the column (maps to data key)
   */
  id: string;
  /**
   * Display label for the column header
   */
  label: string;
  /**
   * Data type for formatting
   */
  type: ColumnType;
  /**
   * Whether this is an AI-generated column (Von IQ)
   */
  isAI?: boolean;
  /**
   * Whether sorting is enabled for this column
   * @default true
   */
  sortable?: boolean;
  /**
   * Column width (optional)
   */
  width?: number;
  /**
   * Minimum column width
   */
  minWidth?: number;
}

export interface ReportTableProps<TData extends Record<string, unknown>> {
  /**
   * Column definitions
   */
  columns: ReportColumn[];
  /**
   * Table data
   */
  data: TData[];
  /**
   * Called when a row is selected via checkbox
   */
  onRowSelect?: (row: TData, selected: boolean) => void;
  /**
   * Called when the open action is clicked on a row
   */
  onRowOpen?: (row: TData) => void;
  /**
   * Currently selected row IDs
   */
  selectedRows?: string[];
  /**
   * Key to use for row identification
   * @default 'id'
   */
  rowIdKey?: string;
  /**
   * Additional class name
   */
  className?: string;
  /**
   * Whether to show loading state
   */
  isLoading?: boolean;
  /**
   * Empty state message
   */
  emptyMessage?: string;
  /**
   * Number of rows per page
   * @default 10
   */
  pageSize?: number;
  /**
   * Whether to show pagination
   * @default true
   */
  showPagination?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

const formatValue = (value: unknown, type: ColumnType): string => {
  if (value === null || value === undefined) return '—';

  switch (type) {
    case 'currency':
      return typeof value === 'number'
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)
        : String(value);

    case 'percentage':
      return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : `${value}%`;

    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);

    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime())
          ? value
          : date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
      }
      return String(value);

    case 'boolean':
      return value ? 'Yes' : 'No';

    case 'email':
    case 'phone':
    case 'url':
    case 'text':
    case 'picklist':
    default:
      return String(value);
  }
};

// ============================================================================
// Sub-components
// ============================================================================

interface SortIndicatorProps {
  direction: 'asc' | 'desc' | false;
}

const SortIndicator: React.FC<SortIndicatorProps> = ({ direction }) => {
  return (
    <div className="flex flex-col items-center -space-y-1">
      <CaretUp
        size={10}
        weight="fill"
        className={direction === 'asc' ? 'text-gray-900' : 'text-gray-300'}
      />
      <CaretDown
        size={10}
        weight="fill"
        className={direction === 'desc' ? 'text-gray-900' : 'text-gray-300'}
      />
    </div>
  );
};

interface VonIconProps {
  size?: number;
  className?: string;
}

const VonIcon: React.FC<VonIconProps> = ({ size = 14, className = '' }) => {
  return (
    <img
      src={LOGO_STATIC_URL}
      alt="Von"
      style={{ width: size, height: size }}
      className={`rounded-sm ${className}`}
    />
  );
};

interface ActionsCellProps<TData extends Record<string, unknown>> {
  row: Row<TData>;
  isHovered: boolean;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onOpen: () => void;
}

function ActionsCell<TData extends Record<string, unknown>>({
  isHovered,
  isSelected,
  onSelect,
  onOpen,
}: ActionsCellProps<TData>) {
  const showActions = isHovered || isSelected;

  return (
    <div
      className={`flex items-center gap-1 transition-opacity duration-150 ${showActions ? 'opacity-100' : 'opacity-0'}`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onSelect(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 focus:ring-offset-0 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />
      <TertiaryIconButton
        icon={<ArrowSquareOut size={14} />}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        title="Open"
        size="small"
      />
    </div>
  );
}

interface ColumnResizerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

const ColumnResizer: React.FC<ColumnResizerProps> = ({ onMouseDown, isResizing }) => {
  return (
    <div
      onMouseDown={onMouseDown}
      className={`
        absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none
        hover:bg-gray-300 transition-colors
        ${isResizing ? 'bg-gray-400' : 'bg-transparent'}
      `}
      style={{ transform: 'translateX(50%)' }}
    />
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function ReportTable<TData extends Record<string, unknown>>({
  columns,
  data,
  onRowSelect,
  onRowOpen,
  selectedRows = [],
  rowIdKey = 'id',
  className = '',
  isLoading = false,
  emptyMessage = 'No data available',
  pageSize = 10,
  showPagination = true,
}: ReportTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const columnHelper = createColumnHelper<TData>();

  // Default column sizes
  const defaultColumnSizes: Record<string, number> = useMemo(() => {
    const sizes: Record<string, number> = { _actions: 60 };
    columns.forEach((col) => {
      sizes[col.id] = col.width ?? col.minWidth ?? 150;
    });
    return sizes;
  }, [columns]);

  const tableColumns = useMemo((): ColumnDef<TData>[] => {
    const cols: ColumnDef<TData>[] = [
      // Actions column (always first)
      columnHelper.display({
        id: '_actions',
        header: () => null,
        cell: ({ row }) => {
          const rowId = String(row.original[rowIdKey as keyof TData] ?? row.index);
          const isHovered = hoveredRowId === rowId;
          const isSelected = selectedRows.includes(rowId);

          return (
            <ActionsCell
              row={row}
              isHovered={isHovered}
              isSelected={isSelected}
              onSelect={(selected) => onRowSelect?.(row.original, selected)}
              onOpen={() => onRowOpen?.(row.original)}
            />
          );
        },
        size: 60,
        minSize: 60,
        maxSize: 60,
        enableResizing: false,
      }),
      // Data columns
      ...columns.map((col): ColumnDef<TData> =>
        columnHelper.accessor((row: TData) => row[col.id as keyof TData] as unknown, {
          id: col.id,
          header: () => (
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-1.5">
                {col.isAI && <VonIcon size={14} />}
                <span
                  className={
                    col.isAI
                      ? 'bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent'
                      : ''
                  }
                >
                  {col.label}
                </span>
              </div>
            </div>
          ),
          cell: (info) => {
            const value = info.getValue();
            const formattedValue = formatValue(value, col.type);

            return <span className="text-gray-900">{formattedValue}</span>;
          },
          size: col.width ?? 150,
          minSize: col.minWidth ?? 80,
          enableSorting: col.sortable !== false,
          enableResizing: true,
        })
      ),
    ];

    return cols;
  }, [columns, columnHelper, hoveredRowId, selectedRows, rowIdKey, onRowSelect, onRowOpen]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnSizing, pagination },
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
  });

  // Handle column resize
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, columnId: string) => {
      e.preventDefault();
      setResizingColumnId(columnId);

      const startX = e.clientX;
      const startWidth = columnSizing[columnId] ?? defaultColumnSizes[columnId] ?? 150;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const diff = moveEvent.clientX - startX;
        const newWidth = Math.max(80, startWidth + diff);
        setColumnSizing((prev) => ({
          ...prev,
          [columnId]: newWidth,
        }));
      };

      const handleMouseUp = () => {
        setResizingColumnId(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [columnSizing, defaultColumnSizes]
  );

  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-50 rounded-t-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 border-b border-gray-100 flex items-center px-4">
              <div className="h-4 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-center py-12 text-[13px] text-gray-700">
          {emptyMessage}
        </div>
      </div>
    );
  }

  const totalRows = data.length;
  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const startRow = currentPage * pagination.pageSize + 1;
  const endRow = Math.min((currentPage + 1) * pagination.pageSize, totalRows);

  return (
    <div className={`w-full flex flex-col ${className}`}>
      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse table-fixed">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-gray-50">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  const isActionsColumn = header.id === '_actions';
                  const colWidth =
                    columnSizing[header.column.id] ??
                    defaultColumnSizes[header.column.id] ??
                    header.getSize();
                  const canResize = header.column.getCanResize();

                  return (
                    <th
                      key={header.id}
                      className={`
                        px-4 py-2.5 text-left text-xs font-medium text-gray-700 relative
                        ${!isActionsColumn && canSort ? 'cursor-pointer select-none hover:bg-gray-100 transition-colors' : ''}
                      `}
                      style={{
                        width: colWidth,
                        minWidth: header.column.columnDef.minSize,
                      }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {!isActionsColumn && canSort && <SortIndicator direction={sortDirection} />}
                      </div>
                      {canResize && (
                        <ColumnResizer
                          onMouseDown={(e) => handleResizeMouseDown(e, header.column.id)}
                          isResizing={resizingColumnId === header.column.id}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const rowId = String(row.original[rowIdKey as keyof TData] ?? row.index);
              const isSelected = selectedRows.includes(rowId);

              return (
                <tr
                  key={row.id}
                  className={`
                    border-b border-gray-100 transition-colors
                    ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/50'}
                  `}
                  onMouseEnter={() => setHoveredRowId(rowId)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const colWidth =
                      columnSizing[cell.column.id] ??
                      defaultColumnSizes[cell.column.id] ??
                      cell.column.getSize();

                    return (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-[13px]"
                        style={{
                          width: colWidth,
                          minWidth: cell.column.columnDef.minSize,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white">
          <div className="text-[13px] text-gray-700">
            Showing {startRow} to {endRow} of {totalRows} results
          </div>
          <div className="flex items-center gap-2">
            <SecondaryIconButton
              icon={<CaretLeft size={14} />}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              title="Previous page"
              size="small"
            />
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => table.setPageIndex(i)}
                  className={`
                    min-w-[28px] h-7 px-2 text-[13px] font-medium rounded-lg transition-colors
                    ${
                      currentPage === i
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <SecondaryIconButton
              icon={<CaretRight size={14} />}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              title="Next page"
              size="small"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportTable;
