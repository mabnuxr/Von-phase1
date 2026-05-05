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
import { DashboardFilterBarV2 } from "../AnalyticsFilters/DashboardFilterBarV2";
import { DataSourcesSlot } from "./DataSourcesSlot";
import type { DashboardFilterDefinition } from "../../../types/dashboard";
import type { ActiveFilter } from "../../../hooks/useDashboardFilters";
import { StatusLine } from "./StatusLine";
import { SaveButton } from "./SaveButton";
import { useCreatorName } from "../../../hooks/useCreatorName";
import { useLayoutAutoSave } from "../../../hooks/useLayoutAutoSave";
import { useFeatureFlag } from "../../../hooks/useFeatureFlag";
import { ShareDashboardDialog } from "./ShareDashboardDialog";
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
import { buildTextWidgetVariables } from "./buildTextWidgetVariables";
import type {
  WidgetConfig,
  GridConfig,
  LayoutItem,
  WidgetAddToChatPayload,
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
  onApplyFilters: () => void;
  /** Immediate-commit clear — PATCH resets/removes the filter. */
  onClearFilter?: (filterId: string) => void;
  /** Owner-only: commit-lock/unlock — immediate PATCH with current value. */
  onToggleLock?: (filterId: string, locked: boolean) => void;
  /** Owner-only: returns whether a given filter has a valid value to lock. */
  canLockFilter?: (filterId: string) => boolean;
  /** Revert unapplied local state for a single filter on popover dismiss. */
  onRevertFilter?: (filterId: string) => void;
  onRefresh: () => Promise<void>;
  onSave: (options?: { isFirstSave?: boolean; onSuccess?: () => void }) => void;
  savePhase: MutationPhase;
  /** Whether to show the inline save success toast */
  showSaveToast: boolean;
  /** Whether the last save was the first publish (for toast message) */
  isFirstSave: boolean;
  onRevert: (options?: { onSuccess?: () => void }) => void;
  revertPhase: MutationPhase;
  onShare: (
    isSharedWithTenant: boolean,
    sharedDataScope?: string | null,
  ) => void;
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
  /** Callback when a widget's "add to chat" icon is clicked. Button hidden when absent. */
  onAddWidgetToChat?: (widget: WidgetAddToChatPayload) => void;
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
   * Revert an unapplied panel-level edit back to the last server-
   * committed state. Wired to the widget popover's dismiss so closing
   * without Apply discards the draft (v2).
   */
  onRevertPanelFilter?: (panelId: string, filterId: string) => void;
  /**
   * Revert ALL pending edits for this panel. Fired when the outer
   * widget filter popover closes via any path (v2).
   */
  onRevertPanel?: (panelId: string) => void;
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

// Rename input's horizontal padding (px-1.5 × 2 = 12px) + border (1px × 2 = 2px).
// Added to the measured title width so the text inside the input aligns with the h1's.
const RENAME_INPUT_CHROME_PX = 14;

const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  dashboard,
  refreshInfo,
  filterDefinitions,
  filterState,
  filterCanApply,
  filterIsApplying,
  onFilterChange,
  onRemoveFilter,
  onApplyFilters,
  onClearFilter,
  onToggleLock,
  canLockFilter,
  onRevertFilter,
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
  onAddWidgetToChat,
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
  // Panel-filter props accepted but unused until widget-level filter UI is re-enabled
}) => {
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

  const { handleLayoutChange } = useLayoutAutoSave(
    dashboard.id,
    dashboard.isEditable,
    layout,
  );

  const variablesByWidget = useMemo(
    () =>
      buildTextWidgetVariables(
        dashboard.widgets as unknown as Record<string, WidgetConfig>,
        filterDefinitions,
        filterState,
      ),
    [dashboard.widgets, filterDefinitions, filterState],
  );

  // Widget-level filter UI hidden until panel-filter designs are ready.
  // widgetIds, widgetQueryRefMap, widgetAppliedFilters, and widgetFilterSlot
  // memos removed — restore when re-enabling widget-level filters.

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
  const [renameWidth, setRenameWidth] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const committedRef = useRef(false);

  const startRename = useCallback(() => {
    const titleWidth = titleRef.current?.offsetWidth;
    setRenameWidth(
      titleWidth != null ? titleWidth + RENAME_INPUT_CHROME_PX : null,
    );
    setIsRenamingTitle(true);
  }, []);

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

  // Drag-and-drop / resize chrome is gated behind a LaunchDarkly flag so we
  // can roll the manual-layout feature out per tenant. Edit mode itself
  // (filters, rename, save) stays available regardless.
  const { isDashboardDragDropEnabled } = useFeatureFlag();

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
                  style={
                    renameWidth != null ? { width: renameWidth } : undefined
                  }
                  className="text-base font-semibold text-gray-900 bg-transparent border border-gray-300 rounded-lg px-1.5 py-0.5 outline-none focus:border-gray-400"
                />
              ) : (
                <div className="flex items-center gap-1.5">
                  <h1
                    ref={titleRef}
                    className={`text-base font-semibold text-gray-900 truncate ${
                      dashboard.isOwner && onRename ? "cursor-pointer" : ""
                    }`}
                    onDoubleClick={
                      dashboard.isOwner && onRename ? startRename : undefined
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

            {/* Data sources pill — header-right, next to Ask Von */}
            {dashboard.data_sources && (
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
              onRevertFilter={onRevertFilter}
            />
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
                <ShareDashboardDialog
                  isSharedWithTenant={dashboard.isSharedWithTenant}
                  sharedDataScope={dashboard.sharedDataScope}
                  dataScopingAvailable={
                    dashboard.data_sources?.some(
                      (s) => s.type === "salesforce",
                    ) ?? false
                  }
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
        className={`relative transition-colors duration-200 ${
          isEditMode ? "bg-gray-100" : "bg-gray-50"
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
            onAddToChat={onAddWidgetToChat}
            onTableSortChange={onTableSortChange}
            tableSortStates={tableSortStates}
            isEditMode={isEditMode}
            isDragDropEnabled={isDashboardDragDropEnabled}
            isLoading={isRefetchingData || isRefreshing}
            variablesByWidget={variablesByWidget}
            onLayoutChange={handleLayoutChange}
            // Widget-level filter UI hidden until panel-filter designs are ready
            // widgetAppliedFilters={widgetAppliedFilters}
            // widgetFilterSlot={widgetFilterSlot}
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
