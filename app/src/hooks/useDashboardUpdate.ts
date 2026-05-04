import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  dashboardService,
  type DashboardUpdateRequest,
} from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";
import { dashboardListKeys } from "./useDashboardList";
import { folderKeys } from "./folders";
import { useToast } from "./useToast";
import { useDebouncedFn } from "./useDebouncedFn";

/**
 * Generic hook for updating dashboard metadata / ui_config via PATCH.
 * Used by parent components (Analytics page, DashboardPreviewPane) and
 * designed to support future updates (name, description, etc.).
 */
export function useDashboardUpdate(dashboardId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (data: DashboardUpdateRequest) =>
      dashboardService.updateDashboard(dashboardId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
      // Invalidate sidebar/list caches when the name changes — both the
      // top-level unfiled list and any folder contents that may hold this
      // dashboard need to repaint with the new name.
      if (variables.dashboard_name) {
        queryClient.invalidateQueries({ queryKey: dashboardListKeys.all });
        queryClient.invalidateQueries({
          queryKey: folderKeys.unfiled("dashboard"),
        });
        queryClient.invalidateQueries({
          queryKey: [...folderKeys.all, "contents"],
        });
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
  });

  const handleUpdate = useDebouncedFn((data: DashboardUpdateRequest) => {
    updateMutation.mutate(data, {
      onError: (error: unknown) => {
        console.error("[useDashboardUpdate] Update failed:", error);
        showToast({
          message: "Failed to update dashboard. Please try again.",
          variant: "error",
        });
      },
    });
  }, 400);

  return { handleUpdate, updateMutation };
}
