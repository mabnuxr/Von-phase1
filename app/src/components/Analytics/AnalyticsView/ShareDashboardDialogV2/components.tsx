import { useEffect, useRef } from "react";
import {
  CaretDownIcon,
  CheckIcon,
  LockSimpleIcon,
  BuildingsIcon,
  SpinnerGapIcon,
  XIcon,
} from "@phosphor-icons/react";
import type {
  DashboardRoleV2,
  DashboardScopeV2,
  DataScopeOptionV2,
  GrantableRoleV2,
  ShareDialogPersonV2,
} from "./types";
import { ROLE_LABEL } from "./constants";

// ─── Avatar (no design-component primitive; matches existing inline pattern) ──

const AVATAR_PALETTE = [
  "#6b2fd6",
  "#2a5bff",
  "#f97316",
  "#16a34a",
  "#c53030",
  "#0ea5e9",
  "#7c3aed",
  "#db2777",
];

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1)
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  seed?: string;
  color?: string;
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  seed,
  color,
  size = 32,
  className = "",
}) => {
  const bg = color ?? hashColor(seed ?? name);
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-white font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size <= 22 ? 10.5 : 12,
      }}
    >
      {initials(name)}
    </span>
  );
};

// ─── Role pill ────────────────────────────────────────────────────

interface RolePillProps {
  role: DashboardRoleV2;
  disabled?: boolean;
  hideCaret?: boolean;
  open?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const RolePill: React.FC<RolePillProps> = ({
  role,
  disabled,
  hideCaret,
  open,
  onClick,
}) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-normal transition-colors ${
      disabled
        ? "text-gray-400 cursor-default"
        : open
          ? "text-gray-600 bg-gray-100 cursor-pointer"
          : "text-gray-600 hover:bg-gray-50 cursor-pointer"
    }`}
  >
    <span>{ROLE_LABEL[role]}</span>
    {!disabled && !hideCaret && (
      <CaretDownIcon size={11} className="text-gray-400" />
    )}
  </button>
);

// ─── Per-row role menu (Editor / Read-only / Remove) ─────────────

interface PerRowRoleMenuProps {
  current: GrantableRoleV2;
  options?: GrantableRoleV2[];
  /** When false, "Editor" is rendered as capped (locked) — spec §2.4.1. */
  allowEditor?: boolean;
  onSelect: (next: GrantableRoleV2) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export const PerRowRoleMenu: React.FC<PerRowRoleMenuProps> = ({
  current,
  options = ["editor", "viewer"],
  allowEditor = true,
  onSelect,
  onRemove,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  // Click-outside / Esc to close. The parent renders a single menu at a time,
  // so we don't need to scope to a portal here.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-10 mt-1 min-w-[200px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)]"
    >
      {options.map((opt) => {
        const lockedEditor = opt === "editor" && !allowEditor;
        return (
          <button
            key={opt}
            type="button"
            disabled={lockedEditor}
            onClick={() => {
              if (lockedEditor) return;
              onSelect(opt);
            }}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${
              lockedEditor
                ? "cursor-not-allowed text-gray-400"
                : opt === current
                  ? "bg-gray-100 text-gray-900 cursor-pointer"
                  : "text-gray-800 hover:bg-gray-50 cursor-pointer"
            }`}
          >
            <span className="flex-1">{ROLE_LABEL[opt]}</span>
            {opt === current && (
              <CheckIcon size={12} className="text-gray-900" />
            )}
          </button>
        );
      })}
      {onRemove && (
        <>
          <div className="my-1 h-px bg-gray-100" />
          <button
            type="button"
            onClick={onRemove}
            className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 cursor-pointer"
          >
            Remove access
          </button>
        </>
      )}
    </div>
  );
};

// ─── Person row ───────────────────────────────────────────────────

interface PersonRowProps {
  person: ShareDialogPersonV2;
  /** Optional override for the right side — e.g. open role menu. */
  suffix?: React.ReactNode;
  /** Open the per-row role menu when this row's pill is clicked. */
  onRoleClick?: () => void;
  /** Optional tag pill rendered next to the name (e.g. "Already shared"). */
  tag?: string;
  dim?: boolean;
}

