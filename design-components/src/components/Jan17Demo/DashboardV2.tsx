import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DotsThreeIcon,
  PencilSimpleIcon,
  TrashIcon,
  TableIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  DownloadIcon,
  ArrowsClockwiseIcon,
  PaperPlaneTiltIcon,
  CalendarIcon,
  UserIcon,
  CaretDownIcon,
  CheckIcon,
  XIcon,
  SparkleIcon,
  GearIcon,
  UsersIcon,
  InfoIcon,
  NoteIcon,
} from '@phosphor-icons/react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { SecondaryIconButton, AddButton, GhostButton, PrimaryButton } from '../forms/buttons';
import { ContextMenu, type ContextMenuItem } from '../popups';
import { FilterRow } from '../forms/filter';

// ============================================================================
// Types
// ============================================================================

export type TimelineFilter = 'this-quarter' | 'next-quarter' | 'last-quarter' | 'this-month' | 'this-year';
export type OwnerFilter = string; // owner id or 'all'

export interface DashboardFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface KPICardData {
  id: string;
  title: string;
  value: string;
  change?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  /** Progress value as a percentage (0-100) for horizontal progress bar */
  progress?: number;
  /** Target/goal value to display alongside progress */
  target?: string;
}

export interface ChartData {
  id: string;
  title: string;
  type: 'bar' | 'pie';
  data: unknown;
}

export interface TableColumn {
  id: string;
  label: string;
  type?: 'string' | 'number' | 'currency' | 'date';
}

export interface TableData {
  id: string;
  title: string;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
}

export interface TextWidgetData {
  id: string;
  title: string;
  content: string;
  /** Maximum character limit for the text content */
  maxCharacters?: number;
  /** Whether this is AI-generated content */
  isAIGenerated?: boolean;
}

export interface OwnerOption {
  id: string;
  name: string;
}

export interface DashboardV2Props {
  name: string;
  kpiCards: KPICardData[];
  barChart?: ChartData;
  pieChart?: ChartData;
  table?: TableData;
  /** Text widget for notes or AI-generated content */
  textWidget?: TextWidgetData;
  /** Callback when text widget content changes */
  onTextWidgetChange?: (content: string) => void;
  isBuilding?: boolean;
  buildProgress?: number;
  visibleWidgets?: string[];
  onWidgetDrillDown?: (widgetId: string) => void;
  onWidgetEdit?: (widgetId: string) => void;
  onWidgetDelete?: (widgetId: string) => void;
  /** Callback when filter button is clicked (legacy) */
  onFilterClick?: (buttonRect: DOMRect) => void;
  /** Callback when export button is clicked */
  onExportClick?: () => void;
  /** Callback when refresh button is clicked */
  onRefreshClick?: () => void;
  /** Callback when share button is clicked */
  onShareClick?: (buttonRect: DOMRect) => void;
  /** Callback when edit button is clicked (enters edit mode) */
  onEditClick?: () => void;
  /** Callback when dashboard name is changed */
  onNameChange?: (newName: string) => void;
  /** Whether the dashboard is in edit mode */
  isEditMode?: boolean;
  /** Timeline filter value */
  timelineFilter?: TimelineFilter;
  /** Callback when timeline filter changes */
  onTimelineFilterChange?: (value: TimelineFilter) => void;
  /** Owner filter value */
  ownerFilter?: OwnerFilter;
  /** Callback when owner filter changes */
  onOwnerFilterChange?: (value: OwnerFilter) => void;
  /** Available owners for filtering */
  ownerOptions?: OwnerOption[];
  /** Advanced filters */
  advancedFilters?: DashboardFilter[];
  /** Callback when advanced filters change */
  onAdvancedFiltersChange?: (filters: DashboardFilter[]) => void;
  /** Available fields for advanced filtering */
  availableFilterFields?: string[];
  /** Callback when a chart segment is clicked for drilldown */
  onChartSegmentClick?: (widgetId: string, segmentData: { name: string; value: number }) => void;
  /** Callback when cancel/close button is clicked */
  onCancelClick?: () => void;
  /** Timestamp when dashboard was created/updated */
  timestamp?: string;
  /** User who created the dashboard */
  createdBy?: string;
  /** Callback when a widget card is clicked (for reference context updates) */
  onWidgetClick?: (widgetId: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const TIMELINE_OPTIONS = [
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'next-quarter', label: 'Next Quarter' },
  { value: 'last-quarter', label: 'Last Quarter' },
  { value: 'this-month', label: 'This Month' },
  { value: 'this-year', label: 'This Year' },
];

// ============================================================================
// Context Menu Items
// ============================================================================

const getWidgetContextMenuItems = (): ContextMenuItem[] => [
  { id: 'edit', label: 'Edit', icon: <PencilSimpleIcon size={14} /> },
  { id: 'delete', label: 'Delete', icon: <TrashIcon size={14} />, variant: 'danger' },
];

// ============================================================================
// Filter Dropdown Popover Component
// ============================================================================

interface FilterDropdownPopoverProps<T extends string> {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  title: string;
}

function FilterDropdownPopover<T extends string>({
  isOpen,
  onClose,
  anchorRef,
  options,
  value,
  onChange,
  title,
}: FilterDropdownPopoverProps<T>) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
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

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-[10000] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100">
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{title}</span>
      </div>

