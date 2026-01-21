import React, { useState, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X as XIcon,
  Table as TableIcon,
  Database as DatabaseIcon,
  CaretLeft as CaretLeftIcon,
  CaretRight as CaretRightIcon,
  CaretDown as CaretDownIcon,
  CaretUp as CaretUpIcon,
  MagnifyingGlass as MagnifyingGlassIcon,
  Funnel as FunnelIcon,
  Plus as PlusIcon,
  Sparkle as SparkleIcon,
  Star as StarIcon,
  Trash as TrashIcon,
  SortAscending as SortAscendingIcon,
  SortDescending as SortDescendingIcon,
  ArrowsDownUp as ArrowsDownUpIcon,
} from '@phosphor-icons/react';
import type { ReportColumn, AIReasoningData } from '../ReportTable/ReportTable';
import { LOGO_STATIC_URL } from '../../constants';

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

export interface DataFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
  isAI?: boolean;
}

export interface DataTablesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tables: DataTableConfig[];
  title?: string;
}

const ROWS_PER_PAGE = 25;

// ============================================================================
// Utility Functions
// ============================================================================

const formatValue = (value: unknown, type: ReportColumn['type']): string => {
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
    default:
      return String(value);
  }
};

// ============================================================================
// AI Star Icon
// ============================================================================

interface AIStarIconProps {
  size?: number;
  className?: string;
  id?: string;
}

const AIStarIcon: React.FC<AIStarIconProps> = ({
  size = 10,
  className = '',
  id = 'aiStarGradient',
}) => {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size + 4, height: size + 4 }}
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

// ============================================================================
// Natural Language Filter Popover
// ============================================================================

interface NLFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onApplyFilter: (filter: DataFilter) => void;
  columns: ReportColumn[];
}

const NLFilterPopover: React.FC<NLFilterPopoverProps> = ({
  isOpen,
  onClose,
  anchorRef,
  onApplyFilter,
  columns,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [promptValue, setPromptValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      setPromptValue('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 420)),
      });
    }
  }, [isOpen, anchorRef]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const handleApplyPrompt = () => {
    if (!promptValue.trim()) return;

    setIsProcessing(true);

    setTimeout(() => {
      const lowerPrompt = promptValue.toLowerCase();
      let filter: DataFilter | null = null;

      // Parse natural language filter
      if (lowerPrompt.includes('>') && (lowerPrompt.includes('$') || lowerPrompt.includes('amount'))) {
        const match = promptValue.match(/>\s*\$?([\d,]+)k?/i);
        if (match) {
          const value = match[1].replace(/,/g, '');
          const multiplier = lowerPrompt.includes('k') ? 1000 : 1;
          filter = {
            id: `filter-${Date.now()}`,
            field: 'amount',
            operator: '>',
            value: String(parseInt(value) * multiplier),
            isAI: true,
          };
        }
      } else if (lowerPrompt.includes('stage')) {
        const stageMatch = promptValue.match(/stage[:\s]*([\w\s]+)/i);
        if (stageMatch) {
          filter = {
            id: `filter-${Date.now()}`,
            field: 'stage',
            operator: '=',
            value: stageMatch[1].trim(),
            isAI: true,
          };
        }
      } else if (lowerPrompt.includes('owner') || lowerPrompt.includes('rep')) {
        const nameMatch = promptValue.match(/(?:owner|rep)[:\s]*([\w\s]+)/i);
        if (nameMatch) {
          filter = {
            id: `filter-${Date.now()}`,
            field: 'ownerName',
            operator: 'contains',
            value: nameMatch[1].trim(),
            isAI: true,
          };
        }
      } else if (lowerPrompt.includes('region')) {
        const regionMatch = promptValue.match(/region[:\s]*([\w]+)/i);
        if (regionMatch) {
          filter = {
            id: `filter-${Date.now()}`,
            field: 'region',
            operator: '=',
            value: regionMatch[1].trim(),
            isAI: true,
          };
        }
      } else if (lowerPrompt.includes('high risk') || lowerPrompt.includes('at risk')) {
        filter = {
          id: `filter-${Date.now()}`,
          field: 'riskFlag',
          operator: '=',
          value: 'High',
          isAI: true,
        };
      } else if (lowerPrompt.includes('deal score') && lowerPrompt.includes('>')) {
        const scoreMatch = promptValue.match(/>\s*(\d+)/);
        if (scoreMatch) {
          filter = {
            id: `filter-${Date.now()}`,
            field: 'dealScore',
            operator: '>',
            value: scoreMatch[1],
            isAI: true,
          };
        }
      } else {
        // Default to text search on first text column
        const textCol = columns.find(c => c.type === 'text');
        filter = {
          id: `filter-${Date.now()}`,
          field: textCol?.id || 'name',
          operator: 'contains',
          value: promptValue,
          isAI: true,
        };
      }

      if (filter) {
        onApplyFilter(filter);
      }
      setIsProcessing(false);
      onClose();
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleApplyPrompt();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed w-[400px] bg-white rounded-xl shadow-xl border border-gray-200 z-[10001] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <SparkleIcon size={16} weight="duotone" className="text-indigo-600" />
        <span className="text-[13px] font-medium text-gray-900">Filter with AI</span>
      </div>

      <div className="p-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g., "Deals > $100K in West region" or "High risk deals"'
            disabled={isProcessing}
            className="w-full px-3 py-2.5 pr-10 text-[13px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow disabled:opacity-50"
          />
          {isProcessing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <SparkleIcon size={16} weight="duotone" className="text-indigo-600" />
              </motion.div>
            </div>
          )}
        </div>
        <p className="mt-2 text-[11px] text-gray-500">
          Describe your filter in natural language. Press Enter to apply.
        </p>
      </div>
    </motion.div>,
    document.body
  );
};