export const PersonRow: React.FC<PersonRowProps> = ({
  person,
  suffix,
  onRoleClick,
  tag,
  dim,
}) => (
  <div
    className={`flex items-center gap-2.5 py-1.5 pr-1 ${dim ? "opacity-60" : ""}`}
  >
    <Avatar
      name={person.name}
      seed={person.userId}
      color={person.colorHex}
      size={32}
    />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5 leading-tight">
        <span className="truncate text-[13px] font-medium text-gray-900">
          {person.name}
          {person.isYou && (
            <span className="font-normal text-gray-400"> (you)</span>
          )}
        </span>
        {tag && (
          <span className="shrink-0 rounded-full bg-purple-50 px-1.5 py-px text-[10px] font-medium text-purple-700">
            {tag}
          </span>
        )}
      </div>
      <div className="mt-0.5 truncate text-[12px] text-gray-400">
        {person.email}
      </div>
    </div>
    <div className="relative">
      {suffix ?? (
        <RolePill
          role={person.role}
          disabled={person.role === "owner"}
          onClick={onRoleClick}
        />
      )}
    </div>
  </div>
);

// ─── General-access row ───────────────────────────────────────────

interface GeneralAccessRowProps {
  scope: DashboardScopeV2;
  scopeRole?: GrantableRoleV2;
  /** When true, the scope dropdown is visible. */
  open?: boolean;
  onToggle?: () => void;
  onSelect?: (scope: DashboardScopeV2) => void;
  onClose?: () => void;
  /** Editor's view greys this out per spec §2.4.2 — but D12 allows editors
   *  to change scope; the BE M2 cut keeps this owner-only. Caller decides. */
  disabled?: boolean;
  /** While the share mutation is in flight, lock interactions and surface
   *  a spinner on the right of the row. */
  isLoading?: boolean;
  workspaceLabel?: string;
}

const SCOPE_OPTIONS: Array<{
  id: DashboardScopeV2;
  label: (workspace: string) => string;
}> = [
  { id: "private", label: () => "Only people invited" },
  { id: "org_wide", label: (workspace) => `Everyone at ${workspace}` },
];

