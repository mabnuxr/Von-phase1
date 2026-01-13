import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  GridFourIcon,
  TableIcon,
  PencilSimpleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ColumnsIcon,
  SparkleIcon,
  XIcon,
  DotsSixVerticalIcon,
  CheckIcon,
  DownloadIcon,
  ArrowsClockwiseIcon,
  PaperPlaneTiltIcon,
} from '@phosphor-icons/react';
import GridLayout, { noCompactor } from 'react-grid-layout';
import type { Layout, LayoutItem } from 'react-grid-layout';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { SecondaryIconButton, AddButton } from '../../forms/buttons';
import { FilterRow } from '../../forms/filter';
import {
  WidgetConfigPopover,
  WidgetDetailSheet,
  type DataSourceOption,
  type WidgetConfig,
  type DrillDownFilter,
  type SourceDataColumn,
  type SourceDataRow,
} from '../../popups';
import type { ChartComponent } from '../../Pane1/Pane1';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// ============================================================================
// Types
// ============================================================================

export type Pane2Mode = 'dashboard' | 'data';

export interface DashboardWidgetData {
  id: string;
  type: 'chart' | 'metric' | 'table';
  chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table';
  title: string;
  reportId?: string;
  config?: Record<string, unknown>;
}

export interface FilterConfig {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface ColumnConfig {
  id: string;
  label: string;
  isVisible: boolean;
  isAI?: boolean;
}

export interface Pane2Props {
  /**
   * Current mode (dashboard builder or data view)
   */
  mode: Pane2Mode;

  /**
   * Dashboard name (displayed in header when in dashboard mode)
   */
  dashboardName?: string;

  /**
   * Report name (displayed in header when in data mode)
   */
  reportName?: string;

  /**
   * Callback when filter button is clicked
   */
  onFilterClick?: (buttonRect: DOMRect) => void;

  /**
   * Callback when export button is clicked
   */
  onExportClick?: () => void;

  /**
   * Callback when refresh button is clicked
   */
  onRefreshClick?: () => void;

  /**
   * Callback when share button is clicked
   */
  onShareClick?: (buttonRect: DOMRect) => void;

  /**
   * Dashboard layout (for react-grid-layout)
   */
  layout?: LayoutItem[];

  /**
   * Dashboard widgets data
   */
  widgets?: Record<string, DashboardWidgetData>;

  /**
   * Called when layout changes
   */
  onLayoutChange?: (layout: Layout) => void;

  /**
   * Called when a widget is selected
   */
  onWidgetSelect?: (widgetId: string | null) => void;

  /**
   * Currently selected widget ID
   */
  selectedWidgetId?: string | null;

  /**
   * Called when a component is dropped onto the grid
   */
  onDrop?: (component: ChartComponent, position: { x: number; y: number }) => void;

  /**
   * Called when drop zone is triggered (for state-based drag handling)
   */
  onDropZone?: (position: { x: number; y: number }) => void;

  /**
   * Currently dragging component (for state-based drag handling)
   */
  draggingComponent?: ChartComponent | null;

  /**
   * Called when a widget is edited
   */
  onWidgetEdit?: (widgetId: string) => void;

  /**
   * Called when a widget is deleted
   */
  onWidgetDelete?: (widgetId: string) => void;

  /**
   * Whether to show empty state
   */
  isEmpty?: boolean;

  /**
   * Report table component (rendered when in data mode)
   */
  reportTableContent?: React.ReactNode;

  /**
   * Whether dragging is happening from Pane1
   */
  isDraggingOver?: boolean;

  /**
   * ID of widget currently being edited (shows "Editing" pill)
   */
  editingWidgetId?: string | null;

  /**
   * Fixed width for the grid
   */
  width?: number;

  // ===== Data View Toolbar Props =====

  /**
   * Search value for data view
   */
  searchValue?: string;

  /**
   * Callback when search value changes
   */
  onSearchChange?: (value: string) => void;

  /**
   * Active filters in data view
   */
  filters?: FilterConfig[];

  /**
   * Callback when filters change
   */
  onFiltersChange?: (filters: FilterConfig[]) => void;

  /**
   * Column configurations for data view
   */
  columns?: ColumnConfig[];

  /**
   * Callback when column visibility changes
   */
  onColumnsChange?: (columns: ColumnConfig[]) => void;

  /**
   * Callback when user wants to add an AI column
   */
  onAddAIColumn?: () => void;

  /**
   * Available fields for filtering
   */
  filterFields?: string[];

  // ===== Widget Configuration Props =====

  /**
   * Available data sources for widget configuration
   */
  dataSources?: DataSourceOption[];

  /**
   * Called when a new widget is configured and saved
   */
  onWidgetConfigSave?: (config: WidgetConfig, position: { x: number; y: number }) => void;

  /**
   * Called when widget configuration is cancelled
   */
  onWidgetConfigCancel?: () => void;

  // ===== Widget Detail Sheet Props =====

  /**
   * Available drill-down filters for widget details
   */
  drillDownFilters?: DrillDownFilter[];

