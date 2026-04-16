import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShareNetworkIcon,
  UserIcon,
  BuildingsIcon,
  XIcon,
  SpinnerGapIcon,
  CheckIcon,
  CopyIcon,
  LinkIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { Tooltip } from "@vonlabs/design-components";
import type { MutationPhase } from "../../../hooks/useMutationPhase";
import { UnsavedChangesModal } from "../UnsavedChangesModal";

type DataScope =
  | "MY_RECORDS"
  | "MY_TEAMS_RECORDS"
  | "MY_MANAGERS_TEAM"
  | "ALL_RECORDS";

// Ordered from most restrictive → least restrictive.
// Each level cumulatively includes all levels above it.
const SCOPE_OPTIONS: { value: DataScope; label: string }[] = [
  { value: "MY_RECORDS", label: "My records" },
  { value: "MY_TEAMS_RECORDS", label: "My team's records" },
  { value: "MY_MANAGERS_TEAM", label: "My manager's team records" },
  { value: "ALL_RECORDS", label: "All records" },
];

const SCOPE_RANK: Record<DataScope, number> = {
  MY_RECORDS: 0,
  MY_TEAMS_RECORDS: 1,
  MY_MANAGERS_TEAM: 2,
  ALL_RECORDS: 3,
};

function isValidScope(value: unknown): value is DataScope {
  return typeof value === "string" && value in SCOPE_RANK;
}

/**
 * Default scope for the UI when the dashboard has no explicit
 * `shared_data_scope` yet. "My team's records" is the least surprising
 * starting point — broad enough to be useful without exposing the full
 * org, and matches the common "share to my immediate team" intent.
 */
const DEFAULT_SCOPE: DataScope = "MY_TEAMS_RECORDS";

function toSafeScope(value: string | null | undefined): DataScope {
  return isValidScope(value) ? value : DEFAULT_SCOPE;
}

interface ShareDashboardDialogProps {
  isSharedWithTenant: boolean;
  sharedDataScope: string | null | undefined;
  /**
   * Whether ownership-based data scoping applies to this dashboard.
   * Only true when at least one data source supports row-level
   * ownership (Salesforce today). When false, the scope toggle is
   * hidden and the subtitle drops the data-scope mention.
   */
  dataScopingAvailable: boolean;
  canShare: boolean;
  sharePhase: MutationPhase;
  onShare: (
    isSharedWithTenant: boolean,
    sharedDataScope?: string | null,
  ) => void;
  onCopyLink?: () => Promise<void>;
}

