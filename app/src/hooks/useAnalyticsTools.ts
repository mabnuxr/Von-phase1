import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useVisibilityToggle } from "@vonlabs/design-components";
import { dashboardService } from "../services/dashboardService";
import { dashboardKeys } from "./useDashboardQuery";
import { sidebarDashboardKeys } from "./useSidebarDashboards";
import { useMutationPhase } from "./useMutationPhase";
import { useToast } from "./useToast";

const SAVE_TOAST_DURATION_MS = 3000;

/**
 * Hook that provides all action handlers for AnalyticsView toolbar.
 * Used by both the Analytics page and DashboardPreviewPane.
 */
export function useAnalyticsTools(dashboardId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // ─── Save ─────────────────────────────────────────────────────
  const isFirstSaveRef = useRef(false);
  const {
    isVisible: showSaveToast,
    show: showToastNow,
    hide: hideToastNow,
  } = useVisibilityToggle(false);
  const saveToastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(saveToastTimerRef.current), []);

  const saveMutation = useMutation({
    mutationFn: async (version?: number) => {
      await dashboardService.publishDashboard(dashboardId, version);
      await queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sidebarDashboardKeys.all,
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
  });

  const handleSave = useCallback(
    ({
      isFirstSave,
      onSuccess,
    }: { isFirstSave?: boolean; onSuccess?: () => void } = {}) => {
      isFirstSaveRef.current = isFirstSave ?? false;

      saveMutation.mutate(undefined, {
        onSuccess: () => {
          onSuccess?.();
          // Show inline save toast
          showToastNow();
          clearTimeout(saveToastTimerRef.current);
          saveToastTimerRef.current = setTimeout(
            hideToastNow,
            SAVE_TOAST_DURATION_MS,
          );
        },
        onError: (error) => {
          console.error("[useAnalyticsTools] Save failed:", error);
          showToast({
            message: "Failed to save dashboard. Please try again.",
            variant: "error",
          });
        },
      });
    },
    [saveMutation, showToast, showToastNow, hideToastNow],
  );

  const savePhase = useMutationPhase(
    saveMutation.isPending,
    saveMutation.isSuccess,
  );

  // ─── Revert to Saved ───────────────────────────────────────────
  const revertMutation = useMutation({
    mutationFn: async () => {
      await dashboardService.revertToPublished(dashboardId);
      await queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
    onSuccess: () => {
      showToast({
        message: "Dashboard reverted to last saved version.",
        variant: "success",
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
  });

  const handleRevert = useCallback(
    ({ onSuccess }: { onSuccess?: () => void } = {}) => {
      revertMutation.mutate(undefined, {
        onSuccess,
        onError: (error) => {
          console.error("[useAnalyticsTools] Revert failed:", error);
          showToast({
            message: "Failed to revert dashboard. Please try again.",
            variant: "error",
          });
        },
      });
    },
    [revertMutation, showToast],
  );

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

  // ─── Edit Mode ─────────────────────────────────────────────────
  const editModeMutation = useMutation({
    mutationFn: async (isEditable: boolean) => {
      await dashboardService.updateDashboard(dashboardId, {
        is_editable: isEditable,
      });
      await queryClient.invalidateQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      });
    },
    onMutate: () =>
      queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId),
      }),
    onError: (error: unknown) => {
      console.error("[useAnalyticsTools] Edit mode toggle failed:", error);
      showToast({
        message: "Failed to toggle edit mode. Please try again.",
        variant: "error",
      });
    },
  });

  const editModePhase = useMutationPhase(
    editModeMutation.isPending,
    editModeMutation.isSuccess,
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
    // Save toast state (consumed by AnalyticsView for inline toast rendering)
    showSaveToast,
    isFirstSave: isFirstSaveRef.current,
    handleRevert,
    revertPhase,
    revertMutation,
    handleShare,
    shareMutation,
    sharePhase,
    handleRefresh,
    refreshMutation,
    editModeMutation,
    editModePhase,
  };
}
