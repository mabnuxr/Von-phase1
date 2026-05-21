import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";

/**
 * Restore a historical dashboard version as a new active draft.
 *
 * The caller is expected to handle the 409 error codes
 * (`APP_DASHBOARD_LOCK_HELD_BY_OTHER`, `APP_DASHBOARD_LOCK_REQUIRED`) by
 * surfacing the EditLockModal — restore is only valid while the caller
 * already holds the dashboard's edit lock.
 *
 * On success we invalidate the dashboard detail (which cascades into the
 * versions list and every cached render entry) so the canvas re-renders
 * the freshly-created active draft straight from metadata's
 * `editable_version`.
 */
export function useRestoreDashboardVersion(dashboardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) =>
      dashboardService.restoreVersion(dashboardId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
      queryClient.invalidateQueries({
        queryKey: [...dashboardKeys.all, dashboardId, "render"],
      });
    },
  });
}
