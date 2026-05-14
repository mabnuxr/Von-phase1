/**
 * Types for the version-history right-side drawer (VON-1282).
 *
 * The drawer surfaces both tabs of the dashboard's history:
 *   - Current draft : the active draft + every `draft_saved` snapshot.
 *   - Publish history : the published lineage (live + archived).
 *
 * Until the FE wires `GET /api/v1/dashboards/{id}/versions`, items are
 * fed via placeholder data from the caller.
 */

export type VersionHistoryTab = "current" | "published";

export type VersionEntryKind =
  | "active_draft" // The live mutable working slot (head of current-draft list).
  | "draft_saved" // Frozen `draft_saved` history row.
  | "published" // A published version.
  | "last_published"; // The latest published version, when rendered in
// the current-draft tab as the lineage base.

export interface VersionHistoryItem {
  /** Server version id (e.g. dashboard_version + status discriminator). */
  id: string;
  /** Short label rendered in the row chip — "v3", "v3.2", "Last published". */
  versionLabel: string;
  /** ISO datetime — drives the formatted "Today, 2:14 PM" line. */
  timestamp: string;
  /** Stable category for badges + row labels. */
  kind: VersionEntryKind;
  /** User who created / saved / published this entry. */
  authorId: string;
  authorName: string;
  authorColor?: string;
  /**
   * Free-text change note attached to this entry. When empty / null /
   * undefined the row omits the note element entirely.
   */
  changeNote?: string | null;
  /**
   * When this version was created via Restore, points at the source
   * timestamp — used for the "Restored from …" label. Null otherwise.
   */
  restoredFromTimestamp?: string | null;
}
