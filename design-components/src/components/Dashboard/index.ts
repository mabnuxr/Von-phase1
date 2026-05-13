// Dashboard — View-only dashboard display components

export { DashboardGrid } from './DashboardGrid';
export { WidgetShell } from './WidgetShell';
export { WidgetRenderer } from './WidgetRenderer';
export { AutoFitContext, useAutoFit } from './AutoFitContext';
export type { AutoFitController, AutoFitReport } from './AutoFitContext';
export { DashboardGridConfigContext, useDashboardGridConfig } from './DashboardGridConfigContext';
export { useContentHeightFit } from './useContentHeightFit';
export type { ContentHeightFitOptions } from './useContentHeightFit';
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
  MustacheVariables,
  TableWidgetConfig,
  TablePaginationInfo,
  SortState,
  DrillFilters,
  QueryInfo,
  AppliedWidgetFilter,
  WidgetAddToChatPayload,
} from './types';

// ── DashboardLayout (Compound component) ────────────────────────────
export { DashboardLayout } from './DashboardLayout';

// ── DataSourcesDrawer ───────────────────────────────────────────────
export { DataSources } from './DataSourcesDrawer';
export type { DataSourcesProps, DataSource, DataSourceIcon } from './DataSourcesDrawer';
