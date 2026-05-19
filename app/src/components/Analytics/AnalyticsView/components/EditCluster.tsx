import { SpinnerGapIcon } from "@phosphor-icons/react";
import { Tooltip } from "@vonlabs/design-components";
import { EditModeActionsV2 } from "../EditModeActionsV2";
import { SaveButton } from "../SaveButton";
import { EditButton } from "./EditButton";
import type { MutationPhase } from "../../../../hooks/useMutationPhase";
import type { EditModeActions } from "../hooks/useEditModeActions";

interface EditClusterProps {
  isDashboardCollabEnabled: boolean;
  isEditMode: boolean;
  dashboardVersion: number;
  savePhase: MutationPhase;
  discardDraftPhase: MutationPhase;
  saveDraftPhase: MutationPhase;
  acquireLockPhase: MutationPhase;
  editModePhase: MutationPhase;
  editActions: EditModeActions;
}

// Edit / Save cluster (flat — no nested ternaries):
//   0. dashboardVersion < 1 (never published) → "Publish" CTA. Fires
//      regardless of the collab flag — a not-yet-published preview has
//      nothing to draft and no other editors to lock out, so we skip the
//      triad / Edit-mode dance and surface the single action that makes
//      sense: publish it.
//   1. dashboardCollab ON + in edit mode  → triad (Discard / Save / Publish)
//   2. dashboardCollab OFF + save-able    → legacy SaveButton
//   3. otherwise                          → Edit button (entry phase
//      sourced from acquireLock under flag, legacy is_editable PATCH otherwise).
export function EditCluster({
  isDashboardCollabEnabled,
  isEditMode,
  dashboardVersion,
  savePhase,
  discardDraftPhase,
  saveDraftPhase,
  acquireLockPhase,
  editModePhase,
  editActions,
}: EditClusterProps) {
  if (dashboardVersion < 1) {
    const inFlight = savePhase === "pending";
    return (
      <Tooltip content="Publish this dashboard to your workspace. You'll be able to find it in the side panel once published.">
        <button
          type="button"
          onClick={!inFlight ? editActions.handleSaveFromEditMode : undefined}
          disabled={inFlight}
          className={`inline-flex h-[34px] items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors whitespace-nowrap ${
            inFlight
              ? "border-gray-800 bg-gray-800 text-white cursor-not-allowed"
              : "border-gray-900 bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
          }`}
        >
          {inFlight && <SpinnerGapIcon size={13} className="animate-spin" />}
          Publish
        </button>
      </Tooltip>
    );
  }

  if (isDashboardCollabEnabled && isEditMode) {
    // The triad only mounts in edit mode, which means a draft is active —
    // mark dirty unconditionally so the cluster's emphasis styling kicks in.
    return (
      <EditModeActionsV2
        isDiscarding={discardDraftPhase === "pending"}
        isSavingDraft={saveDraftPhase === "pending"}
        isPublishing={savePhase === "pending"}
        isDirty
        onDiscard={editActions.handleDiscardDraft}
        onSaveDraft={editActions.handleSaveDraft}
        onPublish={editActions.handleSaveFromEditMode}
      />
    );
  }

  if (!isDashboardCollabEnabled && (isEditMode || savePhase !== "idle")) {
    return (
      <SaveButton
        savePhase={savePhase}
        onSave={editActions.handleSaveFromEditMode}
        isSaved={false}
      />
    );
  }

  const entryPhase = isDashboardCollabEnabled
    ? acquireLockPhase
    : editModePhase;
  return (
    <EditButton
      entryPhase={entryPhase}
      onClick={editActions.handleEnterEditMode}
    />
  );
}
