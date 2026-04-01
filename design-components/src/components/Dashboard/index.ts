// Dashboard — View-only dashboard display components

export { DashboardGrid } from './DashboardGrid';
export { WidgetShell } from './WidgetShell';
export { WidgetRenderer } from './WidgetRenderer';
export { WidgetErrorBoundary } from './WidgetErrorBoundary';
export { ChartWidget } from './ChartWidget';
export { CounterWidget } from './CounterWidget';
export { TextWidget } from './TextWidget';
export { TableWidget } from './TableWidget';

export type {
  DashboardGridProps,
  WidgetShellProps,
  WidgetRendererProps,
  ChartWidgetProps,
  CounterWidgetProps,
  TextWidgetProps,
  WidgetConfig,
  WidgetType,
  GridConfig,
  LayoutItem,
  ChartWidgetConfig,
  CounterWidgetConfig,
  TextWidgetConfig,
  TableWidgetConfig,
  TablePaginationInfo,
  SortState,
  DrilldownConfig,
  DrilldownColumnMapping,
  DrillFilters,
  QueryInfo,
} from './types';

// ── DashboardLayout (Compound component) ────────────────────────────
export { DashboardLayout } from './DashboardLayout';
