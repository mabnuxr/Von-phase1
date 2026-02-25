import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { applyWidgetTheme } from "../utils/applyWidgetTheme";
import type { Dashboard, RefreshInfo } from "../types/dashboard";

/**
 * Query keys for dashboard data.
 */
export const dashboardKeys = {
  all: ["dashboards"] as const,
  detail: (id: string) => [...dashboardKeys.all, id] as const,
};

interface DashboardQueryData {
  dashboard: Dashboard;
  refreshInfo: RefreshInfo;
  activeFilters: Record<string, unknown>;
}

/**
 * Fetch and transform a single dashboard by ID.
 * Uses `select` to apply widget theme and extract default filters.
 */
export function useDashboardQuery(dashboardId: string | undefined) {
  return useQuery<DashboardQueryData>({
    queryKey: dashboardKeys.detail(dashboardId!),
    queryFn: async () => {
      const response = await dashboardService.getDashboard(dashboardId!);

      if (!response.success) {
        throw new Error(response.error?.message ?? "Failed to load dashboard");
      }

      const { dashboard, refreshInfo } = response.data;

      // Inject frontend color palette into widget configs
      dashboard.widgets = applyWidgetTheme(
        dashboard.widgets,
      ) as typeof dashboard.widgets;

      // Extract default filter values
      const activeFilters: Record<string, unknown> = {};
      dashboard.filters?.forEach((filter) => {
        if (filter.defaultValue !== undefined) {
          activeFilters[filter.id] = filter.defaultValue;
        }
      });

      return { dashboard, refreshInfo, activeFilters };
    },
    enabled: !!dashboardId,
  });
}

/**
 * Trigger a dashboard refresh and invalidate the cache to refetch.
 */
export function useRefreshDashboardMutation(dashboardId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dashboardService.triggerRefresh(dashboardId!),
    onSuccess: () => {
      if (dashboardId) {
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.detail(dashboardId),
        });
      }
    },
  });
}
