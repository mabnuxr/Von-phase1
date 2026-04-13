import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowsOutSimpleIcon,
  BuildingsIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  InfoIcon,
  LockSimpleIcon,
  SpinnerGapIcon,
  XIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import vonFilledLogo from "../../../assets/von-filled-logo.svg";
import {
  DashboardLayout,
  DashboardGrid,
  ErrorBoundary,
  Tooltip,
} from "@vonlabs/design-components";
import { AnalyticsFilters } from "../AnalyticsFilters";
import { DashboardFilterBarV2 } from "../AnalyticsFilters/DashboardFilterBarV2";
import { PanelFilterPopover } from "../AnalyticsFilters/PanelFilterPopover";
import { DataSourcesSlot } from "./DataSourcesSlot";
import { useFeatureFlag } from "../../../hooks/useFeatureFlag";
import type { DashboardFilterDefinition } from "../../../types/dashboard";
import type { ActiveFilter } from "../../../hooks/useDashboardFilters";
import { StatusLine } from "./StatusLine";
import { SaveButton } from "./SaveButton";
import { useCreatorName } from "../../../hooks/useCreatorName";
import { SharePopover } from "./SharePopover";
import { RefreshButton } from "./RefreshButton";
import { DashboardStatus } from "../../../types/dashboard";
import type {
  Dashboard,
  RefreshInfo,
  ScheduleConfigRequest,
  DashboardScheduleResponse,
} from "../../../types/dashboard";
import type { MutationPhase } from "../../../hooks/useMutationPhase";
import { EditModeBanner } from "../EditModeBanner";
import type {
  WidgetConfig,
  GridConfig,
  LayoutItem,
  AppliedWidgetFilter,
} from "@vonlabs/design-components";

