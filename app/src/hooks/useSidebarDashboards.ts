import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import type {
  DashboardListItem,
  DashboardListResponse,
} from "../services/dashboardService";
import type { DashboardSidebarItem } from "@vonlabs/design-components";
import {
  SIDEBAR_DASHBOARD_PAGE_SIZE,
  DASHBOARD_LIST_STALE_TIME,
} from "../config/constants";

export const sidebarDashboardKeys = {
  all: ["sidebarDashboards"] as const,
  list: (status: string, limit: number) =>
    [...sidebarDashboardKeys.all, status, limit] as const,
};

/**
 * Transform a DashboardListItem from the API into a DashboardSidebarItem
 * for the sidebar component.
 */
function toDashboardSidebarItem(item: DashboardListItem): DashboardSidebarItem {
  return {
    id: item.dashboard_id,
    label: item.dashboard_name,
    state: item.status === "published" ? "published" : "draft",
    visibility: item.is_shared_with_tenant ? "org" : "private",
    isPinned: false,
    isOwner: item.is_owner,
    lastEdited: item.updated_at,
  };
}

const STATUS = "published";

/**
 * Hook to fetch dashboards for the sidebar with "show more" pagination.
 *
 * Uses `useInfiniteQuery` so that:
 * - Pages are fetched sequentially (no skipping).
 * - All page data is subscribed — refetches of earlier pages trigger re-renders.
 * - `fetchNextPage` is a no-op while a fetch is in flight (built-in guard).
 */
export function useSidebarDashboards() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery<DashboardListResponse>({
      queryKey: sidebarDashboardKeys.list(STATUS, SIDEBAR_DASHBOARD_PAGE_SIZE),
      queryFn: ({ pageParam }) =>
        dashboardService.getDashboards(
          STATUS,
          pageParam as number,
          SIDEBAR_DASHBOARD_PAGE_SIZE,
        ),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasNextPage
          ? lastPage.pagination.page + 1
          : undefined,
      staleTime: DASHBOARD_LIST_STALE_TIME,
    });

  const dashboards: DashboardSidebarItem[] = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data.map(toDashboardSidebarItem));
  }, [data]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    dashboards,
    isLoading,
    hasNextPage: hasNextPage ?? false,
    loadMore,
  };
}
