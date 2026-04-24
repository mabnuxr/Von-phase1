import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";
import { dashboardListKeys } from "./useDashboardList";
import { sidebarDashboardKeys } from "./useSidebarDashboards";
import { useToast } from "./useToast";

/**
 * Hook for deleting dashboards from the sidebar.
 * Returns a callback that accepts a dashboard ID and triggers the delete mutation.
 */
export function useSidebarDashboardDelete(
  onSuccess?: (deletedId: string) => void,
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: (id: string) => dashboardService.deleteDashboard(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: dashboardListKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: sidebarDashboardKeys.all,
      });
      showToast({
        message: "Dashboard deleted",
        variant: "success",
      });
      onSuccess?.(id);
    },
    onError: (error: unknown) => {
      console.error("[useSidebarDashboardDelete] Delete failed:", error);
      showToast({
        message: "Failed to delete dashboard. Please try again.",
        variant: "error",
      });
    },
  });

  const deleteDashboard = useCallback(
    (id: string) => {
      mutation.mutate(id);
    },
    [mutation],
  );

  return deleteDashboard;
}