  /**
   * Get source data columns for a widget
   */
  getWidgetSourceColumns?: (widgetId: string) => SourceDataColumn[];

  /**
   * Get source data rows for a widget
   */
  getWidgetSourceData?: (widgetId: string) => SourceDataRow[];

  /**
   * Called when drill-down filter changes in widget detail
   */
  onWidgetDrillDownChange?: (widgetId: string, filterId: string, value: string) => void;
}

// ============================================================================
// Grid Constants
// ============================================================================

const COLS = 10; // 10 column grid (allows max 5 widgets per row with minW=2)
const ROW_HEIGHT = 80; // 80px row height (10 units of 8px for 8px increment resizing)
const MIN_WIDGET_COLS = 2; // 2 columns minimum = ~200px (each col varies by container width)
const MIN_WIDGET_ROWS = 3; // 3 rows minimum = 240px + margins (~200px visible + 32px header)
const DEFAULT_WIDGET_COLS = 3; // 3 columns default = ~240px width
const DEFAULT_WIDGET_ROWS = 4; // 4 rows default = 320px height
// Reserved for future use: Tables take full width (10 cols) and default to 320px height (4 rows)
const MARGIN = 8; // 8px margin (aligns to 8px grid)
const PADDING = 16; // 16px padding (2 units of 8px)

// ============================================================================
// Demo Data for Charts
// ============================================================================

const demoChartData = {
  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  series: [
    { name: 'Revenue', data: [120, 150, 180, 200, 220, 280] },
    { name: 'Pipeline', data: [80, 100, 130, 150, 170, 200] },
  ],
  pieData: [
    { name: 'Won', y: 45, color: '#4f46e5' },
    { name: 'Lost', y: 20, color: '#ef4444' },
    { name: 'In Progress', y: 35, color: '#f59e0b' },
  ],
};

// Demo table data for table widgets
const demoTableData = [
  { account: 'Acme Corp', stage: 'Negotiation', amount: '$125,000', owner: 'Sarah Chen' },
  { account: 'TechStart Inc', stage: 'Proposal', amount: '$85,000', owner: 'Mike Johnson' },
  { account: 'Global Systems', stage: 'Discovery', amount: '$200,000', owner: 'Alex Kim' },
  { account: 'DataFlow Ltd', stage: 'Closed Won', amount: '$150,000', owner: 'Jordan Lee' },
  { account: 'CloudNine SaaS', stage: 'Qualification', amount: '$95,000', owner: 'Sarah Chen' },
];

// ============================================================================
// Widget Component
// ============================================================================

interface WidgetCardProps {
  widget: DashboardWidgetData;
  isSelected: boolean;
  isEditing?: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const WidgetCard: React.FC<WidgetCardProps> = ({
  widget,
  isSelected,
  isEditing = false,
  onClick,
  onEdit,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const getChartIcon = () => {
    switch (widget.chartType) {
      case 'bar':
        return '📊';
      case 'line':
        return '📈';
      case 'pie':
        return '🥧';
      case 'donut':
        return '🍩';
      case 'metric':
        return '#';
      case 'table':
        return '📋';
      default:
        return '📊';
    }
  };

  // Generate Highcharts options based on chart type
  const chartOptions: Highcharts.Options | null = useMemo(() => {
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
        itemStyle: { fontSize: '10px', fontWeight: '400', color: '#6b7280' },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        borderRadius: 8,
        style: { color: '#fff', fontSize: '11px' },
      },
    };

    switch (widget.chartType) {
      case 'bar':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'column' },
          xAxis: {
            categories: demoChartData.categories,
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
            },
          },
          colors: ['#4f46e5', '#818cf8'],
          series: demoChartData.series as Highcharts.SeriesOptionsType[],
        };

