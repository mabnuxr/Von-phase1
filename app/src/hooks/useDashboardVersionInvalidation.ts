import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "./useDashboardQuery";
import type { DashboardMetadata } from "../types/conversation";

/**
 * Invalidates the React Query cache for a dashboard when dashboard is present in result
 * (e.g. agent updated the dashboard during a run).
 *
 * Works in both contexts:
 * - Chat page with dashboard preview pane (activeDashboardId = pane's dashboardId)
 * - Dashboard page with chat sidebar (activeDashboardId = page's dashboardId)
 */
export function useDashboardVersionInvalidation({
  dashboard,
  activeDashboardId,
}: {
  dashboard: DashboardMetadata | null;
  activeDashboardId: string | null | undefined;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (dashboard && activeDashboardId === dashboard.dashboard_id) {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboard.dashboard_id),
      });
    }
  }, [dashboard, activeDashboardId, queryClient]);
}
