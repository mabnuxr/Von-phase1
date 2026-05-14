import type { DashboardRoleV2 } from "./types";

/**
 * Single source of truth for role labels rendered across the modal.
 * "viewer" maps to the user-facing "Read-only" label per spec §2.2.2.
 */
export const ROLE_LABEL: Record<DashboardRoleV2, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Read-only",
};
