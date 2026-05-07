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

/**
 * Maps a click value to a SQL expression for drilldown filtering.
 *
 * `data_key` is the SQL column name (or short synthetic identifier like
 * `_won_status` for chart axes that aren't real columns). The same
 * `data_key` is what the FE emits in `drill_filters` — single namespace at
 * the wire (matched against the level's column_map on the backend).
 *
 * `extract_from` is the optional Highcharts-property bridge for chart
 * parent clicks. When set, the FE reads the click value from
 * `point[extract_from]` (e.g. `point.name`, `point.x`, `series.name`) but
 * emits the filter keyed by `data_key`. When omitted, the FE looks up
 * `point[data_key]` directly — works for table cells / row clicks where
 * the data_key already matches a key on the click event payload.
 *
 * Legacy V1 dashboards may persist `data_key` values like `point.name` —
 * the FE falls back to dotted-path lookup when `extract_from` is unset,
 * so those continue to work without migration.
 */
export interface DrilldownColumnMapping {
  data_key: string;
  sql_expression: string;
  extract_from?: string | null;
}

export interface DrilldownConfig {
  query_ref: string;
  column_map: DrilldownColumnMapping[];
}

/** Column-value pairs sent as drill filters from a chart point click. */
export type DrillFilters = Record<string, unknown>;

// ─── V2 drilldown (server-shape mirror — pyramid model) ──────────
//
// Mirrors the persisted ``panel.drilldown_v2`` field — a flat list of levels.
// Each level corresponds to reversing one aggregation in the panel's main
// query path. Widget components only read this to wire chart-point clicks
// back into the L0 (= levels[0]) column_map; variant UI / level navigation
// lives in the app's drilldown panel component.

export interface DrilldownV2ColumnMapping {
  data_key: string;
  sql_expression: string;
  /**
   * Optional Highcharts-property bridge for chart parent clicks. See the
   * docstring on the legacy ``DrilldownColumnMapping`` above for the full
   * semantics — same field, same behavior.
   */
  extract_from?: string | null;
  title?: string | null;
  sql_type?: string | null;
  pipe?: string | null;
  value_format?: string | null;
}

export interface DrilldownV2Variant {
  id: string;
  is_default?: boolean;
  column_map?: DrilldownV2ColumnMapping[];
  /**
   * Optional whitelist of column ids in this variant's drill output that
   * are clickable for further descent. Aggregated metric columns only —
   * GROUP BY dimensions are excluded. ``null``/``undefined`` = back-compat
   * (every cell clickable). Used by the drill-view bottom-sheet table.
   */
  drillable_columns?: string[] | null;
  /**
   * Optional column → next-level variant routing. When the user clicks one
   * of THIS variant's drillable cells in the drill view and descends to
   * the next level, the FE looks up the clicked column id here; if
   * present, the next level opens with the mapped variant id (instead of
   * its is_default). Columns NOT in the map fall back to the next level's
   * default. Use when a clickable column corresponds 1:1 to a specific
   * next-level variant (e.g. clicking "Won deals" descends into the "won"
   * variant rather than the default "all"). Ignored for leaf-level
   * variants (no next level).
   */
  column_variant_map?: Record<string, string> | null;
  // The remaining fields (label, description, justification_template,
  // query_ref) aren't read here — the widget only needs column_map for
  // point-click filter extraction.
}

export interface DrilldownV2Level {
  variants: DrilldownV2Variant[];
}

