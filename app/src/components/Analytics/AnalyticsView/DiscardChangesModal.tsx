import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SpinnerGapIcon, WarningCircleIcon } from "@phosphor-icons/react";

interface DiscardChangesModalProps {
  isOpen: boolean;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation gate for the dashboard's destructive "discard / revert"
 * actions. Same modal serves both the legacy Revert button (rolls back to
 * the last published version) and the collab Discard button (soft-deletes
 * the active draft). Tone is amber/soft — the action is recoverable from
 * version history, so the warning is informational rather than red.
 */
export const DiscardChangesModal: React.FC<DiscardChangesModalProps> = ({
  isOpen,
  isPending,
  onCancel,
  onConfirm,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, isPending, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]"
            onClick={isPending ? undefined : onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-changes-modal-title"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-[9999] w-[420px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)]"
          >
            <div className="px-5 pb-3 pt-5">
              <div className="flex items-start gap-3.5">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                  <WarningCircleIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    id="discard-changes-modal-title"
                    className="mb-2 text-[15px] font-medium leading-snug tracking-[-0.005em] text-gray-900"
                  >
                    Discard unsaved changes?
                  </div>
                  <div className="text-[13px] leading-relaxed text-gray-600">
                    Your unsaved changes will be lost. This can&apos;t be
                    undone.
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 pb-4 pt-2">
              <div className="flex-1" />
              <button
                type="button"
                onClick={onCancel}
                disabled={isPending}
                className={`rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-medium text-gray-800 transition-colors hover:bg-gray-50 ${
                  isPending ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPending}
                className={`inline-flex items-center gap-1.5 rounded-lg border border-amber-600 bg-amber-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-amber-700 ${
                  isPending ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                }`}
                autoFocus
              >
                {isPending && (
                  <SpinnerGapIcon size={13} className="animate-spin" />
                )}
                Discard
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
