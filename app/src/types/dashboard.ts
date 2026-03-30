// Dashboard API Types — matches backend API spec

// ─── API Responses ───────────────────────────────────────────────

export interface DashboardMetadataResponse {
  success: boolean;
  data: {
    dashboard: Dashboard;
    refreshInfo: RefreshInfo;
  };
  error?: ApiError;
}

export interface WidgetDataResponse {
  success: boolean;
  data: {
    widgets: Record<string, WidgetData>;
    meta: {
      fetchedAt: string;
      cacheHit: boolean;
      dataFreshness: "fresh" | "stale";
    };
  };
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
}

// ─── Dashboard ───────────────────────────────────────────────────
export const DashboardStatus = {
  Draft: "draft",
  Published: "published",
} as const;

export type DashboardStatus =
  (typeof DashboardStatus)[keyof typeof DashboardStatus];

export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  status: DashboardStatus;
  dashboardVersion: number;
  isOwner: boolean;
  isSharedWithTenant: boolean;
  gridConfig: GridConfig;
  layout: LayoutItem[];
  widgets: Record<string, WidgetConfig>;
  filters?: DashboardFilters;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  analysisId: string;
  uiConfig?: {
    colorPaletteGlobal?: string;
    panelLayouts?: Record<
      string,
      { x: number; y: number; w: number; h: number }
    >;
  };
}

