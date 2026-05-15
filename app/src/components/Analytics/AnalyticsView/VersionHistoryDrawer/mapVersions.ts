import type {
  DashboardVersionEntry,
  DashboardVersionsResponse,
} from "../../../../services/dashboardService";
import type { TeamMember } from "../../../../services/teamService";
import type { VersionEntryKind, VersionHistoryItem } from "./types";

function resolveAuthorName(
  userId: string | null,
  teamMembers: TeamMember[] | undefined,
): string {
  if (!userId) return "Unknown";
  const member = teamMembers?.find((m) => m.id === userId);
  if (!member) return userId;
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
    authorName: resolveAuthorName(entry.updated_by, teamMembers),
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
): { drafts: VersionHistoryItem[]; publishedVersions: VersionHistoryItem[] } {
  if (!response) {
    return { drafts: [], publishedVersions: [] };
  }
  return {
    drafts: response.drafts.map((e) => toItem(e, teamMembers)),
    publishedVersions: response.published.map((e) => toItem(e, teamMembers)),
  };
}
