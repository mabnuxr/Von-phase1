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
import { useDrilldownV2 } from "../hooks/useDrilldownV2";
import { useDashboardUpdate } from "../hooks/useDashboardUpdate";
import { useDashboardSchedule } from "../hooks/useDashboardSchedule";
import { useDashboardRefreshEvents } from "../hooks/useDashboardRefreshEvents";
import { AnalyticsView, AnalyticsSkeleton, AnalyticsError } from "./Analytics";
import { DrilldownPanelV2 } from "./Analytics/DrilldownPanel";
import { EditModeBanner } from "./Analytics/EditModeBanner";
import {
  getCurrentVariantColumnVariantMap,
  getLevelColumnMaps,
  getLevelDrillableColumns,
  rowDescentFilters,
} from "../utils/drilldownFilters";

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
    saveToastKind,
    isFirstSave,
    handleShareV2,
    shareV2Phase,
    handleAcquireLock,
    acquireLockPhase,
    handleDiscardDraft,
    discardDraftPhase,
    handleSaveDraft,
    saveDraftPhase,
    handleRefresh,
  } = useAnalyticsTools(dashboardId, {
    dashboardVersion: data?.dashboard?.dashboardVersion,
  });

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
      isOwner: dashboard?.accessLevel === "owner",
    },
  );

  const {
    mergedWidgets,
    handlePageChange,
    handleSortChange,
    loadingPanels,
    activeSorts,
  } = useTableServerPagination(dashboardId, dashboard?.widgets ?? {});

  // Drilldown wiring — mirror of pages/Analytics.tsx so preview mode and
  // full mode produce byte-identical drill requests. Per
  // ``feedback_preview_parity.md``: preview must mirror full mode changes.
  const drillV2 = useDrilldownV2(dashboardId);
  const handleWidgetDrillDown = useCallback(
    (panelId: string, metricValue?: unknown) => {
      // KPI tile clicks pass the resolved numeric as ``metricValue``;
      // chart drill-icon clicks pass undefined.
      drillV2.openPanelDrilldown(panelId, [], {}, metricValue);
    },
    [drillV2],
  );
  const handlePointDrillDown = useCallback(
    (
      panelId: string,
      filters: Record<string, unknown>,
      metricValue?: unknown,
      metricLabel?: string,
      variantId?: string | null,
    ) => {
      drillV2.openPanelDrilldown(
        panelId,
        [],
        filters,
        metricValue,
        metricLabel,
        variantId,
      );
    },
    [drillV2],
  );
  const handleV2RowDrill = useCallback(
    (
      _rowIndex: number,
      rowData: Record<string, unknown>,
      metricValue?: unknown,
      metricLabel?: string,
      variantId?: string | null,
    ) => {
      // Mirror of pages/Analytics.tsx::handleV2RowDrill — feed the next
      // level's column_map (and the current level's, for the diff) so each
      // chain entry only carries axes newly introduced at its depth. See
      // `rowDescentFilters` for the cumulative-filter rationale. ``variantId``
      // routes the next level via the active variant's column_variant_map;
      // null falls back to the next level's is_default.
      const widget = drillV2.panelId
        ? dashboard?.widgets?.[drillV2.panelId]
        : undefined;
      const levelColumnMaps = getLevelColumnMaps(widget);
      const currentDepth = drillV2.clickChain.length;
      const filters = rowDescentFilters(
        rowData,
        levelColumnMaps[currentDepth] ?? [],
        levelColumnMaps[currentDepth - 1] ?? [],
      );
      const breadcrumbSeg = Object.keys(filters)[0] ?? `L${currentDepth}`;
      const topChainNode = drillV2.clickChain[currentDepth - 1];
      const nextPath = [...(topChainNode?.columnPath ?? []), breadcrumbSeg];
      drillV2.pushLevel(nextPath, filters, metricValue, metricLabel, variantId);
    },
    [drillV2, dashboard],
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
            saveToastKind={saveToastKind}
            isFirstSave={isFirstSave}
            onShareV2={handleShareV2}
            shareV2Phase={shareV2Phase}
            onAcquireLock={handleAcquireLock}
            acquireLockPhase={acquireLockPhase}
            onDiscardDraft={handleDiscardDraft}
            discardDraftPhase={discardDraftPhase}
            onSaveDraft={handleSaveDraft}
            saveDraftPhase={saveDraftPhase}
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
            isRefetchingData={isFetching && !isLoading}
            isRefreshing={isRefreshing}
            isDrilldownOpen={drillV2.isOpen}
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
              dashboard.accessLevel === "owner"
                ? handleCommitPanelLock
                : undefined
            }
            canLockPanelFilter={canLockPanelFilter}
            lockedPanelFilterState={lockedPanelFilterState}
          />
          {/* Edit mode banner — floats above the drilldown panel when open */}
          <EditModeBanner
            visible={dashboard.isEditable && drillV2.isOpen}
            className="absolute bottom-0 left-0 right-0 z-[51] pointer-events-none flex justify-center pb-4"
          />
          <DrilldownPanelV2
            drill={drillV2}
            widgetTitle={
              drillV2.panelId
                ? (dashboard.widgets?.[drillV2.panelId]?.title ?? "Drilldown")
                : "Drilldown"
            }
            levelColumnMaps={getLevelColumnMaps(
              drillV2.panelId
                ? dashboard.widgets?.[drillV2.panelId]
                : undefined,
            )}
            levelDrillableColumns={getLevelDrillableColumns(
              drillV2.panelId
                ? dashboard.widgets?.[drillV2.panelId]
                : undefined,
            )}
            currentLevelColumnVariantMap={getCurrentVariantColumnVariantMap(
              drillV2.panelId
                ? dashboard.widgets?.[drillV2.panelId]
                : undefined,
              drillV2.clickChain.length,
              drillV2.currentVariantId,
            )}
            onRowDrill={handleV2RowDrill}
          />
        </>
      )}
    </div>
  );
});