      {/* Options */}
      <div className="py-1 max-h-[240px] overflow-y-auto">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onChange(option.value);
              onClose();
            }}
            className={`
              w-full flex items-center justify-between px-3 py-2 text-[13px] transition-colors cursor-pointer
              ${value === option.value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}
            `}
          >
            <span>{option.label}</span>
            {value === option.value && <CheckIcon size={14} className="text-indigo-600" />}
          </button>
        ))}
      </div>
    </motion.div>,
    document.body
  );
}

// ============================================================================
// Advanced Filters Popover Component
// ============================================================================

interface AdvancedFiltersPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  filters: DashboardFilter[];
  fieldOptions: { value: string; label: string }[];
  onFiltersChange: (filters: DashboardFilter[]) => void;
}

const AdvancedFiltersPopover: React.FC<AdvancedFiltersPopoverProps> = ({
  isOpen,
  onClose,
  anchorRef,
  filters,
  fieldOptions,
  onFiltersChange,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [localFilters, setLocalFilters] = useState<DashboardFilter[]>(filters);

  // Reset local filters when popover opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(16, rect.left),
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
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

  const addFilter = () => {
    const newFilter: DashboardFilter = {
      id: `filter-${Date.now()}`,
      field: fieldOptions[0]?.value || '',
      operator: 'equals',
      value: '',
    };
    setLocalFilters([...localFilters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<DashboardFilter>) => {
    setLocalFilters(localFilters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeFilter = (id: string) => {
    setLocalFilters(localFilters.filter((f) => f.id !== id));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed w-[420px] bg-white rounded-xl shadow-xl border border-gray-200 z-[10000]"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-[13px] font-medium text-gray-900">Edit Filters</span>
        <AddButton onClick={addFilter}>Add Filter</AddButton>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        {localFilters.length === 0 ? (
          <p className="text-[13px] text-gray-500 text-center py-4">
            No filters applied. Click "Add Filter" to create one.
          </p>
        ) : (
          <div className="space-y-2">
            {localFilters.map((filter) => (
              <FilterRow
                key={filter.id}
                fields={fieldOptions}
                field={filter.field}
                operator={filter.operator}
                value={filter.value}
                onFieldChange={(field) => updateFilter(filter.id, { field })}
                onOperatorChange={(operator) => updateFilter(filter.id, { operator })}
                onValueChange={(value) => updateFilter(filter.id, { value })}
                onRemove={() => removeFilter(filter.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton onClick={handleApply}>Apply Filters</PrimaryButton>
      </div>
    </motion.div>,
    document.body
  );
};

// ============================================================================
// Prompt-Based Filter Popover Component
// ============================================================================

interface PromptBasedFilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  filters: DashboardFilter[];
  onFiltersChange: (filters: DashboardFilter[]) => void;
  placeholder?: string;
}

const PromptBasedFilterPopover: React.FC<PromptBasedFilterPopoverProps> = ({
  isOpen,
  onClose,
  anchorRef,
  filters,
  onFiltersChange,
  placeholder = 'e.g., "Deals closing this quarter with value > $100K"',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [promptValue, setPromptValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Focus input when popover opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset prompt when popover closes
  useEffect(() => {
    if (!isOpen) {
      setPromptValue('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(16, rect.left),
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
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

  // Simulate converting prompt to structured filters
  const handleApplyPrompt = () => {
    if (!promptValue.trim()) return;

    setIsProcessing(true);

    // Simulate AI processing delay
    setTimeout(() => {
      // Parse the prompt and create structured filters
      // This is a simple simulation - in reality, this would call an AI API
      const newFilters: DashboardFilter[] = [];

      // Simple keyword detection for demo
      const lowerPrompt = promptValue.toLowerCase();

      if (lowerPrompt.includes('this quarter') || lowerPrompt.includes('q1')) {
        newFilters.push({
          id: `filter-${Date.now()}-1`,
          field: 'Close Date',
          operator: 'in',
          value: 'This Quarter',
        });
      }

      if (lowerPrompt.includes('>') && lowerPrompt.includes('$')) {
        const match = promptValue.match(/>\s*\$?([\d,]+)k?/i);
        if (match) {
          const value = match[1].replace(/,/g, '');
          newFilters.push({
            id: `filter-${Date.now()}-2`,
            field: 'Amount',
            operator: 'greater than',
            value: value.includes('k') || lowerPrompt.includes('k') ? `${parseInt(value) * 1000}` : value,
          });
        }
      }

      if (lowerPrompt.includes('stage')) {
        const stages = ['Closed Won', 'Negotiation', 'Proposal', 'Discovery'];
        for (const stage of stages) {
          if (lowerPrompt.includes(stage.toLowerCase())) {
            newFilters.push({
              id: `filter-${Date.now()}-3`,
              field: 'Stage',
              operator: 'equals',
              value: stage,
            });
            break;
          }
        }
      }

      // If no specific filters detected, create a generic one
      if (newFilters.length === 0) {
        newFilters.push({
          id: `filter-${Date.now()}`,
          field: 'Name',
          operator: 'contains',
          value: promptValue,
        });
      }

      onFiltersChange([...filters, ...newFilters]);
      setIsProcessing(false);
      onClose();
    }, 800);
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
      className="fixed w-[400px] bg-white rounded-xl shadow-xl border border-gray-200 z-[10000] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <SparkleIcon size={16} className="text-indigo-600" />
        <span className="text-[13px] font-medium text-gray-900">Add Filter with AI</span>
      </div>

      {/* Prompt Input */}
      <div className="p-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isProcessing}
            className="w-full px-3 py-2.5 pr-10 text-[13px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow disabled:opacity-50"
          />
          {isProcessing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <SparkleIcon size={16} className="text-indigo-600" />
              </motion.div>
            </div>
          )}
        </div>

        <p className="mt-2 text-[11px] text-gray-500">
          Describe the filter in natural language. Press Enter to apply.
        </p>
      </div>

      {/* Existing Filters Preview */}
      {filters.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">
            Active Filters ({filters.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((filter) => (
              <span
                key={filter.id}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-gray-100 text-gray-700 rounded-md"
              >
                {filter.field} {filter.operator} "{filter.value}"
                <button
                  onClick={() => onFiltersChange(filters.filter((f) => f.id !== filter.id))}
                  className="ml-0.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <XIcon size={10} weight="bold" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton onClick={handleApplyPrompt} disabled={!promptValue.trim() || isProcessing}>
          {isProcessing ? 'Processing...' : 'Apply Filter'}
        </PrimaryButton>
      </div>
    </motion.div>,
    document.body
  );
};

// ============================================================================
// KPI Card Component
// ============================================================================

interface KPICardProps {
  data: KPICardData;
  isAnimating?: boolean;
  onDrillDown?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({ data, isAnimating, onDrillDown, onContextMenu, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={isAnimating ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-gray-200 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Actions */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-2 flex items-center gap-1"
          >
            <SecondaryIconButton
              icon={<TableIcon size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown?.();
              }}
              title="View data"
              size="small"
            />
            <SecondaryIconButton
              icon={<DotsThreeIcon size={14} weight="bold" />}
              onClick={(e) => {
                e.stopPropagation();
                onContextMenu?.(e);
              }}
              title="More options"
              size="small"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-gray-500 mb-1">{data.title}</p>
      <p className="text-2xl font-semibold text-gray-900 tabular-nums">{data.value}</p>
      {data.change && (
        <div className="flex items-center gap-1 mt-1">
          {data.changeDirection === 'up' && <ArrowUpIcon size={12} className="text-emerald-600" />}
          {data.changeDirection === 'down' && <ArrowDownIcon size={12} className="text-red-600" />}
          <span
            className={`text-xs font-medium ${
              data.changeDirection === 'up'
                ? 'text-emerald-600'
                : data.changeDirection === 'down'
                  ? 'text-red-600'
                  : 'text-gray-500'
            }`}
          >
            {data.change}
          </span>
          {data.subtitle && <span className="text-xs text-gray-500">{data.subtitle}</span>}
        </div>
      )}

      {/* Progress bar */}
      {data.progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">Progress</span>
            {data.target && (
              <span className="text-[10px] text-gray-500">Target: {data.target}</span>
            )}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, data.progress))}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                data.progress >= 100
                  ? 'bg-emerald-500'
                  : data.progress >= 75
                    ? 'bg-indigo-500'
                    : data.progress >= 50
                      ? 'bg-amber-500'
                      : 'bg-red-400'
              }`}
            />
          </div>
          <div className="flex items-center justify-end mt-0.5">
            <span className="text-[10px] font-medium text-gray-600">{Math.round(data.progress)}%</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// Chart Widget Component
// ============================================================================

interface ChartWidgetProps {
  data: ChartData;
  isAnimating?: boolean;
  onDrillDown?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onSegmentClick?: (segmentData: { name: string; value: number }) => void;
  onClick?: () => void;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ data, isAnimating, onDrillDown, onContextMenu, onSegmentClick, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const chartOptions: Highcharts.Options = useMemo(() => {
    const baseOptions: Highcharts.Options = {
      chart: {
        backgroundColor: 'transparent',
        style: { fontFamily: 'inherit' },
        spacing: [10, 10, 10, 10],
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
        itemStyle: { fontSize: '11px', fontWeight: '400', color: '#6b7280' },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        borderRadius: 8,
        style: { color: '#fff', fontSize: '11px' },
      },
    };

    if (data.type === 'bar') {
      const barData = data.data as { categories: string[]; series: { name: string; data: number[] }[] };
      return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'column' },
        xAxis: {
          categories: barData.categories,
          labels: { style: { fontSize: '10px', color: '#6b7280' } },
          lineColor: '#e5e7eb',
          tickColor: '#e5e7eb',
        },
        yAxis: {
          title: { text: undefined },
          labels: { style: { fontSize: '10px', color: '#6b7280' } },
          gridLineColor: '#f3f4f6',
        },
        plotOptions: {
          column: {
            borderRadius: 4,
            borderWidth: 0,
            groupPadding: 0.2,
            pointPadding: 0.1,
            cursor: onSegmentClick ? 'pointer' : 'default',
            point: {
              events: {
                click: function (this: Highcharts.Point) {
                  if (onSegmentClick) {
                    onSegmentClick({
                      name: this.category as string,
                      value: this.y as number,
                    });
                  }
                },
              },
            },
          },
        },
        colors: ['#4f46e5', '#818cf8'],
        series: barData.series as Highcharts.SeriesOptionsType[],
      };
    }

    if (data.type === 'pie') {
      const pieData = data.data as { name: string; y: number; color?: string }[];
      return {
        ...baseOptions,
        chart: { ...baseOptions.chart, type: 'pie' },
        plotOptions: {
          pie: {
            innerSize: '50%',
            borderWidth: 0,
            cursor: onSegmentClick ? 'pointer' : 'default',
            dataLabels: {
              enabled: true,
              format: '{point.name}: {point.percentage:.0f}%',
              style: { fontSize: '10px', fontWeight: '400', color: '#374151' },
            },
            point: {
              events: {
                click: function (this: Highcharts.Point) {
                  if (onSegmentClick) {
                    onSegmentClick({
                      name: this.name as string,
                      value: this.y as number,
                    });
                  }
                },
              },
            },
          },
        },
        series: [
          {
            type: 'pie',
            name: 'Distribution',
            data: pieData,
          },
        ],
      };
    }

    return baseOptions;
  }, [data, onSegmentClick]);

  return (
    <motion.div
      initial={isAnimating ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-[13px] font-medium text-gray-900">{data.title}</span>
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <SecondaryIconButton
                icon={<TableIcon size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDrillDown?.();
                }}
                title="View data"
                size="small"
              />
              <SecondaryIconButton
                icon={<DotsThreeIcon size={14} weight="bold" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onContextMenu?.(e);
                }}
                title="More options"
                size="small"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="p-4 h-64">
        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions}
          containerProps={{ style: { height: '100%', width: '100%' } }}
        />
      </div>
    </motion.div>
  );
};

// ============================================================================
// Settings Panel Component
// ============================================================================

type SettingsTab = 'refresh' | 'sharing' | 'details';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  anchorRef,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const [activeTab, setActiveTab] = useState<SettingsTab>('refresh');
  const [refreshFrequency, setRefreshFrequency] = useState('daily');

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
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

  if (!isOpen) return null;

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'refresh', label: 'Refresh', icon: <ArrowsClockwiseIcon size={14} /> },
    { id: 'sharing', label: 'Sharing', icon: <UsersIcon size={14} /> },
    { id: 'details', label: 'Details', icon: <InfoIcon size={14} /> },
  ];

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed w-[320px] bg-white rounded-xl shadow-xl border border-gray-200 z-[10000] overflow-hidden"
      style={{ top: position.top, right: position.right }}
    >
      {/* Header with pill tabs */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 text-[12px] font-medium rounded-md transition-all cursor-pointer
                ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'refresh' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                Refresh Frequency
              </label>
              <div className="space-y-2">
                {[
                  { value: 'realtime', label: 'Real-time', desc: 'Updates as data changes' },
                  { value: 'hourly', label: 'Hourly', desc: 'Every hour' },
                  { value: 'daily', label: 'Daily', desc: 'Once per day at midnight' },
                  { value: 'weekly', label: 'Weekly', desc: 'Every Monday' },
                  { value: 'manual', label: 'Manual only', desc: 'Click refresh to update' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors
                      ${
                        refreshFrequency === option.value
                          ? 'border-indigo-200 bg-indigo-50'
                          : 'border-gray-100 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="refreshFrequency"
                      value={option.value}
                      checked={refreshFrequency === option.value}
                      onChange={(e) => setRefreshFrequency(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`
                        w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${
                          refreshFrequency === option.value
                            ? 'border-indigo-600'
                            : 'border-gray-300'
                        }
                      `}
                    >
                      {refreshFrequency === option.value && (
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-900">{option.label}</p>
                      <p className="text-[11px] text-gray-500">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sharing' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                Visibility
              </label>
              <div className="space-y-2">
                {[
                  { value: 'private', label: 'Private', desc: 'Only you can view' },
                  { value: 'team', label: 'Team', desc: 'All team members can view' },
                  { value: 'org', label: 'Organization', desc: 'Everyone in organization' },
                ].map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <UsersIcon size={16} className="text-gray-400" />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-gray-900">{option.label}</p>
                      <p className="text-[11px] text-gray-500">{option.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <button className="flex items-center gap-2 text-[13px] text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer">
                <PaperPlaneTiltIcon size={14} />
                <span>Invite collaborators</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-3">
            {[
              { label: 'Created', value: 'Jan 15, 2025' },
              { label: 'Last modified', value: '2 hours ago' },
              { label: 'Owner', value: 'John Doe' },
              { label: 'Data sources', value: 'Salesforce, HubSpot' },
              { label: 'Widgets', value: '6 widgets' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5">
                <span className="text-[12px] text-gray-500">{item.label}</span>
                <span className="text-[13px] text-gray-900 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
        <GhostButton onClick={onClose}>Close</GhostButton>
      </div>
    </motion.div>,
    document.body
  );
};

// ============================================================================
// AI Column Types for Tables
// ============================================================================

interface AIColumnConfig {
  id: string;
  name: string;
  prompt: string;
}

// ============================================================================
// AI Column Popover for Tables
// ============================================================================

interface TableAIColumnPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  column: AIColumnConfig | null;
  onSave: (column: AIColumnConfig) => void;
  onDelete?: (columnId: string) => void;
}

const TableAIColumnPopover: React.FC<TableAIColumnPopoverProps> = ({
  isOpen,
  onClose,
  anchorRef,
  column,
  onSave,
  onDelete,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [columnName, setColumnName] = useState(column?.name || '');
  const [prompt, setPrompt] = useState(column?.prompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reasoning, setReasoning] = useState<string[]>([]);

  const isEditing = !!column;

  useEffect(() => {
    if (isOpen) {
      setColumnName(column?.name || '');
      setPrompt(column?.prompt || '');
      setIsGenerating(false);
      setReasoning([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, column]);

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left - 150, window.innerWidth - 400 - 16)),
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
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

  const handleGenerate = () => {
    if (!columnName.trim() || !prompt.trim()) return;

    setIsGenerating(true);
    setReasoning([]);

    const reasoningSteps = [
      'Analyzing data structure...',
      'Processing prompt...',
      `Generating "${columnName}"...`,
      'Validating results...',
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < reasoningSteps.length) {
        setReasoning((prev) => [...prev, reasoningSteps[stepIndex]]);
        stepIndex++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
        onSave({
          id: column?.id || `ai-col-${Date.now()}`,
          name: columnName,
          prompt: prompt,
        });
        onClose();
      }
    }, 300);
  };

  if (!isOpen) return null;

  return createPortal(
    <motion.div
      ref={popoverRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="fixed w-[380px] bg-white rounded-xl shadow-xl border border-gray-200 z-[10000]"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SparkleIcon size={16} className="text-indigo-600" />
          <span className="text-[13px] font-medium text-gray-900">
            {isEditing ? 'Edit AI Column' : 'Add AI Column'}
          </span>
        </div>
        {isEditing && onDelete && (
          <button
            onClick={() => {
              onDelete(column.id);
              onClose();
            }}
            className="text-[12px] text-red-600 hover:text-red-700 cursor-pointer"
          >
            Delete
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Column Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            placeholder="e.g., Risk Score"
            disabled={isGenerating}
            className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe how to generate values..."
            disabled={isGenerating}
            rows={2}
            className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none disabled:opacity-50"
          />
        </div>

        {reasoning.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[11px] font-medium text-gray-700 mb-1.5">AI Reasoning</p>
            <div className="space-y-1">
              {reasoning.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-1.5 text-[11px] text-gray-600"
                >
                  <span className="text-indigo-500">•</span>
                  <span>{step}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <GhostButton onClick={onClose} disabled={isGenerating}>Cancel</GhostButton>
        <PrimaryButton
          onClick={handleGenerate}
          disabled={!columnName.trim() || !prompt.trim() || isGenerating}
        >
          {isGenerating ? 'Generating...' : isEditing ? 'Update' : 'Generate'}
        </PrimaryButton>
      </div>
    </motion.div>,
    document.body
  );
};

// ============================================================================
// Table Widget Component
// ============================================================================

interface TableWidgetProps {
  data: TableData;
  isAnimating?: boolean;
  onDrillDown?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

const TableWidget: React.FC<TableWidgetProps> = ({ data, isAnimating, onDrillDown, onContextMenu, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [aiColumns, setAiColumns] = useState<AIColumnConfig[]>([]);
  const [aiColumnData, setAiColumnData] = useState<Record<string, Record<number, string>>>({});
  const [showAIColumnPopover, setShowAIColumnPopover] = useState(false);
  const [editingAIColumn, setEditingAIColumn] = useState<AIColumnConfig | null>(null);
  const aiColumnButtonRef = useRef<HTMLButtonElement>(null);

  const formatValue = (value: unknown, type?: string): string => {
    if (value === null || value === undefined) return '—';
    if (type === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    if (type === 'date' && typeof value === 'string') {
      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return String(value);
  };

  const handleAIColumnSave = (column: AIColumnConfig) => {
    setAiColumns((prev) => {
      const exists = prev.find((c) => c.id === column.id);
      if (exists) return prev.map((c) => (c.id === column.id ? column : c));
      return [...prev, column];
    });

    // Generate sample values
    const samples = ['High', 'Medium', 'Low', 'Critical', 'Normal'];
    setTimeout(() => {
      const newData: Record<number, string> = {};
      data.rows.forEach((_, idx) => {
        newData[idx] = samples[idx % samples.length];
      });
      setAiColumnData((prev) => ({ ...prev, [column.id]: newData }));
    }, 300);
  };

  const handleAIColumnDelete = (columnId: string) => {
    setAiColumns((prev) => prev.filter((c) => c.id !== columnId));
    setAiColumnData((prev) => {
      const newData = { ...prev };
      delete newData[columnId];
      return newData;
    });
  };

  return (
    <motion.div
      initial={isAnimating ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-[13px] font-medium text-gray-900">{data.title}</span>
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <SecondaryIconButton
                icon={<TableIcon size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDrillDown?.();
                }}
                title="View full data"
                size="small"
              />
              <SecondaryIconButton
                icon={<DotsThreeIcon size={14} weight="bold" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onContextMenu?.(e);
                }}
                title="More options"
                size="small"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-80">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              {data.columns.map((col) => (
                <th
                  key={col.id}
                  className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide"
                >
                  {col.label}
                </th>
              ))}
              {/* AI Columns Headers */}
              {aiColumns.map((aiCol) => (
                <th key={aiCol.id} className="text-left px-4 py-2 text-xs font-medium uppercase tracking-wide group">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAIColumn(aiCol);
                      setShowAIColumnPopover(true);
                    }}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    <SparkleIcon size={10} />
                    <span>{aiCol.name}</span>
                    <PencilSimpleIcon size={10} className="opacity-0 group-hover:opacity-100" />
                  </button>
                </th>
              ))}
              {/* Add AI Column */}
              <th className="text-left px-4 py-2">
                <button
                  ref={aiColumnButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAIColumn(null);
                    setShowAIColumnPopover(true);
                  }}
                  className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 cursor-pointer"
                >
                  <SparkleIcon size={10} />
                  <span>AI</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.rows.slice(0, 10).map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {data.columns.map((col) => (
                  <td
                    key={col.id}
                    className={`px-4 py-2 text-gray-900 ${col.type === 'currency' || col.type === 'number' ? 'tabular-nums' : ''}`}
                  >
                    {formatValue(row[col.id], col.type)}
                  </td>
                ))}
                {/* AI Columns Data */}
                {aiColumns.map((aiCol) => (
                  <td key={aiCol.id} className="px-4 py-2 text-gray-900">
                    {aiColumnData[aiCol.id]?.[idx] || <span className="text-gray-400 italic text-[11px]">...</span>}
                  </td>
                ))}
                <td className="px-4 py-2" />
              </tr>
            ))}
          </tbody>
        </table>
        {data.rows.length > 10 && (
          <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
            Showing 10 of {data.rows.length} rows
          </div>
        )}
      </div>

      {/* AI Column Popover */}
      <AnimatePresence>
        <TableAIColumnPopover
          isOpen={showAIColumnPopover}
          onClose={() => {
            setShowAIColumnPopover(false);
            setEditingAIColumn(null);
          }}
          anchorRef={aiColumnButtonRef}
          column={editingAIColumn}
          onSave={handleAIColumnSave}
          onDelete={handleAIColumnDelete}
        />
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// Text Widget Component
// ============================================================================

interface TextWidgetProps {
  data: TextWidgetData;
  isAnimating?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  onChange?: (content: string) => void;
}

const TextWidget: React.FC<TextWidgetProps> = ({ data, isAnimating, onContextMenu, onClick, onChange }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxChars = data.maxCharacters || 500;
  const charCount = content.length;
  const isOverLimit = charCount > maxChars;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content, isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (!isOverLimit) {
      onChange?.(content);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContent(data.content);
  };

  return (
    <motion.div
      initial={isAnimating ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-200 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!isEditing) onClick?.();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <NoteIcon size={16} className="text-gray-500" />
          <span className="text-[13px] font-medium text-gray-900">{data.title}</span>
          {data.isAIGenerated && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 rounded">
              <SparkleIcon size={10} className="text-indigo-600" />
              <span className="text-[10px] text-indigo-600 font-medium">AI</span>
            </div>
          )}
        </div>
        <AnimatePresence>
          {isHovered && !isEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1"
            >
              <SecondaryIconButton
                icon={<PencilSimpleIcon size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                title="Edit"
                size="small"
              />
              <SecondaryIconButton
                icon={<DotsThreeIcon size={14} weight="bold" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onContextMenu?.(e);
                }}
                title="More options"
                size="small"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`
                w-full px-3 py-2 text-[13px] text-gray-900 bg-gray-50 border rounded-lg
                placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
                resize-none min-h-[100px] leading-relaxed
                ${isOverLimit ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}
              `}
              placeholder="Add your notes here..."
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${isOverLimit ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                {charCount}/{maxChars} characters
              </span>
              <div className="flex items-center gap-2">
                <GhostButton onClick={handleCancel}>Cancel</GhostButton>
                <PrimaryButton onClick={handleSave} disabled={isOverLimit}>
                  Save
                </PrimaryButton>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {content ? (
              <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
            ) : (
              <p className="text-[13px] text-gray-400 italic">Click edit to add notes...</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const DashboardV2: React.FC<DashboardV2Props> = ({
  name,
  kpiCards,
  barChart,
  pieChart,
  table,
  textWidget,
  onTextWidgetChange,
  isBuilding = false,
  visibleWidgets = [],
  onWidgetDrillDown,
  onWidgetEdit,
  onWidgetDelete,
  onFilterClick,
  onExportClick,
  onRefreshClick,
  onShareClick,
  onEditClick,
  onNameChange,
  isEditMode = false,
  timelineFilter = 'this-quarter',
  onTimelineFilterChange,
  ownerFilter = 'all',
  onOwnerFilterChange,
  ownerOptions = [],
  advancedFilters = [],
  onAdvancedFiltersChange,
  availableFilterFields = [],
  onChartSegmentClick,
  onCancelClick,
  timestamp,
  createdBy,
  onWidgetClick,
}) => {
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const timelineButtonRef = useRef<HTMLButtonElement>(null);
  const ownerButtonRef = useRef<HTMLButtonElement>(null);
  const shareButtonRef = useRef<HTMLDivElement>(null);
  const editButtonRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [showTimelinePopover, setShowTimelinePopover] = useState(false);
  const [showOwnerPopover, setShowOwnerPopover] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Derive owner options for dropdown
  const ownerDropdownOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [{ value: 'all', label: 'All Owners' }];
    ownerOptions.forEach((owner) => {
      options.push({ value: owner.id, label: owner.name });
    });
    return options;
  }, [ownerOptions]);

  // Derive field options for filter rows (kept for AdvancedFiltersPopover if needed)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _fieldOptions = useMemo(() => {
    return availableFilterFields.map((f) => ({ value: f, label: f }));
  }, [availableFilterFields]);

  // Get display labels for current filter values
  const timelineLabel = TIMELINE_OPTIONS.find((o) => o.value === timelineFilter)?.label || 'This Quarter';
  const ownerLabel = ownerDropdownOptions.find((o) => o.value === ownerFilter)?.label || 'All Owners';

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { top: number; left: number };
    widgetId: string | null;
  }>({ isOpen: false, position: { top: 0, left: 0 }, widgetId: null });

  // Close all popovers when one opens
  const handleOpenTimelinePopover = () => {
    setShowTimelinePopover(true);
    setShowOwnerPopover(false);
    setShowAdvancedFilters(false);
  };

  const handleOpenOwnerPopover = () => {
    setShowOwnerPopover(true);
    setShowTimelinePopover(false);
    setShowAdvancedFilters(false);
  };

  const handleOpenAdvancedFilters = () => {
    setShowAdvancedFilters(true);
    setShowTimelinePopover(false);
    setShowOwnerPopover(false);
  };

  const handleContextMenu = (e: React.MouseEvent, widgetId: string) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { top: e.clientY, left: e.clientX },
      widgetId,
    });
  };

  const handleContextMenuAction = (actionId: string) => {
    if (!contextMenu.widgetId) return;
    if (actionId === 'edit') {
      onWidgetEdit?.(contextMenu.widgetId);
    } else if (actionId === 'delete') {
      onWidgetDelete?.(contextMenu.widgetId);
    }
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const isWidgetVisible = (widgetId: string) => {
    if (!isBuilding) return true;
    return visibleWidgets.includes(widgetId);
  };

  return (
    <div className="px-2 h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        {/* Left side - Dashboard Name and metadata */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Dashboard Name - Editable */}
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={() => {
                setIsEditingName(false);
                if (editedName.trim() && editedName !== name) {
                  onNameChange?.(editedName.trim());
                } else {
                  setEditedName(name);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingName(false);
                  if (editedName.trim() && editedName !== name) {
                    onNameChange?.(editedName.trim());
                  }
                }
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                  setEditedName(name);
                }
              }}
              autoFocus
              className="text-[13px] font-medium text-gray-900 bg-transparent border-b border-indigo-500 outline-none px-0 py-0"
            />
          ) : (
            <span
              className={`text-[13px] font-medium text-gray-900 ${onNameChange ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''}`}
              onClick={() => {
                if (onNameChange) {
                  setIsEditingName(true);
                }
              }}
              title={onNameChange ? 'Click to edit name' : undefined}
            >
              {name}
            </span>
          )}

          {/* Timestamp with Refresh */}
          {(timestamp || createdBy || onRefreshClick) && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 whitespace-nowrap">
              {onRefreshClick && (
                <button
                  onClick={onRefreshClick}
                  className="flex items-center gap-1 px-1.5 py-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                  title="Refresh now"
                >
                  <ArrowsClockwiseIcon size={12} />
                </button>
              )}
              {timestamp && <span>Last refreshed {timestamp}</span>}
              {timestamp && createdBy && <span>•</span>}
              {createdBy && <span>by {createdBy}</span>}
            </div>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Export Button */}
          {onExportClick && (
            <SecondaryIconButton
              icon={<DownloadIcon size={14} />}
              onClick={onExportClick}
              title="Export as PDF"
            />
          )}

          {/* Share Button */}
          {onShareClick && (
            <div ref={shareButtonRef}>
              <SecondaryIconButton
                icon={<PaperPlaneTiltIcon size={14} />}
                onClick={() => {
                  if (shareButtonRef.current) {
                    onShareClick(shareButtonRef.current.getBoundingClientRect());
                  }
                }}
                title="Share dashboard"
              />
            </div>
          )}

          {/* Settings Button */}
          <button
            ref={settingsButtonRef}
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className={`
              p-2 rounded-lg transition-colors cursor-pointer
              ${showSettingsPanel
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }
            `}
            title="Settings"
          >
            <GearIcon size={16} />
          </button>

          {/* Separator before Cancel */}
          {onCancelClick && <div className="h-6 w-px bg-gray-200" />}

          {/* Cancel Button */}
          {onCancelClick && (
            <button
              onClick={onCancelClick}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Close dashboard"
            >
              <XIcon size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
        {/* Timeline Filter Button */}
        {onTimelineFilterChange && (
          <button
            ref={timelineButtonRef}
            onClick={handleOpenTimelinePopover}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[13px] transition-colors cursor-pointer
              ${
                showTimelinePopover
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200'
              }
            `}
          >
            <CalendarIcon size={14} />
            <span>{timelineLabel}</span>
            <CaretDownIcon size={12} className="text-gray-400" />
          </button>
        )}

        {/* Owner Filter Button */}
        {onOwnerFilterChange && ownerDropdownOptions.length > 1 && (
          <button
            ref={ownerButtonRef}
            onClick={handleOpenOwnerPopover}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[13px] transition-colors cursor-pointer
              ${
                showOwnerPopover
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200'
              }
            `}
          >
            <UserIcon size={14} />
            <span>{ownerLabel}</span>
            <CaretDownIcon size={12} className="text-gray-400" />
          </button>
        )}

        {/* Advanced Filters Button */}
        {onAdvancedFiltersChange && (
          <button
            ref={filterButtonRef}
            onClick={handleOpenAdvancedFilters}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[13px] transition-colors cursor-pointer
              ${
                showAdvancedFilters || advancedFilters.length > 0
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200'
              }
            `}
          >
            <FunnelIcon size={14} />
            <span>Filters</span>
            {advancedFilters.length > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-medium bg-indigo-600 text-white rounded-full">
                {advancedFilters.length}
              </span>
            )}
          </button>
        )}

        {/* Legacy Filter Button (for backwards compatibility) */}
        {onFilterClick && !onAdvancedFiltersChange && (
          <button
            ref={filterButtonRef}
            onClick={() => {
              if (filterButtonRef.current) {
                onFilterClick(filterButtonRef.current.getBoundingClientRect());
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] text-gray-700 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-gray-200 transition-colors cursor-pointer"
          >
            <FunnelIcon size={14} />
            <span>Filter</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-3 gap-4">
            {kpiCards.map((kpi) => (
              <AnimatePresence key={kpi.id}>
                {isWidgetVisible(kpi.id) && (
                  <KPICard
                    data={kpi}
                    isAnimating={isBuilding}
                    onDrillDown={() => onWidgetDrillDown?.(kpi.id)}
                    onContextMenu={(e) => handleContextMenu(e, kpi.id)}
                    onClick={() => onWidgetClick?.(kpi.id)}
                  />
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4">
            {barChart && (
              <AnimatePresence>
                {isWidgetVisible(barChart.id) && (
                  <ChartWidget
                    data={barChart}
                    isAnimating={isBuilding}
                    onDrillDown={() => onWidgetDrillDown?.(barChart.id)}
                    onContextMenu={(e) => handleContextMenu(e, barChart.id)}
                    onSegmentClick={
                      onChartSegmentClick
                        ? (segmentData) => onChartSegmentClick(barChart.id, segmentData)
                        : undefined
                    }
                    onClick={() => onWidgetClick?.(barChart.id)}
                  />
                )}
              </AnimatePresence>
            )}
            {pieChart && (
              <AnimatePresence>
                {isWidgetVisible(pieChart.id) && (
                  <ChartWidget
                    data={pieChart}
                    isAnimating={isBuilding}
                    onDrillDown={() => onWidgetDrillDown?.(pieChart.id)}
                    onContextMenu={(e) => handleContextMenu(e, pieChart.id)}
                    onSegmentClick={
                      onChartSegmentClick
                        ? (segmentData) => onChartSegmentClick(pieChart.id, segmentData)
                        : undefined
                    }
                    onClick={() => onWidgetClick?.(pieChart.id)}
                  />
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Table */}
          {table && (
            <AnimatePresence>
              {isWidgetVisible(table.id) && (
                <TableWidget
                  data={table}
                  isAnimating={isBuilding}
                  onDrillDown={() => onWidgetDrillDown?.(table.id)}
                  onContextMenu={(e) => handleContextMenu(e, table.id)}
                  onClick={() => onWidgetClick?.(table.id)}
                />
              )}
            </AnimatePresence>
          )}

          {/* Text Widget */}
          {textWidget && (
            <AnimatePresence>
              {isWidgetVisible(textWidget.id) && (
                <TextWidget
                  data={textWidget}
                  isAnimating={isBuilding}
                  onContextMenu={(e) => handleContextMenu(e, textWidget.id)}
                  onClick={() => onWidgetClick?.(textWidget.id)}
                  onChange={onTextWidgetChange}
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        items={getWidgetContextMenuItems()}
        fixedPosition={contextMenu.position}
        width={128}
        onItemClick={(item) => handleContextMenuAction(item.id)}
      />

      {/* Timeline Filter Popover */}
      <AnimatePresence>
        {onTimelineFilterChange && (
          <FilterDropdownPopover
            isOpen={showTimelinePopover}
            onClose={() => setShowTimelinePopover(false)}
            anchorRef={timelineButtonRef}
            options={TIMELINE_OPTIONS}
            value={timelineFilter}
            onChange={(value) => {
              onTimelineFilterChange(value as TimelineFilter);
            }}
            title="Time Period"
          />
        )}
      </AnimatePresence>

      {/* Owner Filter Popover */}
      <AnimatePresence>
        {onOwnerFilterChange && (
          <FilterDropdownPopover
            isOpen={showOwnerPopover}
            onClose={() => setShowOwnerPopover(false)}
            anchorRef={ownerButtonRef}
            options={ownerDropdownOptions}
            value={ownerFilter}
            onChange={(value) => {
              onOwnerFilterChange(value);
            }}
            title="Owner"
          />
        )}
      </AnimatePresence>

      {/* Prompt-Based Filters Popover */}
      <AnimatePresence>
        {onAdvancedFiltersChange && (
          <PromptBasedFilterPopover
            isOpen={showAdvancedFilters}
            onClose={() => setShowAdvancedFilters(false)}
            anchorRef={filterButtonRef}
            filters={advancedFilters}
            onFiltersChange={onAdvancedFiltersChange}
          />
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        <SettingsPanel
          isOpen={showSettingsPanel}
          onClose={() => setShowSettingsPanel(false)}
          anchorRef={settingsButtonRef}
        />
      </AnimatePresence>
    </div>
  );
};

export default DashboardV2;
