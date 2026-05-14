import { useQuery } from "@tanstack/react-query";
import {
  dashboardService,
  type DashboardVersionsResponse,
} from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";

/**
 * Query key for the dashboard versions list. Nested under
 * `dashboardKeys.detail(id)` so invalidating the dashboard cascades into
 * the versions cache — Save Draft / Publish / Discard / Restore mutations
 * just need to invalidate the detail key once and both refetch.
 */
export const dashboardVersionsKey = (dashboardId: string) =>
  [...dashboardKeys.detail(dashboardId), "versions"] as const;

/**
 * Fetch `GET /api/v1/dashboards/{id}/versions` (M1 — VON-1282).
 *
 * The query is gated by `enabled` so the request only fires when the
 * version-history drawer is open. Stale time matches the dashboard
 * detail (30s) — version lists don't churn often, and explicit
 * invalidations after draft-lifecycle mutations keep it fresh.
 */
export function useDashboardVersions(
  dashboardId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery<DashboardVersionsResponse>({
    queryKey: dashboardId
      ? dashboardVersionsKey(dashboardId)
      : ["dashboards", "versions", "loading"],
    queryFn: () => dashboardService.getVersions(dashboardId!),
    enabled: !!dashboardId && options.enabled !== false,
    staleTime: 30_000,
  });
}
