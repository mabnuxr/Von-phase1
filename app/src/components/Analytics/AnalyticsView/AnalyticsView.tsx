import { useCallback } from "react";
import {
  DashboardLayout,
  DashboardGrid,
  ErrorBoundary,
  AutoFitContext,
  useCopyToClipboard,
} from "@vonlabs/design-components";
import { EditLockModal } from "./EditLockModal";
import { DiscardChangesModal } from "./DiscardChangesModal";
import { EditModeBanner } from "../EditModeBanner";
import { DashboardStatus } from "../../../types/dashboard";
import { useFeatureFlag } from "../../../hooks/useFeatureFlag";
import { useUser } from "../../../hooks/useUser";
import { useTeamMembers } from "../../../hooks/useTeam";
import { getUserContext } from "../../../lib/auth";
import { useDashboardLayoutData } from "./hooks/useDashboardLayoutData";
import { useDashboardRoles } from "./hooks/useDashboardRoles";
import { useDashboardShareV2 } from "./hooks/useDashboardShareV2";
import { useInlineRename } from "./hooks/useInlineRename";
import { useEditLockConflict } from "./hooks/useEditLockConflict";
import { useEditModeActions } from "./hooks/useEditModeActions";
import { AnalyticsHeaderTitleRow } from "./components/AnalyticsHeaderTitleRow";
import { AnalyticsHeaderActions } from "./components/AnalyticsHeaderActions";
import {
  AnalyticsToolbarFilters,
  AnalyticsToolbarActions,
} from "./components/AnalyticsToolbar";
import { SaveToast } from "./components/SaveToast";
import { RefreshingToast } from "./components/RefreshingToast";
import type { ActiveFilter } from "../../../hooks/useDashboardFilters";
import type { DashboardFilterDefinition } from "../../../types/dashboard";
import type {
  Dashboard,
  RefreshInfo,
  ScheduleConfigRequest,
  DashboardScheduleResponse,
} from "../../../types/dashboard";
import type { MutationPhase } from "../../../hooks/useMutationPhase";
import type { ShareDashboardV2Request } from "../../../services/dashboardService";
import type { WidgetAddToChatPayload } from "@vonlabs/design-components";

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
  /** Whether to show the in-canvas top-center save toast. */
  showSaveToast: boolean;
  /**
   * Which lifecycle event triggered the toast — drives the copy:
   *   - "publish" + isFirstSave → "Dashboard is created …"
   *   - "publish" (subsequent)  → "Published. Your changes are live …"
   *   - "draft"                 → "Draft saved. Editors or owners …"
   */
  saveToastKind: "publish" | "draft";
  /** True when the most recent publish was the dashboard's first save. */
  isFirstSave: boolean;
  /**
   * Unified share mutation (M2) — accepts the full desired sharing state
   * in a single round-trip. Used by the share dialog.
   */
  onShareV2?: (payload: ShareDashboardV2Request) => Promise<void>;
  shareV2Phase?: MutationPhase;
  /**
   * Acquire the dashboard's edit lock (M1). The Edit button routes
   * through this. Callbacks let us surface the EditLockModal when
   * another user holds the lock.
   */
  onAcquireLock?: (callbacks?: {
    onSuccess?: () => void;
    onHeldByOther?: () => void;
    onUnknownError?: (error: unknown) => void;
  }) => Promise<void> | void;
  acquireLockPhase?: MutationPhase;
  /**
   * Discard the active draft (M1 — VON-1282). Fires `POST /draft/discard`
   * which soft-deletes the draft (or just releases the lock for an
   * unedited clone) and returns 204. Wires the triad's Discard button.
   */
  onDiscardDraft?: () => Promise<void> | void;
  discardDraftPhase?: MutationPhase;
  /**
   * Save the active draft (M1 — VON-1282). Fires `POST /draft/save`
   * which freezes the current draft as a `draft_saved` snapshot,
   * inserts a fresh unedited clone, and releases the lock. The
   * response carries new version pair + `is_editable=false`, used to
   * re-render with `latest_published_version`. Wires the triad's
   * Save-as-draft button.
   */
  onSaveDraft?: () => Promise<void> | void;
  saveDraftPhase?: MutationPhase;
  /** Show expand icon — navigates to full dashboard page */
  onExpand?: () => void;
  /** Show close (X) icon — closes the dashboard/preview pane */
  onClose?: () => void;
  /** Show Von Chat button */
  onChatClick?: () => void;
  /** Whether the chat pane is currently open */
  isChatOpen?: boolean;
  /** Open the version-history side-panel. The panel itself lives at
   *  the page level (docked alongside the chat panel) and the caller
   *  is responsible for mutual exclusion with the chat. The
   *  More-options menu item is hidden when this prop is absent. */
  onOpenVersionHistory?: () => void;
  /**
   * True while the dashboard is rendering a historical version
   * selected from the version-history panel. Used to strip the
   * Ask-Von affordances (header button + per-widget add-to-chat icons)
   * — preview is read-only by intent, and chat actions would
   * misleadingly bind to the previewed snapshot. Filter edits stay
   * enabled, but PATCHes carry the previewed `dashboard_version`
   * (wired upstream in `useDashboardFilters`).
   */
  isVersionPreview?: boolean;
  /**
   * When true, drops the dashboard panel's own card chrome (rounded
   * corners / border / shadow). Use this when the page wraps the
   * dashboard + version-history side-pane in a single shared card so
   * the two surfaces read as one continuous panel.
   */
  embedded?: boolean;
  /**
   * Latest live published version of the dashboard, sourced from the
   * metadata query. Used by the preview chip to decide whether the
   * previewed version is the current live one — that case gets a
   * "(published - latest)" suffix instead of plain "(published)".
   * `null` while metadata is loading or for a brand-new dashboard
   * that has never been published.
   */
  latestPublishedVersion?: number | null;
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
  /** Fired when the share link is copied from the share modal. */
  onLinkCopied?: () => void;
  /** Fired when the query-info popover is opened on any widget. */
  onWidgetQueryViewed?: (
    panelId: string,
    widgetTitle: string,
    widgetType: string,
  ) => void;
  /** Fired when SQL is copied from the query-info popover on any widget. */
  onWidgetSQLCopied?: (panelId: string, widgetTitle: string) => void;
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
  /**
   * True when rendered inside the chat-side preview pane. Auto-fit only
   * runs when this is true AND edit mode is on AND the drag-and-drop flag
   * is enabled — the full dashboard page never auto-fits, regardless of
   * mode/flag.
   */
  isPreview?: boolean;
  /** Schedule state and handlers (required when isDashboardOwner) */
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
  saveToastKind,
  isFirstSave,
  onShareV2,
  shareV2Phase = "idle",
  onAcquireLock,
  acquireLockPhase = "idle",
  onDiscardDraft,
  discardDraftPhase = "idle",
  onSaveDraft,
  saveDraftPhase = "idle",
  onExpand,
  onClose,
  onChatClick,
  isChatOpen,
  onOpenVersionHistory,
  isVersionPreview = false,
  embedded = false,
  latestPublishedVersion = null,
  onTablePageChange,
  loadingTablePanels,
  paginatedWidgets,
  onDrillDown,
  onPointDrillDown,
  onAddWidgetToChat,
  onLinkCopied,
  onWidgetQueryViewed,
  onWidgetSQLCopied,
  onTableSortChange,
  tableSortStates,
  onRename,
  hideCreatorChip,
  isPreview,
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
  // Drag-and-drop / resize chrome is gated behind a LaunchDarkly flag so we
  // can roll the manual-layout feature out per tenant. Edit mode itself
  // (filters, rename, save) stays available regardless.
  const { isDashboardDragDropEnabled } = useFeatureFlag();
  const { user } = useUser();
  // Bootstrap the team-members fetch from the synchronously-available
  // stored auth context so it doesn't wait on this component's own
  // `useUser` /me round-trip. AppShell does the same — both paths now
  // converge on the same React Query key as soon as the page renders,
  // which makes name resolution in the share dialog instant rather
  // than gated on /me + /team/members in series.
  const teamMembersTenantId =
    getUserContext()?.tenant_id ?? user?.tenantId ?? undefined;
  const { data: teamMembers } = useTeamMembers(teamMembersTenantId);

  // While version-history is driving the canvas, force edit mode off even if
  // the rendered dashboard's `is_editable` is true (happens when the user is
  // holding the lock on the same version they're previewing). This strips
  // the edit chrome (ring, gray bg, banner, drag/drop, layout autosave) so
  // the preview always reads as read-only, no matter which version is
  // rendered.
  const isEditMode = dashboard.isEditable && !isVersionPreview;

  const {
    gridConfig,
    layout,
    widgets,
    variablesByWidget,
    autoFitController,
    handleLayoutChange,
  } = useDashboardLayoutData({
    dashboard,
    paginatedWidgets,
    filterDefinitions,
    filterState,
    isEditMode,
    isPreview,
    isDashboardDragDropEnabled,
  });

  const { isDashboardOwner, canEditDashboard, creatorName, isCreatorLoading } =
    useDashboardRoles(dashboard);

  const { copy } = useCopyToClipboard(2000, onLinkCopied);
  const handleCopyLink = useCallback(async () => {
    await copy(window.location.href);
  }, [copy]);

  const { shareState, shareActions } = useDashboardShareV2({
    dashboard,
    onShareV2,
    teamMembers,
    currentUserId: user?.id,
    currentUser: user,
  });

  const rename = useInlineRename({ title: dashboard.title, onRename });

  const editLock = useEditLockConflict({
    editLock: dashboard.editLock,
    teamMembers,
  });

  const { editActions, discardModal } = useEditModeActions({
    dashboardVersion: dashboard.dashboardVersion,
    onAcquireLock,
    onChatClick,
    onDiscardDraft,
    onSaveDraft,
    onSave,
    openLockModal: editLock.openModal,
    discardDraftPhase,
  });

  const isSaved = dashboard.status === DashboardStatus.Published;

  return (
    <>
      <EditLockModal
        isOpen={editLock.isModalOpen}
        onClose={editLock.closeModal}
        holderName={editLock.lockHolderName}
      />
      <DiscardChangesModal
        isOpen={discardModal.isOpen}
        isPending={discardModal.isPending}
        onCancel={discardModal.close}
        onConfirm={discardModal.confirm}
      />
      <DashboardLayout
        embedded={embedded}
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
              <AnalyticsHeaderTitleRow
                dashboard={dashboard}
                refreshInfo={refreshInfo}
                isEditMode={isEditMode}
                isVersionPreview={isVersionPreview}
                isRefetchingData={isRefetchingData}
                isRefreshing={isRefreshing}
                isDashboardOwner={isDashboardOwner}
                onRename={onRename}
                latestPublishedVersion={latestPublishedVersion}
                rename={rename}
              />
            </DashboardLayout.HeaderRow.Left>

            <DashboardLayout.HeaderRow.Right>
              <AnalyticsHeaderActions
                hideCreatorChip={hideCreatorChip}
                isVersionPreview={isVersionPreview}
                currentScope={shareState.currentScope}
                creatorName={creatorName}
                isCreatorLoading={isCreatorLoading}
                isEditMode={isEditMode}
                isSaved={isSaved}
                onExpand={onExpand}
                dataSources={dashboard.data_sources}
                onChatClick={onChatClick}
                isChatOpen={isChatOpen}
                onClose={onClose}
                canEditDashboard={canEditDashboard}
                editLock={dashboard.editLock}
                lastEditedBy={dashboard.lastEditedBy}
                lastEditedAt={dashboard.lastEditedAt}
                currentUserId={user?.id}
                teamMembers={teamMembers}
                onOpenVersionHistory={onOpenVersionHistory}
              />
            </DashboardLayout.HeaderRow.Right>
          </DashboardLayout.HeaderRow>

          {/* Toolbar row: filters | edit/save, revert, customize, refresh, share */}
          <DashboardLayout.HeaderRow bordered>
            <DashboardLayout.HeaderRow.Left>
              <AnalyticsToolbarFilters
                isDashboardOwner={isDashboardOwner}
                filterDefinitions={filterDefinitions}
                filterState={filterState}
                filterCanApply={filterCanApply}
                filterIsApplying={filterIsApplying}
                onFilterChange={onFilterChange}
                onRemoveFilter={onRemoveFilter}
                onApplyFilters={onApplyFilters}
                onClearFilter={onClearFilter}
                onToggleLock={onToggleLock}
                canLockFilter={canLockFilter}
                onRevertFilter={onRevertFilter}
              />
            </DashboardLayout.HeaderRow.Left>

            <DashboardLayout.HeaderRow.Right>
              <AnalyticsToolbarActions
                dashboard={dashboard}
                isVersionPreview={isVersionPreview}
                isEditMode={isEditMode}
                isSaved={isSaved}
                canEditDashboard={canEditDashboard}
                currentUserId={user?.id ?? ""}
                onRefresh={onRefresh}
                isRefreshing={isRefreshing}
                schedule={schedule}
                isScheduled={isScheduled}
                isSchedulePaused={isSchedulePaused}
                isScheduleMutating={isScheduleMutating}
                onCreateSchedule={onCreateSchedule}
                onUpdateSchedule={onUpdateSchedule}
                onPauseSchedule={onPauseSchedule}
                onResumeSchedule={onResumeSchedule}
                onDeleteSchedule={onDeleteSchedule}
                savePhase={savePhase}
                discardDraftPhase={discardDraftPhase}
                saveDraftPhase={saveDraftPhase}
                acquireLockPhase={acquireLockPhase}
                shareV2Phase={shareV2Phase}
                editActions={editActions}
                shareState={shareState}
                shareActions={shareActions}
                onCopyLink={handleCopyLink}
                onOpenVersionHistory={onOpenVersionHistory}
              />
            </DashboardLayout.HeaderRow.Right>
          </DashboardLayout.HeaderRow>
        </DashboardLayout.Header>

        <DashboardLayout.Canvas
          className={`relative transition-colors duration-200 ${
            isEditMode ? "bg-gray-100" : "bg-gray-50"
          }`}
        >
          <SaveToast
            visible={showSaveToast}
            kind={saveToastKind}
            isFirstSave={isFirstSave}
          />
          <RefreshingToast visible={!!isRefreshing} />

          <ErrorBoundary>
            <AutoFitContext.Provider value={autoFitController}>
              <DashboardGrid
                layout={layout}
                widgets={widgets}
                gridConfig={gridConfig}
                onTablePageChange={onTablePageChange}
                loadingTablePanels={loadingTablePanels}
                onDrillDown={onDrillDown}
                onPointDrillDown={onPointDrillDown}
                // Suppress per-widget add-to-chat icons during version
                // preview — same reasoning as the header Ask-Von button.
                onAddToChat={isVersionPreview ? undefined : onAddWidgetToChat}
                onWidgetQueryViewed={onWidgetQueryViewed}
                onWidgetSQLCopied={onWidgetSQLCopied}
                onTableSortChange={onTableSortChange}
                tableSortStates={tableSortStates}
                isEditMode={isEditMode}
                isDragDropEnabled={isDashboardDragDropEnabled}
                isLoading={isRefetchingData || isRefreshing}
                variablesByWidget={variablesByWidget}
                onLayoutChange={handleLayoutChange}
              />
            </AutoFitContext.Provider>
          </ErrorBoundary>

          {/* Edit mode banner — full-width sticky bottom (hidden when
              drilldown is open; parent renders its own) */}
          <EditModeBanner
            visible={isEditMode && !isDrilldownOpen}
            className="sticky bottom-0 z-10 -mx-4"
          />
        </DashboardLayout.Canvas>
      </DashboardLayout>
    </>
  );
};

export { AnalyticsView };
