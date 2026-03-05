import { ShieldWarning, X } from "@phosphor-icons/react";
import type { WriteBlockedState } from "../hooks/useWriteBlockedEvent";

interface WriteBlockedBannerProps {
  writeBlocked: WriteBlockedState;
  onDismiss: () => void;
}

export function WriteBlockedBanner({
  writeBlocked,
  onDismiss,
}: WriteBlockedBannerProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        <ShieldWarning
          size={16}
          weight="fill"
          className="text-amber-600 shrink-0"
        />
        <p className="flex-1 text-sm text-amber-800">{writeBlocked.message}</p>
        <button
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded-md text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <X size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}
