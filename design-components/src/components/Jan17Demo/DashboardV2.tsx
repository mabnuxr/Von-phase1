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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [showTimelinePopover, setShowTimelinePopover] = useState(false);
  const [showOwnerPopover, setShowOwnerPopover] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Derive owner options for dropdown
  const ownerDropdownOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [{ value: 'all', label: 'All Owners' }];
    ownerOptions.forEach((owner) => {
      options.push({ value: owner.id, label: owner.name });
    });
    return options;
  }, [ownerOptions]);

  // Derive field options for filter rows
  const fieldOptions = useMemo(() => {
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

          {/* Timestamp and Created By */}
          {(timestamp || createdBy) && (
            <span className="text-[11px] text-gray-400 whitespace-nowrap">
              {timestamp && `Updated ${timestamp}`}
              {timestamp && createdBy && ' • '}
              {createdBy && `by ${createdBy}`}
            </span>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          {onRefreshClick && (
            <SecondaryIconButton
              icon={<ArrowsClockwiseIcon size={14} />}
              onClick={onRefreshClick}
              title="Refresh now • Refreshes automatically daily"
            />
          )}

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

      {/* Advanced Filters Popover */}
      <AnimatePresence>
        {onAdvancedFiltersChange && (
          <AdvancedFiltersPopover
            isOpen={showAdvancedFilters}
            onClose={() => setShowAdvancedFilters(false)}
            anchorRef={filterButtonRef}
            filters={advancedFilters}
            fieldOptions={fieldOptions}
            onFiltersChange={onAdvancedFiltersChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardV2;
