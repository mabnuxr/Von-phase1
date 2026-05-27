import { useQuery, type QueryClient } from "@tanstack/react-query";
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

/**
 * Single source of truth for "an edit-action just changed the dashboard's
 * editable state — sync the caches."
 *
 * The edit-action endpoints (`acquire-lock`, `save-draft`, the `ui_config`
 * PATCH) all return the flat `DashboardMetadataResponse`. Rather than discard
 * it and refetch, patch those four state fields onto the cached metadata so
 * `useDashboardQuery` re-keys to the right version (`is_editable ?
 * editable_version : latest_published_version`), then invalidate the render
 * entries so the canvas refetches that version — no follow-up `GET /metadata`.
 * Falls back to a full `detail` refetch when no metadata is cached yet (initial
 * load raced the action), which subsumes the render invalidation via prefix.
 */
export function writeDashboardEditState(
  queryClient: QueryClient,
  dashboardId: string,
  state: Pick<
    DashboardMetadataApiResponse,
    | "is_editable"
    | "editable_version"
    | "latest_published_version"
    | "edit_lock"
  >,
): void {
  const cached = queryClient.getQueryData<DashboardMetadataApiResponse>(
    dashboardMetadataKey(dashboardId),
  );
  if (cached) {
    queryClient.setQueryData<DashboardMetadataApiResponse>(
      dashboardMetadataKey(dashboardId),
      { ...cached, ...state },
    );
    queryClient.invalidateQueries({
      queryKey: [...dashboardKeys.all, dashboardId, "render"],
    });
  } else {
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.detail(dashboardId),
    });
  }
}