export const ShareDashboardDialog: React.FC<ShareDashboardDialogProps> = ({
  isSharedWithTenant,
  sharedDataScope,
  dataScopingAvailable,
  canShare,
  sharePhase,
  onShare,
  onCopyLink,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedShared, setSelectedShared] = useState(isSharedWithTenant);
  const [scopeEnabled, setScopeEnabled] = useState(!!sharedDataScope);
  const [selectedScope, setSelectedScope] = useState<DataScope>(
    toSafeScope(sharedDataScope),
  );
  const [copied, setCopied] = useState(false);
  const [showPrivateConfirm, setShowPrivateConfirm] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Clean up copy timer on unmount
  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const handleOpen = useCallback(() => {
    if (!canShare) return;
    setSelectedShared(isSharedWithTenant);
    setScopeEnabled(!!sharedDataScope);
    setSelectedScope(toSafeScope(sharedDataScope));
    setCopied(false);
    setOpen(true);
  }, [canShare, isSharedWithTenant, sharedDataScope]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const isDisabled = sharePhase === "pending" || sharePhase === "success";
  const isMakingPrivate = isSharedWithTenant && !selectedShared;

  // Scope only applies when the dashboard has a data source that supports
  // row-level ownership (Salesforce). On other dashboards the toggle is
  // hidden and computedScope stays null — clears any stale value on save.
  const computedScope =
    selectedShared && scopeEnabled && dataScopingAvailable
      ? selectedScope
      : null;
  // Only count the scope delta as a "change" when scoping is available;
  // otherwise a stale `sharedDataScope` on a non-Salesforce dashboard
  // would phantom-enable the Done button on open. (Any actual sharing
  // change still goes through and clears the stale scope to null.)
  const scopeChanged =
    dataScopingAvailable && computedScope !== (sharedDataScope ?? null);
  const hasChanged = selectedShared !== isSharedWithTenant || scopeChanged;

  const handleDone = () => {
    if (isMakingPrivate) {
      setOpen(false);
      setShowPrivateConfirm(true);
      return;
    }
    onShare(selectedShared, computedScope);
  };

  const handleConfirmPrivate = () => {
    setShowPrivateConfirm(false);
    onShare(false, null);
  };

  const handleCancelPrivate = () => {
    setShowPrivateConfirm(false);
  };

  const handleCopyLink = async () => {
    try {
      await onCopyLink?.();
      setCopied(true);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write can fail (insecure context, permissions denied)
    }
  };

  const shareLink = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <Tooltip
        content={
          canShare
            ? "Share"
            : "Save the dashboard to share it with your organisation"
        }
      >
        <button
          onClick={handleOpen}
          disabled={!canShare}
          className={`inline-flex items-center justify-center w-[34px] h-[34px] border rounded-xl transition-colors ${
            !canShare
              ? "text-gray-400 bg-gray-100 border-gray-200/70 cursor-not-allowed"
              : open
                ? "text-gray-800 bg-gray-50 border-gray-300 cursor-pointer"
                : "text-gray-800 bg-white border-gray-200/70 hover:bg-gray-50 cursor-pointer"
          }`}
        >
          <ShareNetworkIcon size={14} />
        </button>
      </Tooltip>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]"
              onClick={handleClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] max-w-[90vw] bg-white rounded-2xl border border-gray-100 shadow-xl flex flex-col"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Share this dashboard
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {dataScopingAvailable
                        ? "Choose who can view this dashboard and what data they see."
                        : "Choose who can view this dashboard."}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer mt-0.5 shrink-0"
                  >
                    <XIcon size={13} />
                  </button>
                </div>

                {/* Access options */}
                <div className="flex flex-col gap-2 mt-4">
                  {/* Private */}
                  <button
                    onClick={() => setSelectedShared(false)}
                    disabled={isDisabled}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-colors cursor-pointer text-left ${
                      !selectedShared
                        ? "border-gray-300 bg-gray-50"
                        : "border-gray-100 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        !selectedShared ? "bg-gray-200" : "bg-gray-100"
                      }`}
                    >
                      <UserIcon
                        size={16}
                        className={
                          !selectedShared ? "text-gray-700" : "text-gray-400"
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">
                        Private
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Only you have access
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        !selectedShared ? "border-gray-700" : "border-gray-300"
                      }`}
                    >
                      {!selectedShared && (
                        <div className="w-2 h-2 rounded-full bg-gray-900" />
                      )}
                    </div>
                  </button>

                  {/* Organization wide */}
                  <button
                    onClick={() => setSelectedShared(true)}
                    disabled={isDisabled}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-colors cursor-pointer text-left ${
                      selectedShared
                        ? "border-gray-300 bg-gray-50"
                        : "border-gray-100 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        selectedShared ? "bg-gray-200" : "bg-gray-100"
                      }`}
                    >
                      <BuildingsIcon
                        size={16}
                        className={
                          selectedShared ? "text-gray-700" : "text-gray-400"
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">
                        Organization wide
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Anyone at your org can view
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedShared ? "border-gray-700" : "border-gray-300"
                      }`}
                    >
                      {selectedShared && (
                        <div className="w-2 h-2 rounded-full bg-gray-900" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Scope data by ownership — only when org-wide AND
                    the dashboard has a data source that supports
                    row-level ownership (Salesforce). */}
                {selectedShared && dataScopingAvailable && (
                  <div className="mt-3 px-3.5 py-3 rounded-xl border border-indigo-100 bg-indigo-50/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-indigo-900">
                          Scope data by ownership
                        </span>
                        <p className="text-xs text-indigo-600 mt-0.5">
                          Viewers can only see data based on the selected scope.
                        </p>
                      </div>
                      {/* Toggle switch */}
                      <button
                        onClick={() => setScopeEnabled((v) => !v)}
                        disabled={isDisabled}
                        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ml-3 cursor-pointer ${
                          scopeEnabled ? "bg-indigo-500" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                            scopeEnabled
                              ? "translate-x-[18px]"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Scope level options — visible when toggle is on */}
                    {scopeEnabled && (
                      <div className="mt-3 pt-2.5 border-t border-indigo-100">
                        <span className="text-[11px] font-medium text-indigo-800">
                          Viewers will see
                        </span>
                        <div className="mt-1.5 flex flex-col gap-0.5">
                          {SCOPE_OPTIONS.map((opt) => {
                            // Cumulative visualisation: selecting "My team's
                            // records" implies "My records" is included, etc.
                            const included =
                              SCOPE_RANK[opt.value] <=
                              SCOPE_RANK[selectedScope];
                            return (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  if (
                                    included &&
                                    opt.value !== SCOPE_OPTIONS[0].value
                                  ) {
                                    // Deselect: drop to one level below the clicked option
                                    const idx = SCOPE_OPTIONS.findIndex(
                                      (o) => o.value === opt.value,
                                    );
                                    setSelectedScope(
                                      SCOPE_OPTIONS[idx - 1].value,
                                    );
                                  } else {
                                    setSelectedScope(opt.value);
                                  }
                                }}
                                disabled={isDisabled}
                                className="flex items-center gap-2 py-1 text-left cursor-pointer hover:bg-indigo-50/40 rounded-md px-1 -mx-1 transition-colors"
                              >
                                <div
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                    included
                                      ? "bg-indigo-600 border-indigo-600"
                                      : "bg-white border-gray-300"
                                  }`}
                                >
                                  {included && (
                                    <CheckIcon
                                      size={10}
                                      weight="bold"
                                      className="text-white"
                                    />
                                  )}
                                </div>
                                <span
                                  className={`text-xs ${
                                    included
                                      ? "text-indigo-900 font-medium"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {opt.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Share link row — visible only when the dashboard is
                    currently shared org-wide on the server AND the user
                    hasn't selected Private in the modal. Selecting Private
                    hides the link immediately even before the change is
                    committed, since the link is about to become invalid. */}
                {isSharedWithTenant && selectedShared && onCopyLink && (
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-2 mt-3 px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer text-left"
                  >
                    <LinkIcon size={13} className="text-gray-400 shrink-0" />
                    <span className="flex-1 text-xs text-gray-500 truncate font-mono">
                      {shareLink}
                    </span>
                    {copied ? (
                      <span className="text-[10px] text-gray-500 shrink-0">
                        Copied!
                      </span>
                    ) : (
                      <CopyIcon size={13} className="text-gray-400 shrink-0" />
                    )}
                  </button>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDone}
                    disabled={!hasChanged || isDisabled}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                      !hasChanged || isDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
                    }`}
                  >
                    {sharePhase === "pending" && (
                      <>
                        <SpinnerGapIcon size={14} className="animate-spin" />
                        {isMakingPrivate ? "Making Private..." : "Sharing..."}
                      </>
                    )}
                    {sharePhase === "success" && (
                      <>
                        <CheckIcon size={14} weight="bold" />
                        Done!
                      </>
                    )}
                    {sharePhase === "idle" && "Done"}
                  </button>
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
    </>
  );
};
