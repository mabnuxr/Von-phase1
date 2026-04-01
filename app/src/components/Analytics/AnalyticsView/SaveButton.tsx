import { SpinnerGapIcon } from "@phosphor-icons/react";
import type { MutationPhase } from "../../../hooks/useMutationPhase";

interface SaveButtonProps {
  savePhase: MutationPhase;
  onSave: () => void;
  isSaved?: boolean;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  savePhase,
  onSave,
  isSaved,
}) => {
  const isIdle = savePhase === "idle";
  const isDisabled = !isIdle || isSaved;

  return (
    <button
      onClick={isIdle && !isSaved ? onSave : undefined}
      disabled={isDisabled}
      className={`flex items-center gap-1.5 h-[34px] px-3 text-sm font-medium rounded-xl border transition-colors ${
        savePhase === "success" || isSaved
          ? "border-emerald-700 bg-emerald-700 text-white cursor-default"
          : savePhase === "pending"
            ? "border-emerald-800 bg-emerald-800 text-white cursor-not-allowed"
            : "border-gray-900 bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
      }`}
    >
      {savePhase === "pending" && (
        <>
          <SpinnerGapIcon size={14} className="animate-spin" />
          Saving
        </>
      )}
      {(savePhase === "success" || (isIdle && isSaved)) && <>Saved</>}
      {isIdle && !isSaved && "Save"}
    </button>
  );
};
