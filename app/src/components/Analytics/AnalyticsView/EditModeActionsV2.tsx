import { ArrowUUpLeftIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { Tooltip } from "@vonlabs/design-components";

interface EditModeActionsV2Props {
  /** Whether the discard mutation is in-flight (stubbed today). */
  isDiscarding?: boolean;
  /** Whether the save-as-draft mutation is in-flight (stubbed today). */
  isSavingDraft?: boolean;
  /** Whether the publish mutation is in-flight. */
  isPublishing?: boolean;
  /**
   * When true, Save as draft + Publish render with heavier visual emphasis
   * (bolder weight, drop shadow on Publish). Matches the design's
   * `TriadCluster dirty` variant — surfaces "you have unsaved changes".
   */
  isDirty?: boolean;
  onDiscard: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

/**
 * Edit-mode action cluster (VON-1147 §3.4.1). Renders while the
 * dashboard is in edit mode. Three CTAs, left to right:
 *
 *   - Discard       : amber, soft-warning — moves the draft to history.
 *   - Save as draft : neutral — stores the draft and releases the lock.
 *   - Publish       : dark, primary — promotes the draft to a new
 *                     published version.
 *
 * A thin divider between Discard and Save-as-draft keeps the destructive
 * action visually separated so it can't be misclicked.
 */
export const EditModeActionsV2: React.FC<EditModeActionsV2Props> = ({
  isDiscarding,
  isSavingDraft,
  isPublishing,
  isDirty,
  onDiscard,
  onSaveDraft,
  onPublish,
}) => {
  const anyInFlight = !!(isDiscarding || isSavingDraft || isPublishing);
  return (
    <div className="inline-flex items-center gap-1.5">
      {/* Discard — amber, never red. The discarded draft stays restorable
          from version history, so the tone is "you can undo this." */}
      <Tooltip content="Discard this draft.">
        <button
          type="button"
          onClick={onDiscard}
          disabled={anyInFlight}
          className={`inline-flex h-[34px] items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 text-[12.5px] font-medium text-amber-700 transition-colors hover:bg-amber-50 ${
            anyInFlight ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
        >
          {isDiscarding ? (
            <SpinnerGapIcon size={12} className="animate-spin" />
          ) : (
            <ArrowUUpLeftIcon size={12} weight="bold" />
          )}
          Discard
        </button>
      </Tooltip>

      <span
        aria-hidden
        className="mx-0.5 inline-block h-[18px] w-px bg-gray-100"
      />

      {/* Save as draft — neutral. Stores the snapshot + releases the lock
          so other editors can continue. Border tightens when dirty. */}
      <Tooltip content="Save your changes and let others continue editing.">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={anyInFlight}
          className={`inline-flex h-[34px] items-center gap-1 rounded-lg border bg-white px-3 text-[12.5px] transition-colors hover:bg-gray-50 ${
            isDirty
              ? "border-gray-900 font-semibold text-gray-900"
              : "border-gray-200 font-medium text-gray-800"
          } ${anyInFlight ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          {isSavingDraft && (
            <SpinnerGapIcon size={12} className="animate-spin" />
          )}
          Save as draft
        </button>
      </Tooltip>

      {/* Publish — primary, dark. Drop shadow only when dirty so the
          "ready to promote" state pops without competing in the resting
          edit view. */}
      <Tooltip content="Publish your changes live to all viewers.">
        <button
          type="button"
          onClick={onPublish}
          disabled={anyInFlight}
          className={`inline-flex h-[34px] items-center gap-1 rounded-lg border border-gray-900 bg-gray-900 px-3.5 text-[12.5px] text-white transition-colors hover:bg-gray-800 ${
            isDirty
              ? "font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.18)]"
              : "font-medium"
          } ${anyInFlight ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        >
          {isPublishing && (
            <SpinnerGapIcon size={12} className="animate-spin" />
          )}
          Publish
        </button>
      </Tooltip>
    </div>
  );
};
