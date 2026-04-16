import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "./useDashboardQuery";
import { findLast } from "../utils/findLast";
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
  dashboards,
  activeDashboardId,
}: {
  dashboards: DashboardMetadata[];
  activeDashboardId: string | null | undefined;
}) {
  const queryClient = useQueryClient();

  // Derive a stable key for the matching dashboard so the effect only fires
  // when a NEW version of the active dashboard appears, not on every array mutation.
  const matchKey = useMemo(() => {
    if (!activeDashboardId) return null;
    const match = findLast(
      dashboards,
      (d) => d.dashboard_id === activeDashboardId,
    );
    return match ? `${match.dashboard_id}:${match.dashboard_version}` : null;
  }, [dashboards, activeDashboardId]);

  useEffect(() => {
    if (matchKey) {
      const dashboardId = matchKey.split(":")[0];
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    }
  }, [matchKey, queryClient]);
}
