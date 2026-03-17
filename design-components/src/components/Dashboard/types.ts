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
  query_failed?: boolean;
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

export interface TableWidgetConfig {
  gridOptions: Record<string, unknown>;
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
