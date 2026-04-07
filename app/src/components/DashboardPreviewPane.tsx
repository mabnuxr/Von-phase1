/**
 * DashboardPreviewPane - Shows AnalyticsView in a resizable right pane
 *
 * Opened when user clicks "View Dashboard" in the chat conversation.
 * Has a header with title, close button, and expand button.
 * Expand navigates to the full dashboard page with conversationId.
 */

import { useCallback, memo } from "react";
import {
  useGuardedNavigate,
  useNavigationGuard,
} from "../providers/NavigationGuard";
import { useAppShell } from "../hooks/useAppShell";
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
  const { collapseSidebar } = useAppShell();
  const { data, isLoading, isFetching, error } = useDashboardQuery(dashboardId);
  const dashboardTitle = data?.dashboard?.title ?? "";
  const isEditable = data?.dashboard?.isEditable ?? false;

  useNavigationGuard({
    when: isEditable,
    title: "Dashboard in edit mode",
    body: `You have unsaved changes on ${dashboardTitle || "this dashboard"}. Are you sure you want to switch?`,
    confirmLabel: "Switch Anyway",
  });

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
    pendingRows: filterPendingRows,
    activeCount: filterActiveCount,
    canApply: filterCanApply,
    isApplying: filterIsApplying,
    handleFilterChange,
    handleRemoveFilter,
    handleAddFilter,
    handleRemovePendingRow,
    handleCommitPendingRow,
    handleApply,
    handleClearAll,
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
    panelId: drilldownPanelId,
    title: drilldownTitle,
    query: drilldownQuery,
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
  } = useDrilldown(dashboardId);

  const handleExpand = useCallback(() => {
    navigate(
      `/redirecting?to=${encodeURIComponent(`/dashboard/${dashboardId}?conversationId=${conversationId}`)}`,
      collapseSidebar,
    );
  }, [navigate, dashboardId, conversationId, collapseSidebar]);

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
        <>
          <AnalyticsView
            dashboard={dashboard}
            refreshInfo={refreshInfo}
            filterDefinitions={filterDefinitions}
            filterState={filterState}
            filterPendingRows={filterPendingRows}
            filterActiveCount={filterActiveCount}
            filterCanApply={filterCanApply}
            filterIsApplying={filterIsApplying}
            onFilterChange={handleFilterChange}
            onRemoveFilter={handleRemoveFilter}
            onAddFilter={handleAddFilter}
            onRemovePendingRow={handleRemovePendingRow}
            onCommitPendingRow={handleCommitPendingRow}
            onApplyFilters={handleApply}
            onClearAll={handleClearAll}
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
            isRefreshing={isRefreshing}
          />
          <DrilldownPanel
            isOpen={isDrilldownOpen}
            onClose={closeDrilldown}
            widgetTitle={
              drilldownTitle ||
              (drilldownPanelId &&
                dashboard.widgets?.[drilldownPanelId]?.title) ||
              "Drilldown"
            }
            query={
              drilldownQuery ||
              (drilldownPanelId &&
                dashboard.widgets?.[drilldownPanelId]?.queryInfo?.sql) ||
              ""
            }
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