export interface PanelDrilldownV2 {
  /**
   * Ordered top→bottom. levels[0] reverses the topmost aggregation of the
   * panel's main query (the one that produced the panel's value); levels[-1]
   * reaches raw entity rows. Empty list = panel is non-drillable (raw rows).
   */
  levels: DrilldownV2Level[];
  /**
   * Optional whitelist of column ids in the panel's main query output that
   * are clickable to open the drill view. Aggregated metric columns only —
   * GROUP BY dimensions are excluded. ``null``/``undefined`` = back-compat
   * (every cell clickable). Used by the dashboard table widget; ignored
   * for non-table panels.
   */
  drillable_columns?: string[] | null;
  /**
   * Optional column → L1 variant routing for table panels. When the user
   * clicks a panel cell and opens the drill view (L0 → L1), the FE looks
   * up the clicked column id here; if present, L1 opens with the mapped
   * variant id (instead of L1's is_default). Columns NOT in the map fall
   * back to L1's default. Use when a clickable panel column corresponds
   * 1:1 to a specific L1 variant (e.g. clicking the "Won deals" column
   * opens the "won" variant rather than the default "all_deals").
   */
  column_variant_map?: Record<string, string> | null;
}

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
  /**
   * V2 drilldown configuration (pyramid model). Present when the panel was
   * authored with the ``drilldown_v2`` flag on. Widgets prefer this over
   * ``drilldown`` for point-click filter extraction (read off levels[0]'s
   * default variant); the variant selector and level-descent UI live in the
   * drilldown panel component, not the widget itself.
   */
  drilldown_v2?: PanelDrilldownV2 | null;
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
  /** Callback when the "add to chat" icon is clicked. Button hidden when absent. */
  onAddToChat?: () => void;
  /**
   * When true, renders the orange tab-pill drag handle next to the title.
   * Only takes effect alongside the dashboard-level drag-and-drop flag.
   */
  isEditMode?: boolean;
}

// ─── Text ────────────────────────────────────────────────────────

export interface TextWidgetConfig {
  content: string;
  variant?: 'heading' | 'subheading' | 'body' | 'caption';
  alignment?: 'left' | 'center' | 'right';
  overflow?: 'auto' | 'hidden' | 'visible';
}

/** Flat key → value map fed to `{{key}}` mustache tokens at render time. */
export type MustacheVariables = Record<string, string | number | null | undefined>;

export interface TextWidgetProps {
  /** Panel id used by auto-fit coordination. Pass through from WidgetRenderer. */
  panelId?: string;
  config: TextWidgetConfig;
  /** Variables substituted into `{{key}}` tokens in `config.content`. */
  variables?: MustacheVariables;
  onAddToChat?: () => void;
  /**
   * When true, renders the orange tab-pill drag handle at the top-left so the
   * widget can be moved while the dashboard is in edit mode. Only takes
   * effect alongside the dashboard-level drag-and-drop flag.
   */
  isEditMode?: boolean;
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
  /** Callback when the "add to chat" icon is clicked. Button hidden when absent. */
  onAddToChat?: () => void;
  /**
   * When true, renders the orange tab-pill drag handle next to the title.
   * Only takes effect alongside the dashboard-level drag-and-drop flag.
   */
  isEditMode?: boolean;
}

// ─── Widget Renderer ─────────────────────────────────────────────

/** Minimal widget snapshot emitted to the "add to chat" callback. */
export interface WidgetAddToChatPayload {
  id: string;
  title: string;
  type: WidgetType;
}

export interface WidgetRendererProps {
  widget: WidgetConfig;
  onTablePageChange?: (panelId: string, page: number) => void;
  isTableLoading?: boolean;
  /** Callback when a widget's drilldown icon is clicked (chart-level), or
   *  when a KPI tile is clicked. The optional ``metricValue`` carries the
   *  KPI's resolved numeric so the drill breadcrumb can render it as a
   *  parenthesized suffix (chart drill icon leaves it null since charts
   *  don't have a single "value" to drill into). */
  onDrillDown?: (panelId: string, metricValue?: unknown) => void;
  /** Callback when a chart data point is clicked (point-level drilldown)
   *  or a table cell is clicked. ``metricValue`` carries the clicked
   *  point/cell's numeric value; ``metricLabel`` carries the column's
   *  display label for table-style sources (renders "label: value" in
   *  the breadcrumb suffix); chart sources leave it null since the axis
   *  is already in the segment's main label. ``variantId``: when the
   *  panel's drilldown_v2.column_variant_map maps the clicked column to
   *  a specific L1 variant id, that id is forwarded so the drill view
   *  opens with the matched variant rather than L1's default. */
  onPointDrillDown?: (
    panelId: string,
    drillFilters: DrillFilters,
    metricValue?: unknown,
    metricLabel?: string,
    variantId?: string | null
  ) => void;
  /** Callback when a table column header is clicked for sorting */
  onTableSortChange?: (panelId: string, columnId: string, order: 'asc' | 'desc' | null) => void;
  /** Current sort state for this table widget */
  tableSortState?: SortState;
  /** Filters currently applied to this widget (read-only display) */
  appliedFilters?: AppliedWidgetFilter[];
  /** Optional slot rendered in place of the read-only filter popover (v2). */
  filterSlot?: React.ReactNode;
  /** Callback when the widget's "add to chat" icon is clicked. Button hidden when absent. */
  onAddToChat?: (widget: WidgetAddToChatPayload) => void;
  /** Variables for `{{key}}` mustache tokens inside a text widget's content. */
  variables?: MustacheVariables;
  /**
   * When true, renders edit-mode chrome (drag-pill in widget header). Pass
   * through from the grid; only takes effect alongside the drag-drop flag.
   */
  isEditMode?: boolean;
}

