import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  list: (status: string, page: number, limit: number) =>
    [...sidebarDashboardKeys.all, status, page, limit] as const,
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
    lastEdited: item.updated_at,
  };
}

/**
 * Hook to fetch dashboards for the sidebar with "show more" pagination.
 *
 * Fetches draft + published dashboards with a page size of 5.
 * Supports "show more" by incrementing pages and accumulating results.
 */
export function useSidebarDashboards() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const status = "draft,published";
  const limit = SIDEBAR_DASHBOARD_PAGE_SIZE;

  // Fetch current page
  const { data, isLoading } = useQuery<DashboardListResponse>({
    queryKey: sidebarDashboardKeys.list(status, page, limit),
    queryFn: () => dashboardService.getDashboards(status, page, limit),
    staleTime: DASHBOARD_LIST_STALE_TIME,
  });

  // Accumulate all pages' data by reading from cache
  const allDashboards = useMemo(() => {
    const items: DashboardListItem[] = [];
    for (let p = 1; p <= page; p++) {
      const pageData = queryClient.getQueryData<DashboardListResponse>(
        sidebarDashboardKeys.list(status, p, limit),
      );
      if (pageData?.data) {
        items.push(...pageData.data);
      }
    }
    return items;
  }, [queryClient, page, status, limit, data]);

  const dashboards: DashboardSidebarItem[] = useMemo(
    () => allDashboards.map(toDashboardSidebarItem),
    [allDashboards],
  );

  const hasNextPage = data?.pagination?.has_next_page ?? false;

  const loadMore = useCallback(() => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  return {
    dashboards,
    isLoading,
    hasNextPage,
    loadMore,
  };
}