// ============================================================================
// Add AI Column Popover
// ============================================================================

interface AddAIColumnPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onAddColumn: (column: ReportColumn) => void;
  existingColumns: ReportColumn[];
}

const AddAIColumnPopover: React.FC<AddAIColumnPopoverProps> = ({
  isOpen,
  onClose,
  anchorRef,
  onAddColumn,
  existingColumns,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [columnName, setColumnName] = useState('');
  const [columnPrompt, setColumnPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setColumnName('');
      setColumnPrompt('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 420)),
      });
    }
  }, [isOpen, anchorRef]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const handleAddColumn = () => {
    if (!columnName.trim() || !columnPrompt.trim()) return;

    setIsProcessing(true);

    setTimeout(() => {
      const newColumn: ReportColumn = {
        id: `ai-${Date.now()}`,
        label: columnName,
        type: 'text',
        width: 150,
        sortable: true,
        isAI: true,
        aiPrompt: columnPrompt,
        aiDataSources: ['Salesforce', 'Gong', 'Email Activity'],
      };

      onAddColumn(newColumn);
      setIsProcessing(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed w-[420px] bg-white rounded-xl shadow-xl border border-gray-200 z-[10001] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-center w-5 h-5">
          <img src={LOGO_STATIC_URL} alt="Von" className="w-4 h-4 rounded-sm" />
        </div>
        <span className="text-[13px] font-medium text-gray-900">Add AI Column</span>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Column Name</label>
          <input
            type="text"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            placeholder="e.g., Win Probability"
            disabled={isProcessing}
            className="w-full px-3 py-2 text-[13px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">AI Prompt</label>
          <textarea
            value={columnPrompt}
            onChange={(e) => setColumnPrompt(e.target.value)}
            placeholder="Describe what this column should calculate or analyze..."
            disabled={isProcessing}
            rows={3}
            className="w-full px-3 py-2 text-[13px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow disabled:opacity-50 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAddColumn}
            disabled={!columnName.trim() || !columnPrompt.trim() || isProcessing}
            className="px-3 py-1.5 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
          >
            {isProcessing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <SparkleIcon size={14} weight="duotone" />
                </motion.div>
                Processing...
              </>
            ) : (
              <>
                <PlusIcon size={14} weight="bold" />
                Add Column
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>,
    document.body
  );
};

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
        flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium rounded-full
        transition-colors duration-150 cursor-pointer whitespace-nowrap border
        ${
          isActive
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      <TableIcon
        size={14}
        weight={isActive ? 'fill' : 'regular'}
        className={isActive ? 'text-white' : 'text-gray-500'}
      />
      <span className="truncate max-w-[120px]">{table.name}</span>
      <span className={`text-[11px] ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
        ({table.rowCount})
      </span>
    </button>
  );
};

// ============================================================================
// Filter Chip Component
// ============================================================================

interface FilterChipProps {
  filter: DataFilter;
  onRemove: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ filter, onRemove }) => {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md text-[12px]">
      {filter.isAI && <AIStarIcon size={10} id={`filter-${filter.id}`} />}
      <span className="text-gray-700 font-medium">{filter.field}</span>
      <span className="text-gray-500">{filter.operator}</span>
      <span className="text-gray-900">{filter.value}</span>
      <button
        onClick={onRemove}
        className="ml-1 p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors cursor-pointer"
      >
        <XIcon size={10} weight="bold" />
      </button>
    </div>
  );
};

// ============================================================================
// Data Table Content Component
// ============================================================================

interface DataTableContentProps {
  table: DataTableConfig;
  filters: DataFilter[];
  sortConfig: { column: string; direction: 'asc' | 'desc' } | null;
  onSort: (column: string) => void;
  addedColumns: ReportColumn[];
}

const DataTableContent: React.FC<DataTableContentProps> = ({
  table,
  filters,
  sortConfig,
  onSort,
  addedColumns,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Combine original columns with added AI columns
  const allColumns = useMemo(() => {
    return [...table.columns, ...addedColumns];
  }, [table.columns, addedColumns]);

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...table.data];

    filters.forEach((filter) => {
      result = result.filter((row) => {
        const value = row[filter.field];
        if (value === null || value === undefined) return false;

        const strValue = String(value).toLowerCase();
        const filterValue = filter.value.toLowerCase();

        switch (filter.operator) {
          case '=':
            return strValue === filterValue;
          case 'contains':
            return strValue.includes(filterValue);
          case '>':
            return Number(value) > Number(filter.value);
          case '<':
            return Number(value) < Number(filter.value);
          case '>=':
            return Number(value) >= Number(filter.value);
          case '<=':
            return Number(value) <= Number(filter.value);
          default:
            return strValue.includes(filterValue);
        }
      });
    });

    return result;
  }, [table.data, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.column];
      const bVal = b[sortConfig.column];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortConfig.direction === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalRows = sortedData.length;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalRows);
  const currentRows = sortedData.slice(startIndex, endIndex);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const getSortIcon = (columnId: string) => {
    if (sortConfig?.column !== columnId) {
      return <ArrowsDownUpIcon size={12} className="text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? (
      <SortAscendingIcon size={12} className="text-gray-900" />
    ) : (
      <SortDescendingIcon size={12} className="text-gray-900" />
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Table Info */}
      <div className="px-4 py-2 flex items-center justify-between text-[11px] text-gray-500">
        <span>
          Showing {startIndex + 1}–{endIndex} of {totalRows} rows
          {filters.length > 0 && ` (filtered from ${table.rowCount})`}
        </span>
        <span>{allColumns.filter((c) => c.isAI).length} AI columns</span>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto mx-4 border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              {allColumns.map((col) => (
                <th
                  key={col.id}
                  className={`px-3 py-2.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap bg-gray-50 ${
                    col.type === 'number' || col.type === 'currency' || col.type === 'percentage'
                      ? 'text-right'
                      : ''
                  } ${col.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}`}
                  style={{ minWidth: col.width || 100 }}
                  onClick={() => col.sortable && onSort(col.id)}
                >
                  <div className={`flex items-center gap-1.5 ${
                    col.type === 'number' || col.type === 'currency' || col.type === 'percentage'
                      ? 'justify-end'
                      : ''
                  }`}>
                    {col.isAI && <AIStarIcon size={10} id={`col-${col.id}`} />}
                    <span>{col.label}</span>
                    {col.sortable && getSortIcon(col.id)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, rowIndex) => (
              <tr
                key={row.id as string || startIndex + rowIndex}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
              >
                {allColumns.map((col) => {
                  const isAIColumn = col.isAI;
                  const value = row[col.id];
                  const hasValue = value !== null && value !== undefined;

                  return (
                    <td
                      key={col.id}
                      className={`px-3 py-2 text-[13px] whitespace-nowrap ${
                        col.type === 'number' || col.type === 'currency' || col.type === 'percentage'
                          ? 'text-right tabular-nums'
                          : 'text-left'
                      } text-gray-700`}
                    >
                      {isAIColumn && !hasValue ? (
                        <span className="text-gray-400 italic">Calculating...</span>
                      ) : (
                        formatValue(value, col.type)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-[11px] text-gray-500">
          Page {currentPage} of {totalPages || 1}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <CaretLeftIcon size={14} weight="bold" />
            </button>
            <span className="text-[11px] text-gray-600 px-2 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <CaretRightIcon size={14} weight="bold" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const DataTablesDrawer: React.FC<DataTablesDrawerProps> = ({
  isOpen,
  onClose,
  tables,
  title = 'Data Reference',
}) => {
  const [activeTableId, setActiveTableId] = useState<string>(tables[0]?.id || '');
  const [filters, setFilters] = useState<Record<string, DataFilter[]>>({});
  const [sortConfigs, setSortConfigs] = useState<Record<string, { column: string; direction: 'asc' | 'desc' } | null>>({});
  const [addedColumns, setAddedColumns] = useState<Record<string, ReportColumn[]>>({});
  const [showNLFilter, setShowNLFilter] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);

  const nlFilterButtonRef = useRef<HTMLButtonElement>(null);
  const addColumnButtonRef = useRef<HTMLButtonElement>(null);

  const activeTable = tables.find((t) => t.id === activeTableId);
  const activeFilters = filters[activeTableId] || [];
  const activeSortConfig = sortConfigs[activeTableId] || null;
  const activeAddedColumns = addedColumns[activeTableId] || [];

  const handleSort = useCallback((columnId: string) => {
    setSortConfigs((prev) => {
      const current = prev[activeTableId];
      let newDirection: 'asc' | 'desc' = 'asc';

      if (current?.column === columnId) {
        newDirection = current.direction === 'asc' ? 'desc' : 'asc';
      }

      return {
        ...prev,
        [activeTableId]: { column: columnId, direction: newDirection },
      };
    });
  }, [activeTableId]);

  const handleAddFilter = useCallback((filter: DataFilter) => {
    setFilters((prev) => ({
      ...prev,
      [activeTableId]: [...(prev[activeTableId] || []), filter],
    }));
  }, [activeTableId]);

  const handleRemoveFilter = useCallback((filterId: string) => {
    setFilters((prev) => ({
      ...prev,
      [activeTableId]: (prev[activeTableId] || []).filter((f) => f.id !== filterId),
    }));
  }, [activeTableId]);

  const handleAddColumn = useCallback((column: ReportColumn) => {
    setAddedColumns((prev) => ({
      ...prev,
      [activeTableId]: [...(prev[activeTableId] || []), column],
    }));
  }, [activeTableId]);

  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);

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
            className="fixed right-0 top-0 h-full w-[800px] max-w-[95vw] pr-2 py-2 z-[9999]"
          >
            <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50">
                    <DatabaseIcon size={18} weight="duotone" className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    <p className="text-xs text-gray-500">
                      {tables.length} tables, {totalRows.toLocaleString()} total rows
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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

              {/* Filter & Actions Bar */}
              <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center justify-between gap-4">
                  {/* Filters */}
                  <div className="flex items-center gap-2 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    <button
                      ref={nlFilterButtonRef}
                      onClick={() => setShowNLFilter(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <SparkleIcon size={14} weight="duotone" className="text-indigo-600" />
                      Add Filter
                    </button>

                    {activeFilters.map((filter) => (
                      <FilterChip
                        key={filter.id}
                        filter={filter}
                        onRemove={() => handleRemoveFilter(filter.id)}
                      />
                    ))}
                  </div>

                  {/* Add AI Column */}
                  <button
                    ref={addColumnButtonRef}
                    onClick={() => setShowAddColumn(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <PlusIcon size={14} weight="bold" />
                    <img src={LOGO_STATIC_URL} alt="Von" className="w-3.5 h-3.5 rounded-sm" />
                    AI Column
                  </button>
                </div>
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-hidden">
                {activeTable && (
                  <DataTableContent
                    table={activeTable}
                    filters={activeFilters}
                    sortConfig={activeSortConfig}
                    onSort={handleSort}
                    addedColumns={activeAddedColumns}
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* Popovers */}
          <NLFilterPopover
            isOpen={showNLFilter}
            onClose={() => setShowNLFilter(false)}
            anchorRef={nlFilterButtonRef}
            onApplyFilter={handleAddFilter}
            columns={activeTable?.columns || []}
          />

          <AddAIColumnPopover
            isOpen={showAddColumn}
            onClose={() => setShowAddColumn(false)}
            anchorRef={addColumnButtonRef}
            onAddColumn={handleAddColumn}
            existingColumns={activeTable?.columns || []}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default DataTablesDrawer;
