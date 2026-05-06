import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";
import { dashboardListKeys } from "./useDashboardList";
import { folderKeys } from "./folders";
import { useToast } from "./useToast";

/**
 * Hook for renaming dashboards from the sidebar.
 * Unlike useDashboardUpdate (which is scoped to a single dashboard),
 * this returns a callback that accepts any dashboard ID.
 */
export function useSidebarDashboardRename() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const mutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      dashboardService.updateDashboard(id, { dashboard_name: name }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: dashboardListKeys.all,
      });
      // Dashboard label appears in the unfiled list AND inside any folder's
      // contents — invalidate both so the rename surfaces everywhere.
      queryClient.invalidateQueries({
        queryKey: folderKeys.unfiled("dashboard"),
      });
      queryClient.invalidateQueries({
        queryKey: [...folderKeys.all, "contents"],
      });
    },
    onError: (error: unknown) => {
      console.error("[useSidebarDashboardRename] Rename failed:", error);
      showToast({
        message: "Failed to rename dashboard. Please try again.",
        variant: "error",
      });
    },
  });

  const renameDashboard = useCallback(
    (id: string, newName: string) => {
      mutation.mutate({ id, name: newName });
    },
    [mutation],
  );

  return renameDashboard;
}
