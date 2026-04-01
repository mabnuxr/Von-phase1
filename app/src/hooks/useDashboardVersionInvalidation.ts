import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "./useDashboardQuery";
import type { DashboardMetadata } from "../types/conversation";

/**
 * Invalidates the React Query cache for a dashboard when its version changes
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
  const prevVersionRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      dashboard &&
      activeDashboardId === dashboard.dashboard_id &&
      prevVersionRef.current !== null &&
      dashboard.dashboard_version !== prevVersionRef.current
    ) {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboard.dashboard_id),
      });
    }
    if (dashboard) {
      prevVersionRef.current = dashboard.dashboard_version;
    }
  }, [dashboard, activeDashboardId, queryClient]);
}
