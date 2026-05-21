import { SpinnerGapIcon } from "@phosphor-icons/react";
import { Tooltip } from "@vonlabs/design-components";
import { EditModeActionsV2 } from "../EditModeActionsV2";
import { EditButton } from "./EditButton";
import type { MutationPhase } from "../../../../hooks/useMutationPhase";
import type { EditModeActions } from "../hooks/useEditModeActions";

interface EditClusterProps {
  isEditMode: boolean;
  dashboardVersion: number;
  savePhase: MutationPhase;
  discardDraftPhase: MutationPhase;
  saveDraftPhase: MutationPhase;
  acquireLockPhase: MutationPhase;
  editActions: EditModeActions;
}

// Edit / Save cluster (flat — no nested ternaries):
//   0. dashboardVersion < 1 (never published) → "Publish" CTA. A
//      not-yet-published preview has nothing to draft and no other
//      editors to lock out, so we skip the triad / Edit-mode dance
//      and surface the single action that makes sense: publish it.
//   1. in edit mode → triad (Discard / Save as draft / Publish)
//   2. otherwise    → Edit button (routes through acquireLock).
export function EditCluster({
  isEditMode,
  dashboardVersion,
  savePhase,
  discardDraftPhase,
  saveDraftPhase,
  acquireLockPhase,
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

  if (isEditMode) {
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

  return (
    <EditButton
      entryPhase={acquireLockPhase}
      onClick={editActions.handleEnterEditMode}
    />
  );
}
