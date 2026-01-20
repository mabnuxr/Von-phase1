import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
   * AI prompt used to generate this column (shown on header click)
   */
  aiPrompt?: string;
  /**
   * Data sources used for AI column generation
   */
  aiDataSources?: string[];
  /**
   * AI reasoning prompt/description for the column (deprecated, use aiPrompt)
   */
  aiReasoning?: string;
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

export interface AIReasoningData {
  /**
   * The reasoning/explanation for how AI arrived at this value
   */
  reasoning: string;
  /**
   * Confidence score (0-1)
   */
  confidence?: number;
  /**
   * Data sources used for this calculation
   */
  sources?: string[];
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
   * @default 15
   */
  pageSize?: number;
  /**
   * Whether to show pagination
   * @default true
   */
  showPagination?: boolean;
  /**
   * AI reasoning data for cells - keyed by `${columnId}-${rowIndex}`
   * Used to display reasoning popovers on AI column cells
   */
  aiReasoningData?: Record<string, AIReasoningData>;
  /**
   * Whether to show AI indicators on AI column cells
   * @default true
   */
  showAIIndicators?: boolean;
  /**
   * Table title (used for edit reference)
   */
  title?: string;
  /**
   * Called when user clicks "Edit" on the table
   * Receives the table title as reference
   */
  onEditTable?: (tableTitle: string) => void;
  /**
   * Whether to show the edit action on hover
   * @default false
   */
  showEditAction?: boolean;
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

// AI Star Icon - StarFour shape with Von logo gradient fill
interface AIStarIconProps {
  size?: number;
  className?: string;
  id?: string;
}

// StarFour icon with gradient fill matching Von logo colors
const AIStarIcon: React.FC<AIStarIconProps> = ({
  size = 10,
  className = '',
  id = 'aiStarGradient',
}) => {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size + 6, height: size + 6 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient
            id={id}
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(200 16) rotate(120.964) scale(280)"
          >
            <stop stopColor="#FFF3EB" />
            <stop offset="0.26" stopColor="#FF9042" />
            <stop offset="1" stopColor="#854FFF" />
          </radialGradient>
        </defs>
        <path
          d="M240,128a8,8,0,0,1-8,8H179.31L136,179.31V232a8,8,0,0,1-16,0V179.31L76.69,136H24a8,8,0,0,1,0-16H76.69L120,76.69V24a8,8,0,0,1,16,0V76.69L179.31,120H232A8,8,0,0,1,240,128Z"
          fill={`url(#${id})`}
          fillOpacity="0.85"
        />
      </svg>
    </div>
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
// AI Cell Indicator with Hover Popover
// ============================================================================

interface AICellIndicatorProps {
  reasoning?: AIReasoningData;
}

const AICellIndicator: React.FC<AICellIndicatorProps> = ({ reasoning }) => {
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const indicatorRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    if (indicatorRef.current && reasoning) {
      const rect = indicatorRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 280),
      });
      setShowPopover(true);
    }
  };

  const handleMouseLeave = () => {
    setShowPopover(false);
  };

  return (
    <>
      <button
        ref={indicatorRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="ml-1.5 p-0.5 hover:bg-gray-100 rounded transition-colors cursor-pointer flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <AIStarIcon size={10} id={`aiStar-cell-${Math.random().toString(36).slice(2, 11)}`} />
      </button>
      {showPopover && reasoning && (
        <div
          className="fixed w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-[10000] p-3"
          style={{ top: popoverPosition.top, left: popoverPosition.left }}
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <AIStarIcon size={12} id="aiStar-reasoning" />
            <span className="text-[11px] font-medium text-gray-900">AI Reasoning</span>
          </div>
          <p className="text-[12px] text-gray-600 leading-relaxed">{reasoning.reasoning}</p>
          {reasoning.confidence !== undefined && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Confidence</span>
                <span className="font-medium text-gray-900">
                  {Math.round(reasoning.confidence * 100)}%
                </span>
              </div>
            </div>
          )}
          {reasoning.sources && reasoning.sources.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-[11px] text-gray-500 mb-1">Sources</p>
              <div className="flex flex-wrap gap-1">
                {reasoning.sources.map((source, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

// ============================================================================
// AI Column Header Popover (click to show prompt)
// ============================================================================

interface AIColumnHeaderPopoverProps {
  column: ReportColumn;
  onClose: () => void;
  position: { top: number; left: number };
}

const AIColumnHeaderPopover: React.FC<AIColumnHeaderPopoverProps> = ({
  column,
  onClose,
  position,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className="fixed w-72 bg-gray-900 rounded-lg shadow-xl z-[10000] p-3 text-white"
      style={{ top: position.top, left: Math.min(position.left, window.innerWidth - 300) }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
        <AIStarIcon size={12} id="aiStar-header-popover" />
        <span className="text-[12px] font-medium">{column.label}</span>
      </div>

      {/* Prompt section */}
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1.5">Prompt</p>
        <p className="text-[12px] text-gray-200 leading-relaxed">
          {column.aiPrompt || column.aiReasoning || 'Generate insights based on available data.'}
        </p>
      </div>

      {/* Data Sources section */}
      {column.aiDataSources && column.aiDataSources.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1.5">Data Sources</p>
          <div className="flex flex-wrap gap-1">
            {column.aiDataSources.map((source, idx) => (
              <span key={idx} className="px-2 py-0.5 text-[11px] bg-gray-800 text-gray-300 rounded">
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
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
  pageSize = 12,
  showPagination = true,
  aiReasoningData = {},
  showAIIndicators = true,
  title,
  onEditTable,
  showEditAction = false,
}: ReportTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);
  const [isTableHovered, setIsTableHovered] = useState(false);
  const [aiColumnPopover, setAiColumnPopover] = useState<{
    column: ReportColumn;
    position: { top: number; left: number };
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columnHelper = createColumnHelper<TData>();

  // Default column sizes
  const defaultColumnSizes: Record<string, number> = useMemo(() => {
    const sizes: Record<string, number> = { _actions: 60 };
    columns.forEach((col) => {
      sizes[col.id] = col.width ?? col.minWidth ?? 120;
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
      ...columns.map(
        (col): ColumnDef<TData> =>
          columnHelper.accessor((row: TData) => row[col.id as keyof TData] as unknown, {
            id: col.id,
            header: () => (
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  {col.isAI && <VonIcon size={14} className="flex-shrink-0" />}
                  <span
                    className={`truncate ${
                      col.isAI
                        ? 'bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent'
                        : ''
                    }`}
                  >
                    {col.label}
                  </span>
                </div>
                {col.isAI && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setAiColumnPopover({
                        column: col,
                        position: { top: rect.bottom + 4, left: rect.left },
                      });
                    }}
                    className="p-0.5 hover:bg-gray-100 rounded transition-colors cursor-pointer flex-shrink-0"
                    title="View AI column details"
                  >
                    <AIStarIcon size={10} id={`aiStar-col-${col.id}`} />
                  </button>
                )}
              </div>
            ),
            cell: (info) => {
              const value = info.getValue();
              const formattedValue = formatValue(value, col.type);
              const rowIndex = info.row.index;
              const reasoningKey = `${col.id}-${rowIndex}`;
              const reasoning = aiReasoningData[reasoningKey];

              // For AI columns, show indicator with reasoning popover
              if (col.isAI && showAIIndicators) {
                return (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{formattedValue}</span>
                    <AICellIndicator reasoning={reasoning} />
                  </div>
                );
              }

              return <span className="text-gray-900">{formattedValue}</span>;
            },
            size: col.width ?? 120,
            minSize: col.minWidth ?? 120,
            enableSorting: col.sortable !== false,
            enableResizing: true,
          })
      ),
    ];

    return cols;
  }, [
    columns,
    columnHelper,
    hoveredRowId,
    selectedRows,
    rowIdKey,
    onRowSelect,
    onRowOpen,
    aiReasoningData,
    showAIIndicators,
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
      const startWidth = columnSizing[columnId] ?? defaultColumnSizes[columnId] ?? 120;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const diff = moveEvent.clientX - startX;
        const newWidth = Math.max(120, startWidth + diff);
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

  // Handle column reorder via drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, columnId: string) => {
    e.stopPropagation();
    setDraggedColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColumnId: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedColumnId || draggedColumnId === targetColumnId) {
        setDraggedColumnId(null);
        return;
      }

      const currentOrder = table.getAllLeafColumns().map((col) => col.id);
      const draggedIndex = currentOrder.indexOf(draggedColumnId);
      const targetIndex = currentOrder.indexOf(targetColumnId);

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedColumnId(null);
        return;
      }

      // Don't allow reordering the actions column
      if (draggedColumnId === '_actions' || targetColumnId === '_actions') {
        setDraggedColumnId(null);
        return;
      }

      const newOrder = [...currentOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColumnId);

      setColumnOrder(newOrder);
      setDraggedColumnId(null);
    },
    [draggedColumnId, table]
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedColumnId(null);
  }, []);

  // Check scroll position to show/hide gradients
  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const isScrollable = scrollWidth > clientWidth;

    setShowLeftGradient(isScrollable && scrollLeft > 0);
    setShowRightGradient(isScrollable && scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Check scroll on mount and when data/columns change
  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => checkScroll();
    container.addEventListener('scroll', handleScroll);

    // Also check on resize
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll, data, columns, columnSizing]);

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

  return (
    <div
      ref={tableContainerRef}
      className={`w-full flex flex-col ${className}`}
      onMouseEnter={() => setIsTableHovered(true)}
      onMouseLeave={() => setIsTableHovered(false)}
    >
      {/* Title bar with ask Von action (shown on hover) */}
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <span className="text-[13px] font-medium text-gray-900">{title}</span>
          {showEditAction && onEditTable && (
            <button
              onClick={() => onEditTable(title)}
              className={`flex items-center gap-1 px-2 py-1.5 bg-gray-900 text-white rounded-xl shadow-sm hover:bg-gray-800 transition-all cursor-pointer ${
                isTableHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Von Logo */}
              <svg
                width={16}
                height={16}
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="14" cy="14" r="14" fill="url(#paint0_radial_von_table)" />
                <path
                  d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
                  stroke="white"
                  strokeWidth="1.33"
                />
                <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
                <defs>
                  <radialGradient
                    id="paint0_radial_von_table"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)"
                  >
                    <stop stopColor="#FFF3EB" />
                    <stop offset="0.26" stopColor="#FF9042" />
                    <stop offset="1" stopColor="#854FFF" />
                  </radialGradient>
                </defs>
              </svg>
              <span className="text-[12px] font-medium whitespace-nowrap">Ask Von</span>
            </button>
          )}
        </div>
      )}

      <div className="relative flex-1">
        {/* Left scroll gradient */}
        {showLeftGradient && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
        )}

        {/* Right scroll gradient */}
        {showRightGradient && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        )}

        <div ref={scrollContainerRef} className="overflow-x-auto h-full">
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
                        draggable={!isActionsColumn}
                        onDragStart={(e) =>
                          !isActionsColumn && handleDragStart(e, header.column.id)
                        }
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, header.column.id)}
                        onDragEnd={handleDragEnd}
                        className={`
                        px-4 py-2.5 text-left text-xs font-medium text-gray-700 relative
                        ${!isActionsColumn ? 'cursor-move' : ''}
                        ${!isActionsColumn && canSort ? 'select-none hover:bg-gray-100 transition-colors' : ''}
                        ${draggedColumnId === header.column.id ? 'opacity-50' : ''}
                      `}
                        style={{
                          width: colWidth,
                          minWidth: header.column.columnDef.minSize,
                        }}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {!isActionsColumn && canSort && (
                            <SortIndicator direction={sortDirection} />
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
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-white">
          <div className="text-xs text-gray-600">
            {totalRows} {totalRows === 1 ? 'result' : 'results'}
          </div>
          <div className="flex items-center gap-2">
            <SecondaryIconButton
              icon={<CaretLeft size={14} />}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              title="Previous page"
              size="small"
            />
            <span className="text-xs text-gray-700 font-medium">
              Page {currentPage + 1} of {totalPages}
            </span>
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

      {/* AI Column Header Popover */}
      {aiColumnPopover && (
        <AIColumnHeaderPopover
          column={aiColumnPopover.column}
          position={aiColumnPopover.position}
          onClose={() => setAiColumnPopover(null)}
        />
      )}
    </div>
  );
}

export default ReportTable;
