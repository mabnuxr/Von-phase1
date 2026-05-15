import { useQuery } from "@tanstack/react-query";
import {
  dashboardService,
  type DashboardMetadataApiResponse,
} from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";

/**
 * Query key for the sharing-focused metadata payload. Nested under
 * `dashboardKeys.detail(id)` so invalidating the dashboard cascades
 * into the metadata cache too (e.g., after a share mutation when we
 * want the open dialog to see authoritative `granted_by` / `granted_at`
 * stamps).
 */
export const dashboardMetadataKey = (dashboardId: string) =>
  [...dashboardKeys.detail(dashboardId), "metadata"] as const;

/**
 * Fetch `GET /api/v1/dashboards/{id}/metadata` (BE M2 — VON-1283).
 *
 * Two callers, two policies:
 *
 *   - **Dashboard load** (`useDashboardQuery`): default settings. Cached
 *     for 60s so remounts during the same view don't burn round-trips.
 *     `editable_version` / `latest_published_version` here drive which
 *     snapshot the render call asks for.
 *
 *   - **Share dialog** (`forceFresh: true`): `staleTime: 0` +
 *     `refetchOnMount: 'always'` so every open re-reads authoritative
 *     sharing state — a collaborator's grant changes in another tab
 *     don't show up as stale here.
 */
export function useDashboardMetadata(
  dashboardId: string | undefined,
  options: { enabled?: boolean; forceFresh?: boolean } = {},
) {
  const forceFresh = options.forceFresh === true;
  return useQuery<DashboardMetadataApiResponse>({
    queryKey: dashboardId
      ? dashboardMetadataKey(dashboardId)
      : ["dashboards", "metadata", "loading"],
    queryFn: () => dashboardService.getDashboardMetadata(dashboardId!),
    enabled: !!dashboardId && options.enabled !== false,
    staleTime: forceFresh ? 0 : 60_000,
    refetchOnMount: forceFresh ? "always" : true,
    refetchOnWindowFocus: false,
  });
}
