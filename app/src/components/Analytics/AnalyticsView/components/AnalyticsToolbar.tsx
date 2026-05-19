import {
  ClockCounterClockwiseIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { Tooltip } from "@vonlabs/design-components";
import { DashboardFilterBarV2 } from "../../AnalyticsFilters/DashboardFilterBarV2";
import { RefreshButton } from "../RefreshButton";
import { ShareDashboardDialog } from "../ShareDashboardDialog";
import {
  ShareDashboardDialogV2,
  type DataScopeOptionV2,
} from "../ShareDashboardDialogV2";
import { DashboardMoreMenu } from "../../DashboardMoreMenu";
import { EditCluster } from "./EditCluster";
import { DashboardStatus } from "../../../../types/dashboard";
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
  isDashboardOwner: boolean;
  canEditDashboard: boolean;
  isDashboardCollabEnabled: boolean;
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

  // Legacy revert + legacy share
  revertPhase: MutationPhase;
  onShare: (
    isSharedWithTenant: boolean,
    sharedDataScope?: string | null,
  ) => void;
  sharePhase: MutationPhase;

  // Edit cluster
  savePhase: MutationPhase;
  discardDraftPhase: MutationPhase;
  saveDraftPhase: MutationPhase;
  acquireLockPhase: MutationPhase;
  editModePhase: MutationPhase;
  shareV2Phase: MutationPhase;
  editActions: EditModeActions;

  // Share (V2) — split into state + handlers so re-renders triggered by
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
  isDashboardOwner,
  canEditDashboard,
  isDashboardCollabEnabled,
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
  revertPhase,
  onShare,
  sharePhase,
  savePhase,
  discardDraftPhase,
  saveDraftPhase,
  acquireLockPhase,
  editModePhase,
  shareV2Phase,
  editActions,
  shareState,
  shareActions,
  onCopyLink,
  onOpenVersionHistory,
}: AnalyticsToolbarActionsProps) {
  return (
    <>
      {/* Refresh trigger + schedule menu — both bind to the live dashboard,
          so they're hidden in version-history preview to match the rest of
          the read-only chrome. */}
      {!isVersionPreview && (
        <RefreshButton
          onRefresh={onRefresh}
          canRefresh={isSaved}
          isOwner={isDashboardOwner}
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
          sharing acts on the live dashboard, not the previewed snapshot. */}
      {isDashboardCollabEnabled && canEditDashboard && !isVersionPreview && (
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
          onOpenChange={shareActions.setIsShareDialogOpen}
        />
      )}

      {/* Legacy owner-only actions — only relevant when the dashboardCollab
          flag is off. The triad cluster supersedes Revert, and the legacy
          share dialog is replaced by ShareDashboardDialogV2 above. */}
      {isDashboardOwner &&
        !isDashboardCollabEnabled &&
        isEditMode &&
        dashboard.dashboardVersion >= 1 && (
          <Tooltip content="Reverts to previous saved version">
            <button
              onClick={
                revertPhase === "idle"
                  ? editActions.handleRevertFromEditMode
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

      {isDashboardOwner && !isDashboardCollabEnabled && !isVersionPreview && (
        <ShareDashboardDialog
          isSharedWithTenant={dashboard.isSharedWithTenant}
          sharedDataScope={dashboard.sharedDataScope}
          dataScopingAvailable={shareState.dataScopingAvailable}
          canShare={isSaved}
          sharePhase={sharePhase}
          onShare={onShare}
          onCopyLink={onCopyLink}
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
            isDashboardCollabEnabled={isDashboardCollabEnabled}
            isEditMode={isEditMode}
            dashboardVersion={dashboard.dashboardVersion}
            savePhase={savePhase}
            discardDraftPhase={discardDraftPhase}
            saveDraftPhase={saveDraftPhase}
            acquireLockPhase={acquireLockPhase}
            editModePhase={editModePhase}
            editActions={editActions}
          />
          <DashboardMoreMenu
            dashboardId={dashboard.id}
            dashboardName={dashboard.title}
            // Hide the entry when the caller didn't wire a handler — happens
            // in surfaces (e.g. the chat-side preview pane) that don't render
            // a docked panel.
            showVersionHistory={
              isDashboardCollabEnabled && !!onOpenVersionHistory
            }
            onOpenVersionHistory={onOpenVersionHistory}
          />
        </>
      )}
    </>
  );
}