interface AnalyticsViewProps {
  dashboard: Dashboard;
  refreshInfo: RefreshInfo | null;
  /** Filter definitions from the dashboard */
  filterDefinitions: DashboardFilterDefinition[];
  /** Current filter state in API-native format */
  filterState: Record<
    string,
    { operator: string; value?: unknown; include_blank?: boolean }
  >;
  /** Pending rows where user hasn't picked a field yet */
  filterPendingRows: { tempId: string }[];
  /** Number of active filters */
  filterActiveCount: number;
  /** Whether filters can be applied (dirty + all valid) */
  filterCanApply: boolean;
  /** Whether filters are being applied (PATCH + refetch in progress) */
  filterIsApplying: boolean;
  onFilterChange: (
    filterId: string,
    operator: string,
    value?: unknown,
    includeBlank?: boolean,
  ) => void;
  onRemoveFilter: (filterId: string) => void;
  onAddFilter: () => void;
  onRemovePendingRow: (tempId: string) => void;
  onCommitPendingRow: (
    pendingId: string,
    filterId: string,
    defaultOperator: string,
  ) => void;
  onApplyFilters: () => void;
  onClearAll: () => void;
  /** Immediate-commit clear — PATCH resets/removes the filter. */
  onClearFilter?: (filterId: string) => void;
  /** Owner-only: commit-lock/unlock — immediate PATCH with current value. */
  onToggleLock?: (filterId: string, locked: boolean) => void;
  /** Owner-only: returns whether a given filter has a valid value to lock. */
  canLockFilter?: (filterId: string) => boolean;
  onRefresh: () => Promise<void>;
  onSave: (options?: { isFirstSave?: boolean; onSuccess?: () => void }) => void;
  savePhase: MutationPhase;
  /** Whether to show the inline save success toast */
  showSaveToast: boolean;
  /** Whether the last save was the first publish (for toast message) */
  isFirstSave: boolean;
  onRevert: (options?: { onSuccess?: () => void }) => void;
  revertPhase: MutationPhase;
  onShare: (isSharedWithTenant: boolean) => void;
  sharePhase: MutationPhase;
  /** Show expand icon — navigates to full dashboard page */
  onExpand?: () => void;
  /** Show close (X) icon — closes the dashboard/preview pane */
  onClose?: () => void;
  /** Show Von Chat button */
  onChatClick?: () => void;
  /** Whether the chat pane is currently open */
  isChatOpen?: boolean;
  /** Toggle edit mode via PATCH API (is_editable) */
  onEditModeChange?: (isEditable: boolean) => void;
  /** Edit mode mutation phase (pending while API + refetch in flight) */
  editModePhase?: MutationPhase;
  /** Server-side table pagination handler */
  onTablePageChange?: (panelId: string, page: number) => void;
  /** Set of panel IDs currently loading a new page */
  loadingTablePanels?: Set<string>;
  /** Widgets with paginated table data merged in (overrides dashboard.widgets) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paginatedWidgets?: Record<string, any>;
  /** Callback when a widget's drilldown icon is clicked (chart-level) */
  onDrillDown?: (panelId: string) => void;
  /** Callback when a chart data point is clicked (point-level drilldown) */
  onPointDrillDown?: (
    panelId: string,
    drillFilters: Record<string, unknown>,
  ) => void;
  /** Server-side table sort handler */
  onTableSortChange?: (
    panelId: string,
    columnId: string,
    order: "asc" | "desc" | null,
  ) => void;
  /** Current sort state per panel */
  tableSortStates?: Record<string, { orderBy: string; orderByAsc: boolean }>;
  /** Called when the owner renames the dashboard */
  onRename?: (newName: string) => void;
  /** Hide the "Created by" chip in the header */
  hideCreatorChip?: boolean;
  /** Schedule state and handlers (required when dashboard.isOwner) */
  schedule: DashboardScheduleResponse | null;
  isScheduled: boolean;
  isSchedulePaused: boolean;
  isScheduleMutating: boolean;
  onCreateSchedule: (config: ScheduleConfigRequest) => Promise<unknown>;
  onUpdateSchedule: (
    config: Partial<ScheduleConfigRequest>,
  ) => Promise<unknown>;
  onPauseSchedule: () => Promise<unknown>;
  onResumeSchedule: () => Promise<unknown>;
  onDeleteSchedule: () => Promise<unknown>;
  /** Whether widget data is being refetched (e.g. after filter change) */
  isRefetchingData?: boolean;
  /** Whether a background refresh is in progress (Pusher-driven) */
  isRefreshing?: boolean;
  /** Whether the drilldown panel is open (hides inline edit banner to avoid duplication) */
  isDrilldownOpen?: boolean;
  // ── v2 filter plumbing (panel-level overrides) ───────────────────────
  /** Panel-level filter overrides (v2). */
  panelFilterState?: Record<string, Record<string, ActiveFilter>>;
  /** Dashboard-level locked filter state (v2). */
  lockedFilterState?: Record<string, ActiveFilter>;
  /** Client-side resolver for per-panel effective filter state (v2). */
  getEffectivePanelState?: (panelId: string) => Record<string, ActiveFilter>;
  /** Panel-level filter change handler (v2). */
  onPanelFilterChange?: (
    panelId: string,
    filterId: string,
    operator: string,
    value?: unknown,
    includeBlank?: boolean,
  ) => void;
  /** Reset a single panel-level filter back to the dashboard value (v2). */
  onResetPanelFilter?: (panelId: string, filterId: string) => void;
  /**
   * Commit a single panel-level filter change to the server (v2).
   * Sends only the affected filter in the PATCH payload, scoped to
   * the given `panel_id`, so `panel_state` gets populated without
   * touching dashboard-level state.
   */
  onApplyPanelFilter?: (panelId: string, filterId: string) => void;
  /** True when the given panel+filter has a pending commit. */
  canApplyPanelFilter?: (panelId: string, filterId: string) => boolean;
  /**
   * Owner-only. Toggle the per-panel lock for a filter. Commits the
   * effective value (panel override or dashboard value) via PATCH with
   * `panel_id` + `is_locked`.
   */
  onTogglePanelLock?: (
    panelId: string,
    filterId: string,
    locked: boolean,
  ) => void;
  /** Validity gate for the panel-level Lock button. */
  canLockPanelFilter?: (panelId: string, filterId: string) => boolean;
  /**
   * Server-side per-panel locked state, keyed by panelId → filterId.
   * Used to show (locked) indicator on widget-level filter rows.
   */
  lockedPanelFilterState?: Record<string, Record<string, ActiveFilter>>;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  dashboard,
  refreshInfo,
  filterDefinitions,
  filterState,
  filterPendingRows,
  filterActiveCount,
  filterCanApply,
  filterIsApplying,
  onFilterChange,
  onRemoveFilter,
  onAddFilter,
  onRemovePendingRow,
  onCommitPendingRow,
  onApplyFilters,
  onClearAll,
  onClearFilter,
  onToggleLock,
  canLockFilter,
  onRefresh,
  onSave,
  savePhase,
  showSaveToast,
  isFirstSave,
  onRevert,
  revertPhase,
  onShare,
  sharePhase,
  onExpand,
  onClose,
  onChatClick,
  isChatOpen,
  onEditModeChange,
  editModePhase = "idle",
  onTablePageChange,
  loadingTablePanels,
  paginatedWidgets,
  onDrillDown,
  onPointDrillDown,
  onTableSortChange,
  tableSortStates,
  onRename,
  hideCreatorChip,
  schedule,
  isScheduled,
  isSchedulePaused,
  isScheduleMutating,
  onCreateSchedule,
  onUpdateSchedule,
  onPauseSchedule,
  onResumeSchedule,
  onDeleteSchedule,
  isRefetchingData,
  isRefreshing,
  isDrilldownOpen,
  panelFilterState,
  lockedFilterState,
  getEffectivePanelState,
  onPanelFilterChange,
  onResetPanelFilter,
  onApplyPanelFilter,
  canApplyPanelFilter,
  onTogglePanelLock,
  canLockPanelFilter,
  lockedPanelFilterState,
}) => {
  const { isDashboardFiltersV2Enabled } = useFeatureFlag();
  const rawGridConfig = dashboard.gridConfig as unknown as GridConfig;
  const gridConfig = {
    ...rawGridConfig,
    rowHeight: Math.min(rawGridConfig.rowHeight ?? 60, 60),
  };
  const layout = dashboard.layout as unknown as LayoutItem[];
  const widgets = (paginatedWidgets ?? dashboard.widgets) as unknown as Record<
    string,
    WidgetConfig
  >;

  const widgetIds = useMemo(() => Object.keys(widgets), [widgets]);

  const widgetAppliedFilters = useMemo(() => {
    if (!filterDefinitions.length || !filterState) return undefined;

    // Pre-compute display-ready filter info once per active definition
    const stringify = (v: unknown) => {
      if (v == null) return "";
      if (typeof v === "object" && v !== null && "start" in v && "end" in v) {
        const r = v as { start: string; end: string };
        return `${r.start} – ${r.end}`;
      }
      return typeof v === "object" ? JSON.stringify(v) : String(v);
    };

    const enrichedDefs = filterDefinitions
      .filter((def) => def.id in filterState)
      .map((def) => {
        const state = filterState[def.id];
        const operatorLabel =
          def.valid_operators?.find((op) => op.value === state.operator)
            ?.label ?? state.operator;
        const values = Array.isArray(state.value)
          ? state.value.map(stringify)
          : state.value != null
            ? [stringify(state.value)]
            : [];
        const includeBlank = !!state.include_blank;
        return {
          label: def.label,
          operatorLabel,
          values,
          includeBlank,
          appliesTo: def.applies_to,
        };
      });
    if (!enrichedDefs.length) return undefined;

    const result: Record<string, AppliedWidgetFilter[]> = {};
    for (const wId of widgetIds) {
      const filtersForWidget: AppliedWidgetFilter[] = [];
      for (const def of enrichedDefs) {
        // No applies_to means the filter applies to all widgets
        if (def.appliesTo && !def.appliesTo.includes(wId)) continue;
        filtersForWidget.push({
          label: def.label,
          operatorLabel: def.operatorLabel,
          values: def.values,
          ...(def.includeBlank && { includeBlank: true }),
        });
      }
      if (filtersForWidget.length > 0) {
        result[wId] = filtersForWidget;
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }, [filterDefinitions, filterState, widgetIds]);

  // v2: per-panel filter slot factory. Only mounted when the flag is on and
  // required handlers are provided; otherwise DashboardGrid falls back to the
  // read-only WidgetFiltersPopover it already renders.
  const widgetFilterSlot = useMemo(() => {
    if (
      !isDashboardFiltersV2Enabled ||
      !getEffectivePanelState ||
      !onPanelFilterChange ||
      !onResetPanelFilter
    ) {
      return undefined;
    }
    return (panelId: string) => (
      <PanelFilterPopover
        panelId={panelId}
        definitions={filterDefinitions}
        effectiveState={getEffectivePanelState(panelId)}
        lockedFilterState={lockedFilterState ?? {}}
        lockedPanelFilterState={lockedPanelFilterState?.[panelId] ?? {}}
        panelFilterState={panelFilterState?.[panelId] ?? {}}
        onPanelFilterChange={onPanelFilterChange}
        onResetPanelFilter={onResetPanelFilter}
        onApplyPanelFilter={onApplyPanelFilter}
        canApplyPanelFilter={canApplyPanelFilter}
        onTogglePanelLock={onTogglePanelLock}
        canLockPanelFilter={canLockPanelFilter}
        isApplying={filterIsApplying}
      />
    );
  }, [
    isDashboardFiltersV2Enabled,
    filterDefinitions,
    getEffectivePanelState,
    lockedFilterState,
    lockedPanelFilterState,
    panelFilterState,
    onApplyPanelFilter,
    canApplyPanelFilter,
    onTogglePanelLock,
    canLockPanelFilter,
    filterIsApplying,
    onPanelFilterChange,
    onResetPanelFilter,
  ]);

  const { name: creatorName, isLoading: isCreatorLoading } = useCreatorName({
    isOwner: dashboard.isOwner,
    createdBy: dashboard.createdBy,
    createdByName: dashboard.createdByName,
  });

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
  }, []);

  // ── Inline rename state ─────────────────────────────────────────
  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const [editValue, setEditValue] = useState(dashboard.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    if (!isRenamingTitle) setEditValue(dashboard.title);
  }, [dashboard.title, isRenamingTitle]);

  useEffect(() => {
    if (isRenamingTitle) {
      committedRef.current = false;
      inputRef.current?.select();
    }
  }, [isRenamingTitle]);

  const commitRename = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    const trimmed = editValue.trim();
    setIsRenamingTitle(false);
    if (trimmed && trimmed !== dashboard.title) {
      onRename?.(trimmed);
    } else {
      setEditValue(dashboard.title);
    }
  }, [editValue, dashboard.title, onRename]);

  // ── Dashboard edit mode (API-driven via is_editable) ────────────
  const isEditMode = dashboard.isEditable;

  const handleEnterEditMode = useCallback(() => {
    if (dashboard.isOwner) {
      onEditModeChange?.(true);
    }
    onChatClick?.();
  }, [dashboard.isOwner, onEditModeChange, onChatClick]);

  const handleSaveFromEditMode = useCallback(() => {
    onSave({
      isFirstSave: dashboard.dashboardVersion < 1,
    });
  }, [onSave, dashboard.dashboardVersion]);

  const handleRevertFromEditMode = useCallback(() => {
    onRevert();
  }, [onRevert]);

  const isSaved = dashboard.status === DashboardStatus.Published;

  return (
    <DashboardLayout
      className={
        isEditMode
          ? "transition-all duration-200 [&>*:first-child]:border-gray-700 [&>*:first-child]:ring-3 [&>*:first-child]:ring-gray-200"
          : "transition-all duration-200"
      }
    >
      <DashboardLayout.Header>
        {/* Title row: name + description | chat + close */}
        <DashboardLayout.HeaderRow
          className={isDrilldownOpen ? "relative z-[45] bg-white" : ""}
        >
          <DashboardLayout.HeaderRow.Left>
            <div className="min-w-0">
              {isRenamingTitle ? (
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") {
                      setEditValue(dashboard.title);
                      setIsRenamingTitle(false);
                    }
                  }}
                  className="text-base font-semibold text-gray-900 bg-transparent border border-gray-300 rounded-lg px-1.5 py-0.5 outline-none focus:border-gray-400 w-full max-w-md"
                />
              ) : (
                <div className="flex items-center gap-1.5">
                  <h1
                    className={`text-base font-semibold text-gray-900 truncate ${
                      dashboard.isOwner && onRename && isSaved
                        ? "cursor-pointer"
                        : ""
                    }`}
                    onDoubleClick={
                      dashboard.isOwner && onRename && isSaved
                        ? () => setIsRenamingTitle(true)
                        : undefined
                    }
                  >
                    {dashboard.title}
                  </h1>
                  {dashboard.description && (
                    <Tooltip
                      content={
                        <span className="block max-w-[240px] whitespace-normal">
                          {dashboard.description}
                        </span>
                      }
                    >
                      <button className="text-gray-700 hover:text-gray-600 transition-colors">
                        <InfoIcon size={16} />
                      </button>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
            {!isEditMode && !isRefetchingData && !isRefreshing && (
              <StatusLine lastRefreshedAt={refreshInfo?.lastRefreshedAt} />
            )}
          </DashboardLayout.HeaderRow.Left>

          <DashboardLayout.HeaderRow.Right>
            {/* Visibility indicator */}
            {/* Created by indicator */}
            {!hideCreatorChip && (
              <span className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1.5 leading-none whitespace-nowrap">
                <Tooltip
                  content={
                    dashboard.isSharedWithTenant
                      ? "This dashboard is shared with your organization"
                      : "This dashboard is private"
                  }
                >
                  <span className="inline-flex items-center justify-center text-gray-700 cursor-default">
                    {dashboard.isSharedWithTenant ? (
                      <BuildingsIcon size={14} />
                    ) : (
                      <LockSimpleIcon size={14} />
                    )}
                  </span>
                </Tooltip>
                <span className="text-gray-800">Created by</span>
                {isCreatorLoading ? (
                  <span className="bg-gray-200 rounded animate-pulse w-16 h-3" />
                ) : (
                  <span className="text-gray-800 font-medium">
                    {creatorName}
                  </span>
                )}
              </span>
            )}
            {onExpand && !isEditMode && (
              <button
                onClick={isSaved ? onExpand : undefined}
                disabled={!isSaved}
                className={`flex items-center gap-1.5 h-[34px] px-2.5 text-sm font-medium rounded-xl border transition-colors whitespace-nowrap ${
                  !isSaved
                    ? "text-gray-400 bg-gray-100 border-gray-200/70 cursor-not-allowed"
                    : "text-gray-800 bg-white border-gray-200/70 hover:bg-gray-50 cursor-pointer"
                }`}
              >
                <ArrowsOutSimpleIcon size={13} />
                View in Dashboards
              </button>
            )}

            {/* Data sources pill (v2) — header-right, next to Ask Von */}
            {isDashboardFiltersV2Enabled && dashboard.data_sources && (
              <DataSourcesSlot dataSources={dashboard.data_sources} />
            )}

            {/* "Ask Von" button — only shown when chat panel is closed */}
            {onChatClick && !isChatOpen && (
              <motion.button
                key="ask-von"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={onChatClick}
                title="Ask Von"
                className="flex items-center gap-1.5 h-[34px] px-2.5 bg-white text-gray-900 text-sm rounded-xl border border-gray-200/70 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <img
                  src={vonFilledLogo}
                  alt="Von"
                  width={15}
                  height={15}
                  className="flex-shrink-0"
                />
                Ask Von
              </motion.button>
            )}

            {/* Standalone close for panes that pass onClose but no chat (e.g. DashboardPreviewPane) */}
            {!onChatClick && onClose && (
              <Tooltip content="Close">
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center w-[34px] h-[34px] text-gray-800 bg-white border border-gray-200/70 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <XIcon size={14} />
                </button>
              </Tooltip>
            )}
          </DashboardLayout.HeaderRow.Right>
        </DashboardLayout.HeaderRow>

        {/* Toolbar row: filters | edit/save, revert, customize, refresh, share */}
        <DashboardLayout.HeaderRow bordered>
          <DashboardLayout.HeaderRow.Left>
            {isDashboardFiltersV2Enabled ? (
              <DashboardFilterBarV2
                definitions={filterDefinitions}
                filterState={filterState}
                isApplying={filterIsApplying}
                canApply={filterCanApply}
                isOwner={dashboard.isOwner}
                onFilterChange={onFilterChange}
                onRemoveFilter={onRemoveFilter}
                onClearFilter={onClearFilter}
                onToggleLock={onToggleLock}
                canLockFilter={canLockFilter}
                onApply={onApplyFilters}
              />
            ) : (
              <AnalyticsFilters
                definitions={filterDefinitions}
                filterState={filterState}
                pendingRows={filterPendingRows}
                activeCount={filterActiveCount}
                canApply={filterCanApply}
                isApplying={filterIsApplying}
                onFilterChange={onFilterChange}
                onRemoveFilter={onRemoveFilter}
                onAddFilter={onAddFilter}
                onRemovePendingRow={onRemovePendingRow}
                onCommitPendingRow={onCommitPendingRow}
                onApply={onApplyFilters}
                onClearAll={onClearAll}
              />
            )}
          </DashboardLayout.HeaderRow.Left>

          <DashboardLayout.HeaderRow.Right>
            <RefreshButton
              onRefresh={onRefresh}
              canRefresh={isSaved}
              isOwner={dashboard.isOwner}
              isRefreshing={isRefreshing}
              schedule={schedule}
              isScheduled={isScheduled}
              isPaused={isSchedulePaused}
              isMutating={isScheduleMutating}
              onCreateSchedule={onCreateSchedule}
              onUpdateSchedule={onUpdateSchedule}
              onPauseSchedule={onPauseSchedule}
              onResumeSchedule={onResumeSchedule}
              onDeleteSchedule={onDeleteSchedule}
            />
            {dashboard.isOwner && (
              <>
                {/* Revert — only in edit mode when there's a previous version */}
                {isEditMode && dashboard.dashboardVersion >= 1 && (
                  <Tooltip content="Reverts to previous saved version">
                    <button
                      onClick={
                        revertPhase === "idle"
                          ? handleRevertFromEditMode
                          : undefined
                      }
                      disabled={
                        revertPhase !== "idle" ||
                        dashboard.status !== DashboardStatus.Draft
                      }
                      className={`inline-flex items-center justify-center w-[34px] h-[34px] border rounded-xl transition-colors ${
                        dashboard.status !== DashboardStatus.Draft
                          ? "text-gray-400 bg-gray-100 border-gray-200/70 cursor-not-allowed"
                          : revertPhase === "pending"
                            ? "text-gray-500 bg-gray-100 border-gray-200/70 cursor-not-allowed"
                            : revertPhase === "success"
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200 cursor-default"
                              : "text-gray-800 bg-white border-gray-200/70 hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      {revertPhase === "pending" ? (
                        <SpinnerGapIcon size={14} className="animate-spin" />
                      ) : (
                        <ClockCounterClockwiseIcon size={14} />
                      )}
                    </button>
                  </Tooltip>
                )}
                <SharePopover
                  isSharedWithTenant={dashboard.isSharedWithTenant}
                  canShare={isSaved}
                  sharePhase={sharePhase}
                  onShare={onShare}
                  onCopyLink={handleCopyLink}
                />

                {/* Edit / Save toggle */}
                {isEditMode ||
                savePhase !== "idle" ||
                dashboard.dashboardVersion < 1 ? (
                  <SaveButton
                    savePhase={savePhase}
                    onSave={handleSaveFromEditMode}
                    isSaved={false}
                  />
                ) : (
                  <Tooltip content="Edit dashboard">
                    <button
                      onClick={
                        editModePhase === "idle"
                          ? handleEnterEditMode
                          : undefined
                      }
                      disabled={editModePhase !== "idle"}
                      className={`flex items-center gap-1.5 h-[34px] px-2.5 text-sm font-medium rounded-xl border transition-colors whitespace-nowrap ${
                        editModePhase === "pending"
                          ? "border-gray-800 bg-gray-800 text-white cursor-not-allowed"
                          : "border-gray-900 bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
                      }`}
                    >
                      {editModePhase === "pending" ? (
                        <SpinnerGapIcon size={13} className="animate-spin" />
                      ) : (
                        <PencilSimpleIcon size={13} />
                      )}
                      Edit
                    </button>
                  </Tooltip>
                )}
              </>
            )}
          </DashboardLayout.HeaderRow.Right>
        </DashboardLayout.HeaderRow>
      </DashboardLayout.Header>

      <DashboardLayout.Canvas
        className={`relative ${
          isEditMode
            ? "bg-gray-50 transition-colors duration-200"
            : "transition-colors duration-200"
        }`}
      >
        {/* Save toast — absolute top-center, no layout impact */}
        <AnimatePresence>
          {showSaveToast && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none"
            >
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-green-50 border border-green-300 text-green-900 text-sm font-medium rounded-xl shadow-sm pointer-events-auto">
                <CheckCircleIcon size={16} weight="fill" />
                {isFirstSave
                  ? "Dashboard is created. You can access the dashboard from the side panel."
                  : "Dashboard is updated. You can access the dashboard from the side panel."}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Refresh-in-progress banner */}
        <AnimatePresence>
          {isRefreshing && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none"
            >
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium rounded-xl shadow-sm pointer-events-auto">
                <SpinnerGapIcon size={16} className="animate-spin" />
                Refreshing dashboard data…
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ErrorBoundary>
          <DashboardGrid
            layout={layout}
            widgets={widgets}
            gridConfig={gridConfig}
            onTablePageChange={onTablePageChange}
            loadingTablePanels={loadingTablePanels}
            onDrillDown={onDrillDown}
            onPointDrillDown={onPointDrillDown}
            onTableSortChange={onTableSortChange}
            tableSortStates={tableSortStates}
            isEditMode={isEditMode}
            isLoading={isRefetchingData || isRefreshing}
            widgetAppliedFilters={widgetAppliedFilters}
            widgetFilterSlot={widgetFilterSlot}
          />
        </ErrorBoundary>

        {/* Edit mode banner — full-width sticky bottom (hidden when drilldown is open; parent renders its own) */}
        <EditModeBanner
          visible={isEditMode && !isDrilldownOpen}
          className="sticky bottom-0 z-10 -mx-4"
        />
      </DashboardLayout.Canvas>
    </DashboardLayout>
  );
};

export { AnalyticsView };
