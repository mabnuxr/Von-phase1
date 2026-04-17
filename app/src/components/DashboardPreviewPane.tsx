/**
 * DashboardPreviewPane - Shows AnalyticsView in a resizable right pane
 *
 * Opened when user clicks "View Dashboard" in the chat conversation.
 * Has a header with title, close button, and expand button.
 * Expand navigates to the full dashboard page with conversationId.
 */

import { useCallback, memo } from "react";
import { useGuardedNavigate } from "../providers/NavigationGuard";
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
import { EditModeBanner } from "./Analytics/EditModeBanner";

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
    panelFilterState,
    lockedFilterState,
    lockedPanelFilterState,
    canApply: filterCanApply,
    isApplying: filterIsApplying,
    handleFilterChange,
    handleRevertFilter,
    handleRemoveFilter,
    handleClearFilter,
    handlePanelFilterChange,
    handleResetPanelFilter,
    handleRevertPanelFilter,
    handleRevertPanel,
    handleApplyPanelFilter,
    canApplyPanelFilter,
    handleCommitPanelLock,
    canLockPanelFilter,
    handleCommitLock,
    canLockFilter,
    getEffectivePanelState,
    handleApply,
  } = useDashboardFilters(
    dashboardId,
    dashboard?.filters?.definitions ?? [],
    activeFilters,
    {
      panelState: dashboard?.filters?.panel_state,
      lockedFilterState: dashboard?.filters?.locked_filter_state,
      lockedPanelFilterState: dashboard?.filters?.locked_panel_filter_state,
      isOwner: dashboard?.isOwner,
    },
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
            filterCanApply={filterCanApply}
            filterIsApplying={filterIsApplying}
            onFilterChange={handleFilterChange}
            onRemoveFilter={handleRemoveFilter}
            onApplyFilters={handleApply}
            onClearFilter={handleClearFilter}
            onToggleLock={handleCommitLock}
            canLockFilter={canLockFilter}
            onRevertFilter={handleRevertFilter}
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
            isDrilldownOpen={isDrilldownOpen}
            panelFilterState={panelFilterState}
            lockedFilterState={lockedFilterState}
            getEffectivePanelState={getEffectivePanelState}
            onPanelFilterChange={handlePanelFilterChange}
            onResetPanelFilter={handleResetPanelFilter}
            onRevertPanelFilter={handleRevertPanelFilter}
            onRevertPanel={handleRevertPanel}
            onApplyPanelFilter={handleApplyPanelFilter}
            canApplyPanelFilter={canApplyPanelFilter}
            onTogglePanelLock={
              dashboard.isOwner ? handleCommitPanelLock : undefined
            }
            canLockPanelFilter={canLockPanelFilter}
            lockedPanelFilterState={lockedPanelFilterState}
          />
          {/* Edit mode banner — floats above drilldown panel when both are active */}
          <EditModeBanner
            visible={dashboard.isEditable && isDrilldownOpen}
            className="absolute bottom-0 left-0 right-0 z-[51] pointer-events-none flex justify-center pb-4"
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
