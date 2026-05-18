import { AnimatePresence, motion } from "framer-motion";
import { SpinnerGapIcon } from "@phosphor-icons/react";

interface RefreshingToastProps {
  visible: boolean;
}

export function RefreshingToast({ visible }: RefreshingToastProps) {
  // Same sticky-wrapper trick as SaveToast so the indicator stays visible
  // regardless of canvas scroll.
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
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium rounded-xl shadow-sm pointer-events-auto">
              <SpinnerGapIcon size={16} className="animate-spin" />
              Refreshing dashboard data…
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
