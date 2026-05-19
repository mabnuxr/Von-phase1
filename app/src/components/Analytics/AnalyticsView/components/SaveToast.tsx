import { AnimatePresence, motion } from "framer-motion";
import { CheckCircleIcon } from "@phosphor-icons/react";

interface SaveToastProps {
  visible: boolean;
  kind: "publish" | "draft";
  isFirstSave: boolean;
}

function messageFor(kind: "publish" | "draft", isFirstSave: boolean): string {
  if (kind === "draft") {
    return "Draft saved. Editors or owners can continue from your draft.";
  }
  return isFirstSave
    ? "Dashboard is created. You can access the dashboard from the side panel."
    : "Published. Your changes are live to all viewers.";
}

export function SaveToast({ visible, kind, isFirstSave }: SaveToastProps) {
  // Pinned to the Canvas viewport top via a zero-height sticky wrapper so
  // it stays visible even when the grid is scrolled. `h-0` keeps it from
  // taking layout space; the absolute inner positions the pill 16px below
  // the Canvas viewport top.
  return (
    <div className="sticky top-0 z-10 h-0">
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none"
          >
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-green-50 border border-green-300 text-green-900 text-sm font-medium rounded-xl shadow-sm pointer-events-auto">
              <CheckCircleIcon size={16} weight="fill" />
              {messageFor(kind, isFirstSave)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
