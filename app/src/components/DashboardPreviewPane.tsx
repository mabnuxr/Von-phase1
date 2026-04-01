/**
 * DashboardPreviewPane - Shows AnalyticsView in a resizable right pane
 *
 * Opened when user clicks "View Dashboard" in the chat conversation.
 * Has a header with title, close button, and expand button.
 * Expand navigates to the full dashboard page with conversationId.
 */

import { useCallback, memo } from "react";
import { useGuardedNavigate } from "../providers/NavigationGuard";
import { useDashboardQuery } from "../hooks/useDashboardQuery";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import { useAnalyticsTools } from "../hooks/useAnalyticsTools";
import { useTableServerPagination } from "../hooks/useTableServerPagination";
import { useDrilldown } from "../hooks/useDrilldown";
import { useDashboardUpdate } from "../hooks/useDashboardUpdate";
import { useDashboardSchedule } from "../hooks/useDashboardSchedule";
import { useDashboardRefreshEvents } from "../hooks/useDashboardRefreshEvents";
import { AnalyticsView, AnalyticsSkeleton, AnalyticsError } from "./Analytics";
import { DrilldownPanel } from "./Analytics/DrilldownPanel";

interface DashboardPreviewPaneProps {
  dashboardId: string;
  conversationId: string;
  onClose: () => void;
}

export const DashboardPreviewPane = memo(function DashboardPreviewPane({
  dashboardId,
  conversationId,
  onClose,
}: DashboardPreviewPaneProps) {
  const navigate = useGuardedNavigate();
  const { data, isLoading, isFetching, error } = useDashboardQuery(dashboardId);
  const {
    handleSave,
    savePhase,
    showSaveToast,
    isFirstSave,
    handleRevert,
    revertPhase,
    handleShare,
    sharePhase,
    handleRefresh,
    editModeMutation,
    editModePhase,
  } = useAnalyticsTools(dashboardId);

  const { handleUpdate } = useDashboardUpdate(dashboardId);
  const { isRefreshing } = useDashboardRefreshEvents(dashboardId);
  const {
    schedule,
    isScheduled,
    isPaused: isSchedulePaused,
    isMutating: isScheduleMutating,
    handleCreateSchedule,
    handleUpdateSchedule,
    handlePauseSchedule,
    handleResumeSchedule,
    handleDeleteSchedule,
  } = useDashboardSchedule(dashboardId);

  const handleColorThemeChange = useCallback(
    (themeId: string) => {
      handleUpdate({
        ui_config: {
          color_palette_global: themeId,
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
    definitions: filterDefinitions,
    filterState,
    activeCount: filterActiveCount,
    handleFilterChange,
    handleClearFilter,
  } = useDashboardFilters(
    dashboardId,
    dashboard?.filters?.definitions ?? [],
    activeFilters,
  );

  const {
    mergedWidgets,
    handlePageChange,
    handleSortChange,
    loadingPanels,
    activeSorts,
  } = useTableServerPagination(dashboardId, dashboard?.widgets ?? {});

  const {
    isOpen: isDrilldownOpen,
    widgetTitle: drilldownWidgetTitle,
    data: drilldownData,
    pagination: drilldownPagination,
    currentSort: drilldownSort,
    isLoading: isDrilldownLoading,
    isError: isDrilldownError,
    openDrilldown,
    openPointDrilldown,
    closeDrilldown,
    changePage: changeDrilldownPage,
    changeSort: changeDrilldownSort,
  } = useDrilldown(dashboardId, dashboard?.widgets ?? {});

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
      {isLoading || isRefreshing ? (
        <AnalyticsSkeleton />
      ) : error || !dashboard ? (
        <AnalyticsError error={error?.message ?? null} />
      ) : (
        <>
          <AnalyticsView
            dashboard={dashboard}
            refreshInfo={refreshInfo}
            filterDefinitions={filterDefinitions}
            filterState={filterState}
            filterActiveCount={filterActiveCount}
            onFilterChange={handleFilterChange}
            onClearFilter={handleClearFilter}
            onRefresh={handleRefresh}
            onSave={handleSave}
            savePhase={savePhase}
            showSaveToast={showSaveToast}
            isFirstSave={isFirstSave}
            onRevert={handleRevert}
            revertPhase={revertPhase}
            onShare={handleShare}
            sharePhase={sharePhase}
            onExpand={handleExpand}
            onClose={onClose}
            onTablePageChange={handlePageChange}
            loadingTablePanels={loadingPanels}
            paginatedWidgets={mergedWidgets}
            onDrillDown={openDrilldown}
            onPointDrillDown={openPointDrilldown}
            onTableSortChange={handleSortChange}
            tableSortStates={activeSorts}
            defaultColorTheme={dashboard.uiConfig?.colorPaletteGlobal}
            onColorThemeChange={handleColorThemeChange}
            onRename={handleRename}
            hideCreatorChip
            schedule={schedule}
            isScheduled={isScheduled}
            isSchedulePaused={isSchedulePaused}
            isScheduleMutating={isScheduleMutating}
            onCreateSchedule={handleCreateSchedule}
            onUpdateSchedule={handleUpdateSchedule}
            onPauseSchedule={handlePauseSchedule}
            onResumeSchedule={handleResumeSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            onEditModeChange={editModeMutation.mutate}
            editModePhase={editModePhase}
            isRefetchingData={isFetching && !isLoading}
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
            onSortChange={changeDrilldownSort}
            sortState={drilldownSort}
          />
        </>
      )}
    </div>
  );
});
