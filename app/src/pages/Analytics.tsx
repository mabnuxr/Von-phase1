import { useParams } from "react-router-dom";
import { useDashboard } from "../hooks/useDashboard";
import { AnalyticsView } from "../components/Analytics";

const Analytics = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const { dashboard, refreshInfo, loading, error, activeFilters, refresh } =
    useDashboard(dashboardId);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg bg-white shadow-xs border border-gray-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg bg-white shadow-xs border border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {error ?? "Dashboard not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnalyticsView
      dashboard={dashboard}
      refreshInfo={refreshInfo}
      activeFilters={activeFilters}
      onRefresh={refresh}
    />
  );
};

export default Analytics;
