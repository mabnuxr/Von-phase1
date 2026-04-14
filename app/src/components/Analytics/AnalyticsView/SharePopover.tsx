import { useState, useEffect } from "react";
import {
  CheckIcon,
  SpinnerGapIcon,
  ExportIcon,
  UserIcon,
  BuildingsIcon,
  LinkIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useVisibilityToggle, Tooltip } from "@vonlabs/design-components";
import { useToast } from "../../../hooks/useToast";
import type { MutationPhase } from "../../../hooks/useMutationPhase";
import { UnsavedChangesModal } from "../UnsavedChangesModal";

interface SharePopoverProps {
  isSharedWithTenant: boolean;
  canShare: boolean;
  sharePhase: MutationPhase;
  onShare: (
    isSharedWithTenant: boolean,
    sharedDataScope?: string | null,
  ) => void;
  onCopyLink?: () => Promise<void>;
}

export const SharePopover: React.FC<SharePopoverProps> = ({
  isSharedWithTenant,
  canShare,
  sharePhase,
  onShare,
  onCopyLink,
}) => {
  const { isVisible: open, hide, toggleVisibility } = useVisibilityToggle();
  const { showToast } = useToast();

  // Local selection state — initialised from server, reset when popover opens
  const [selectedShared, setSelectedShared] = useState(isSharedWithTenant);

  // Sync local state when server state changes, but only while popover is closed
  // to avoid overwriting the user's in-progress selection
  useEffect(() => {
    if (!open) setSelectedShared(isSharedWithTenant);
  }, [isSharedWithTenant, open]);

  // Reset selection when popover opens
  const handleToggle = () => {
    if (!open) setSelectedShared(isSharedWithTenant);
    toggleVisibility();
  };

  const [showPrivateConfirm, setShowPrivateConfirm] = useState(false);

  const isDisabled = sharePhase === "pending" || sharePhase === "success";
  const hasChanged = selectedShared !== isSharedWithTenant;
  const isMakingPrivate = isSharedWithTenant && !selectedShared;

  const handleShare = () => {
    if (isMakingPrivate) {
      hide();
      setShowPrivateConfirm(true);
      return;
    }
    onShare(selectedShared);
  };

  const handleConfirmPrivate = () => {
    setShowPrivateConfirm(false);
    onShare(false);
  };

  const handleCancelPrivate = () => {
    setShowPrivateConfirm(false);
  };

  const handleCopyLink = async () => {
    try {
      await onCopyLink?.();
      hide();
      showToast({ message: "Share link copied!", variant: "success" });
    } catch {
      showToast({ message: "Failed to copy link", variant: "error" });
    }
  };

  return (
    <div className="relative">
      <Tooltip
        content={
          canShare
            ? "Share"
            : "Save the dashboard to share it with your organisation"
        }
      >
        <button
          onClick={canShare ? handleToggle : undefined}
          disabled={!canShare}
          className={`inline-flex items-center justify-center w-[34px] h-[34px] border rounded-xl transition-colors ${
            !canShare
              ? "text-gray-400 bg-gray-100 border-gray-200/70 cursor-not-allowed"
              : open
                ? "text-gray-800 bg-gray-50 border-gray-300 cursor-pointer"
                : "text-gray-800 bg-white border-gray-200/70 hover:bg-gray-50 cursor-pointer"
          }`}
        >
          <ExportIcon size={14} />
        </button>
      </Tooltip>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={hide} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ type: "spring", duration: 0.25, bounce: 0.1 }}
              className="absolute right-0 top-full mt-1.5 z-[9999] bg-white rounded-2xl border border-gray-100 shadow-sm w-[240px]"
            >
              <div className="p-1">
                <button
                  onClick={() => setSelectedShared(false)}
                  disabled={isDisabled}
                  className="w-full rounded-xl flex items-center justify-between px-3 py-2 bg-transparent hover:bg-gray-50 transition-colors cursor-pointer text-left"
                >
                  <span
                    className={`flex items-center gap-2 text-sm ${!selectedShared ? "text-gray-900" : "text-gray-700"}`}
                  >
                    <UserIcon size={14} />
                    Private
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      !selectedShared ? "border-gray-700" : "border-gray-300"
                    }`}
                  >
                    {!selectedShared && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setSelectedShared(true)}
                  disabled={isDisabled}
                  className="w-full rounded-xl flex items-center justify-between px-3 py-2 bg-transparent hover:bg-gray-50 transition-colors cursor-pointer text-left"
                >
                  <span
                    className={`flex items-center gap-2 text-sm ${selectedShared ? "text-gray-900" : "text-gray-700"}`}
                  >
                    <BuildingsIcon size={14} />
                    Organization wide
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedShared ? "border-gray-700" : "border-gray-300"
                    }`}
                  >
                    {selectedShared && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                    )}
                  </div>
                </button>

                <div className="px-2 pb-1 pt-1 flex flex-col gap-1.5">
                  <button
                    onClick={handleShare}
                    disabled={!hasChanged || isDisabled}
                    className={`w-full h-[34px] rounded-xl text-sm font-medium transition-colors ${
                      !hasChanged || isDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
                    }`}
                  >
                    {sharePhase === "pending" && (
                      <span className="flex items-center justify-center gap-1.5">
                        <SpinnerGapIcon size={14} className="animate-spin" />
                        {!selectedShared ? "Making Private" : "Sharing"}
                      </span>
                    )}
                    {sharePhase === "success" && (
                      <span className="flex items-center justify-center gap-1.5">
                        <CheckIcon size={14} weight="bold" />
                        {!selectedShared ? "Made Private" : "Shared"}
                      </span>
                    )}
                    {sharePhase === "idle" &&
                      (isMakingPrivate ? "Make Private" : "Share")}
                  </button>

                  {isSharedWithTenant && onCopyLink && (
                    <button
                      onClick={handleCopyLink}
                      className="w-full h-[34px] rounded-xl text-sm font-medium text-gray-800 border border-gray-200/70 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <LinkIcon size={14} />
                        Copy link
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <UnsavedChangesModal
        isOpen={showPrivateConfirm}
        title="Make dashboard private?"
        body="Your team will lose access to this dashboard. Only you will be able to view and edit it."
        confirmLabel="Yes, Make Private"
        onConfirm={handleConfirmPrivate}
        onCancel={handleCancelPrivate}
      />
    </div>
  );
};
