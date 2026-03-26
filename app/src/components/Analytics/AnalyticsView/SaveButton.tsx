import { CheckIcon, SpinnerGapIcon } from "@phosphor-icons/react";
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
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
          : savePhase === "pending"
            ? "border-gray-200/70 bg-gray-100 text-gray-500 cursor-not-allowed"
            : "border-gray-200/70 text-gray-800 hover:bg-gray-50 cursor-pointer"
      }`}
    >
      {savePhase === "pending" && (
        <>
          <SpinnerGapIcon size={14} className="animate-spin" />
          Saving
        </>
      )}
      {(savePhase === "success" || (isIdle && isSaved)) && (
        <>
          <CheckIcon size={14} weight="bold" />
          Saved
        </>
      )}
      {isIdle && !isSaved && "Save"}
    </button>
  );
};
