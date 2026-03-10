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

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  config: ChartWidgetConfig | CounterWidgetConfig | TableWidgetConfig | TextWidgetConfig;
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
  value: string | number | null;
  format: 'number' | 'currency' | 'percentage';
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    sentiment: 'positive' | 'negative' | 'neutral';
    label?: string;
    /** Unit suffix shown after the trend value (e.g. '%', 'pts'). Defaults to no suffix. */
    unit?: string;
  };
  sparkline?: {
    data: number[];
    type: 'line' | 'bar';
  };
  /** Progress value as a percentage (0-100) for horizontal progress bar */
  progress?: number;
  /** Target/goal value to display alongside progress */
  target?: string;
  accentColor?: string;
}

export interface CounterWidgetProps {
  config: CounterWidgetConfig;
  title?: string;
  subtitle?: string;
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

// ─── Table (placeholder) ─────────────────────────────────────────

export interface TableWidgetConfig {
  columns: unknown[];
  [key: string]: unknown;
}

// ─── Widget Shell ────────────────────────────────────────────────

export interface WidgetShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

// ─── Widget Renderer ─────────────────────────────────────────────

export interface WidgetRendererProps {
  widget: WidgetConfig;
}

// ─── Dashboard Grid ──────────────────────────────────────────────

export interface DashboardGridProps {
  layout: LayoutItem[];
  widgets: Record<string, WidgetConfig>;
  gridConfig: GridConfig;
}
