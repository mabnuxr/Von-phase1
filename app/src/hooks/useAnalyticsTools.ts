import { useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";
import { useMutationPhase } from "./useMutationPhase";
import { useToast } from "./useToast";

/**
 * Hook that provides all action handlers for AnalyticsView toolbar.
 * Used by both the Analytics page and DashboardPreviewPane.
 */
export function useAnalyticsTools(dashboardId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // ─── Publish (Save) ────────────────────────────────────────────
  const isFirstSaveRef = useRef(false);

  const publishMutation = useMutation({
    mutationFn: (version?: number) =>
      dashboardService.publishDashboard(dashboardId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
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
      publishMutation.mutate(undefined, {
        onError: (error) => {
          console.error("[useAnalyticsTools] Publish failed:", error);
          showToast({
            message: "Failed to save dashboard. Please try again.",
            variant: "error",
          });
        },
      });
      // Store whether this is a first save so the onSuccess toast can use it
      isFirstSaveRef.current = isFirstSave ?? false;
    },
    [publishMutation, showToast],
  );

  const savePhase = useMutationPhase(
    publishMutation.isPending,
    publishMutation.isSuccess,
  );

  // ─── Revert to Published ────────────────────────────────────────
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
    publishMutation,
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
