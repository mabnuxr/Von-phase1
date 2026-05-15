import { useEffect, useMemo, useState } from "react";
import { Tooltip, formatRelativeTime } from "@vonlabs/design-components";
import type { DashboardEditLock } from "../../../types/dashboard";
import type { TeamMember } from "../../../services/teamService";

// ─── Avatar helpers ───────────────────────────────────────────────
// Same palette + hash used elsewhere in the dashboard surface (share
// dialog, version-history rows) so a given user reads as a consistent
// color across every chip.

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

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function resolveDisplayName(
  userId: string,
  teamMembers: TeamMember[] | undefined,
): string | null {
  const member = teamMembers?.find((m) => m.id === userId);
  if (!member) return null;
  const full = `${member.firstName} ${member.lastName}`.trim();
  return full || member.email;
}

// ─── Component ────────────────────────────────────────────────────

interface EditLockBadgeProps {
  editLock: DashboardEditLock;
  currentUserId: string | undefined;
  teamMembers: TeamMember[] | undefined;
  /**
   * User ID of the last meaningful editor (commit / publish / discard
   * — BE PR #1109). Drives the chip's label and avatar. `null` on
   * dashboards that pre-date the deploy with no lifecycle event since;
   * the chip falls back to the lock holder in that case so something
   * coherent still renders.
   */
  lastEditedBy?: string | null;
  /**
   * Optional click handler. The design treats the chip as an entry
   * point into the version-history panel, so the caller wires this
   * to the panel's open action. When omitted, the chip still renders
   * but is not interactive.
   */
  onClick?: () => void;
}

/**
 * Compact "Edited by …" chip rendered next to the dashboard title
 * while an edit session is active (BE M1). Surfaces the latest
 * meaningful editor — the user who last committed, published, or
 * discarded — not the current lock holder. The two can drift: a
 * caller who just acquired the lock but hasn't committed yet still
 * sees the prior editor's name here, which keeps attribution honest
 * until their first commit.
 *
 * Whole chip is a button when `onClick` is wired — clicking opens
 * the version-history side-panel so the user can browse historical
 * versions starting from the current editor.
 */
export const EditLockBadge: React.FC<EditLockBadgeProps> = ({
  editLock,
  currentUserId,
  teamMembers,
  lastEditedBy = null,
  onClick,
}) => {
  // Tick once a minute so the "1m ago" timestamp stays fresh without
  // re-rendering the entire dashboard.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Pick the user id the chip should attribute the edit to.
  // Preference: explicit `last_edited_by` → fall back to the lock
  // holder so pre-PR-#1109 dashboards still show something coherent.
  const attributedUserId = lastEditedBy ?? editLock.userId;
  const isSelf = !!currentUserId && attributedUserId === currentUserId;

  const resolvedName = useMemo(
    () => resolveDisplayName(attributedUserId, teamMembers),
    [attributedUserId, teamMembers],
  );
  const displayName = isSelf ? "You" : (resolvedName ?? "another editor");
  // Avatar reads the resolved name for initials but always hashes
  // colour off the user id so it stays stable across name changes.
  const avatarName = isSelf
    ? (resolvedName ?? "You")
    : (resolvedName ?? attributedUserId);
  const avatarColor = hashColor(attributedUserId);

  const relativeTime = formatRelativeTime(editLock.acquiredAt);
  const label = `Edited by ${displayName}`;
  const tooltip = isSelf
    ? "You made the last edit. Click to open version history."
    : `${displayName} made the last edit. Click to open version history.`;

  const chipClasses =
    "inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white pl-0.5 pr-2 py-0.5 whitespace-nowrap shrink-0";

  const content = (
    <>
      <span
        aria-hidden
        className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{ background: avatarColor }}
      >
        {initialsOf(avatarName)}
      </span>
      <span className="text-[12.5px] font-medium text-gray-900">{label}</span>
      <span className="text-[12px] text-gray-400">· {relativeTime}</span>
    </>
  );

  return (
    <Tooltip content={tooltip}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={`${label}. ${tooltip}`}
          className={`${chipClasses} cursor-pointer transition-colors hover:bg-gray-50`}
        >
          {content}
        </button>
      ) : (
        <span
          role="status"
          aria-label={`${label} · ${relativeTime}`}
          className={chipClasses}
        >
          {content}
        </span>
      )}
    </Tooltip>
  );
};
