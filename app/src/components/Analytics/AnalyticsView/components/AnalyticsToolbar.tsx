import { DashboardFilterBarV2 } from "../../AnalyticsFilters/DashboardFilterBarV2";
import { RefreshButton } from "../RefreshButton";
import {
  ShareDashboardDialogV2,
  type DataScopeOptionV2,
} from "../ShareDashboardDialogV2";
import { DashboardMoreMenu } from "../../DashboardMoreMenu";
import { EditCluster } from "./EditCluster";
import type {
  Dashboard,
  DashboardFilterDefinition,
  DashboardScheduleResponse,
  ScheduleConfigRequest,
} from "../../../../types/dashboard";
import type { MutationPhase } from "../../../../hooks/useMutationPhase";
import type { EditModeActions } from "../hooks/useEditModeActions";
import type {
  DashboardShareActions,
  DashboardShareState,
} from "../hooks/useDashboardShareV2";

// ── Filters (left slot) ──────────────────────────────────────────────

interface AnalyticsToolbarFiltersProps {
  isDashboardOwner: boolean;
  filterDefinitions: DashboardFilterDefinition[];
  filterState: Record<
    string,
    { operator: string; value?: unknown; include_blank?: boolean }
  >;
  filterCanApply: boolean;
  filterIsApplying: boolean;
  onFilterChange: (
    filterId: string,
    operator: string,
    value?: unknown,
    includeBlank?: boolean,
  ) => void;
  onRemoveFilter: (filterId: string) => void;
  onApplyFilters: () => void;
  onClearFilter?: (filterId: string) => void;
  onToggleLock?: (filterId: string, locked: boolean) => void;
  canLockFilter?: (filterId: string) => boolean;
  onRevertFilter?: (filterId: string) => void;
}

export function AnalyticsToolbarFilters({
  isDashboardOwner,
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
}: AnalyticsToolbarFiltersProps) {
  return (
    <DashboardFilterBarV2
      definitions={filterDefinitions}
      filterState={filterState}
      isApplying={filterIsApplying}
      canApply={filterCanApply}
      isOwner={isDashboardOwner}
      onFilterChange={onFilterChange}
      onRemoveFilter={onRemoveFilter}
      onClearFilter={onClearFilter}
      onToggleLock={onToggleLock}
      canLockFilter={canLockFilter}
      onApply={onApplyFilters}
      onRevertFilter={onRevertFilter}
    />
  );
}

// ── Actions (right slot) ─────────────────────────────────────────────

interface AnalyticsToolbarActionsProps {
  dashboard: Dashboard;
  isVersionPreview: boolean;
  isEditMode: boolean;
  isSaved: boolean;
  canEditDashboard: boolean;
  currentUserId: string;

  // Refresh + schedule
  onRefresh: () => Promise<void>;
  isRefreshing: boolean | undefined;
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

  // Edit cluster
  savePhase: MutationPhase;
  discardDraftPhase: MutationPhase;
  saveDraftPhase: MutationPhase;
  acquireLockPhase: MutationPhase;
  shareV2Phase: MutationPhase;
  editActions: EditModeActions;

  // Share — split into state + handlers so re-renders triggered by
  // dialog refetches don't cascade through the rest of the toolbar.
  shareState: DashboardShareState;
  shareActions: DashboardShareActions;
  onCopyLink: () => Promise<void>;

  // More menu
  onOpenVersionHistory?: () => void;
}

export function AnalyticsToolbarActions({
  dashboard,
  isVersionPreview,
  isEditMode,
  isSaved,
  canEditDashboard,
  currentUserId,
  onRefresh,
  isRefreshing,
  schedule,
  isScheduled,
  isSchedulePaused,
  isScheduleMutating,
  onCreateSchedule,
  onUpdateSchedule,
  onPauseSchedule,
  onResumeSchedule,
  onDeleteSchedule,
  savePhase,
  discardDraftPhase,
  saveDraftPhase,
  acquireLockPhase,
  shareV2Phase,
  editActions,
  shareState,
  shareActions,
  onCopyLink,
  onOpenVersionHistory,
}: AnalyticsToolbarActionsProps) {
  return (
    <>
      {/* Refresh trigger + schedule menu — bound to the live dashboard,
          so it's hidden in version-history preview to match the rest of
          the read-only chrome. Also hidden in edit mode: editing
          focuses the toolbar on the draft lifecycle (Discard / Save as
          draft / Publish), and refresh acts on the published view so
          it would read as out of context here. Editors share the
          scheduling popover with owners now — viewers fall back to
          the bare refresh icon. */}
      {!isVersionPreview && !isEditMode && (
        <RefreshButton
          onRefresh={onRefresh}
          canRefresh={isSaved}
          canSchedule={canEditDashboard}
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
      )}

      {/* Share — editor+ only. Viewers can't change scope or grants in any
          practical way (BE permits viewer scope flips but the UI doesn't
          expose them as a v1), so the trigger button is hidden from them
          entirely. Also suppressed in version-history preview mode —
          sharing acts on the live dashboard, not the previewed snapshot.
          Hidden in edit mode for the same reason as refresh: the
          toolbar collapses to the draft lifecycle cluster. */}
      {canEditDashboard && !isVersionPreview && !isEditMode && (
        <ShareDashboardDialogV2
          dashboardTitle={dashboard.title}
          currentUserId={currentUserId}
          myAccessLevel={shareState.currentAccessLevel}
          canShare={isSaved}
          scope={shareState.currentScope === "tenant" ? "org_wide" : "private"}
          scopeDefaultRole="viewer"
          grants={shareState.grants}
          directory={shareState.directory}
          dataScopingAvailable={shareState.dataScopingAvailable}
          dataScopeOwnership={
            (shareState.currentSharedDataScope as DataScopeOptionV2 | null) ??
            null
          }
          onScopeChange={shareActions.handleScopeChange}
          onGrantAdd={shareActions.handleGrantAdd}
          onGrantUpdate={shareActions.handleGrantUpdate}
          onGrantRemove={shareActions.handleGrantRemove}
          onDataScopeChange={shareActions.handleDataScopeChange}
          onCopyLink={onCopyLink}
          isAddingPeople={shareV2Phase === "pending"}
          isSavingShare={shareV2Phase === "pending"}
          savePhase={shareV2Phase}
          saveSuccessLabel={shareState.lastSaveLabel}
          onOpenChange={shareActions.setIsShareDialogOpen}
        />
      )}

      {/* Editor+ surface — Edit / Save cluster + the More menu. Editors are
          treated identically to owners here per the BE M2 editor+ permission
          model. Both affordances are suppressed in version-history preview
          mode — the toolbar collapses to filters only so the preview reads
          as a read-only browse. */}
      {canEditDashboard && !isVersionPreview && (
        <>
          <EditCluster
            isEditMode={isEditMode}
            dashboardVersion={dashboard.dashboardVersion}
            savePhase={savePhase}
            discardDraftPhase={discardDraftPhase}
            saveDraftPhase={saveDraftPhase}
            acquireLockPhase={acquireLockPhase}
            editActions={editActions}
          />
          <DashboardMoreMenu
            dashboardId={dashboard.id}
            dashboardName={dashboard.title}
            // Hide the entry when the caller didn't wire a handler — happens
            // in surfaces (e.g. the chat-side preview pane) that don't render
            // a docked panel.
            showVersionHistory={!!onOpenVersionHistory}
            onOpenVersionHistory={onOpenVersionHistory}
          />
        </>
      )}
    </>
  );
}
