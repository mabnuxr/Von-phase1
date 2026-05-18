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
  if (isDashboardCollabEnabled && isEditMode) {
    return (
      <EditModeActionsV2
        isDiscarding={discardDraftPhase === "pending"}
        isSavingDraft={saveDraftPhase === "pending"}
        isPublishing={savePhase === "pending"}
        onDiscard={editActions.handleDiscardDraft}
        onSaveDraft={editActions.handleSaveDraft}
        onPublish={editActions.handleSaveFromEditMode}
      />
    );
  }

  if (
    !isDashboardCollabEnabled &&
    (isEditMode || savePhase !== "idle" || dashboardVersion < 1)
  ) {
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
