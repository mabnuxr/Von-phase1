import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useDashboardQuery } from "../hooks/useDashboardQuery";
import { useAnalyticsTools } from "../hooks/useAnalyticsTools";
import { useTableServerPagination } from "../hooks/useTableServerPagination";
import { useDrilldown } from "../hooks/useDrilldown";
import { useDashboardUpdate } from "../hooks/useDashboardUpdate";
import { useAppShell } from "../hooks/useAppShell";
import { useVisibilityToggle } from "@vonlabs/design-components";
import { useResizablePane } from "../hooks/useResizablePane";
import {
  AnalyticsView,
  AnalyticsSkeleton,
  AnalyticsError,
} from "../components/Analytics";
import { DrilldownPanel } from "../components/Analytics/DrilldownPanel";
import { AnalyticsChatContainer } from "../components/AnalyticsChatContainer";
import { AnalyticsNewConversationContainer } from "../components/AnalyticsNewConversationContainer";
import { useDashboardRefreshEvents } from "../hooks/useDashboardRefreshEvents";

const Analytics = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>() as {
    dashboardId: string;
  };
  const [searchParams] = useSearchParams();

  // Read conversationId from query params (deep-link support)
  const conversationIdFromParams = searchParams.get("conversationId");

  // Conversation created after the user sends their first message
  const [createdConversationId, setCreatedConversationId] = useState<
    string | null
  >(null);
  // Track which dashboardId was active when the create was initiated so that
  // an in-flight response from a previous dashboard doesn't overwrite state
  // after the user has navigated to a different dashboard.
  const activeDashboardIdRef = useRef(dashboardId);
  const handleConversationCreated = useCallback(
    (conversationId: string) => {
      if (activeDashboardIdRef.current === dashboardId) {
        setCreatedConversationId(conversationId);
      }
    },
    [dashboardId],
  );

  const {
    isVisible: isChatOpen,
    show: openChat,
    hide: closeChat,
  } = useVisibilityToggle();

  const conversationId = conversationIdFromParams ?? createdConversationId;

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
      handleUpdate({
        ui_config: {
          color_palette_global: themeId === "default" ? null : themeId,
        },
      });
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
  const {
    widthCss: chatPaneWidth,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = useResizablePane();
  const { collapseSidebar } = useAppShell();

  const { mergedWidgets, handlePageChange, loadingPanels } =
    useTableServerPagination(dashboardId, dashboard?.widgets ?? {});

  // Drilldown
  const {
    isOpen: isDrilldownOpen,
    widgetTitle: drilldownWidgetTitle,
    data: drilldownData,
    pagination: drilldownPagination,
    isLoading: isDrilldownLoading,
    isError: isDrilldownError,
    openDrilldown,
    closeDrilldown,
    changePage: changeDrilldownPage,
  } = useDrilldown(dashboardId, dashboard?.widgets ?? {});

  // Subscribe to Pusher events for dashboard refresh notifications
  useDashboardRefreshEvents(dashboardId);

  // Collapse left sidebar on mount
  useEffect(() => {
    collapseSidebar();
  }, [collapseSidebar]);

  // Reset local conversation when navigating to a different dashboard
  useEffect(() => {
    activeDashboardIdRef.current = dashboardId;
    setCreatedConversationId(null);
  }, [dashboardId]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error || !dashboard) {
    return <AnalyticsError error={error?.message ?? null} />;
  }

  return (
    <div className="flex h-full w-full gap-1">
      <div className="flex-1 min-w-0 h-full relative">
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
          onChatClick={openChat}
          onChatClose={closeChat}
          isChatOpen={isChatOpen}
          onTablePageChange={handlePageChange}
          loadingTablePanels={loadingPanels}
          paginatedWidgets={mergedWidgets}
          onDrillDown={openDrilldown}
          defaultColorTheme={dashboard.uiConfig?.colorPaletteGlobal}
          onColorThemeChange={handleColorThemeChange}
          onRename={handleRename}
        />
        <DrilldownPanel
          isOpen={isDrilldownOpen}
          onClose={closeDrilldown}
          widgetTitle={drilldownWidgetTitle}
          data={drilldownData}
          pagination={drilldownPagination}
          isLoading={isDrilldownLoading}
          isError={isDrilldownError}
          onPageChange={changeDrilldownPage}
        />
      </div>

      {isChatOpen && (
        <div
          className="h-full flex-shrink-0 relative"
          style={{
            width: chatPaneWidth,
            transition: isResizing ? "none" : "width 0.3s ease",
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
            <AnalyticsChatContainer
              key={conversationId}
              conversationId={conversationId}
              dashboardId={dashboardId}
              dashboardTitle={dashboard.title}
              dashboardVersion={dashboard.dashboardVersion}
            />
          ) : (
            <AnalyticsNewConversationContainer
              key={dashboardId}
              dashboardId={dashboardId}
              dashboardTitle={dashboard.title}
              dashboardVersion={dashboard.dashboardVersion}
              onCreated={handleConversationCreated}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