export const GeneralAccessRow: React.FC<GeneralAccessRowProps> = ({
  scope,
  scopeRole = "viewer",
  open,
  onToggle,
  onSelect,
  onClose,
  disabled,
  isLoading,
  workspaceLabel = "your org",
}) => {
  const isOrg = scope === "org_wide";
  const interactionLocked = !!disabled || !!isLoading;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose?.();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div ref={ref}>
      <div className="mb-1.5 mt-1 text-[11.5px] font-medium text-gray-400">
        General access
      </div>
      {/* The row + dropdown share a `relative` parent so the dropdown's
          `top-full` anchors to the row's bottom (not the section header).
          A sibling spacer (rendered when open) reserves modal-body height
          so the dropdown doesn't overlap the footer — same trick the
          design's `minHeight: 200` wrapper uses. */}
      <div className="relative">
        <div
          className={`flex w-full items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2 transition-colors ${
            open ? "bg-gray-50" : "bg-transparent"
          } ${disabled ? "opacity-55 pointer-events-none" : ""}`}
        >
          <button
            type="button"
            onClick={onToggle}
            disabled={interactionLocked}
            className={`flex min-w-0 flex-1 items-center gap-2.5 bg-transparent text-left p-0 ${
              interactionLocked
                ? "cursor-default"
                : "cursor-pointer disabled:cursor-default"
            }`}
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
              {isOrg ? (
                <BuildingsIcon size={16} />
              ) : (
                <LockSimpleIcon size={14} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`flex items-center gap-1 text-[13px] ${
                  isLoading ? "text-gray-500" : "text-gray-900"
                }`}
              >
                <span>
                  {isOrg
                    ? `Everyone at ${workspaceLabel}`
                    : "Only people invited"}
                </span>
                <CaretDownIcon
                  size={11}
                  className={isLoading ? "text-gray-300" : "text-gray-400"}
                />
              </span>
              <span className="mt-0.5 block text-[11.5px] text-gray-400">
                {isOrg
                  ? "Anyone in the workspace can open this."
                  : "Only people you add can open this."}
              </span>
            </span>
          </button>
          {/* Right slot — spinner when the share mutation is in flight,
              otherwise the org-wide role pill (for the tenant scope). */}
          {isLoading ? (
            <span
              role="status"
              aria-label="Saving sharing settings"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-gray-400"
            >
              <SpinnerGapIcon size={14} className="animate-spin" />
            </span>
          ) : (
            isOrg && <RolePill role={scopeRole} hideCaret />
          )}
        </div>

        {open && (
          <div className="absolute left-10 top-full z-10 mt-1 w-[280px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)]">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelect?.(opt.id)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] cursor-pointer ${
                  opt.id === scope
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-800 hover:bg-gray-50"
                }`}
              >
                <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                  {opt.id === "org_wide" ? (
                    <BuildingsIcon size={12} />
                  ) : (
                    <LockSimpleIcon size={11} />
                  )}
                </span>
                <span className="flex-1">{opt.label(workspaceLabel)}</span>
                {opt.id === scope && (
                  <CheckIcon size={12} className="text-gray-900" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Spacer — only rendered while the dropdown is open. Pushes the
          modal footer down by the dropdown's height + a comfortable gap. */}
      {open && <div aria-hidden className="h-[100px]" />}
    </div>
  );
};

// ─── Scope data by ownership (Read-only viewers only) ────────────

const DATA_SCOPE_OPTIONS: Array<{ id: DataScopeOptionV2; label: string }> = [
  { id: "MY_RECORDS", label: "My records" },
  { id: "MY_TEAMS_RECORDS", label: "My team's records" },
  { id: "MY_MANAGERS_TEAM", label: "My manager's team records" },
  { id: "ALL_RECORDS", label: "All records" },
];

const DATA_SCOPE_RANK: Record<DataScopeOptionV2, number> = {
  MY_RECORDS: 0,
  MY_TEAMS_RECORDS: 1,
  MY_MANAGERS_TEAM: 2,
  ALL_RECORDS: 3,
};

interface ScopeDataByOwnershipProps {
  enabled: boolean;
  selected: DataScopeOptionV2;
  onToggle: (enabled: boolean) => void;
  onSelect: (next: DataScopeOptionV2) => void;
  /** When true, the toggle + checklist are read-only (greyed). Surfaced to
   *  viewer callers — changing data scope is editor+ per BE M2 §3.3. */
  disabled?: boolean;
}

export const ScopeDataByOwnership: React.FC<ScopeDataByOwnershipProps> = ({
  enabled,
  selected,
  onToggle,
  onSelect,
  disabled = false,
}) => (
  <div
    className={`mt-2.5 rounded-xl border px-3.5 py-3 ${
      enabled
        ? "border-blue-100 bg-blue-50/40"
        : "border-gray-100 bg-gray-50/60"
    } ${disabled ? "opacity-60" : ""}`}
  >
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-gray-900">
          Scope data by ownership
        </div>
        <div
          className={`mt-0.5 text-[11.5px] leading-snug ${
            enabled ? "text-blue-600" : "text-gray-400"
          }`}
        >
          {disabled
            ? "Only editors and the owner can change the data scope."
            : "Read-only viewers see only data scoped to their ownership."}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={disabled ? undefined : () => onToggle(!enabled)}
        className={`relative ml-3 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          enabled ? "bg-blue-600" : "bg-gray-300"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>

    {enabled && (
      <>
        <div className="my-3 h-px bg-blue-100" />
        <div className="mb-2 text-[11.5px] font-medium text-blue-600">
          Viewers will see
        </div>
        <div className="flex flex-col gap-1.5">
          {DATA_SCOPE_OPTIONS.map((opt) => {
            // Cumulative visualisation: selecting "My team's records" implies
            // "My records" is included, etc. Matches legacy ShareDashboardDialog.
            const included =
              DATA_SCOPE_RANK[opt.id] <= DATA_SCOPE_RANK[selected];
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={
                  disabled
                    ? undefined
                    : () => {
                        if (included && opt.id !== "MY_RECORDS") {
                          const idx = DATA_SCOPE_OPTIONS.findIndex(
                            (o) => o.id === opt.id,
                          );
                          onSelect(DATA_SCOPE_OPTIONS[idx - 1].id);
                        } else {
                          onSelect(opt.id);
                        }
                      }
                }
                className={`flex items-center gap-2.5 rounded-md py-0.5 text-left ${
                  disabled
                    ? "cursor-not-allowed"
                    : "cursor-pointer hover:bg-blue-50/60"
                }`}
              >
                <span
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                    included
                      ? "bg-blue-600 border border-blue-600 text-white"
                      : "border border-gray-300 bg-white text-transparent"
                  }`}
                >
                  <CheckIcon size={10} weight="bold" />
                </span>
                <span
                  className={`text-[13px] ${
                    included ? "font-medium text-gray-900" : "text-gray-500"
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </>
    )}
  </div>
);

// ─── Invite chip (in Add-people view) ─────────────────────────────

interface InviteChipProps {
  name: string;
  seed: string;
  color?: string;
  onRemove?: () => void;
}

export const InviteChip: React.FC<InviteChipProps> = ({
  name,
  seed,
  color,
  onRemove,
}) => (
  <span className="inline-flex max-w-[200px] items-center gap-1.5 rounded-full bg-gray-100 py-0.5 pl-0.5 pr-1 text-[12.5px] text-gray-900">
    <Avatar name={name} seed={seed} color={color} size={20} />
    <span className="truncate">{name}</span>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-transparent text-gray-400 hover:bg-gray-200 cursor-pointer"
      >
        <XIcon size={10} weight="bold" />
      </button>
    )}
  </span>
);
