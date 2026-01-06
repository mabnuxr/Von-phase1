import type { Layout } from 'react-grid-layout';
import type { DashboardWidget } from '../types';

export type DashboardData = {
  layout: Layout;
  widgets: {
    [key: string]: DashboardWidget;
  };
};

export type UseDashboardGridLayoutParams = {
  fetchDashboardData: () => Promise<DashboardData>;
  updateDashboardLayout: (params: { layout: Layout }) => Promise<void>;
};

export type DashboardGridProps = {
  dashboardData: DashboardData;
  loading?: boolean;
  onLayoutChange: (layout: Layout) => void;
  onWidgetEdit?: (widgetId: string) => void;
  onWidgetExpand?: (widgetId: string) => void;
  onWidgetDelete?: (widgetId: string) => void;
  width?: number;
};

export type WidgetLayoutProps = {
  title: string;
  subtitle?: string;
  onEdit?: () => void;
  onExpand?: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
};

export type WidgetProps = {
  widget: DashboardWidget;
  onEdit?: () => void;
  onExpand?: () => void;
  onDelete?: () => void;
};
