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
  filters?: DashboardFilter[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  analysisId: string;
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

export interface DashboardFilter {
  id: string;
  label: string;
  field: string;
  type: "select" | "multi-select" | "date-range" | "search" | "range";
  options?: Array<{
    value: string;
    label: string;
    count?: number;
  }>;
  defaultValue?: unknown;
  range?: {
    min: number;
    max: number;
    step?: number;
  };
  affectedWidgets?: string[];
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
