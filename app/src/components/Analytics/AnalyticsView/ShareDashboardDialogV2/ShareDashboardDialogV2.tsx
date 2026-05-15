import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CaretLeftIcon,
  CopyIcon,
  LinkSimpleIcon,
  QuestionIcon,
  ShareNetworkIcon,
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

interface FooterProps {
  helpHref?: string;
  onCopyLink?: () => Promise<void>;
}

const StandardFooter: React.FC<FooterProps> = ({ helpHref, onCopyLink }) => {
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
      <a
        href={helpHref}
        target={helpHref ? "_blank" : undefined}
        rel="noreferrer"
        className="inline-flex items-center gap-1 px-1 py-1.5 text-[12px] text-gray-400 hover:text-gray-600"
      >
        <QuestionIcon size={13} />
        <span>Learn about sharing</span>
      </a>
      <div className="flex-1" />
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
    <span className="flex-1 text-[13px] text-gray-500">
      Add people, groups, or email
    </span>
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
  /** Actions — caller wires to mutations / mock handlers during the rollout. */
  onScopeChange: (
    scope: DashboardScopeV2,
    scopeDefaultRole: GrantableRoleV2,
  ) => void;
  onGrantAdd: (
    userIds: string[],
    role: GrantableRoleV2,
    dataScope: DataScopeOptionV2 | null,
  ) => Promise<void> | void;
  onGrantUpdate: (userId: string, role: GrantableRoleV2) => void;
  onGrantRemove: (userId: string) => void;
  onDataScopeChange: (next: DataScopeOptionV2 | null) => void;
  onCopyLink?: () => Promise<void>;
  /** Optional ref to a footer "Learn about sharing" link. */
  helpHref?: string;
  /** Pending state surfaced to the Add-people submit button. */
  isAddingPeople?: boolean;
  /** While the unified share mutation is in flight, lock the scope row
   *  (and the org-wide data-scope toggle) and surface a spinner. */
  isSavingShare?: boolean;
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
  onScopeChange,
  onGrantAdd,
  onGrantUpdate,
  onGrantRemove,
  onDataScopeChange,
  onCopyLink,
  helpHref,
  isAddingPeople,
  isSavingShare,
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

  // Reset transient state every time the modal opens — matches existing dialog.
  const handleOpen = useCallback(() => {
    if (!canShare) return;
    setView("default");
    setScopeMenuOpen(false);
    setRowMenuFor(null);
    setOpen(true);
  }, [canShare]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // People list ordering: owner first, then the current user (if
  // they have a grant), then everyone else in the caller's original
  // `grants` order. The remainder is left untouched so it tracks the
  // BE's `user_grants` payload (typically `granted_at` order) — only
  // the two pinned rows float to the top.
  const sortedGrants = useMemo(() => {
    const owner = grants.find((g) => g.role === "owner");
    const youGrant = grants.find((g) => g.isYou && g.role !== "owner");
    const rest = grants.filter(
      (g) => g.role !== "owner" && !(g.isYou && g.role !== "owner"),
    );
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

  const handleAddPeopleSubmit = useCallback(
    async (
      userIds: string[],
      role: GrantableRoleV2,
      dataScope: DataScopeOptionV2 | null,
    ) => {
      await onGrantAdd(userIds, role, dataScope);
      setView("default");
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
              className="fixed left-1/2 top-1/2 z-[9999] w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.16),0_2px_8px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)]"
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
                    dataScopeOwnership={dataScopeOwnership}
                    canChangeDataScope={canChangeDataScope}
                    canManageEditorGrants={canManageEditorGrants}
                    isSavingShare={isSavingShare}
                    onAddPeople={() => setView("addPeople")}
                    onScopeToggle={() => setScopeMenuOpen((v) => !v)}
                    onScopeClose={() => setScopeMenuOpen(false)}
                    onScopeSelect={(next) => {
                      setScopeMenuOpen(false);
                      onScopeChange(next, scopeDefaultRole);
                    }}
                    onRowMenuOpen={(userId) => setRowMenuFor(userId)}
                    onRowMenuClose={() => setRowMenuFor(null)}
                    onGrantUpdate={(userId, role) => {
                      setRowMenuFor(null);
                      onGrantUpdate(userId, role);
                    }}
                    onGrantRemove={(userId) => {
                      setRowMenuFor(null);
                      onGrantRemove(userId);
                    }}
                    onDataScopeChange={onDataScopeChange}
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
                  />
                )}
              </div>

              {/* Footer — only on the default view; AddPeopleView renders its
                  own Send/Cancel pair scoped to the batch submit. */}
              {view === "default" && (
                <div className="flex items-center gap-2 px-[18px] pb-3 pt-2.5">
                  <StandardFooter helpHref={helpHref} onCopyLink={onCopyLink} />
                </div>
              )}
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
    </>
  );
};