// ─── Dashboard Grid ──────────────────────────────────────────────

export interface DashboardGridProps {
  layout: LayoutItem[];
  widgets: Record<string, WidgetConfig>;
  gridConfig: GridConfig;
  onTablePageChange?: (panelId: string, page: number) => void;
  loadingTablePanels?: Set<string>;
  /** Callback when a widget's drilldown icon is clicked (chart-level), or
   *  when a KPI tile is clicked. The optional ``metricValue`` carries the
   *  KPI's resolved numeric so the drill breadcrumb can render it as a
   *  parenthesized suffix (chart drill icon leaves it null since charts
   *  don't have a single "value" to drill into). */
  onDrillDown?: (panelId: string, metricValue?: unknown) => void;
  /** Callback when a chart data point is clicked (point-level drilldown)
   *  or a table cell is clicked. ``metricValue`` carries the clicked
   *  point/cell's numeric value; ``metricLabel`` carries the column's
   *  display label for table-style sources (renders "label: value" in
   *  the breadcrumb suffix); chart sources leave it null since the axis
   *  is already in the segment's main label. ``variantId``: when the
   *  panel's drilldown_v2.column_variant_map maps the clicked column to
   *  a specific L1 variant id, that id is forwarded so the drill view
   *  opens with the matched variant rather than L1's default. */
  onPointDrillDown?: (
    panelId: string,
    drillFilters: DrillFilters,
    metricValue?: unknown,
    metricLabel?: string,
    variantId?: string | null
  ) => void;
  /** Callback when a table column header is clicked for sorting */
  onTableSortChange?: (panelId: string, columnId: string, order: 'asc' | 'desc' | null) => void;
  /** Current sort state per panel */
  tableSortStates?: Record<string, SortState>;
  /** Whether the dashboard is in edit mode (shows visual indicators on widgets) */
  isEditMode?: boolean;
  /**
   * Whether widgets can be rearranged via drag-and-drop and resized in edit
   * mode. Only takes effect when `isEditMode` is also true. Defaults to true
   * for backward compatibility — callers gating behind a feature flag should
   * pass this explicitly.
   */
  isDragDropEnabled?: boolean;
  /** Whether all widgets are loading (e.g. after a filter change) */
  isLoading?: boolean;
  /** Applied filters per widget ID (read-only display) */
  widgetAppliedFilters?: Record<string, AppliedWidgetFilter[]>;
  /**
   * Per-widget filter slot factory (v2). When provided, replaces the read-only
   * WidgetFiltersPopover with app-supplied editable UI.
   */
  widgetFilterSlot?: (panelId: string) => React.ReactNode;
  /** Callback when a widget's "add to chat" icon is clicked. Button hidden when absent. */
  onAddToChat?: (widget: WidgetAddToChatPayload) => void;
  /** Per-widget variables map for `{{key}}` mustache tokens inside text widgets. */
  variablesByWidget?: Record<string, MustacheVariables>;
  /**
   * Called with the new layout (array of {i,x,y,w,h}) whenever the user drags
   * or resizes a widget in edit mode. Parent persists the layout; the grid
   * itself is stateless with respect to positions.
   */
  onLayoutChange?: (layout: readonly LayoutItem[]) => void;
}
