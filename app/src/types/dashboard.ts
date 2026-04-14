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
  sharedDataScope?: "MY_RECORDS" | "MY_TEAMS_RECORDS" | "MY_MANAGERS_TEAM" | "ALL_RECORDS" | null;
  gridConfig: GridConfig;
  layout: LayoutItem[];
  widgets: Record<string, WidgetConfig>;
  filters?: DashboardFilters;
  /** Extraction metadata — what data was pulled and from where (v2). */
  data_boundary?: DataBoundary;
  /** Source systems grouped by type, with dataset details (v2). */
  data_sources?: DataSourceGroup[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName?: string;
  analysisId: string;
  isEditable: boolean;
  uiConfig?: {
    panelLayouts?: Record<
      string,
      { x: number; y: number; w: number; h: number }
    >;
  };
}

// ─── Data Sources & Boundary (v2) ────────────────────────────────

export interface DataBoundary {
  summary: string;
  row_counts: Record<string, number>;
}

export interface DataSourceGroup {
  /** Source type, e.g. "salesforce", "snowflake", "von_iq". */
  type: string;
  /** Unique source objects (table/object names) exposed by this source type. */
  objects: string[];
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
  | "picklist"
  | "select"
  | "multi-select"
  | "date"
  | "date-range"
  | "number"
  | "text"
  | "search"
  | "range";

/**
 * Semantic role of a filter, independent of its UI type. Unlike `type` (which
 * describes the UI control — picklist, date-range, etc.), `semantic_type`
 * identifies the filter's business role so backend/frontend can dispatch
 * specialized behavior (e.g. the ownership scope selector).
 */
export type DashboardFilterSemanticType = "ownership";

export interface DashboardFilterDefinition {
  id: string;
  label: string;
  /** Structural UI control type. */
  type: DashboardFilterType;
  /** Semantic business role (optional). E.g. "ownership" for the scope filter. */
  semantic_type?: DashboardFilterSemanticType;
  /** Column name used in SQL queries */
  column: string;
  /** Available option values (for select / multi-select) */
  options?: string[];
  /** Default value applied on first load */
  default?: unknown;
  /** Widget IDs this filter applies to */
  applies_to?: string[];
  /** Valid operators with display labels for this filter type */
  valid_operators?: { value: string; label: string }[];
  // ─── v2 additions ─────────────────────────────────────────────
  /** When true, the filter's value may be a dynamic token (e.g. THIS_QUARTER, MY_RECORDS). */
  dynamic?: boolean;
  /** True if this filter is locked at the dashboard level by the owner. */
  is_locked?: boolean;
  /**
   * Whether the current viewer may edit this filter at the dashboard level.
   * Owners: always true. Viewers: true unless `is_locked`.
   */
  is_editable?: boolean;
  /** Hard extraction boundary — values outside this range are not queryable. */
  boundary?: { operator: string; value: unknown };
  /** Human-readable description of the boundary (e.g., "Last 1 year"). */
  boundary_description?: string;
  /** Source types this filter applies to (e.g. ["salesforce", "snowflake"]). */
  sources?: string[];
  /** For dynamic date filters — non-parameterized tokens (TODAY, THIS_QUARTER, LAST_30_DAYS, …). */
  available_presets?: string[];
  /**
   * For dynamic date filters — parameterized tokens that take an N value (e.g. LAST_N_DAYS).
   * The frontend renders each as a selectable option with an inline number input.
   */
  available_dynamic_options?: {
    id: string; // e.g. "LAST_N_DAYS"
    label: string; // display label, e.g. "Last N days"
    default_n: number;
    unit: string; // suffix shown next to the input, e.g. "days"
  }[];
  /** Per-panel lock metadata: panel_id → true if locked for that panel. */
  panel_locks?: Record<string, boolean>;
}

// ─── Dynamic Tokens (v2) ─────────────────────────────────────────

/** Dynamic date tokens resolved server-side at query time. */
export type DynamicDateToken =
  // Tier 1
  | "TODAY"
  | "THIS_WEEK"
  | "THIS_MONTH"
  | "THIS_QUARTER"
  | "THIS_FISCAL_QUARTER"
  | "THIS_YEAR"
  | "THIS_FISCAL_YEAR"
  | "LAST_QUARTER"
  | "QUARTER_TO_DATE"
  | "YEAR_TO_DATE"
  | "LAST_7_DAYS"
  | "LAST_30_DAYS"
  | "LAST_90_DAYS"
  // Tier 2
  | "YESTERDAY"
  | "TOMORROW"
  | "LAST_WEEK"
  | "NEXT_WEEK"
  // N-parameterized tokens use "TOKEN:N" form (e.g. "LAST_N_DAYS:30").
  | string;

/** Dynamic ownership tokens resolved server-side per viewer. */
export type OwnershipToken =
  | "MY_RECORDS"
  | "MY_TEAMS_RECORDS"
  | "MY_MANAGERS_TEAM"
  | "ALL_RECORDS";

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
  defaults?: DashboardFilterState;
  // ─── v2 additions ─────────────────────────────────────────────
  /** Per-panel user filter overrides: {panel_id: {filter_id: FilterValue}}. */
  panel_state?: Record<string, Record<string, FilterValue>>;
  /** Dashboard-level owner-locked filters: {filter_id: FilterValue}. */
  locked_filter_state?: Record<string, FilterValue>;
  /** Panel-level owner-locked filters: {panel_id: {filter_id: FilterValue}}. */
  locked_panel_filter_state?: Record<string, Record<string, FilterValue>>;
  /** For each filter, the source types it applies to (for badge rendering). */
  source_applicability?: Record<string, string[]>;
  /** For each query, the source types it reads from (for widget badges). */
  query_sources?: Record<string, string[]>;
}

/** @deprecated Use DashboardFilterDefinition */
export type DashboardFilter = DashboardFilterDefinition;

// ─── Filter API (PATCH /dashboards/{id}/filters) ────────────────

export type FilterOperator =
  // picklist
  | "in"
  | "not_in"
  // picklist + text
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  // text only
  | "starts_with"
  | "ends_with"
  // date
  | "on"
  | "before"
  | "after"
  | "on_or_before"
  | "on_or_after"
  // number
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  // date + number range
  | "between"
  | "not_between"
  // universal
  | "is_blank"
  | "is_not_blank";

export interface FilterValue {
  operator: FilterOperator;
  value?: string | number | string[] | [string, string] | [number, number];
  include_blank?: boolean;
  // ─── v2 additions ─────────────────────────────────────────────
  /** Owner-only: lock this filter so non-owners cannot edit it. */
  is_locked?: boolean;
  /** Server-resolved concrete value for dynamic tokens (e.g. THIS_QUARTER → [date, date]). */
  resolved_value?: unknown;
}

export type FilterPatchPayload = Record<
  string,
  FilterValue | FilterValue[] | null
>;

export interface FilterPatchResponse {
  dashboard_id: string;
  dashboard_version: number;
  definitions: DashboardFilterDefinition[];
  state: Record<string, FilterValue>;
  defaults?: Record<string, FilterValue>;
  // ─── v2 additions ─────────────────────────────────────────────
  panel_state?: Record<string, Record<string, FilterValue>>;
  locked_filter_state?: Record<string, FilterValue>;
  locked_panel_filter_state?: Record<string, Record<string, FilterValue>>;
}

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
  title: string;
  query: string;
  data: Record<string, unknown>[];
  pagination: PanelDrilldownPagination;
}
