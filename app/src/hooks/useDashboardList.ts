import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import type { DashboardListResponse } from "../services/dashboardService";
import {
  DASHBOARD_LIST_PAGE_SIZE,
  DASHBOARD_LIST_STALE_TIME,
} from "../config/constants";

export const dashboardListKeys = {
  all: ["dashboardList"] as const,
  list: (status: string, limit: number) =>
    [...dashboardListKeys.all, status, limit] as const,
};

/**
 * Hook to fetch a list of dashboards for @ mention references.
 *
 * The query only fires when `enabled` is true — typically set when the
 * user first types "@". Once fetched, React Query caches the result.
 */
export function useDashboardList(
  enabled: boolean = true,
  status: string = "published",
  limit: number = DASHBOARD_LIST_PAGE_SIZE,
) {
  return useQuery<DashboardListResponse>({
    queryKey: dashboardListKeys.list(status, limit),
    queryFn: () => dashboardService.getDashboards(status, 1, limit),
    staleTime: DASHBOARD_LIST_STALE_TIME,
    enabled,
  });
}