export interface GridConfig {
  cols: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
  compactType: "vertical" | "horizontal" | null;
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

// ─── Widgets ─────────────────────────────────────────────────────

export type WidgetType = "chart" | "counter" | "table" | "text";

// Single source of truth lives in design-components
import type { CounterWidgetConfig } from "@vonlabs/design-components";
export type { CounterWidgetConfig };

export interface QueryInfo {
  sql: string;
  description?: string;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  config:
    | ChartWidgetConfig
    | CounterWidgetConfig
    | TableWidgetConfig
    | TextWidgetConfig;
  query_failed?: boolean;
  drilldown?: {
    query_ref: string;
    column_map: Array<{ data_key: string; sql_expression: string }>;
  } | null;
  queryInfo?: QueryInfo;
}

// ─── Chart Widget ────────────────────────────────────────────────

export type ChartType =
  | "line"
  | "bar"
  | "column"
  | "line-bar"
  | "column-line"
  | "line-line"
  | "pie"
  | "donut"
  | "area"
  | "gantt";

export interface ChartWidgetConfig {
  chartType: ChartType;
  highchartsOptions: HighchartsOptions;
  dataSource?: {
    tableId: string;
    xAxisField: string;
    yAxisFields: string[];
    groupByField?: string;
  };
}

export interface HighchartsOptions {
  chart: {
    type: string;
    backgroundColor?: string;
    style?: Record<string, string>;
    height?: number | string;
  };
  title: { text: string | null };
  subtitle?: { text: string | null };
  xAxis?: {
    categories?: string[];
    title?: { text: string };
    type?: "category" | "datetime" | "linear" | "logarithmic";
    labels?: {
      rotation?: number;
      style?: Record<string, string>;
      format?: string;
    };
  };
  yAxis?: Array<{
    title?: { text: string };
    labels?: { format?: string };
    categories?: string[];
    opposite?: boolean;
    min?: number;
    max?: number;
    stackLabels?: { enabled: boolean };
  }>;
  series: HighchartsSeries[];
  legend?: {
    enabled: boolean;
    align?: "left" | "center" | "right";
    verticalAlign?: "top" | "middle" | "bottom";
    layout?: "horizontal" | "vertical";
  };
  tooltip?: {
    shared?: boolean;
    valuePrefix?: string;
    valueSuffix?: string;
    pointFormat?: string;
    headerFormat?: string;
    formatter?: string;
  };
  plotOptions?: Record<string, unknown>;
  colors?: string[];
  credits?: { enabled: boolean };
  responsive?: {
    rules: Array<{
      condition: { maxWidth: number };
      chartOptions: Record<string, unknown>;
    }>;
  };
}

export interface HighchartsSeries {
  name: string;
  type?: string;
  data: SeriesDataPoint[];
  color?: string;
  yAxis?: number;
  dashStyle?: string;
  marker?: {
    enabled?: boolean;
    symbol?: string;
    radius?: number;
  };
  dataLabels?: {
    enabled?: boolean;
    format?: string;
  };
  innerSize?: string;
}

export type SeriesDataPoint =
  | number
  | [string, number]
  | { name: string; y: number; color?: string; drilldown?: string }
  | { x: number; x2: number; y: number; color?: string };

// ─── Table Widget (defined but not rendered yet) ─────────────────

export interface TableWidgetConfig {
  columns: TableColumn[];
  pagination?: {
    enabled: boolean;
    pageSize: number;
    pageSizeOptions?: number[];
  };
  sorting?: {
    enabled: boolean;
    defaultSort?: {
      field: string;
      direction: "asc" | "desc";
    };
  };
  rowStyles?: Array<{
    condition: {
      field: string;
      operator: "eq" | "gt" | "lt" | "gte" | "lte" | "contains";
      value: unknown;
    };
    sentiment?: "positive" | "negative" | "neutral";
    style: {
      backgroundColor?: string;
      textColor?: string;
      fontWeight?: string;
    };
  }>;
}

export interface TableColumn {
  id: string;
  field: string;
  header: string;
  width?: number | string;
  minWidth?: number;
  dataType:
    | "string"
    | "number"
    | "currency"
    | "percentage"
    | "date"
    | "boolean";
  format?: {
    decimals?: number;
    abbreviate?: boolean;
    prefix?: string;
    suffix?: string;
    dateFormat?: string;
    colorScale?: {
      type: "threshold" | "gradient";
      thresholds?: Array<{ value: number; color?: string; label?: string }>;
    };
    progressBar?: {
      maxValue: number;
      colorThresholds: Array<{ value: number; color?: string }>;
    };
    badge?: {
      mapping: Record<
        string,
        { color?: string; backgroundColor?: string; label?: string }
      >;
    };
  };
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
}

// ─── Text Widget ─────────────────────────────────────────────────

export interface TextWidgetConfig {
  content: string;
  variant: "heading" | "subheading" | "body" | "caption";
  alignment?: "left" | "center" | "right";
}

// ─── Filters ─────────────────────────────────────────────────────

export type DashboardFilterType =
  | "select"
  | "multi-select"
  | "date-range"
  | "search"
  | "range";

export interface DashboardFilterDefinition {
  id: string;
  label: string;
  type: DashboardFilterType;
  /** Column name used in SQL queries */
  column: string;
  /** Available option values (for select / multi-select) */
  options?: string[];
  /** Default value applied on first load */
  default?: unknown;
  /** Widget IDs this filter applies to */
  applies_to?: string[];
}

/** Active filter state values per filter type:
 *  select       → string
 *  multi-select → string[]
 *  date-range   → { start: string; end: string }
 *  range        → { min: number; max: number }
 *  search       → string
 */
export type DashboardFilterState = Record<string, unknown>;

export interface DashboardFilters {
  definitions: DashboardFilterDefinition[];
  state: DashboardFilterState;
}

/** @deprecated Use DashboardFilterDefinition */
export type DashboardFilter = DashboardFilterDefinition;

// ─── Schedule ────────────────────────────────────────────────────

export type ScheduleFrequency =
  | "minutely"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly";

export interface ScheduleConfigRequest {
  frequency: ScheduleFrequency;
  interval?: number | null;
  time?: string | null; // HH:MM UTC
  days?: string[] | null; // for weekly, e.g. ["Mon","Wed","Fri"]
  dayOfMonth?: number | null; // 1-31, for monthly
}

export interface ScheduleConfig extends ScheduleConfigRequest {
  enabled?: boolean;
}

export interface DashboardScheduleResponse {
  dashboard_id: string;
  schedule_config: ScheduleConfig | null;
  schedule_trigger_id: string | null;
  next_run_time: string | null;
  is_scheduled: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// ─── Refresh ─────────────────────────────────────────────────────

export interface RefreshInfo {
  lastRefreshedAt: string;
  refreshStatus: "idle" | "refreshing" | "failed";
  nextScheduledRefresh?: string;
  refreshIntervalMinutes?: number;
  cacheExpiresAt?: string;
  dataSource: {
    analysisId: string;
    analysisName: string;
    dataFreshness: "fresh" | "stale" | "expired";
  };
}

// ─── Widget Data (API 2) ─────────────────────────────────────────

export interface WidgetDataRequest {
  widgetIds: string[];
  filters?: Record<string, unknown>;
  pagination?: Record<string, { page: number; pageSize: number }>;
  sorting?: Record<string, { field: string; direction: "asc" | "desc" }>;
}

export interface WidgetData {
  widgetId: string;
  chartData?: {
    series: HighchartsSeries[];
    xAxis?: { categories?: string[] };
    yAxis?: Array<{ title?: { text: string }; labels?: { format?: string } }>;
  };
  counterData?: {
    value: string | number;
    trend?: {
      value: number;
      direction: "up" | "down" | "neutral";
      sentiment: "positive" | "negative" | "neutral";
    };
    sparkline?: { data: number[] };
  };
  tableData?: {
    rows: Record<string, unknown>[];
    totalRows: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: { code: string; message: string };
}

export interface PanelRenderRequest {
  panels: PanelRenderItem[];
}

export interface SortConfigItem {
  order_by: string;
  order_by_asc: boolean;
}

export interface PanelRenderItem {
  panel_id: string;
  table_limit: number;
  table_page: number;
  sort_config?: SortConfigItem[];
}

export interface PanelPaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  sortConfig?: SortConfigItem[];
}

export interface PanelRenderWidget {
  id: string;
  type: string;
  title?: string;
  gridOptions?: Record<string, unknown>;
  pagination?: PanelPaginationInfo;
}

export interface PanelRenderResponse {
  widgets: Record<string, PanelRenderWidget>;
}

// ─── Panel Drilldown ────────────────────────────────────────────

export interface PanelDrilldownRequest {
  panel_id: string;
  drill_filters?: Record<string, unknown> | null;
  page_limit: number;
  page: number;
  sort_config?: SortConfigItem[];
}

export interface PanelDrilldownPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  sortConfig?: SortConfigItem[];
}

export interface PanelDrilldownResponse {
  data: Record<string, unknown>[];
  pagination: PanelDrilldownPagination;
}
