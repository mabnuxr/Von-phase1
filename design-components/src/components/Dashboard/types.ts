// Shared prop types for Dashboard display components.
// These are component-level prop types, not API response types.

export interface GridConfig {
  cols: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
  compactType: 'vertical' | 'horizontal' | null;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
}

export type WidgetType = 'chart' | 'counter' | 'table' | 'text';

// ─── Drilldown ────────────────────────────────────────────────────

/** Maps a Highcharts point event path to a SQL expression for drilldown. */
export interface DrilldownColumnMapping {
  data_key: string;
  sql_expression: string;
}

export interface DrilldownConfig {
  query_ref: string;
  column_map: DrilldownColumnMapping[];
}

/** Column-value pairs sent as drill filters from a chart point click. */
export type DrillFilters = Record<string, unknown>;

// ─── Query Info ──────────────────────────────────────────────────

export interface QueryInfo {
  sql: string;
  description?: string;
}

// ─── Widget Config ────────────────────────────────────────────────

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  config: ChartWidgetConfig | CounterWidgetConfig | TableWidgetConfig | TextWidgetConfig;
  query_failed?: boolean;
  /**
   * Backend query ID that powers this widget. Used to match filter
   * `applies_to` entries (which reference query IDs, not widget IDs).
   */
  queryRef?: string;
  /** Drilldown configuration — present when the panel supports drill-down. */
  drilldown?: DrilldownConfig | null;
  /** Query SQL and description for this widget */
  queryInfo?: QueryInfo;
}

// ─── Chart ───────────────────────────────────────────────────────

export interface ChartWidgetConfig {
  chartType: string;
  highchartsOptions: Record<string, unknown>;
}

export interface ChartWidgetProps {
  config: ChartWidgetConfig;
}

// ─── Counter ─────────────────────────────────────────────────────

export interface CounterWidgetConfig {
  value: number | null;
  format: string | null;
  prefix?: string | null;
  suffix?: string | null;
  comparison?: {
    value: number | null;
    format: string | null;
    suffix?: string | null;
    label?: string | null;
    positive_is_good: boolean;
  } | null;
  target?: {
    value: number | null;
    format: string | null;
    label: string;
    inverted?: boolean;
  } | null;
  sparkline?: {
    data: number[];
    type: 'line' | 'bar';
  };
  accentColor?: string;
}

export interface CounterWidgetProps {
  config: CounterWidgetConfig;
  title?: string;
  subtitle?: string;
  /** Callback when the drilldown icon is clicked */
  onDrillDown?: () => void;
  /** Query SQL and description to display on hover */
  queryInfo?: QueryInfo;
  /** Filters currently applied to this widget (read-only display) */
  appliedFilters?: AppliedWidgetFilter[];
  /** Optional slot rendered in place of the read-only filter popover (v2). */
  filterSlot?: React.ReactNode;
}

// ─── Text ────────────────────────────────────────────────────────

export interface TextWidgetConfig {
  content: string;
  variant?: 'heading' | 'subheading' | 'body' | 'caption';
  alignment?: 'left' | 'center' | 'right';
}

export interface TextWidgetProps {
  config: TextWidgetConfig;
}

// ─── Table ──────────────────────────────────────────────────────

export interface SortConfigItem {
  order_by: string;
  order_by_asc: boolean;
}

export interface TablePaginationInfo {
  page: number;
  limit: number;
  totalRows: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  sortConfig?: SortConfigItem[];
}

export interface SortState {
  orderBy: string;
  orderByAsc: boolean;
}

export interface TableWidgetConfig {
  gridOptions: Record<string, unknown>;
  serverPagination?: TablePaginationInfo;
}

// ─── Applied Widget Filters ─────────────────────────────────────

/** A single filter applied to a widget, pre-computed for read-only display. */
export interface AppliedWidgetFilter {
  /** Human-readable filter name, e.g. "Segment" */
  label: string;
  /** Human-readable operator, e.g. "One of" */
  operatorLabel: string;
  /** Display values, e.g. ["SMB", "COM"] */
  values: string[];
  /** Whether blank/null values are also included */
  includeBlank?: boolean;
}

// ─── Widget Shell ────────────────────────────────────────────────

export interface WidgetShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Callback when the drilldown icon is clicked */
  onDrillDown?: () => void;
  /** Query SQL and description to display on hover */
  queryInfo?: QueryInfo;
  /** Filters currently applied to this widget (read-only display) */
  appliedFilters?: AppliedWidgetFilter[];
  /**
   * Optional slot rendered in place of the read-only WidgetFiltersPopover.
   * Used by the v2 filter UI to render an editable panel-level filter popover.
   */
  filterSlot?: React.ReactNode;
}

// ─── Widget Renderer ─────────────────────────────────────────────

export interface WidgetRendererProps {
  widget: WidgetConfig;
  onTablePageChange?: (panelId: string, page: number) => void;
  isTableLoading?: boolean;
  /** Callback when a widget's drilldown icon is clicked (chart-level) */
  onDrillDown?: (panelId: string) => void;
  /** Callback when a chart data point is clicked (point-level drilldown) */
  onPointDrillDown?: (panelId: string, drillFilters: DrillFilters) => void;
  /** Callback when a table column header is clicked for sorting */
  onTableSortChange?: (panelId: string, columnId: string, order: 'asc' | 'desc' | null) => void;
  /** Current sort state for this table widget */
  tableSortState?: SortState;
  /** Filters currently applied to this widget (read-only display) */
  appliedFilters?: AppliedWidgetFilter[];
  /** Optional slot rendered in place of the read-only filter popover (v2). */
  filterSlot?: React.ReactNode;
}

// ─── Dashboard Grid ──────────────────────────────────────────────

export interface DashboardGridProps {
  layout: LayoutItem[];
  widgets: Record<string, WidgetConfig>;
  gridConfig: GridConfig;
  onTablePageChange?: (panelId: string, page: number) => void;
  loadingTablePanels?: Set<string>;
  /** Callback when a widget's drilldown icon is clicked (chart-level) */
  onDrillDown?: (panelId: string) => void;
  /** Callback when a chart data point is clicked (point-level drilldown) */
  onPointDrillDown?: (panelId: string, drillFilters: DrillFilters) => void;
  /** Callback when a table column header is clicked for sorting */
  onTableSortChange?: (panelId: string, columnId: string, order: 'asc' | 'desc' | null) => void;
  /** Current sort state per panel */
  tableSortStates?: Record<string, SortState>;
  /** Whether the dashboard is in edit mode (shows visual indicators on widgets) */
  isEditMode?: boolean;
  /** Whether all widgets are loading (e.g. after a filter change) */
  isLoading?: boolean;
  /** Applied filters per widget ID (read-only display) */
  widgetAppliedFilters?: Record<string, AppliedWidgetFilter[]>;
  /**
   * Per-widget filter slot factory (v2). When provided, replaces the read-only
   * WidgetFiltersPopover with app-supplied editable UI.
   */
  widgetFilterSlot?: (panelId: string) => React.ReactNode;
}
