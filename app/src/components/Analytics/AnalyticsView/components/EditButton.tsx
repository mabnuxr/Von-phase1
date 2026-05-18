import { PencilSimpleIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { Tooltip } from "@vonlabs/design-components";
import type { MutationPhase } from "../../../../hooks/useMutationPhase";

interface EditButtonProps {
  entryPhase: MutationPhase;
  onClick: () => void;
}

export function EditButton({ entryPhase, onClick }: EditButtonProps) {
  const isPending = entryPhase === "pending";
  return (
    <Tooltip content="Edit dashboard">
      <button
        onClick={entryPhase === "idle" ? onClick : undefined}
        disabled={entryPhase !== "idle"}
        className={`flex items-center gap-1.5 h-[34px] px-2.5 text-sm font-medium rounded-xl border transition-colors whitespace-nowrap ${
          isPending
            ? "border-gray-800 bg-gray-800 text-white cursor-not-allowed"
            : "border-gray-900 bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
        }`}
      >
        {isPending ? (
          <SpinnerGapIcon size={13} className="animate-spin" />
        ) : (
          <PencilSimpleIcon size={13} />
        )}
        Edit
      </button>
    </Tooltip>
  );
}
