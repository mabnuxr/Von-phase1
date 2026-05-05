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
import { useAddWidgetToChat } from "../hooks/useAddWidgetToChat";
import { useDashboardQuery } from "../hooks/useDashboardQuery";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import { useAnalyticsTools } from "../hooks/useAnalyticsTools";
import { useTableServerPagination } from "../hooks/useTableServerPagination";
import { useDrilldown } from "../hooks/useDrilldown";
import { useDrilldownV2 } from "../hooks/useDrilldownV2";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useDashboardUpdate } from "../hooks/useDashboardUpdate";
import { useDashboardSchedule } from "../hooks/useDashboardSchedule";
import { useDashboardRefreshEvents } from "../hooks/useDashboardRefreshEvents";
import { AnalyticsView, AnalyticsSkeleton, AnalyticsError } from "./Analytics";
import { DrilldownPanel, DrilldownPanelV2 } from "./Analytics/DrilldownPanel";
import { EditModeBanner } from "./Analytics/EditModeBanner";
import { rowDescentFilters } from "../utils/drilldownFilters";

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

  // V2 drilldown wiring — exact mirror of pages/Analytics.tsx so preview
  // mode and full mode produce byte-identical drill requests. Without this,
  // V2-built panels (which only have ``drilldown_v2`` config, no V1
  // ``drilldown.query_ref``) fall through to the V1 endpoint in preview
  // mode and the backend 500s because the panel has no V1 drilldown to
  // execute. Per ``feedback_preview_parity.md``: preview must mirror full
  // mode changes — V2 drilldown is one of those changes.
  const { isDrilldownV2Enabled } = useFeatureFlag();
  const drillV2 = useDrilldownV2(dashboardId);
  const shouldUseV2 = useCallback(
    (panelId: string) => {
      if (!isDrilldownV2Enabled) return false;
      const widget = dashboard?.widgets?.[panelId];
      return !!widget?.drilldown_v2;
    },
    [isDrilldownV2Enabled, dashboard?.widgets],
  );
  const handleWidgetDrillDown = useCallback(
    (panelId: string) => {
      if (shouldUseV2(panelId)) {
        drillV2.openPanelDrilldown(panelId, [], {});
        return;
      }
      openDrilldown(panelId);
    },
    [shouldUseV2, drillV2, openDrilldown],
  );
  const handlePointDrillDown = useCallback(
    (panelId: string, filters: Record<string, unknown>) => {
      if (shouldUseV2(panelId)) {
        drillV2.openPanelDrilldown(panelId, [], filters);
        return;
      }
      openPointDrilldown(panelId, filters);
    },
    [shouldUseV2, drillV2, openPointDrilldown],
  );
  const handleV2RowDrill = useCallback(
    (_rowIndex: number, rowData: Record<string, unknown>) => {
      const filters = rowDescentFilters(rowData);
      const breadcrumbSeg =
        Object.keys(filters)[0] ?? `L${drillV2.clickChain.length}`;
      const topChainNode = drillV2.clickChain[drillV2.clickChain.length - 1];
      const nextPath = [...(topChainNode?.columnPath ?? []), breadcrumbSeg];
      drillV2.pushLevel(nextPath, filters);
    },
    [drillV2],
  );

  const handleExpand = useCallback(() => {
    navigate(
      `/redirecting?to=${encodeURIComponent(`/dashboard/${dashboardId}?conversationId=${conversationId}`)}`,
      collapseSidebar,
    );
  }, [navigate, dashboardId, conversationId, collapseSidebar]);

  const handleAddWidgetToChat = useAddWidgetToChat(conversationId, dashboard);

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
            isPreview
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
            onDrillDown={handleWidgetDrillDown}
            onPointDrillDown={handlePointDrillDown}
            onAddWidgetToChat={handleAddWidgetToChat}
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
            isDrilldownOpen={isDrilldownOpen || drillV2.isOpen}
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
          {/* Edit mode banner — floats above drilldown panel when either V1 or V2 drill is open */}
          <EditModeBanner
            visible={
              dashboard.isEditable && (isDrilldownOpen || drillV2.isOpen)
            }
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
          {/* V2 drilldown panel — mounted in parallel with V1, gated on the
              ``drilldown_v2`` LD flag so V1-only users never see V2 chrome.
              The handlers above route per-panel based on widget config; the
              panel itself only opens when one of those handlers fires. */}
          {isDrilldownV2Enabled && (
            <DrilldownPanelV2
              drill={drillV2}
              widgetTitle={
                drillV2.panelId
                  ? (dashboard.widgets?.[drillV2.panelId]?.title ?? "Drilldown")
                  : "Drilldown"
              }
              onRowDrill={handleV2RowDrill}
            />
          )}
        </>
      )}
    </div>
  );
});
