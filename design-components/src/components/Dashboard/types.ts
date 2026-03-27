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

// ─── Widget Config ────────────────────────────────────────────────

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  config: ChartWidgetConfig | CounterWidgetConfig | TableWidgetConfig | TextWidgetConfig;
  query_failed?: boolean;
  /** Drilldown configuration — present when the panel supports drill-down. */
  drilldown?: DrilldownConfig | null;
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
}

// ─── Text ────────────────────────────────────────────────────────

export interface TextWidgetConfig {
  content: string;
  variant: 'heading' | 'subheading' | 'body' | 'caption';
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

// ─── Widget Shell ────────────────────────────────────────────────

export interface WidgetShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Callback when the drilldown icon is clicked */
  onDrillDown?: () => void;
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
}
