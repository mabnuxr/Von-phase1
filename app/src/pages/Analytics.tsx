import { useEffect, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  useDashboardQuery,
  useRefreshDashboardMutation,
} from "../hooks/useDashboardQuery";
import { useResizablePane } from "../hooks/useResizablePane";
import { useAppShell } from "../hooks/useAppShell";
import {
  AnalyticsView,
  AnalyticsSkeleton,
  AnalyticsError,
} from "../components/Analytics";
import { AnalyticsChatContainer } from "../components/AnalyticsChatContainer";

const Analytics = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const location = useLocation();
  const conversationId =
    (location.state as { conversationId?: string } | null)?.conversationId ??
    null;
  const { data, isLoading, error } = useDashboardQuery(dashboardId);
  const refreshMutation = useRefreshDashboardMutation(dashboardId);

  const dashboard = data?.dashboard ?? null;
  const refreshInfo = data?.refreshInfo ?? null;
  const activeFilters = data?.activeFilters ?? {};
  const { collapseSidebar } = useAppShell();
  const {
    width: chatPaneWidth,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useResizablePane();

  const handleRefresh = useCallback(async () => {
    try {
      await refreshMutation.mutateAsync();
    } catch (error) {
      console.error("[Analytics] Refresh failed:", error);
    }
  }, [refreshMutation]);

  // Collapse left sidebar on mount
  useEffect(() => {
    collapseSidebar();
  }, [collapseSidebar]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error || !dashboard) {
    return <AnalyticsError error={error?.message ?? null} />;
  }

  return (
    <div className="flex h-full w-full gap-2">
      {/* Dashboard content */}
      <div className="flex-1 min-w-0">
        <AnalyticsView
          dashboard={dashboard}
          refreshInfo={refreshInfo}
          activeFilters={activeFilters}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Chat pane */}
      <div
        style={{
          width: `${chatPaneWidth}px`,
          transition: isResizing ? "none" : "width 0.3s ease",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Resize handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-indigo-500/30 transition-colors z-10 group touch-none"
          style={{ marginLeft: "-3px" }}
        >
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-transparent group-hover:bg-indigo-400 transition-colors" />
        </div>

        {conversationId ? (
          <div className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <AnalyticsChatContainer
              conversationId={conversationId}
              dashboardTitle={dashboard.title}
            />
          </div>
        ) : (
          <div className="h-full w-full bg-white rounded-xl border border-gray-100 shadow-xs flex items-center justify-center">
            <p className="text-sm text-gray-400">
              No conversation context available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
