import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CaretLeftIcon,
  CopyIcon,
  LinkSimpleIcon,
  QuestionIcon,
  ShareNetworkIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Tooltip } from "@vonlabs/design-components";
import {
  GeneralAccessRow,
  PerRowRoleMenu,
  PersonRow,
  RolePill,
  ScopeDataByOwnership,
} from "./components";
import { AddPeopleView } from "./AddPeopleView";
import type {
  DashboardRoleV2,
  DashboardScopeV2,
  DataScopeOptionV2,
  DirectoryPersonV2,
  GrantableRoleV2,
  ShareDialogPersonV2,
} from "./types";
import type { MutationPhase } from "../../../../hooks/useMutationPhase";

// ─── Trigger button (matches existing share-button styling) ──────

interface TriggerButtonProps {
  canShare: boolean;
  open: boolean;
  onClick: () => void;
}

const TriggerButton: React.FC<TriggerButtonProps> = ({
  canShare,
  open,
  onClick,
}) => (
  <Tooltip
    content={
      canShare
        ? "Share"
        : "Save the dashboard to share it with your organisation"
    }
  >
    <button
      type="button"
      onClick={onClick}
      disabled={!canShare}
      className={`inline-flex h-[34px] w-[34px] items-center justify-center rounded-xl border transition-colors ${
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
);

// ─── Footer ──────────────────────────────────────────────────────

const SHARING_DOCS_URL =
  "https://docs.vonlabs.ai/features/von-dashboards/sharing-dashboards";

/** Time the "Access updated" pill is held before the modal closes.
 *  Mirrors the Add-People submit flow so the success cue reads as a
 *  deliberate confirmation regardless of which path triggered it. */
const SHARE_SUCCESS_TOAST_HOLD_MS = 2000;

interface FooterProps {
  onCopyLink?: () => Promise<void>;
  /** True when there are unsaved data-scope changes — flips the
   *  right-side button from "Done" to "Save" and reveals the
   *  "Pending changes" indicator. */
  hasPendingChanges: boolean;
  /** Pending state for the Save click — surfaces a "Saving…" label
   *  while the mutation is in flight. Ignored when there are no
   *  pending changes (button is "Done" then). */
  isSaving: boolean;
  /** Commit the pending data-scope change. Called only when
   *  `hasPendingChanges` is true. */
  onSave: () => void;
  /** Close the modal without further action. Called when the button
   *  reads "Done" (i.e. no pending changes). */
  onDone: () => void;
}

const StandardFooter: React.FC<FooterProps> = ({
  onCopyLink,
  hasPendingChanges,
  isSaving,
  onSave,
  onDone,
}) => {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const handleCopy = async () => {
    try {
      await onCopyLink?.();
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write may fail under restricted contexts (insecure origin,
      // permissions). The button silently no-ops in that case.
    }
  };

  return (
    <>
      {onCopyLink && (
        <button
          type="button"
          onClick={handleCopy}
          // Swap to a green-tinted pill while the "Copied" confirmation
          // is showing — `transition-colors` animates the border / text /
          // background swap so the success state reads as a deliberate
          // affirmation rather than a gray state flicker.
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium cursor-pointer transition-colors ${
            copied
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {copied ? (
            <>
              <CopyIcon size={13} weight="bold" />
              Copied
            </>
          ) : (
            <>
              <LinkSimpleIcon size={13} />
              Copy link
            </>
          )}
        </button>
      )}
      <div className="flex-1" />
      {hasPendingChanges && (
        <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-500">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gray-500" />
          Pending changes
        </span>
      )}
      <button
        type="button"
        onClick={hasPendingChanges && !isSaving ? onSave : onDone}
        disabled={hasPendingChanges && isSaving}
        // `min-w-[88px]` + `justify-center` pins the button to the
        // widest label ("Saving…") so toggling Done ↔ Save ↔ Saving…
        // doesn't reflow the footer width.
        className={`inline-flex min-w-[88px] items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[12.5px] font-medium transition-colors ${
          hasPendingChanges && isSaving
            ? "bg-gray-700 text-white cursor-not-allowed"
            : "bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
        }`}
      >
        {hasPendingChanges ? (isSaving ? "Saving…" : "Save") : "Done"}
      </button>
    </>
  );
};

// ─── Add-people trigger (inline search field in the default view) ─

const AddPeopleTrigger: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left transition-colors hover:bg-gray-100 cursor-pointer"
  >
    <span className="inline-flex shrink-0 items-center justify-center text-gray-500">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    </span>
    <span className="flex-1 text-[13px] text-gray-500">Add people</span>
  </button>
);

// ─── Main component ──────────────────────────────────────────────

export interface ShareDashboardDialogV2Props {
  /** Dashboard title rendered in the modal header. */
  dashboardTitle: string;
  /** ID of the signed-in user — drives the "(you)" annotation and gates capabilities. */
  currentUserId: string;
  /** Caller's resolved access on this dashboard. */
  myAccessLevel: DashboardRoleV2;
  /** Workspace / tenant display name, used in the org-wide row copy. */
  workspaceLabel?: string;
  /** Whether the share button is enabled (e.g. dashboard saved). */
  canShare: boolean;
  /** Current scope (private = invite-only, org_wide = whole tenant). */
  scope: DashboardScopeV2;
  /** Default role applied to the org-wide scope (only meaningful when scope = org_wide). */
  scopeDefaultRole: GrantableRoleV2;
  /** People with explicit access (includes the owner with role "owner"). */
  grants: ShareDialogPersonV2[];
  /** Tenant directory for the people-search suggestions. */
  directory: DirectoryPersonV2[];
  /** Whether the underlying data sources support row-level ownership scoping. */
  dataScopingAvailable: boolean;
  /** Current data-scope option (only applied when scope = org_wide and viewers exist). */
  dataScopeOwnership: DataScopeOptionV2 | null;
  /** When true, the dashboard reads from at least one personal integration —
   *  surfaces an inline warning above the footer so the owner is conscious
   *  that recipients will see data accessed through their personal
   *  connection before they confirm a share. */
  hasPersonalIntegration?: boolean;
  /** Actions — caller wires to mutations / mock handlers during the rollout.
   *  All return `Promise<void>` so the dialog's fire-and-forget
   *  wrappers can chain `.catch()` to silence the serialization-drop
   *  rejection (`handleShareV2` throws "share_v2_in_flight" while a
   *  prior share is in flight). Real errors are still surfaced
   *  upstream via the global error toast. */
  onScopeChange: (
    scope: DashboardScopeV2,
    scopeDefaultRole: GrantableRoleV2,
  ) => Promise<void> | void;
  onGrantAdd: (
    userIds: string[],
    role: GrantableRoleV2,
    dataScope: DataScopeOptionV2 | null,
  ) => Promise<void> | void;
  onGrantUpdate: (
    userId: string,
    role: GrantableRoleV2,
  ) => Promise<void> | void;
  onGrantRemove: (userId: string) => Promise<void> | void;
  /**
   * Apply a data-scope change. Returns a promise so the dialog can
   * await the Save round-trip before closing — the dialog batches
   * data-scope edits locally and dispatches once on Save.
   */
  onDataScopeChange: (next: DataScopeOptionV2 | null) => Promise<void> | void;
  onCopyLink?: () => Promise<void>;
  /** Pending state surfaced to the Add-people submit button. */
  isAddingPeople?: boolean;
  /** While the unified share mutation is in flight, lock the scope row
   *  (and the org-wide data-scope toggle) and surface a spinner. */
  isSavingShare?: boolean;
  /** Full phase signal for the share mutation. The dialog watches the
   *  `"success"` transition to flash the in-modal pill at its own
   *  bottom edge — keeps the success cue scoped to the surface where
   *  the action originated instead of the global top-right toast
   *  stack. */
  savePhase?: MutationPhase;
  /** Copy rendered inside the success pill. The caller stamps this
   *  per-action so the cue matches what just happened — e.g.
   *  "Removed access" for a grant removal, "Access updated" for
   *  scope / grant edits. */
  saveSuccessLabel?: string;
  /** Notified every time the modal opens or closes. The parent uses this
   *  to gate the on-demand metadata fetch — the share dialog re-reads
   *  authoritative sharing state via `GET /metadata` on every open so a
   *  collaborator's edits in another tab don't show up as stale here. */
  onOpenChange?: (open: boolean) => void;
}

export const ShareDashboardDialogV2: React.FC<ShareDashboardDialogV2Props> = ({
  dashboardTitle,
  currentUserId,
  myAccessLevel,
  workspaceLabel = "your org",
  canShare,
  scope,
  scopeDefaultRole,
  grants,
  directory,
  dataScopingAvailable,
  dataScopeOwnership,
  hasPersonalIntegration,
  onScopeChange,
  onGrantAdd,
  onGrantUpdate,
  onGrantRemove,
  onDataScopeChange,
  onCopyLink,
  isAddingPeople,
  isSavingShare,
  savePhase = "idle",
  saveSuccessLabel = "Access updated",
  onOpenChange,
}) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"default" | "addPeople">("default");
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const [rowMenuFor, setRowMenuFor] = useState<string | null>(null);

  // Surface open transitions to the parent so it can gate the on-demand
  // metadata fetch. Skipping the initial false→false noop keeps us from
  // firing a spurious callback on first mount.
  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // Local draft of the data-scope row. Data-scope edits are batched
  // here — the user can toggle / pick rows freely, and the share
  // mutation only fires on Save. `pendingDataScope` is seeded from
  // `dataScopeOwnership` (server-authoritative) on every modal open
  // and compared back against it to derive the "Pending changes"
  // flag. Other share actions (scope flip, grant add / update /
  // remove) still fire immediately — only the data-scope row uses
  // the batched-save pattern.
  const [pendingDataScope, setPendingDataScope] =
    useState<DataScopeOptionV2 | null>(dataScopeOwnership);
  const hasPendingDataScopeChange = pendingDataScope !== dataScopeOwnership;

  // Reset transient state every time the modal opens — matches existing dialog.
  const handleOpen = useCallback(() => {
    if (!canShare) return;
    setView("default");
    setScopeMenuOpen(false);
    setRowMenuFor(null);
    setAddPeopleSucceeded(false);
    // Seed the local draft from the latest server-authoritative
    // value so a re-open after a successful save starts clean.
    setPendingDataScope(dataScopeOwnership);
    setOpen(true);
  }, [canShare, dataScopeOwnership]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Save the pending data-scope change. Mirrors the Add-People flow:
  // dispatch → hold the "Access updated" pill for the toast window →
  // close. On error the mutation hook surfaces the global toast and
  // we keep the modal open so the user can retry.
  const handleSavePendingChanges = useCallback(async () => {
    try {
      await onDataScopeChange(pendingDataScope);
      await new Promise((resolve) =>
        setTimeout(resolve, SHARE_SUCCESS_TOAST_HOLD_MS),
      );
      setOpen(false);
    } catch {
      // Stay open. Caller surfaced the toast.
    }
  }, [onDataScopeChange, pendingDataScope]);

  // People list ordering: owner first, then the current user (if
  // they have a grant), then everyone else in the caller's original
  // `grants` order. The remainder is left untouched so it tracks the
  // BE's `user_grants` payload (typically `granted_at` order) — only
  // the two pinned rows float to the top.
  const sortedGrants = useMemo(() => {
    const owner = grants.find((g) => g.role === "owner");
    // Only pin "you" when the caller isn't the owner — the owner row
    // already covers that user, so a duplicate "you" pin would render
    // them twice.
    const youGrant = grants.find((g) => g.isYou && g.role !== "owner");
    // Rest = non-owner, non-self grants in original order. Owner +
    // youGrant are already pinned above.
    const rest = grants.filter((g) => g.role !== "owner" && !g.isYou);
    const pinned: ShareDialogPersonV2[] = [];
    if (owner) pinned.push(owner);
    if (youGrant) pinned.push(youGrant);
    return [...pinned, ...rest];
  }, [grants]);

  // Permission matrix (BE M2 — VON-1283 §3.3):
  //
  //   - Scope flip (RESTRICTED ↔ TENANT)   : viewer+
  //   - shared_data_scope change           : editor+
  //   - Add/remove/promote/demote editor   : editor+
  //   - Add/remove viewer grant            : viewer+
  //   - Leave existing grant unchanged     : any (no-op passthrough)
  //
  // The dialog is only opened by callers with viewer+ access, so scope change
  // is always allowed here. The other gates are derived from `myAccessLevel`.
  const canChangeDataScope =
    myAccessLevel === "editor" || myAccessLevel === "owner";
  const canManageEditorGrants =
    myAccessLevel === "editor" || myAccessLevel === "owner";

  // Add-people submit is now promise-based: the parent's
  // `handleShareV2` re-throws on error, so the dialog awaits the
  // dispatch directly. The AddPeopleView's pending-state cue is
  // driven by `isAddingPeople` (`shareV2Phase === "pending"`), so
  // the Share button stays in its loading state for the full
  // round-trip. On success we:
  //   1. Flip `addPeopleSucceeded` — AddPeopleView swaps its
  //      Cancel/Share footer for an "Access updated" pill in the
  //      same slot, so the cue stays anchored on the surface the
  //      user just acted on rather than flashing the default view.
  //   2. Hold the modal open for ~2s so the pill reads as a
  //      deliberate confirmation before the modal animates out.
  //   3. Close the modal (and reset the flag for next open).
  // Rejects → swallow (global error toast already fired upstream)
  // and keep the user on AddPeopleView so they can retry.
  const [addPeopleSucceeded, setAddPeopleSucceeded] = useState(false);
  const handleAddPeopleSubmit = useCallback(
    async (
      userIds: string[],
      role: GrantableRoleV2,
      dataScope: DataScopeOptionV2 | null,
    ) => {
      try {
        await onGrantAdd(userIds, role, dataScope);
        setAddPeopleSucceeded(true);
        await new Promise((resolve) =>
          setTimeout(resolve, SHARE_SUCCESS_TOAST_HOLD_MS),
        );
        setAddPeopleSucceeded(false);
        setView("default");
        setOpen(false);
      } catch {
        // Stay open. Caller surfaced the toast.
      }
    },
    [onGrantAdd],
  );

  return (
    <>
      <TriggerButton canShare={canShare} open={open} onClick={handleOpen} />

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
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="fixed left-1/2 top-1/2 z-[9999] w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)]"
              role="dialog"
              aria-modal="true"
              aria-label={
                view === "addPeople"
                  ? `Add people to ${dashboardTitle}`
                  : `Share ${dashboardTitle}`
              }
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-[18px] pb-2.5 pt-3.5 pl-[18px]">
                {view === "addPeople" && (
                  <button
                    type="button"
                    onClick={() => setView("default")}
                    aria-label="Back"
                    className="-ml-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 cursor-pointer"
                  >
                    <CaretLeftIcon size={14} weight="bold" />
                  </button>
                )}
                <div className="min-w-0 flex-1 truncate text-[15px] font-medium tracking-[-0.005em] text-gray-900">
                  {view === "addPeople" ? (
                    <>
                      Add people to{" "}
                      <span className="font-medium">“{dashboardTitle}”</span>
                    </>
                  ) : (
                    <>Share “{dashboardTitle}”</>
                  )}
                </div>
                {/* Help icon — replaces the old footer "Learn about
                    sharing" link. Sits left of the close button so the
                    footer can be reclaimed for Copy link + Save/Done. */}
                <a
                  href={SHARING_DOCS_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Learn about sharing"
                  title="Learn about sharing"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                >
                  <QuestionIcon size={14} />
                </a>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 cursor-pointer"
                >
                  <XIcon size={13} />
                </button>
              </div>

              {/* Body */}
              <div className="px-[18px] pb-1">
                {view === "default" ? (
                  <DefaultView
                    sortedGrants={sortedGrants}
                    currentUserId={currentUserId}
                    scope={scope}
                    scopeDefaultRole={scopeDefaultRole}
                    scopeMenuOpen={scopeMenuOpen}
                    rowMenuFor={rowMenuFor}
                    workspaceLabel={workspaceLabel}
                    dataScopingAvailable={dataScopingAvailable}
                    dataScopeOwnership={pendingDataScope}
                    hasPersonalIntegration={hasPersonalIntegration}
                    canChangeDataScope={canChangeDataScope}
                    canManageEditorGrants={canManageEditorGrants}
                    isSavingShare={isSavingShare}
                    onAddPeople={() => setView("addPeople")}
                    onScopeToggle={() => setScopeMenuOpen((v) => !v)}
                    onScopeClose={() => setScopeMenuOpen(false)}
                    onScopeSelect={(next) => {
                      setScopeMenuOpen(false);
                      // Fire-and-forget; serialization drops surface
                      // as a `"share_v2_in_flight"` rejection that
                      // these per-row paths intentionally swallow
                      // (the awaiting Add-People / Save paths still
                      // see it and stay open). Real errors land in
                      // the global toast via `handleShareV2`.
                      void Promise.resolve(
                        onScopeChange(next, scopeDefaultRole),
                      ).catch(() => {});
                    }}
                    onRowMenuOpen={(userId) => setRowMenuFor(userId)}
                    onRowMenuClose={() => setRowMenuFor(null)}
                    onGrantUpdate={(userId, role) => {
                      setRowMenuFor(null);
                      void Promise.resolve(onGrantUpdate(userId, role)).catch(
                        () => {},
                      );
                    }}
                    onGrantRemove={(userId) => {
                      setRowMenuFor(null);
                      void Promise.resolve(onGrantRemove(userId)).catch(
                        () => {},
                      );
                    }}
                    // Data-scope edits batch into the local
                    // `pendingDataScope` draft instead of firing the
                    // share mutation per-change. The Save button in
                    // the footer commits them in one round-trip.
                    onDataScopeChange={setPendingDataScope}
                  />
                ) : (
                  <AddPeopleView
                    directory={directory}
                    existingGrants={grants}
                    myAccessLevel={myAccessLevel}
                    dataScopingAvailable={dataScopingAvailable}
                    initialDataScope={dataScopeOwnership}
                    onSubmit={handleAddPeopleSubmit}
                    onCancel={() => setView("default")}
                    isSubmitting={isAddingPeople}
                    saveSucceeded={addPeopleSucceeded}
                    saveSuccessLabel={saveSuccessLabel}
                  />
                )}
              </div>

              {/* Footer — only on the default view; AddPeopleView renders its
                  own Send/Cancel pair scoped to the batch submit. */}
              {view === "default" && (
                <div className="flex items-center gap-2 px-[18px] pb-3 pt-2.5">
                  <StandardFooter
                    onCopyLink={onCopyLink}
                    hasPendingChanges={hasPendingDataScopeChange}
                    isSaving={isSavingShare ?? false}
                    onSave={handleSavePendingChanges}
                    onDone={handleClose}
                  />
                </div>
              )}

              {/* In-modal success pill (mirrors Google Sheets' "Access
                  updated" cue). The pulse is driven by `savePhase` —
                  `useMutationPhase` holds `"success"` for 2.5s, then
                  resets — so the pill auto-dismisses without local
                  timers. Positioned absolute over the footer so it
                  reads as a transient confirmation rather than a layout
                  shift. */}
              {/* Modal-level pill only renders on the default view —
                  AddPeopleView hosts its own pill in its footer (in
                  place of the Cancel/Share buttons) so the
                  confirmation stays anchored to the surface the user
                  just acted on. */}
              <AnimatePresence>
                {view === "default" && savePhase === "success" && (
                  <motion.div
                    key="share-saved-pill"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-1.5 text-[12.5px] font-medium text-white shadow-[0_6px_16px_rgba(0,0,0,0.18),0_1px_3px_rgba(0,0,0,0.12)]"
                    role="status"
                    aria-live="polite"
                  >
                    {saveSuccessLabel}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Default view (people list + General access + Scope toggle) ──

interface DefaultViewProps {
  sortedGrants: ShareDialogPersonV2[];
  currentUserId: string;
  scope: DashboardScopeV2;
  scopeDefaultRole: GrantableRoleV2;
  scopeMenuOpen: boolean;
  rowMenuFor: string | null;
  workspaceLabel: string;
  dataScopingAvailable: boolean;
  dataScopeOwnership: DataScopeOptionV2 | null;
  /** Renders the personal-integration caution banner above the footer. */
  hasPersonalIntegration?: boolean;
  /** Editor+ only — viewers see the toggle but cannot flip it. */
  canChangeDataScope: boolean;
  /** Editor+ only — gates the editor role option in the per-row menu and
   *  whether a viewer caller can touch existing editor-role rows at all. */
  canManageEditorGrants: boolean;
  /** Plumbed to the General access row's loading state. */
  isSavingShare?: boolean;
  onAddPeople: () => void;
  onScopeToggle: () => void;
  onScopeClose: () => void;
  onScopeSelect: (next: DashboardScopeV2) => void;
  onRowMenuOpen: (userId: string) => void;
  onRowMenuClose: () => void;
  onGrantUpdate: (userId: string, role: GrantableRoleV2) => void;
  onGrantRemove: (userId: string) => void;
  onDataScopeChange: (next: DataScopeOptionV2 | null) => void;
}

const DEFAULT_DATA_SCOPE: DataScopeOptionV2 = "MY_TEAMS_RECORDS";

const DefaultView: React.FC<DefaultViewProps> = ({
  sortedGrants,
  currentUserId,
  scope,
  scopeDefaultRole,
  scopeMenuOpen,
  rowMenuFor,
  workspaceLabel,
  dataScopingAvailable,
  dataScopeOwnership,
  hasPersonalIntegration,
  canChangeDataScope,
  canManageEditorGrants,
  isSavingShare,
  onAddPeople,
  onScopeToggle,
  onScopeClose,
  onScopeSelect,
  onRowMenuOpen,
  onRowMenuClose,
  onGrantUpdate,
  onGrantRemove,
  onDataScopeChange,
}) => {
  // Data-scope toggle is meaningful whenever any viewer can see this
  // dashboard — either implicitly via tenant scope, or explicitly via
  // a per-user viewer grant. Gated additionally by `dataScopingAvailable`
  // because row-level scoping only makes sense for sources that support
  // it (Salesforce today).
  const hasViewerGrant = sortedGrants.some((g) => g.role === "viewer");
  const scopeRowApplies =
    (scope === "org_wide" || hasViewerGrant) && dataScopingAvailable;

  return (
    <>
      <AddPeopleTrigger onClick={onAddPeople} />

      {/* Section header — mirrors the "General access" label below
          so the two groups read as parallel sections. */}
      <div className="mb-1.5 mt-3 text-[11.5px] font-medium text-gray-400">
        People with access
      </div>
      {/* People list — scrolls in place when the roster gets long
          (keeps the modal compact regardless of grant count). The
          modal shell itself stays the same fixed width / non-growing
          height; only this strip scrolls. */}
      <div className="flex max-h-[300px] flex-col overflow-y-auto pr-1">
        {sortedGrants.map((p) => {
          const isOpen = rowMenuFor === p.userId;
          const current: GrantableRoleV2 =
            p.role === "owner" ? "viewer" : (p.role as GrantableRoleV2);
          // Row-level capability: editor rows require editor+ caller to
          // touch (add/remove/promote/demote of editor role is editor+).
          // Viewer rows are open to any viewer+ caller.
          const canManageRow =
            p.role !== "owner" &&
            (canManageEditorGrants || p.role === "viewer");
          return (
            <PersonRow
              key={p.userId}
              person={p}
              onRoleClick={
                canManageRow ? () => onRowMenuOpen(p.userId) : undefined
              }
              suffix={
                isOpen && canManageRow ? (
                  <>
                    <RolePill role={p.role} open />
                    <PerRowRoleMenu
                      current={current}
                      options={["editor", "viewer"]}
                      // Viewer caller cannot promote to editor — the editor
                      // option renders as "capped".
                      allowEditor={canManageEditorGrants}
                      onSelect={(next) => onGrantUpdate(p.userId, next)}
                      onRemove={
                        p.userId === currentUserId
                          ? undefined
                          : () => onGrantRemove(p.userId)
                      }
                      onClose={onRowMenuClose}
                    />
                  </>
                ) : !canManageRow && p.role !== "owner" ? (
                  // Viewer caller seeing an editor row — render the pill as a
                  // disabled label so the role stays visible but unclickable.
                  <RolePill role={p.role} disabled />
                ) : undefined
              }
            />
          );
        })}
      </div>

      <div className="my-2.5 h-px bg-gray-100" />
      {/* Scope change is viewer+ — anyone who can open the dialog can flip
          RESTRICTED ↔ TENANT. */}
      <GeneralAccessRow
        scope={scope}
        scopeRole={scopeDefaultRole}
        open={scopeMenuOpen}
        onToggle={onScopeToggle}
        onSelect={onScopeSelect}
        onClose={onScopeClose}
        isLoading={isSavingShare}
        workspaceLabel={workspaceLabel}
      />

      {scopeRowApplies && (
        <ScopeDataByOwnership
          enabled={!!dataScopeOwnership}
          selected={dataScopeOwnership ?? DEFAULT_DATA_SCOPE}
          disabled={!canChangeDataScope}
          onToggle={(next) =>
            onDataScopeChange(
              next ? (dataScopeOwnership ?? DEFAULT_DATA_SCOPE) : null,
            )
          }
          onSelect={(next) => onDataScopeChange(next)}
        />
      )}

      {hasPersonalIntegration && (
        <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] leading-snug text-amber-700">
          <WarningCircleIcon
            size={14}
            weight="regular"
            className="mt-0.5 shrink-0 text-amber-600"
          />
          <span>
            This dashboard uses personal integrations. Anyone you share with
            will be able to see data accessed through them.
          </span>
        </div>
      )}
    </>
  );
};
