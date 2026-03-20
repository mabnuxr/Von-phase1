import { CheckIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import type { MutationPhase } from "../../../hooks/useMutationPhase";

interface SaveSplitButtonProps {
  savePhase: MutationPhase;
  onSave: () => void;
}

export const SaveSplitButton: React.FC<SaveSplitButtonProps> = ({
  savePhase,
  onSave,
}) => {
  const isIdle = savePhase === "idle";

  return (
    <button
      onClick={isIdle ? onSave : undefined}
      disabled={!isIdle}
      className={`flex items-center gap-1.5 h-[34px] px-3 text-sm font-medium rounded-xl border transition-colors ${
        savePhase === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
          : savePhase === "pending"
            ? "border-gray-200/70 text-gray-500 cursor-not-allowed"
            : "border-gray-200/70 text-gray-800 hover:bg-gray-50 cursor-pointer"
      }`}
    >
      {savePhase === "pending" && (
        <>
          <SpinnerGapIcon size={14} className="animate-spin" />
          Publishing
        </>
      )}
      {savePhase === "success" && (
        <>
          <CheckIcon size={14} weight="bold" />
          Published
        </>
      )}
      {isIdle && "Publish"}
    </button>
  );
};
