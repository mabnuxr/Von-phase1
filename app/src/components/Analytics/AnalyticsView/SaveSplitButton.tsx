import { useState } from "react";
import {
  CaretDownIcon,
  CheckIcon,
  SpinnerGapIcon,
  FloppyDiskIcon,
  ClockCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { formatRelativeTime } from "@vonlabs/design-components";
import { DashboardStatus } from "../../../types/dashboard";
import type { MutationPhase } from "../../../hooks/useMutationPhase";

interface SaveSplitButtonProps {
  state: DashboardStatus;
  lastSavedAt?: string | null;
  savePhase: MutationPhase;
  onSave: () => void;
  onRevert?: () => void;
}

export const SaveSplitButton: React.FC<SaveSplitButtonProps> = ({
  state,
  lastSavedAt,
  savePhase,
  onSave,
  onRevert,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const isIdle = savePhase === "idle";

  return (
    <div className="relative">
      <div
        className={`flex items-stretch h-[34px] rounded-xl border transition-colors ${
          savePhase === "success"
            ? "border-green-200 bg-green-50"
            : "border-gray-200/70 bg-transparent"
        }`}
      >
        <button
          onClick={isIdle ? onSave : undefined}
          disabled={!isIdle}
          className={`px-3 text-sm font-medium rounded-l-[11px] transition-colors ${
            savePhase === "success"
              ? "text-green-700 cursor-default"
              : savePhase === "pending"
                ? "text-gray-500 cursor-not-allowed"
                : "text-gray-800 hover:bg-gray-50 cursor-pointer"
          }`}
        >
          {savePhase === "pending" && (
            <span className="flex items-center gap-1.5">
              <SpinnerGapIcon size={14} className="animate-spin" />
              Saving
            </span>
          )}
          {savePhase === "success" && (
            <span className="flex items-center gap-1.5">
              <CheckIcon size={14} weight="bold" />
              Saved
            </span>
          )}
          {isIdle && "Save"}
        </button>
        <div
          className={`w-px self-stretch ${savePhase === "success" ? "bg-green-200" : "bg-gray-200"}`}
        />
        <button
          onClick={isIdle ? () => setShowMenu(!showMenu) : undefined}
          disabled={!isIdle}
          className={`flex items-center justify-center px-1.5 rounded-r-[11px] transition-colors ${
            savePhase === "success"
              ? "text-green-700 cursor-default"
              : savePhase === "pending"
                ? "text-gray-400 cursor-not-allowed"
                : `text-gray-800 hover:bg-gray-50 cursor-pointer ${showMenu ? "bg-gray-50" : ""}`
          }`}
        >
          <CaretDownIcon size={12} />
        </button>
      </div>

      <AnimatePresence>
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ type: "spring", duration: 0.25, bounce: 0.1 }}
              className="absolute right-0 top-full mt-1.5 z-[9999] bg-white rounded-2xl border border-gray-100 shadow-sm w-[200px]"
            >
              <div className="p-1">
                <button
                  onClick={() => {
                    onSave();
                    setShowMenu(false);
                  }}
                  className="w-full rounded-xl flex items-center gap-1.5 px-3 py-2 text-sm text-gray-900 bg-transparent hover:bg-gray-50 transition-colors cursor-pointer text-left"
                >
                  <span className="text-gray-800">
                    <FloppyDiskIcon size={14} />
                  </span>
                  Save Dashboard
                </button>
                {onRevert && (
                  <button
                    onClick={() => {
                      onRevert();
                      setShowMenu(false);
                    }}
                    className="w-full rounded-xl flex items-center gap-1.5 px-3 py-2 text-sm text-gray-900 bg-transparent hover:bg-gray-50 transition-colors cursor-pointer text-left"
                  >
                    <span className="text-gray-800">
                      <ClockCounterClockwiseIcon size={14} />
                    </span>
                    Revert to saved
                  </button>
                )}
              </div>
              <div className="px-3 py-2 border-t border-gray-100">
                <div className="text-xs text-gray-700 flex flex-col gap-0.5">
                  {state === DashboardStatus.Draft && (
                    <span>
                      Draft · Edited{" "}
                      {lastSavedAt
                        ? formatRelativeTime(lastSavedAt)
                        : "Just now"}
                    </span>
                  )}
                  {state === DashboardStatus.Published && (
                    <span>
                      Saved ·{" "}
                      {lastSavedAt
                        ? formatRelativeTime(lastSavedAt)
                        : "Just now"}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
