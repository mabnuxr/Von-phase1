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
} from './types';

// ── DashboardLayout (Compound component) ────────────────────────────
export { DashboardLayout } from './DashboardLayout';

// ── DashboardCustomization (Theme provider) ─────────────────────────
export {
  DashboardCustomizationProvider,
  useDashboardCustomization,
  chartThemes,
  chartThemeIds,
  multiSwatchColors,
} from './DashboardCustomization';
export type {
  DashboardCustomizationState,
  ChartThemeId,
  ChartThemePalette,
} from './DashboardCustomization';
