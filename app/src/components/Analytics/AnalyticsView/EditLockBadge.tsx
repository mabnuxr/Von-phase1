import { useEffect, useMemo, useState } from "react";
import { LockSimpleIcon } from "@phosphor-icons/react";
import { Tooltip, formatRelativeTime } from "@vonlabs/design-components";
import type { DashboardEditLock } from "../../../types/dashboard";
import type { TeamMember } from "../../../services/teamService";

interface EditLockBadgeProps {
  editLock: DashboardEditLock;
  currentUserId: string | undefined;
  teamMembers: TeamMember[] | undefined;
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

/**
 * Compact badge that surfaces the dashboard's current edit-lock holder
 * (M1 — VON-1281). Drives the "currently edited by X" affordance off the
 * embedded `edit_lock` on the dashboard response — no separate `GET /lock`
 * round-trip needed.
 *
 * Lives next to the dashboard title. When the caller holds the lock, the
 * copy shifts to "You're editing" to clarify it's not a foreign lock.
 */
export const EditLockBadge: React.FC<EditLockBadgeProps> = ({
  editLock,
  currentUserId,
  teamMembers,
}) => {
  // Tick once a minute so the "editing for 2m" timestamp stays fresh
  // without re-rendering the whole dashboard.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const isSelf = !!currentUserId && currentUserId === editLock.userId;
  const displayName = useMemo(
    () => resolveDisplayName(editLock.userId, teamMembers),
    [editLock.userId, teamMembers],
  );
  const firstName = displayName?.split(" ")[0] ?? "Someone";
  const relativeTime = formatRelativeTime(editLock.acquiredAt);

  const label = isSelf ? "You're editing" : `${firstName} is editing`;
  const tooltip = isSelf
    ? `You've held the edit lock since ${relativeTime}. Save Draft, Discard, or Publish releases it.`
    : `${displayName ?? "Another editor"} has held the edit lock since ${relativeTime}.`;

  return (
    <Tooltip content={tooltip}>
      <span
        role="status"
        aria-label={tooltip}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium whitespace-nowrap shrink-0 ${
          isSelf
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <LockSimpleIcon size={11} weight="fill" />
        <span>{label}</span>
        <span className="opacity-70">· {relativeTime}</span>
      </span>
    </Tooltip>
  );
};
