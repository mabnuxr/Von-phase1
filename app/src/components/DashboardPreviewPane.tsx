/**
 * DashboardPreviewPane - Shows AnalyticsView in a resizable right pane
 *
 * Opened when user clicks "View Dashboard" in the chat conversation.
 * Has a header with title, close button, and expand button.
 * Expand navigates to the full dashboard page with conversationId.
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardQuery } from "../hooks/useDashboardQuery";
import { useAnalyticsTools } from "../hooks/useAnalyticsTools";
import { useTableServerPagination } from "../hooks/useTableServerPagination";
import { useDashboardUpdate } from "../hooks/useDashboardUpdate";
import { AnalyticsView, AnalyticsSkeleton, AnalyticsError } from "./Analytics";

interface DashboardPreviewPaneProps {
  dashboardId: string;
  conversationId: string;
  onClose: () => void;
}

export function DashboardPreviewPane({
  dashboardId,
  conversationId,
  onClose,
}: DashboardPreviewPaneProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useDashboardQuery(dashboardId);
  const {
    handleSave,
    savePhase,
    handleRevert,
    handleShare,
    sharePhase,
    handleRefresh,
  } = useAnalyticsTools(dashboardId);

  const { handleUpdate } = useDashboardUpdate(dashboardId);

  const handleColorThemeChange = useCallback(
    (themeId: string) => {
      handleUpdate({ ui_config: { color_palette_global: themeId } });
    },
    [handleUpdate],
  );

  const handleRename = useCallback(
    (newName: string) => {
      handleUpdate({ dashboard_name: newName });
    },
    [handleUpdate],
  );

  const dashboard = data?.dashboard ?? null;
  const refreshInfo = data?.refreshInfo ?? null;
  const activeFilters = data?.activeFilters ?? {};

  const { mergedWidgets, handlePageChange, loadingPanels } =
    useTableServerPagination(dashboardId, dashboard?.widgets ?? {});

  const handleExpand = useCallback(() => {
    navigate(`/dashboard/${dashboardId}?conversationId=${conversationId}`);
  }, [navigate, dashboardId, conversationId]);

  return (
    <div
      style={{
        position: "relative",
      }}
      className="h-full flex-1 min-w-0"
    >
      {isLoading ? (
        <AnalyticsSkeleton />
      ) : error || !dashboard ? (
        <AnalyticsError error={error?.message ?? null} />
      ) : (
        <AnalyticsView
          dashboard={dashboard}
          refreshInfo={refreshInfo}
          activeFilters={activeFilters}
          onRefresh={handleRefresh}
          onSave={handleSave}
          savePhase={savePhase}
          onRevert={handleRevert}
          onShare={handleShare}
          sharePhase={sharePhase}
          onExpand={handleExpand}
          onClose={onClose}
          onTablePageChange={handlePageChange}
          loadingTablePanels={loadingPanels}
          paginatedWidgets={mergedWidgets}
          defaultColorTheme={dashboard.uiConfig?.colorPaletteGlobal}
          onColorThemeChange={handleColorThemeChange}
          onRename={handleRename}
        />
      )}
    </div>
  );
}
