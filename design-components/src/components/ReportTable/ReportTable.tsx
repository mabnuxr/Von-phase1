import React, { useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  type ColumnOrderState,
} from '@tanstack/react-table';
import { CaretUp, CaretDown, ArrowUpRight, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { TertiaryIconButton, SecondaryIconButton } from '../forms/buttons/IconButtons';
import {
  OwnerCell,
  MultiPicklistCell,
  SentimentCell,
  BooleanCell,
  LongTextCell,
  PicklistCell,
  SourceIcon,
} from './CellRenderers';
import { VonLogoButton } from './SourcePopover';

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
  | 'picklist'
  | 'owner'
  | 'multiPicklist'
  | 'sentiment'
  | 'longText';

export type DataSourceType = 'salesforce' | 'gong' | 'gmail' | 'calendar' | 'hubspot' | 'mixed';

export interface SourceReference {
  type: DataSourceType;
  label: string;
  url?: string;
}

export interface AIReasoningData {
  reasoning: string;
  confidence?: number;
  sources?: string[];
  sourceReferences?: SourceReference[];
  recordName?: string;
}

export interface ReportColumn {
  id: string;
  label: string;
  type: ColumnType;
  isAI?: boolean;
  sortable?: boolean;
  width?: number;
  minWidth?: number;
  source?: DataSourceType;
  aiPrompt?: string;
  aiDataSources?: string[];
}

export interface ReportTableProps<TData extends Record<string, unknown>> {
  columns: ReportColumn[];
  data: TData[];
  onRowSelect?: (row: TData, selected: boolean) => void;
  onRowOpen?: (row: TData) => void;
  selectedRows?: string[];
  rowIdKey?: string;
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  showPagination?: boolean;
  rowSourceKey?: string;
  aiReasoningKey?: string;
  nameKey?: string;
  /** Number of columns to freeze from the left (including actions column) @default 2 */
  frozenColumns?: number;
  /** Whether to prioritize AI columns (move them after first data column) @default true */
  prioritizeAIColumns?: boolean;
  /** Enable drag-and-drop column reordering @default true */
  enableColumnReorder?: boolean;
  /** Whether to show the row actions column (checkbox + open button) @default true */
  showRowActions?: boolean;
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

interface SortButtonProps {
  direction: 'asc' | 'desc' | false;
  onClick: (e: React.MouseEvent) => void;
}

const SortButton: React.FC<SortButtonProps> = ({ direction, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center -space-y-1 p-1 hover:bg-gray-200/50 rounded transition-colors cursor-pointer flex-shrink-0"
      title="Sort column"
    >
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
    </button>
  );
};

// ============================================================================
// AI Header Popover
// ============================================================================

interface AIHeaderPopoverProps {
  column: ReportColumn;
  onClose: () => void;
  position: { top: number; left: number };
}

const AIHeaderPopover: React.FC<AIHeaderPopoverProps> = ({ column, onClose, position }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[10000] overflow-hidden"
      style={{ top: position.top, left: Math.min(position.left, window.innerWidth - 340) }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100">
        <SourcesLogoHeader size={16} />
        <span className="text-sm font-medium text-gray-900">{column.label}</span>
      </div>

      {column.aiPrompt && (
        <div className="px-3 py-2.5 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-700 mb-1.5">AI Prompt</p>
          <p className="text-sm text-gray-900 leading-relaxed">{column.aiPrompt}</p>
        </div>
      )}

      {column.aiDataSources && column.aiDataSources.length > 0 && (
        <div className="px-3 py-2.5">
          <p className="text-xs font-medium text-gray-700 mb-2">Data Sources</p>
          <div className="flex flex-wrap gap-1">
            {column.aiDataSources.map((source, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      )}

      {!column.aiPrompt && (!column.aiDataSources || column.aiDataSources.length === 0) && (
        <div className="px-3 py-2.5">
          <p className="text-sm text-gray-700">AI-generated column</p>
        </div>
      )}
    </div>,
    document.body
  );
};

// Sources Logo - Fixed size that doesn't shrink
const SourcesLogoHeader: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <div
    className="flex-shrink-0"
    style={{ width: size, height: size, minWidth: size, minHeight: size }}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="8" fill="url(#paint0_radial_sources_header)" />
      <path
        d="M11.9998 4.99981C15.8657 4.99981 18.9997 8.1339 18.9998 11.9998C18.9998 13.8225 18.3025 15.4818 17.1609 16.7273C17.0988 16.8085 17.0338 16.8877 16.9607 16.9607C16.8877 17.0338 16.8085 17.0988 16.7273 17.1609C15.4818 18.3025 13.8225 18.9998 11.9998 18.9998C8.1339 18.9997 4.9998 15.8657 4.9998 11.9998C4.99985 10.1789 5.6952 8.52031 6.83476 7.2752C6.89765 7.19266 6.96472 7.11302 7.03886 7.03887C7.11301 6.96472 7.19265 6.89766 7.27519 6.83477C8.5203 5.6952 10.1789 4.99986 11.9998 4.99981ZM6.36601 9.93047C6.12901 10.5755 5.99982 11.2726 5.9998 11.9998C5.9998 15.3135 8.68618 17.9997 11.9998 17.9998C12.7271 17.9998 13.424 17.8697 14.0691 17.6326C12.5215 17.3611 10.7262 16.3824 9.17168 14.8279C7.61709 13.2733 6.63739 11.4782 6.36601 9.93047ZM10.2283 7.45586C9.13908 7.15771 8.37496 7.284 7.92168 7.59942C7.81024 7.70275 7.70274 7.81024 7.59941 7.92168C7.284 8.37497 7.1577 9.13909 7.45586 10.2283C7.78805 11.4417 8.60897 12.8511 9.87871 14.1209C11.1486 15.3908 12.5588 16.2116 13.7723 16.5438C14.8593 16.8412 15.6215 16.7153 16.075 16.4012C16.1879 16.2966 16.2966 16.1879 16.4012 16.075C16.7153 15.6215 16.8412 14.8593 16.5437 13.7723C16.2116 12.5588 15.3908 11.1486 14.1209 9.87872C12.8511 8.60898 11.4417 7.78806 10.2283 7.45586ZM11.9998 5.99981C11.2726 5.99983 10.5755 6.12902 9.93047 6.36602C11.4782 6.6374 13.2733 7.6171 14.8279 9.17168C16.3824 10.7262 17.3611 12.5215 17.6326 14.0691C17.8697 13.4241 17.9998 12.7271 17.9998 11.9998C17.9997 8.68619 15.3134 5.99981 11.9998 5.99981Z"
        fill="white"
      />
      <defs>
        <radialGradient
          id="paint0_radial_sources_header"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(18.75 1.5) rotate(120.964) scale(26.2393)"
        >
          <stop stopColor="#FFF3EB" />
          <stop offset="0.26" stopColor="#FF9042" />
          <stop offset="1" stopColor="#854FFF" />
        </radialGradient>
      </defs>
    </svg>
  </div>
);

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
        icon={<ArrowUpRight size={14} />}
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
  aiReasoningKey = '_aiReasoning',
  nameKey = 'name',
  frozenColumns = 2,
  prioritizeAIColumns = true,
  enableColumnReorder = true,
  showRowActions = true,
}: ReportTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [aiHeaderPopover, setAiHeaderPopover] = useState<{
    column: ReportColumn;
    position: { top: number; left: number };
  } | null>(null);

  // Column order state for drag-and-drop
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const columnHelper = createColumnHelper<TData>();

  // Reorder columns: put AI columns after first data column
  const orderedColumns = useMemo(() => {
    if (!prioritizeAIColumns) return columns;

    const aiColumns = columns.filter((col) => col.isAI);
    const nonAIColumns = columns.filter((col) => !col.isAI);

    if (nonAIColumns.length > 0 && aiColumns.length > 0) {
      const firstColumn = nonAIColumns[0];
      const restColumns = nonAIColumns.slice(1);
      return [firstColumn, ...aiColumns, ...restColumns];
    }

    return columns;
  }, [columns, prioritizeAIColumns]);

  // Initialize column order
  React.useEffect(() => {
    if (columnOrder.length === 0) {
      const order = showRowActions
        ? ['_actions', ...orderedColumns.map((c) => c.id)]
        : orderedColumns.map((c) => c.id);
      setColumnOrder(order);
    }
  }, [orderedColumns, columnOrder.length, showRowActions]);

  // Get columns in current order
  const displayColumns = useMemo(() => {
    if (columnOrder.length === 0) return orderedColumns;

    const orderedResult: ReportColumn[] = [];
    columnOrder.forEach((colId) => {
      if (colId === '_actions') return;
      const col = orderedColumns.find((c) => c.id === colId);
      if (col) orderedResult.push(col);
    });

    // Add any columns not in the order (newly added)
    orderedColumns.forEach((col) => {
      if (!orderedResult.find((c) => c.id === col.id)) {
        orderedResult.push(col);
      }
    });

    return orderedResult;
  }, [orderedColumns, columnOrder]);

  // Default column sizes
  const defaultColumnSizes: Record<string, number> = useMemo(() => {
    const sizes: Record<string, number> = showRowActions ? { _actions: 60 } : {};
    displayColumns.forEach((col) => {
      sizes[col.id] = col.width ?? col.minWidth ?? 150;
    });
    return sizes;
  }, [displayColumns, showRowActions]);

  // Calculate frozen column widths for sticky positioning
  const frozenColumnWidths = useMemo(() => {
    const widths: number[] = showRowActions ? [60] : []; // Actions column only if shown
    const columnsToFreeze = showRowActions ? frozenColumns - 1 : frozenColumns;
    for (let i = 0; i < Math.min(columnsToFreeze, displayColumns.length); i++) {
      const col = displayColumns[i];
      widths.push(columnSizing[col.id] ?? defaultColumnSizes[col.id] ?? 150);
    }
    return widths;
  }, [frozenColumns, displayColumns, columnSizing, defaultColumnSizes, showRowActions]);

  // Render cell based on column type
  const renderCellContent = useCallback(
    (value: unknown, col: ReportColumn, row: TData): React.ReactNode => {
      const aiReasoningData = row[aiReasoningKey] as Record<string, AIReasoningData> | undefined;
      const reasoning = aiReasoningData?.[col.id];

      let content: React.ReactNode;

      switch (col.type) {
        case 'owner':
          content = <OwnerCell value={String(value ?? '')} />;
          break;
        case 'multiPicklist':
          content = <MultiPicklistCell value={value as string | string[]} />;
          break;
        case 'sentiment':
          content = <SentimentCell value={String(value ?? '')} />;
          break;
        case 'boolean':
          content = <BooleanCell value={value as boolean | string} />;
          break;
        case 'longText':
          content = <LongTextCell value={String(value ?? '')} />;
          break;
        case 'picklist':
          content = value ? (
            <PicklistCell value={String(value)} />
          ) : (
            <span className="text-gray-400">—</span>
          );
          break;
        default:
          content = <span className="text-gray-900">{formatValue(value, col.type)}</span>;
      }

      // For AI columns, add the Von logo button
      if (col.isAI) {
        const reasoningWithName: AIReasoningData = {
          ...reasoning,
          reasoning: reasoning?.reasoning || 'AI-generated content',
          recordName: String(row[nameKey] ?? ''),
        };

        return (
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">{content}</div>
            <div className="flex-shrink-0">
              <VonLogoButton reasoning={reasoningWithName} />
            </div>
          </div>
        );
      }

      return content;
    },
    [aiReasoningKey, nameKey]
  );

  const tableColumns = useMemo((): ColumnDef<TData>[] => {
    const cols: ColumnDef<TData>[] = [];

    // Only add actions column if showRowActions is true
    if (showRowActions) {
      cols.push(
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
        })
      );
    }

    cols.push(
      ...displayColumns.map(
        (col): ColumnDef<TData> =>
          columnHelper.accessor((row: TData) => row[col.id as keyof TData] as unknown, {
            id: col.id,
            header: () => (
              <div className="flex items-center gap-1.5 min-w-0">
                {col.isAI && <SourcesLogoHeader size={16} />}
                <span className="text-gray-800 truncate">{col.label}</span>
              </div>
            ),
            cell: (info) => {
              const value = info.getValue();
              return renderCellContent(value, col, info.row.original);
            },
            size: col.width ?? 150,
            minSize: col.minWidth ?? 100,
            enableSorting: col.sortable !== false,
            enableResizing: true,
          })
      )
    );

    return cols;
  }, [
    displayColumns,
    columnHelper,
    hoveredRowId,
    selectedRows,
    rowIdKey,
    onRowSelect,
    onRowOpen,
    renderCellContent,
    showRowActions,
  ]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnSizing, pagination, columnOrder },
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
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

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, columnId: string) => {
    setDraggingColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnId);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, columnId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (columnId !== draggingColumnId && columnId !== '_actions') {
        setDropTargetId(columnId);
      }
    },
    [draggingColumnId]
  );

  const handleDragLeave = useCallback(() => {
    setDropTargetId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const sourceColumnId = e.dataTransfer.getData('text/plain');

    if (sourceColumnId && sourceColumnId !== targetColumnId && targetColumnId !== '_actions') {
      setColumnOrder((prev) => {
        const newOrder = [...prev];
        const sourceIndex = newOrder.indexOf(sourceColumnId);
        const targetIndex = newOrder.indexOf(targetColumnId);

        if (sourceIndex !== -1 && targetIndex !== -1) {
          newOrder.splice(sourceIndex, 1);
          newOrder.splice(targetIndex, 0, sourceColumnId);
        }

        return newOrder;
      });
    }

    setDraggingColumnId(null);
    setDropTargetId(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingColumnId(null);
    setDropTargetId(null);
  }, []);

  // Close AI header popover - memoized to prevent useEffect infinite loop
  const handleCloseAiHeaderPopover = useCallback(() => {
    setAiHeaderPopover(null);
  }, []);

  // Calculate left position for frozen columns
  const getFrozenLeftPosition = (columnIndex: number): number => {
    let left = 0;
    for (let i = 0; i < columnIndex; i++) {
      left += frozenColumnWidths[i] || 0;
    }
    return left;
  };

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
        <div className="flex items-center justify-center py-12 text-sm text-gray-700">
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
    <div className={`w-full flex flex-col h-full ${className}`}>
      {/* Custom scrollbar styles */}
      <style>
        {`
          .report-table-scroll::-webkit-scrollbar {
            height: 8px;
            width: 8px;
          }
          .report-table-scroll::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 4px;
          }
          .report-table-scroll::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
          }
          .report-table-scroll::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
          .cell-scroll::-webkit-scrollbar {
            height: 4px;
          }
          .cell-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .cell-scroll::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 2px;
          }
          .cell-scroll::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
        `}
      </style>

      <div className="overflow-x-auto flex-1 report-table-scroll rounded-lg">
        <table className="w-full border-collapse" style={{ minWidth: 'max-content' }}>
          <thead className="sticky top-0 z-20">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, headerIndex) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  const isActionsColumn = header.id === '_actions';
                  const colWidth =
                    columnSizing[header.column.id] ??
                    defaultColumnSizes[header.column.id] ??
                    header.getSize();
                  const canResize = header.column.getCanResize();

                  const colDef = displayColumns.find((c) => c.id === header.id);
                  const isAIColumn = colDef?.isAI;
                  const columnSource = colDef?.source;

                  const isFrozen = headerIndex < frozenColumns;
                  const frozenLeft = isFrozen ? getFrozenLeftPosition(headerIndex) : undefined;
                  const isDropTarget = dropTargetId === header.id;
                  const isDragging = draggingColumnId === header.id;

                  const aiColumnStyle = isAIColumn
                    ? {
                        backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), url('data:image/svg+xml;utf8,<svg viewBox="0 0 260 42" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><rect x="0" y="0" height="100%" width="100%" fill="url(%23grad)" opacity="0.15"/><defs><radialGradient id="grad" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="10" gradientTransform="matrix(-8.6861e-15 -4.2 17.554 2.0367e-14 6.418 42)"><stop stop-color="rgba(217,79,255,1)" offset="0"/><stop stop-color="rgba(226,123,255,0.75)" offset="0.25"/><stop stop-color="rgba(235,166,255,0.5)" offset="0.5"/><stop stop-color="rgba(253,253,254,0)" offset="1"/></radialGradient></defs></svg>'), url('data:image/svg+xml;utf8,<svg viewBox="0 0 260 42" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><rect x="0" y="0" height="100%" width="100%" fill="url(%23grad)" opacity="0.5"/><defs><radialGradient id="grad" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="10" gradientTransform="matrix(8.4 1.9994 1.2515 3.8235 -24.5 6)"><stop stop-color="rgba(255,144,66,1)" offset="0"/><stop stop-color="rgba(255,171,113,0.75)" offset="0.25"/><stop stop-color="rgba(254,199,160,0.5)" offset="0.5"/><stop stop-color="rgba(253,253,254,0)" offset="1"/></radialGradient></defs></svg>'), url('data:image/svg+xml;utf8,<svg viewBox="0 0 260 42" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><rect x="0" y="0" height="100%" width="100%" fill="url(%23grad)" opacity="0.5"/><defs><radialGradient id="grad" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="10" gradientTransform="matrix(1.9127e-15 5.05 -11.463 0.000001256 50.5 -15)"><stop stop-color="rgba(255,144,66,1)" offset="0"/><stop stop-color="rgba(255,171,113,0.75)" offset="0.25"/><stop stop-color="rgba(254,199,160,0.5)" offset="0.5"/><stop stop-color="rgba(253,253,254,0)" offset="1"/></radialGradient></defs></svg>'), linear-gradient(90deg, rgb(252, 252, 253) 0%, rgb(252, 252, 253) 100%)`,
                      }
                    : undefined;

                  const handleAIHeaderClick = (e: React.MouseEvent) => {
                    if (isAIColumn && colDef) {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setAiHeaderPopover({
                        column: colDef,
                        position: { top: rect.bottom + 4, left: rect.left },
                      });
                    }
                  };

                  const canDrag = enableColumnReorder && !isActionsColumn;

                  return (
                    <th
                      key={header.id}
                      draggable={canDrag}
                      onDragStart={canDrag ? (e) => handleDragStart(e, header.id) : undefined}
                      className={`
                        px-3 py-1.5 text-left text-sm font-medium relative border-r border-gray-100
                        ${isAIColumn ? 'text-gray-800 cursor-pointer' : 'bg-gray-50 text-gray-800'}
                        ${isFrozen ? 'sticky z-30' : ''}
                        ${isDropTarget ? 'bg-indigo-50 border-l-2 border-l-indigo-400' : ''}
                        ${isDragging ? 'opacity-50 cursor-grabbing' : ''}
                      `}
                      style={{
                        width: colWidth,
                        minWidth: colWidth,
                        maxWidth: colWidth,
                        ...(isFrozen
                          ? {
                              left: frozenLeft,
                              backgroundColor: isAIColumn ? undefined : '#f9fafb',
                            }
                          : {}),
                        ...aiColumnStyle,
                      }}
                      onClick={isAIColumn ? handleAIHeaderClick : undefined}
                      onDragOver={(e) => handleDragOver(e, header.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, header.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center justify-between gap-1 overflow-hidden">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                          {!isAIColumn && columnSource && (
                            <div className="flex-shrink-0">
                              <SourceIcon source={columnSource} size={14} />
                            </div>
                          )}
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                        {!isActionsColumn && canSort && (
                          <SortButton
                            direction={sortDirection}
                            onClick={(e) => {
                              e.stopPropagation();
                              header.column.toggleSorting();
                            }}
                          />
                        )}
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
              const isHovered = hoveredRowId === rowId;

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
                  {row.getVisibleCells().map((cell, cellIndex) => {
                    const colWidth =
                      columnSizing[cell.column.id] ??
                      defaultColumnSizes[cell.column.id] ??
                      cell.column.getSize();

                    const isFrozen = cellIndex < frozenColumns;
                    const frozenLeft = isFrozen ? getFrozenLeftPosition(cellIndex) : undefined;

                    return (
                      <td
                        key={cell.id}
                        className={`
                          px-3 py-1.5 text-sm font-medium border-r border-gray-100
                          ${isFrozen ? 'sticky z-10' : ''}
                          ${isFrozen && isSelected ? 'bg-gray-50' : isFrozen ? 'bg-white' : ''}
                          ${isFrozen && isHovered && !isSelected ? 'bg-gray-50/50' : ''}
                        `}
                        style={{
                          width: colWidth,
                          minWidth: colWidth,
                          maxWidth: colWidth,
                          ...(isFrozen ? { left: frozenLeft } : {}),
                        }}
                      >
                        <div
                          className="overflow-x-auto cell-scroll whitespace-nowrap"
                          style={{ scrollbarWidth: 'thin', paddingBottom: '2px' }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
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
      {showPagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white shrink-0">
          <div className="text-[13px] text-gray-500">
            Showing {startRow} to {endRow} of {totalRows} results
          </div>
          {totalPages > 1 && (
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
                      min-w-[28px] h-7 px-2 text-sm font-medium rounded-lg transition-colors cursor-pointer
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
          )}
        </div>
      )}

      {/* AI Header Popover */}
      {aiHeaderPopover && (
        <AIHeaderPopover
          column={aiHeaderPopover.column}
          position={aiHeaderPopover.position}
          onClose={handleCloseAiHeaderPopover}
        />
      )}
    </div>
  );
}

export default ReportTable;
