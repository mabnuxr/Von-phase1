import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WarningCircleIcon } from "@phosphor-icons/react";

interface EditLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Display name of the user currently holding the edit lock. Falls back
   * to "Another editor" when the directory hasn't resolved the user yet —
   * the message stays accurate either way.
   */
  holderName: string | null;
}

/**
 * Hard-block modal shown when a user clicks Edit but another editor holds
 * the dashboard's edit lock (VON-1147 §3.4.2). Tone is informational —
 * nothing is being lost, the user just needs to wait for the holder to
 * save the draft (which releases the lock). Single "Got it" dismiss.
 *
 * The modal does not attempt to acquire the lock itself — the caller is
 * expected to gate on the embedded `edit_lock` (or `POST /lock`'s 409
 * response once that flow is wired) before opening this.
 */
export const EditLockModal: React.FC<EditLockModalProps> = ({
  isOpen,
  onClose,
  holderName,
}) => {
  // Esc to dismiss — matches the share dialog and stays consistent with
  // the rest of the app's modal conventions.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const editorLabel = holderName ?? "Another editor";

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
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-lock-modal-title"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed left-1/2 top-1/2 z-[9999] w-[420px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)]"
          >
            <div className="px-5 pb-3 pt-5">
              <div className="flex items-start gap-3.5">
                {/* Amber, informational — never red. The block is soft. */}
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                  <WarningCircleIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    id="edit-lock-modal-title"
                    className="mb-2 text-[15px] font-medium leading-snug tracking-[-0.005em] text-gray-900"
                  >
                    {editorLabel} is currently editing this dashboard
                  </div>
                  <div className="text-[13px] leading-relaxed text-gray-600">
                    Ask them to save the draft to continue editing it.
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 pb-4 pt-2">
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-gray-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-gray-800 cursor-pointer"
                autoFocus
              >
                Got it
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
