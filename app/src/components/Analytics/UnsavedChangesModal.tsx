import { AnimatePresence, motion } from "framer-motion";
import { WarningCircleIcon } from "@phosphor-icons/react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: UnsavedChangesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] max-w-[90vw] bg-white rounded-2xl border border-gray-100 shadow-xl flex flex-col"
          >
            <div className="flex flex-col p-4">
              <div className="flex flex-row items-center gap-2 pb-3 mb-3 border-b border-gray-100">
                <div className="p-1 rounded-lg bg-amber-50">
                  <WarningCircleIcon
                    size={16}
                    weight="regular"
                    className="text-amber-600"
                  />
                </div>
                <h3 className="text-sm font-medium text-gray-900">{title}</h3>
              </div>
              <p className="text-sm text-gray-900">{body}</p>
              <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100">
                <button
                  onClick={onConfirm}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  {confirmLabel}
                </button>
                <button
                  onClick={onCancel}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-800 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
