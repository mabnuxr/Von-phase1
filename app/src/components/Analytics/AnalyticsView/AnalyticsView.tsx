import { DashboardGrid } from "@vonlabs/design-components";
import { AnalyticsHeader } from "../AnalyticsHeader";
import { AnalyticsFilters } from "../AnalyticsFilters";
import type { Dashboard, RefreshInfo } from "../../../types/dashboard";
import type {
  WidgetConfig,
  GridConfig,
  LayoutItem,
} from "@vonlabs/design-components";

interface AnalyticsViewProps {
  dashboard: Dashboard;
  refreshInfo: RefreshInfo | null;
  activeFilters: Record<string, unknown>;
  onRefresh: () => Promise<void>;
}

/**
 * Container component that composes the analytics header, filters, and grid.
 */
const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  dashboard,
  refreshInfo,
  activeFilters,
  onRefresh,
}) => {
  // Cast API types to display types (structurally compatible)
  const gridConfig = dashboard.gridConfig as unknown as GridConfig;
  const layout = dashboard.layout as unknown as LayoutItem[];
  const widgets = dashboard.widgets as unknown as Record<string, WidgetConfig>;

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full overflow-auto rounded-lg bg-white shadow-xs border border-gray-200">
      <div className="px-4 pt-2 shrink-0">
        <AnalyticsHeader
          title={dashboard.title}
          description={dashboard.description}
          refreshInfo={refreshInfo}
          onRefresh={onRefresh}
        />
        {dashboard.filters && dashboard.filters.length > 0 && (
          <AnalyticsFilters
            filters={dashboard.filters}
            activeFilters={activeFilters}
          />
        )}
      </div>

      <div className="flex-1 min-h-0 px-4 pb-4">
        <DashboardGrid
          layout={layout}
          widgets={widgets}
          gridConfig={gridConfig}
        />
      </div>
    </div>
  );
};

export { AnalyticsView };
