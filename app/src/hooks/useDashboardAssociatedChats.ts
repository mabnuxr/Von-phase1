import { useQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import type { DashboardAssociatedChatsResponse } from "../types/dashboardAssociatedChats";
import { CONVERSATIONS_STALE_TIME } from "../config/constants";

/**
 * Query keys for dashboard-associated chats.
 * Per-dashboard so switching dashboards auto-refetches.
 */
export const dashboardAssociatedChatsKeys = {
  all: ["dashboardAssociatedChats"] as const,
  byDashboard: (dashboardId: string) =>
    [...dashboardAssociatedChatsKeys.all, dashboardId] as const,
};

/**
 * Fetch chats associated with the given dashboard. Pass a falsy dashboardId
 * (or enabled=false) to skip the fetch (e.g. when no dashboard is active).
 */
export function useDashboardAssociatedChats(
  dashboardId: string | null | undefined,
  enabled: boolean = true,
) {
  return useQuery<DashboardAssociatedChatsResponse>({
    queryKey: dashboardAssociatedChatsKeys.byDashboard(dashboardId ?? ""),
    queryFn: () =>
      conversationsService.getDashboardAssociatedChats(dashboardId as string),
    staleTime: CONVERSATIONS_STALE_TIME,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: enabled && Boolean(dashboardId),
  });
}
