// Types for the v2 dashboard share modal (VON-1147).
//
// Two layers, per spec §2.1:
//   1. User-facing  — Scopes + Access Levels (this file).
//   2. Resolution   — backend-side; FE only consumes the resolved `accessLevel`
//                     and the list of explicit grants.
//
// Scope vocabulary chosen for UI clarity:
//   - "private"  → owner + explicit grants only        (BE: scope="restricted")
//   - "org_wide" → everyone in the tenant gets default (BE: scope="tenant")
//
// Role vocabulary chosen to match BE M2 (`viewer | editor | owner`).
// The legacy "reader" label from the design wireframe maps to "viewer".

export type DashboardScopeV2 = "private" | "org_wide";

export type DashboardRoleV2 = "owner" | "editor" | "viewer";

/**
 * The level a grant or scope-default can be set to.
 * Owner level is reachable only via the ownership-transfer flow (out of M1).
 */
export type GrantableRoleV2 = Exclude<DashboardRoleV2, "owner">;

/**
 * Ownership-based data scope applied to viewers when the dashboard is shared
 * org-wide (or to viewer-grants on a private dashboard). Mirrors the legacy
 * `sharedDataScope` field on the Dashboard type so the v2 modal can wire to
 * the existing PATCH `/share` endpoint until M2 ships dedicated endpoints.
 */
export type DataScopeOptionV2 =
  | "MY_RECORDS"
  | "MY_TEAMS_RECORDS"
  | "MY_MANAGERS_TEAM"
  | "ALL_RECORDS";

/**
 * Person rendered in the modal's people list. The owner appears with role
 * "owner"; everyone else carries an explicit grant.
 */
export interface ShareDialogPersonV2 {
  userId: string;
  name: string;
  email: string;
  role: DashboardRoleV2;
  /** True when this row represents the currently-signed-in viewer. */
  isYou?: boolean;
  /** Avatar accent — falls back to a deterministic hash of `userId`. */
  colorHex?: string;
}

/**
 * Suggested candidate from the tenant directory used to populate the
 * Add-people search dropdown. Maps from `TeamMember` (services/teamService).
 */
export interface DirectoryPersonV2 {
  userId: string;
  name: string;
  email: string;
  colorHex?: string;
}
