import type {
  DashboardVersionEntry,
  DashboardVersionsResponse,
} from "../../../../services/dashboardService";
import type { User } from "../../../../services";
import type { TeamMember } from "../../../../services/teamService";
import type { VersionEntryKind, VersionHistoryItem } from "./types";

/** Context the row-mapper needs to attribute the freshly-cloned
 *  active draft to the user who's currently holding the lock. The BE
 *  leaves `updated_by` null until that user actually commits, so
 *  without this hint the row reads as "Unknown" while they're still
 *  editing. */
export interface VersionAuthorContext {
  currentUser: User | null;
  editLockUserId: string | null;
}

function displayNameForUser(user: User): string {
  const full = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return full || user.name || user.email;
}

function resolveAuthorName(
  entry: DashboardVersionEntry,
  teamMembers: TeamMember[] | undefined,
  context: VersionAuthorContext,
): string {
  const userId = entry.updated_by;
  // Active-draft fallback: BE leaves `updated_by` null on a freshly
  // cloned active draft until the lock holder commits. When that
  // holder is the current viewer, swap in their name so the row
  // doesn't read as "Unknown" mid-edit.
  if (!userId && entry.status === "draft") {
    const { currentUser, editLockUserId } = context;
    if (currentUser && editLockUserId && editLockUserId === currentUser.id) {
      return displayNameForUser(currentUser);
    }
    return "";
  }
  if (!userId) return "";
  const member = teamMembers?.find((m) => m.id === userId);
  if (!member) return "Unknown";
  return `${member.firstName} ${member.lastName}`.trim() || member.email;
}

function statusToKind(
  status: DashboardVersionEntry["status"],
): VersionEntryKind {
  if (status === "draft") return "active_draft";
  if (status === "draft_saved") return "draft_saved";
  return "published";
}

function versionLabel(entry: DashboardVersionEntry): string {
  if (entry.status === "draft") return "Active draft";
  if (entry.status === "draft_saved") {
    const base = entry.published_version ?? "";
    const seq = entry.draft_save_seq ?? "";
    return base !== "" && seq !== "" ? `v${base}.${seq}` : "Draft";
  }
  return entry.published_version != null ? `v${entry.published_version}` : "v?";
}

function toItem(
  entry: DashboardVersionEntry,
  teamMembers: TeamMember[] | undefined,
  context: VersionAuthorContext,
): VersionHistoryItem {
  return {
    id: entry.id,
    dashboardVersion: entry.dashboard_version,
    versionLabel: versionLabel(entry),
    // `updated_at` is nominally nullable for pre-migration edge cases.
    // Pass through as null and let `VersionRow` render a "Date unknown"
    // placeholder — a synthesized epoch would render as `Jan 1, 1970` and
    // look like a UI bug.
    timestamp: entry.updated_at,
    kind: statusToKind(entry.status),
    authorId: entry.updated_by ?? "",
    authorName: resolveAuthorName(entry, teamMembers, context),
    changeNote: entry.change_summary,
  };
}

/**
 * Map the `GET /versions` response into the drawer's renderable shape.
 * The BE controls the ordering (descending by `dashboard_version`) — we
 * preserve it verbatim.
 */
export function mapVersionsResponse(
  response: DashboardVersionsResponse | undefined,
  teamMembers: TeamMember[] | undefined,
  context: VersionAuthorContext,
): { drafts: VersionHistoryItem[]; publishedVersions: VersionHistoryItem[] } {
  if (!response) {
    return { drafts: [], publishedVersions: [] };
  }
  return {
    drafts: response.drafts.map((e) => toItem(e, teamMembers, context)),
    publishedVersions: response.published.map((e) =>
      toItem(e, teamMembers, context),
    ),
  };
}
