import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  dashboardService,
  type DashboardUpdateRequest,
} from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";
import { useToast } from "./useToast";

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
  });

  const handleUpdate = useCallback(
    (data: DashboardUpdateRequest) => {
      updateMutation.mutate(data, {
        onError: (error) => {
          console.error("[useDashboardUpdate] Update failed:", error);
          showToast({
            message: "Failed to update dashboard. Please try again.",
            variant: "error",
          });
        },
      });
    },
    [updateMutation, showToast],
  );

  return { handleUpdate, updateMutation };
}
