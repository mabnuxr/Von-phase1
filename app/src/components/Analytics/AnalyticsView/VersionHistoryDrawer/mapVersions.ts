import type {
  DashboardVersionEntry,
  DashboardVersionsResponse,
} from "../../../../services/dashboardService";
import type { User } from "../../../../services";
import type { TenantMember } from "../../../../services/tenantMembersService";
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

interface ResolvedAuthor {
  /** Empty string when the row has no attributable author yet. Used as
   *  the avatar-hashing seed and as the sentinel `VersionRow` checks
   *  to suppress the initials chip. */
  id: string;
  name: string;
}

function resolveAuthor(
  entry: DashboardVersionEntry,
  tenantMembers: TenantMember[] | undefined,
  context: VersionAuthorContext,
): ResolvedAuthor {
  const userId = entry.updated_by;
  // Active-draft fallback: BE leaves `updated_by` null on a freshly
  // cloned active draft until the lock holder commits. When that
  // holder is the current viewer, attribute the row to them so it
  // doesn't read as "No edits yet" while they're mid-edit. Otherwise
  // surface "No edits yet" — and signal to `VersionRow` to drop the
  // initials chip — by returning an empty id.
  if (!userId && entry.status === "draft") {
    const { currentUser, editLockUserId } = context;
    if (currentUser && editLockUserId && editLockUserId === currentUser.id) {
      return { id: currentUser.id, name: displayNameForUser(currentUser) };
    }
    return { id: "", name: "No edits yet" };
  }
  if (!userId) return { id: "", name: "" };
  const member = tenantMembers?.find((m) => m.id === userId);
  if (!member) return { id: userId, name: "Unknown" };
  return {
    id: userId,
    name: `${member.firstName} ${member.lastName}`.trim() || member.email,
  };
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
  tenantMembers: TenantMember[] | undefined,
  context: VersionAuthorContext,
): VersionHistoryItem {
  const author = resolveAuthor(entry, tenantMembers, context);
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
    authorId: author.id,
    authorName: author.name,
    changeNote: entry.change_summary,
  };
}

/** Hide the active-draft row when nobody has actually edited it yet
 *  (`updated_by` null) AND the viewer isn't the one in edit mode. The
 *  row would otherwise render "No edits yet" to passive viewers, who
 *  can't act on it — surfacing it adds clutter and reads like a stub.
 *  When the viewer IS the lock holder, the resolver attributes the
 *  row to them, so this filter lets it through. */
function isOrphanActiveDraft(
  entry: DashboardVersionEntry,
  context: VersionAuthorContext,
): boolean {
  if (entry.status !== "draft" || entry.updated_by) return false;
  const { currentUser, editLockUserId } = context;
  const viewerHoldsLock =
    !!currentUser && !!editLockUserId && editLockUserId === currentUser.id;
  return !viewerHoldsLock;
}

/**
 * Map the `GET /versions` response into the drawer's renderable shape.
 * The BE controls the ordering (descending by `dashboard_version`) — we
 * preserve it verbatim.
 */
export function mapVersionsResponse(
  response: DashboardVersionsResponse | undefined,
  tenantMembers: TenantMember[] | undefined,
  context: VersionAuthorContext,
): { drafts: VersionHistoryItem[]; publishedVersions: VersionHistoryItem[] } {
  if (!response) {
    return { drafts: [], publishedVersions: [] };
  }
  return {
    drafts: response.drafts
      .filter((e) => !isOrphanActiveDraft(e, context))
      .map((e) => toItem(e, tenantMembers, context)),
    publishedVersions: response.published.map((e) =>
      toItem(e, tenantMembers, context),
    ),
  };
}