      case 'line':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'line' },
          xAxis: {
            categories: demoChartData.categories,
            labels: { style: { fontSize: '10px', color: '#6b7280' } },
            lineColor: '#e5e7eb',
          },
          yAxis: {
            title: { text: undefined },
            labels: { style: { fontSize: '10px', color: '#6b7280' } },
            gridLineColor: '#f3f4f6',
          },
          plotOptions: {
            line: {
              marker: { enabled: true, radius: 4 },
              lineWidth: 2,
            },
          },
          colors: ['#4f46e5', '#818cf8'],
          series: demoChartData.series as Highcharts.SeriesOptionsType[],
        };

      case 'pie':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'pie' },
          plotOptions: {
            pie: {
              innerSize: 0,
              borderWidth: 0,
              dataLabels: {
                enabled: true,
                format: '{point.name}: {point.percentage:.0f}%',
                style: { fontSize: '10px', fontWeight: '400', color: '#374151' },
              },
            },
          },
          series: [
            {
              type: 'pie',
              name: 'Deals',
              data: demoChartData.pieData,
            },
          ],
        };

      case 'donut':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'pie' },
          plotOptions: {
            pie: {
              innerSize: '60%',
              borderWidth: 0,
              dataLabels: {
                enabled: true,
                format: '{point.name}: {point.percentage:.0f}%',
                style: { fontSize: '10px', fontWeight: '400', color: '#374151' },
              },
            },
          },
          series: [
            {
              type: 'pie',
              name: 'Deals',
              data: demoChartData.pieData,
            },
          ],
        };

      default:
        return null;
    }
  }, [widget.chartType]);

  // Render metric card content
  const renderMetricContent = () => {
    const metricValue = '$1.26M';
    const metricChange = '+12.5%';
    const metricLabel = 'Total Pipeline Value';

    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <p className="text-4xl font-bold text-gray-900 tabular-nums">{metricValue}</p>
        <p className="text-sm font-medium text-emerald-600 mt-1">{metricChange}</p>
        <p className="text-xs text-gray-500 mt-2">{metricLabel}</p>
      </div>
    );
  };

  // Render table widget content
  const renderTableContent = () => {
    return (
      <div className="h-full overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-500 uppercase tracking-wide">
                Account
              </th>
              <th className="text-left px-3 py-2 font-medium text-gray-500 uppercase tracking-wide">
                Stage
              </th>
              <th className="text-left px-3 py-2 font-medium text-gray-500 uppercase tracking-wide">
                Amount
              </th>
              <th className="text-left px-3 py-2 font-medium text-gray-500 uppercase tracking-wide">
                Owner
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {demoTableData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-900">{row.account}</td>
                <td className="px-3 py-2 text-gray-600">{row.stage}</td>
                <td className="px-3 py-2 text-gray-900 font-medium">{row.amount}</td>
                <td className="px-3 py-2 text-gray-600">{row.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render editing placeholder
  const renderEditingPlaceholder = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <GridFourIcon size={32} className="text-gray-300 mb-2" weight="duotone" />
        <p className="text-sm text-gray-500 font-medium">No data</p>
        <p className="text-xs text-gray-400 mt-1">Configuration in progress</p>
      </div>
    );
  };

  // Render chart content
  const renderChartContent = () => {
    // Show placeholder when widget is being edited
    if (isEditing) {
      return renderEditingPlaceholder();
    }

    if (widget.chartType === 'metric') {
      return renderMetricContent();
    }

    if (widget.chartType === 'table') {
      return renderTableContent();
    }

    if (chartOptions) {
      return (
        <div ref={chartContainerRef} className="h-full w-full">
          <HighchartsReact
            highcharts={Highcharts}
            options={chartOptions}
            containerProps={{ style: { height: '100%', width: '100%' } }}
          />
        </div>
      );
    }

    // Fallback for unknown chart types
    return (
      <div className="text-center">
        <span className="text-4xl mb-2 block">{getChartIcon()}</span>
        <p className="text-xs text-gray-700">{widget.chartType || 'Chart'} Widget</p>
      </div>
    );
  };

  return (
    <div
      className={`
        widget-drag-handle h-full w-full rounded-xl border-2 transition-all cursor-pointer flex flex-col select-none overflow-hidden
        ${isEditing ? 'border-emerald-500 bg-emerald-50/30' : isSelected ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-medium text-gray-900 truncate">{widget.title}</span>
        </div>
        {/* Show "Editing" pill when in editing mode, otherwise show edit/delete icons */}
        {isEditing ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-100 rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Editing
          </span>
        ) : isHovered || isSelected ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <SecondaryIconButton
              icon={<PencilSimpleIcon size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              title="Edit"
              size="small"
            />
            <SecondaryIconButton
              icon={<TrashIcon size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              title="Delete"
              size="small"
            />
          </div>
        ) : null}
      </div>

      {/* Content - Render actual charts */}
      <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-hidden">
        {renderChartContent()}
      </div>
    </div>
  );
};

// ============================================================================
// Data Toolbar Component
// ============================================================================

interface DataToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FilterConfig[];
  onFiltersChange: (filters: FilterConfig[]) => void;
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  onAddAIColumn?: () => void;
  filterFields: string[];
}

const DataToolbar: React.FC<DataToolbarProps> = ({
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  columns,
  onColumnsChange,
  onAddAIColumn,
  filterFields,
}) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const columnButtonRef = useRef<HTMLButtonElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const [filterDropdownPosition, setFilterDropdownPosition] = useState({ top: 0, left: 0 });
  const [columnDropdownPosition, setColumnDropdownPosition] = useState({ top: 0, right: 0 });

  // Update dropdown positions when opening
  useEffect(() => {
    if (showFilterDropdown && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setFilterDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [showFilterDropdown]);

  useEffect(() => {
    if (showColumnDropdown && columnButtonRef.current) {
      const rect = columnButtonRef.current.getBoundingClientRect();
      setColumnDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  }, [showColumnDropdown]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        showFilterDropdown &&
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(target)
      ) {
        setShowFilterDropdown(false);
      }
      if (
        showColumnDropdown &&
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(target) &&
        columnButtonRef.current &&
        !columnButtonRef.current.contains(target)
      ) {
        setShowColumnDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown, showColumnDropdown]);

  // Convert filterFields to format expected by FilterRow
  const filterFieldOptions = filterFields.map((f) => ({ value: f, label: f }));

  const addFilter = () => {
    const newFilter: FilterConfig = {
      id: `filter-${Date.now()}`,
      field: filterFields[0] || '',
      operator: 'contains',
      value: '',
    };
    onFiltersChange([...filters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<FilterConfig>) => {
    onFiltersChange(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const toggleColumn = (columnId: string) => {
    onColumnsChange(
      columns.map((c) => (c.id === columnId ? { ...c, isVisible: !c.isVisible } : c))
    );
  };

  // Handle column reorder
  const handleColumnReorder = (reorderedColumns: ColumnConfig[]) => {
    onColumnsChange(reorderedColumns);
  };

  // Filter dropdown content (rendered via portal)
  const filterDropdownContent = showFilterDropdown
    ? createPortal(
        <AnimatePresence>
          <motion.div
            ref={filterDropdownRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="fixed w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-[9999]"
            style={{ top: filterDropdownPosition.top, left: filterDropdownPosition.left }}
          >
            {/* Header row - compact with inline Add Filter button */}
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between rounded-t-xl">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Active Filters
              </span>
              <AddButton onClick={addFilter}>Add Filter</AddButton>
            </div>

            {/* Filter content - removed overflow-hidden to allow nested dropdowns */}
            <div className="p-3 pb-4 rounded-b-xl">
              {filters.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-[13px] text-gray-500">No filters applied</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Click "Add Filter" to filter your data
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filters.map((filter) => (
                    <FilterRow
                      key={filter.id}
                      fields={filterFieldOptions}
                      field={filter.field}
                      operator={filter.operator}
                      value={filter.value}
                      onFieldChange={(field) => updateFilter(filter.id, { field })}
                      onOperatorChange={(operator) => updateFilter(filter.id, { operator })}
                      onValueChange={(value) => updateFilter(filter.id, { value })}
                      onRemove={() => removeFilter(filter.id)}
                      showRemove={true}
                      usePortal={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )
    : null;

  // Column dropdown content (rendered via portal)
  const columnDropdownContent = showColumnDropdown
    ? createPortal(
        <div
          ref={columnDropdownRef}
          className="fixed w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-[9999] overflow-hidden"
          style={{ top: columnDropdownPosition.top, right: columnDropdownPosition.right }}
        >
          {/* Header row - compact with inline Add AI Column button */}
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Columns
            </span>
            {onAddAIColumn && (
              <AddButton
                onClick={() => {
                  onAddAIColumn();
                  setShowColumnDropdown(false);
                }}
              >
                Add AI Column
              </AddButton>
            )}
          </div>

          {/* Column list with drag-to-reorder */}
          <div className="max-h-80 overflow-y-auto p-2">
            <Reorder.Group
              axis="y"
              values={columns}
              onReorder={handleColumnReorder}
              className="space-y-1"
            >
              {columns.map((column) => (
                <Reorder.Item
                  key={column.id}
                  value={column}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing"
                >
                  {/* Drag handle */}
                  <DotsSixVerticalIcon
                    size={16}
                    weight="bold"
                    className="text-gray-500 flex-shrink-0"
                  />

                  {/* Checkbox */}
                  <button
                    onClick={() => toggleColumn(column.id)}
                    className={`
                        w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer
                        ${column.isVisible ? 'bg-gray-800 border-gray-800' : 'border-2 border-gray-300'}
                      `}
                  >
                    {column.isVisible && (
                      <CheckIcon size={10} weight="bold" className="text-white" />
                    )}
                  </button>

                  {/* Label */}
                  <span
                    className={`text-[13px] flex-1 ${column.isVisible ? 'text-gray-900' : 'text-gray-500'}`}
                  >
                    {column.label}
                  </span>

                  {/* AI indicator */}
                  {column.isAI && (
                    <SparkleIcon size={14} className="text-orange-500 flex-shrink-0" />
                  )}
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="px-4 py-2 border-b border-gray-100 justify-between flex items-center gap-3 flex-shrink-0">
      {/* Search Input - matches Pane1 search style */}
      <div className="flex-1 max-w-xs flex items-center gap-1.5 px-2 py-1.5 bg-white rounded-lg border border-gray-100 focus-within:border-gray-200 focus-within:ring-1 focus-within:ring-gray-100 transition-colors">
        <MagnifyingGlassIcon size={14} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="flex-1 bg-transparent border-0 outline-none text-[13px] text-gray-900 placeholder:text-gray-400"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="p-0.5 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          >
            <XIcon size={12} className="text-gray-500" />
          </button>
        )}
      </div>

      <div className=" flex gap-2 flex-row items-center">
        {/* Filter Button */}
        <button
          ref={filterButtonRef}
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer
          ${
            filters.length > 0
              ? 'bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200'
              : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200'
          }
        `}
        >
          <FunnelIcon size={14} />
          <span>Filters</span>
          {filters.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[11px] font-medium bg-gray-800 text-white rounded-full">
              {filters.length}
            </span>
          )}
        </button>

        {/* Columns Button */}
        <button
          ref={columnButtonRef}
          onClick={() => setShowColumnDropdown(!showColumnDropdown)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-100 text-[13px] font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-200 transition-colors cursor-pointer"
        >
          <ColumnsIcon size={14} />
          <span>Columns</span>
        </button>

        {/* Dropdowns rendered via portal */}
        {filterDropdownContent}
        {columnDropdownContent}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const Pane2: React.FC<Pane2Props> = ({
  mode,
  dashboardName = 'Untitled Dashboard',
  reportName = 'Select a report',
  layout = [],
  widgets = {},
  onLayoutChange,
  onWidgetSelect,
  selectedWidgetId,
  onDrop,
  onDropZone,
  draggingComponent,
  onWidgetEdit,
  onWidgetDelete,
  isEmpty = false,
  reportTableContent,
  isDraggingOver = false,
  editingWidgetId,
  width,
  // Dashboard action callbacks
  onFilterClick,
  onExportClick,
  onRefreshClick,
  onShareClick,
  // Data toolbar props
  searchValue = '',
  onSearchChange,
  filters = [],
  onFiltersChange,
  columns = [],
  onColumnsChange,
  onAddAIColumn,
  filterFields = [],
  // Widget configuration props
  dataSources = [],
  onWidgetConfigSave,
  onWidgetConfigCancel,
  // Widget detail sheet props
  drillDownFilters = [],
  getWidgetSourceColumns,
  getWidgetSourceData,
  onWidgetDrillDownChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(width || 800);
  const [dropPreview, setDropPreview] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Widget config popover state
  const [configPopoverState, setConfigPopoverState] = useState<{
    isOpen: boolean;
    chartType: 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table';
    position: { top: number; left: number };
    dropPosition: { x: number; y: number };
    widgetId?: string;
  } | null>(null);

  // Widget detail sheet state
  const [detailSheetWidgetId, setDetailSheetWidgetId] = useState<string | null>(null);

  // Track if widget is being dragged (to prevent detail sheet opening on drag end)
  const isDraggingWidgetRef = useRef(false);

  // Refs for action buttons
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const shareButtonRef = useRef<HTMLDivElement>(null);

  // Calculate cell width based on container
  const gridWidth = containerWidth - PADDING * 2;
  const cellWidth = (gridWidth - MARGIN * (COLS - 1)) / COLS;

  // Calculate current number of rows from layout
  const currentRows = layout.length > 0 ? Math.max(...layout.map((item) => item.y + item.h)) : 0;

  useEffect(() => {
    if (width) {
      setContainerWidth(width);
      return;
    }

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [width]);

  // Find next available position for a widget
  const findNextAvailablePosition = useCallback(
    (targetX: number, targetY: number): { x: number; y: number } => {
      const widgetW = MIN_WIDGET_COLS;
      const widgetH = 1;

      // Check if position is occupied
      const isOccupied = (x: number, y: number, w: number, h: number) => {
        return layout.some((item) => {
          const itemRight = item.x + item.w;
          const itemBottom = item.y + item.h;
          const newRight = x + w;
          const newBottom = y + h;

          return !(x >= itemRight || newRight <= item.x || y >= itemBottom || newBottom <= item.y);
        });
      };

      // Clamp x to ensure widget fits
      const clampedX = Math.min(targetX, COLS - widgetW);

      // Check if target position is free
      if (!isOccupied(clampedX, targetY, widgetW, widgetH)) {
        return { x: clampedX, y: targetY };
      }

      // Try to find space in the same row first
      for (let x = 0; x <= COLS - widgetW; x++) {
        if (!isOccupied(x, targetY, widgetW, widgetH)) {
          return { x, y: targetY };
        }
      }

      // Find first available spot scanning row by row
      for (let y = 0; y <= currentRows + 1; y++) {
        for (let x = 0; x <= COLS - widgetW; x++) {
          if (!isOccupied(x, y, widgetW, widgetH)) {
            return { x, y };
          }
        }
      }

      // Last resort: add to next row
      return { x: 0, y: currentRows };
    },
    [layout, currentRows]
  );

  // Calculate grid position from mouse coordinates
  const calculateGridPosition = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return null;

      const scrollTop = containerRef.current?.scrollTop || 0;

      // Calculate position relative to the grid area (inside padding)
      const relX = clientX - rect.left - PADDING;
      const relY = clientY - rect.top - PADDING + scrollTop;

      // Calculate grid cell based on cell width + margin
      const colWidth = cellWidth + MARGIN;
      const rowHeightWithMargin = ROW_HEIGHT + MARGIN;

      const x = Math.floor(relX / colWidth);
      const y = Math.floor(relY / rowHeightWithMargin);

      // Clamp to valid range - ensure widget fits within grid
      const clampedX = Math.max(0, Math.min(x, COLS - MIN_WIDGET_COLS));
      const clampedY = Math.max(0, y);

      // Check if the exact position is available
      const isPositionOccupied = layout.some((item) => {
        const itemRight = item.x + item.w;
        const itemBottom = item.y + item.h;
        const newRight = clampedX + MIN_WIDGET_COLS;
        const newBottom = clampedY + MIN_WIDGET_ROWS;

        // Check for overlap
        return !(
          clampedX >= itemRight ||
          newRight <= item.x ||
          clampedY >= itemBottom ||
          newBottom <= item.y
        );
      });

      // If position is free, use it directly
      if (!isPositionOccupied) {
        return { x: clampedX, y: clampedY };
      }

      // Position is occupied, find next available position
      return findNextAvailablePosition(clampedX, clampedY);
    },
    [cellWidth, findNextAvailablePosition, layout]
  );

  // Scroll to widget position
  const scrollToWidget = useCallback((y: number) => {
    if (!containerRef.current) return;

    const targetTop = PADDING + y * (ROW_HEIGHT + MARGIN);
    const containerHeight = containerRef.current.clientHeight;
    const scrollTop = containerRef.current.scrollTop;

    // Only scroll if widget is not visible
    if (targetTop < scrollTop || targetTop > scrollTop + containerHeight - ROW_HEIGHT) {
      containerRef.current.scrollTo({
        top: Math.max(0, targetTop - PADDING),
        behavior: 'smooth',
      });
    }
  }, []);

  // Handle drop from external drag
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropPreview(null);

    const result = calculateGridPosition(e.clientX, e.clientY);
    if (!result) return;

    const dropPosition = { x: result.x, y: result.y };

    // Calculate popover position near the drop location
    const rect = containerRef.current?.getBoundingClientRect();
    const popoverPosition = rect
      ? {
          top: Math.min(e.clientY + 20, window.innerHeight - 400),
          left: Math.min(e.clientX - 160, window.innerWidth - 340),
        }
      : { top: e.clientY + 20, left: e.clientX - 160 };

    // Try to get component from dataTransfer first (for native HTML5 drag)
    const data = e.dataTransfer.getData('application/json');
    let component: ChartComponent | null = null;

    if (data) {
      try {
        component = JSON.parse(data) as ChartComponent;
      } catch {
        // Invalid JSON, fall through to state-based handling
      }
    }

    // Fall back to draggingComponent from state
    if (!component && draggingComponent) {
      component = draggingComponent;
    }

    // If we have dataSources and onWidgetConfigSave, show the config popover
    if (component && dataSources.length > 0 && onWidgetConfigSave) {
      setConfigPopoverState({
        isOpen: true,
        chartType: component.icon as 'bar' | 'line' | 'pie' | 'donut' | 'metric' | 'table',
        position: popoverPosition,
        dropPosition,
      });
      setTimeout(() => scrollToWidget(dropPosition.y), 100);
    } else if (component) {
      // Fall back to original behavior
      onDrop?.(component, dropPosition);
      setTimeout(() => scrollToWidget(dropPosition.y), 100);
    } else {
      onDropZone?.(dropPosition);
      setTimeout(() => scrollToWidget(dropPosition.y), 100);
    }
  };

  // Handle widget config save
  const handleWidgetConfigSave = (config: WidgetConfig) => {
    if (configPopoverState) {
      onWidgetConfigSave?.(config, configPopoverState.dropPosition);
      setConfigPopoverState(null);
    }
  };

  // Handle widget config cancel
  const handleWidgetConfigCancel = () => {
    setConfigPopoverState(null);
    onWidgetConfigCancel?.();
  };

  // Handle widget click - show detail sheet (only if not just finished dragging)
  const handleWidgetClick = (widgetId: string) => {
    // Don't open detail sheet if widget was just dragged
    if (isDraggingWidgetRef.current) {
      isDraggingWidgetRef.current = false;
      onWidgetSelect?.(widgetId);
      return;
    }
    // Don't open detail sheet if widget is being edited
    if (editingWidgetId === widgetId) {
      return;
    }
    onWidgetSelect?.(widgetId);
    setDetailSheetWidgetId(widgetId);
  };

  // Handle widget edit - show config popover for editing
  const handleWidgetEditClick = (widgetId: string) => {
    const widget = widgets[widgetId];
    if (!widget) return;

    // Find widget position for popover placement
    const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`);
    const rect = widgetElement?.getBoundingClientRect();
    const popoverPosition = rect
      ? { top: rect.top + 40, left: rect.left }
      : { top: 200, left: 200 };

    if (dataSources.length > 0 && onWidgetConfigSave) {
      setConfigPopoverState({
        isOpen: true,
        chartType: widget.chartType || 'bar',
        position: popoverPosition,
        dropPosition: { x: 0, y: 0 }, // Not used for edit
        widgetId,
      });
    } else {
      onWidgetEdit?.(widgetId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    // Update drop preview position
    if (isDraggingOver) {
      const result = calculateGridPosition(e.clientX, e.clientY);
      if (result) {
        setDropPreview({
          x: result.x,
          y: result.y,
          w: DEFAULT_WIDGET_COLS,
          h: DEFAULT_WIDGET_ROWS,
        });

        // Auto-scroll if near edges
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && containerRef.current) {
          const scrollThreshold = 60;
          const scrollSpeed = 10;

          if (e.clientY - rect.top < scrollThreshold) {
            containerRef.current.scrollTop -= scrollSpeed;
          } else if (rect.bottom - e.clientY < scrollThreshold) {
            containerRef.current.scrollTop += scrollSpeed;
          }
        }
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the container entirely
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setDropPreview(null);
    }
  };

  // Calculate pixel position for drop preview - matches exactly where widget will land
  const getDropPreviewStyle = () => {
    if (!dropPreview) return {};

    const left = PADDING + dropPreview.x * (cellWidth + MARGIN);
    const top = PADDING + dropPreview.y * (ROW_HEIGHT + MARGIN);
    const previewWidth = dropPreview.w * cellWidth + (dropPreview.w - 1) * MARGIN;
    const previewHeight = dropPreview.h * ROW_HEIGHT + (dropPreview.h - 1) * MARGIN;

    return { left, top, width: previewWidth, height: previewHeight };
  };

  return (
    <div className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          {mode === 'dashboard' ? (
            <>
              <GridFourIcon size={14} weight="regular" className="text-gray-700" />
              <span className="text-[13px] font-medium text-gray-900">{dashboardName}</span>
            </>
          ) : (
            <>
              <TableIcon size={14} weight="regular" className="text-gray-700" />
              <span className="text-[13px] font-medium text-gray-900">{reportName}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mode === 'dashboard' && (
            <>
              {/* Filter Button - Full button with text */}
              {onFilterClick && (
                <button
                  ref={filterButtonRef}
                  onClick={() => {
                    if (filterButtonRef.current) {
                      onFilterClick(filterButtonRef.current.getBoundingClientRect());
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Filter dashboard"
                >
                  <FunnelIcon size={14} weight="regular" />
                  <span>Filter</span>
                </button>
              )}

              {/* Refresh Button - Icon only */}
              {onRefreshClick && (
                <SecondaryIconButton
                  icon={<ArrowsClockwiseIcon size={14} />}
                  onClick={onRefreshClick}
                  title="Refresh now • Refreshes automatically daily"
                />
              )}

              {/* Export Button - Icon only */}
              {onExportClick && (
                <SecondaryIconButton
                  icon={<DownloadIcon size={14} />}
                  onClick={onExportClick}
                  title="Export as PDF"
                />
              )}

              {/* Separator */}
              {onShareClick && <div className="h-6 w-px bg-gray-200" />}

              {/* Share Button - Icon only with send icon */}
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
            </>
          )}
        </div>
      </div>

      {/* Data Toolbar - Only shown in data mode when we have callback handlers */}
      {mode === 'data' && onSearchChange && onFiltersChange && onColumnsChange && (
        <DataToolbar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          filters={filters}
          onFiltersChange={onFiltersChange}
          columns={columns}
          onColumnsChange={onColumnsChange}
          onAddAIColumn={onAddAIColumn}
          filterFields={filterFields}
        />
      )}

      {/* Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {mode === 'dashboard' ? (
          <>
            {/* Drop Preview - Clean indigo indicator showing exactly where widget will land */}
            <AnimatePresence>
              {isDraggingOver && dropPreview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute border-2 border-dashed border-indigo-400 bg-indigo-50/50 rounded-xl z-10 pointer-events-none"
                  style={getDropPreviewStyle()}
                >
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-[13px] font-medium text-indigo-600">
                      {draggingComponent?.label || 'Widget'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {(isEmpty || layout.length === 0) && !isDraggingOver ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <GridFourIcon size={48} weight="duotone" className="text-gray-300 mb-4" />
                <h3 className="text-[13px] font-medium text-gray-900 mb-1">No widgets yet</h3>
                <p className="text-[13px] text-gray-700 mb-4">
                  Drag components from the left panel to start building your dashboard
                </p>
              </div>
            ) : (
              /* Dashboard Grid */
              <div
                className="p-4"
                style={{
                  minHeight: Math.max((currentRows + 1) * (ROW_HEIGHT + MARGIN) + PADDING, 400),
                }}
              >
                <GridLayout
                  className="layout"
                  layout={layout.map((item) => ({
                    ...item,
                    minW: MIN_WIDGET_COLS,
                    minH: MIN_WIDGET_ROWS,
                  }))}
                  width={containerWidth - PADDING * 2}
                  onLayoutChange={(newLayout) => onLayoutChange?.(newLayout as Layout)}
                  onDragStart={() => {
                    isDraggingWidgetRef.current = true;
                  }}
                  onDragStop={() => {
                    // Keep isDraggingWidgetRef true briefly so click handler can check it
                    // It will be reset in handleWidgetClick
                  }}
                  gridConfig={{
                    cols: COLS,
                    rowHeight: ROW_HEIGHT,
                    margin: [MARGIN, MARGIN] as const,
                    containerPadding: [0, 0] as const,
                    maxRows: Infinity,
                  }}
                  dragConfig={{
                    enabled: true,
                    handle: '.widget-drag-handle',
                  }}
                  resizeConfig={{
                    enabled: true,
                  }}
                  compactor={noCompactor}
                >
                  {layout.map((item, index) => (
                    <div key={item.i} className="h-full">
                      <motion.div
                        className="h-full"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {widgets[item.i] && (
                          <div data-widget-id={item.i} className="h-full">
                            <WidgetCard
                              widget={widgets[item.i]}
                              isSelected={selectedWidgetId === item.i}
                              isEditing={editingWidgetId === item.i}
                              onClick={() => handleWidgetClick(item.i)}
                              onEdit={() => handleWidgetEditClick(item.i)}
                              onDelete={() => onWidgetDelete?.(item.i)}
                            />
                          </div>
                        )}
                      </motion.div>
                    </div>
                  ))}
                </GridLayout>
              </div>
            )}
          </>
        ) : (
          /* Data View - Report Table */
          <div className="h-full">
            {reportTableContent || (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <TableIcon size={48} weight="duotone" className="text-gray-300 mb-4" />
                <h3 className="text-[13px] font-medium text-gray-900 mb-1">Select a report</h3>
                <p className="text-[13px] text-gray-700">
                  Choose a report from the left panel to view its data
                </p>
              </div>
            )}
          </div>
        )}

        {/* Widget Detail Sheet - shown when clicking a widget (inside content div for proper positioning) */}
        {detailSheetWidgetId && widgets[detailSheetWidgetId] && (
          <WidgetDetailSheet
            isOpen={!!detailSheetWidgetId}
            widget={{
              id: detailSheetWidgetId,
              name: widgets[detailSheetWidgetId].title,
              chartType: widgets[detailSheetWidgetId].chartType || 'bar',
              dataSourceName: (() => {
                const reportId = widgets[detailSheetWidgetId].reportId;
                if (!reportId) return 'No data source';
                const dataSource = dataSources.find((ds) => ds.id === reportId);
                return (
                  dataSource?.name ||
                  reportId
                    .replace('report-', '')
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                );
              })(),
              dataSourceType:
                dataSources.find((ds) => ds.id === widgets[detailSheetWidgetId].reportId)?.type ||
                'report',
            }}
            drillDownFilters={drillDownFilters}
            onFilterChange={(filterId, value) =>
              onWidgetDrillDownChange?.(detailSheetWidgetId, filterId, value)
            }
            sourceColumns={getWidgetSourceColumns?.(detailSheetWidgetId) || []}
            sourceData={getWidgetSourceData?.(detailSheetWidgetId) || []}
            onClose={() => setDetailSheetWidgetId(null)}
          />
        )}
      </div>

      {/* Custom styles for react-grid-layout - Orange theme */}
      <style>{`
        .react-grid-item.react-grid-placeholder {
          background: rgb(255 144 66 / 0.25) !important;
          border: 3px dashed rgb(255 144 66 / 0.85) !important;
          border-radius: 12px !important;
          box-shadow: 0 0 0 1px rgb(255 144 66 / 0.3) !important;
        }
        .react-grid-item > .react-resizable-handle {
          background-image: none !important;
          width: 12px !important;
          height: 12px !important;
        }
        .react-grid-item > .react-resizable-handle::after {
          content: '';
          position: absolute;
          right: 3px;
          bottom: 3px;
          width: 6px;
          height: 6px;
          border-right: 2px solid rgb(156 163 175);
          border-bottom: 2px solid rgb(156 163 175);
          border-radius: 1px;
        }
        .react-grid-item:hover > .react-resizable-handle::after {
          border-color: rgb(99 102 241);
        }
        .react-grid-item.resizing {
          z-index: 100;
        }
        .react-grid-item.resizing .react-resizable-handle::after {
          border-color: rgb(99 102 241) !important;
        }
        .react-grid-item.react-draggable-dragging {
          z-index: 100;
          box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          border-radius: 12px;
        }
      `}</style>

      {/* Widget Configuration Popover - shown after drop or for editing */}
      {configPopoverState && (
        <WidgetConfigPopover
          isOpen={configPopoverState.isOpen}
          chartType={configPopoverState.chartType}
          defaultName={
            configPopoverState.widgetId ? widgets[configPopoverState.widgetId]?.title : undefined
          }
          dataSources={dataSources}
          position={configPopoverState.position}
          onSave={handleWidgetConfigSave}
          onCancel={handleWidgetConfigCancel}
          widgetId={configPopoverState.widgetId}
          existingConfig={
            configPopoverState.widgetId && widgets[configPopoverState.widgetId]
              ? {
                  name: widgets[configPopoverState.widgetId].title,
                  chartType: widgets[configPopoverState.widgetId].chartType,
                  dataSourceId: widgets[configPopoverState.widgetId].reportId,
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

export default Pane2;
