import { useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";
import { sidebarDashboardKeys } from "./useSidebarDashboards";
import { useMutationPhase } from "./useMutationPhase";
import { useToast } from "./useToast";

/**
 * Hook that provides all action handlers for AnalyticsView toolbar.
 * Used by both the Analytics page and DashboardPreviewPane.
 */
export function useAnalyticsTools(dashboardId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // ─── Save ─────────────────────────────────────────────────────
  const isFirstSaveRef = useRef(false);

  const saveMutation = useMutation({
    mutationFn: (version?: number) =>
      dashboardService.publishDashboard(dashboardId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
      queryClient.invalidateQueries({
        queryKey: sidebarDashboardKeys.all,
      });
      showToast({
        message: isFirstSaveRef.current
          ? "Dashboard is created. You can access the dashboard from the side panel."
          : "Dashboard is updated. You can access the dashboard from the side panel.",
        variant: "success",
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
  });

  const handleSave = useCallback(
    (isFirstSave?: boolean) => {
      isFirstSaveRef.current = isFirstSave ?? false;

      saveMutation.mutate(undefined, {
        onError: (error) => {
          console.error("[useAnalyticsTools] Save failed:", error);
          showToast({
            message: "Failed to save dashboard. Please try again.",
            variant: "error",
          });
        },
      });
    },
    [saveMutation, showToast],
  );

  const savePhase = useMutationPhase(
    saveMutation.isPending,
    saveMutation.isSuccess,
  );

  // ─── Revert to Saved ───────────────────────────────────────────
  const revertMutation = useMutation({
    mutationFn: () => dashboardService.revertToPublished(dashboardId),
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

  const handleRevert = useCallback(() => {
    revertMutation.mutate();
  }, [revertMutation]);

  const revertPhase = useMutationPhase(
    revertMutation.isPending,
    revertMutation.isSuccess,
  );

  // ─── Share ─────────────────────────────────────────────────────
  const shareMutation = useMutation({
    mutationFn: (isSharedWithTenant: boolean) =>
      dashboardService.shareDashboard(dashboardId, isSharedWithTenant),
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

  const handleShare = useCallback(
    (isSharedWithTenant: boolean) => {
      shareMutation.mutate(isSharedWithTenant);
    },
    [shareMutation],
  );

  const sharePhase = useMutationPhase(
    shareMutation.isPending,
    shareMutation.isSuccess,
  );

  // ─── Refresh ───────────────────────────────────────────────────
  const refreshMutation = useMutation({
    mutationFn: () => dashboardService.triggerRefresh(dashboardId),
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
    gcTime: 0,
  });

  const handleRefresh = useCallback(async () => {
    try {
      await refreshMutation.mutateAsync();
    } catch (error) {
      console.error("[useAnalyticsTools] Refresh failed:", error);
    }
  }, [refreshMutation]);

  return {
    handleSave,
    savePhase,
    saveMutation,
    handleRevert,
    revertPhase,
    revertMutation,
    handleShare,
    shareMutation,
    sharePhase,
    handleRefresh,
    refreshMutation,
  };
}
