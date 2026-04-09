import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { useToast } from "./useToast";
import { ApiError } from "../services/apiClient";
import type {
  ScheduleConfigRequest,
  DashboardScheduleResponse,
} from "../types/dashboard";

export const scheduleKeys = {
  all: ["dashboard-schedules"] as const,
  detail: (dashboardId: string) => [...scheduleKeys.all, dashboardId] as const,
};

const SCHEDULE_ERROR_MESSAGES: Record<string, string> = {
  DASHBOARD_NOT_FOUND: "Dashboard not found.",
  DASHBOARD_ACCESS_DENIED:
    "You don't have permission to manage this dashboard's schedule.",
  DASHBOARD_NO_WORKFLOW: "This dashboard has no workflow to schedule.",
  DASHBOARD_SCHEDULE_ALREADY_EXISTS:
    "A schedule already exists for this dashboard.",
  DASHBOARD_SCHEDULE_NOT_FOUND: "No schedule found for this dashboard.",
  DASHBOARD_SCHEDULE_ALREADY_PAUSED: "The schedule is already paused.",
  DASHBOARD_SCHEDULE_ALREADY_ACTIVE: "The schedule is already active.",
  DASHBOARD_INVALID_SCHEDULE_CONFIG:
    "Invalid schedule configuration. Please check your settings.",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const response = error.response as
      | { error?: { code?: string; message?: string } }
      | undefined;
    const code = response?.error?.code;
    if (code && SCHEDULE_ERROR_MESSAGES[code]) {
      return SCHEDULE_ERROR_MESSAGES[code];
    }
    return response?.error?.message || error.message || fallback;
  }
  return fallback;
}

/**
 * Hook for managing dashboard refresh schedule (CRUD + pause/resume).
 * Fetches the current schedule on mount and exposes mutation handlers
 * with toast feedback.
 */
export function useDashboardSchedule(dashboardId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const queryKey = scheduleKeys.detail(dashboardId);

  // ─── Fetch current schedule ──────────────────────────────────
  const scheduleQuery = useQuery({
    queryKey,
    queryFn: () => dashboardService.getSchedule(dashboardId),
    retry: (failureCount, error) => {
      // Don't retry on 404 (no schedule exists yet) or 403
      if (error instanceof ApiError && [404, 403].includes(error.statusCode)) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // ─── Create ──────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (config: ScheduleConfigRequest) =>
      dashboardService.createSchedule(dashboardId, config),
    onSuccess: (data) => {
      queryClient.setQueryData<DashboardScheduleResponse>(queryKey, data);
      showToast({
        message: "Refresh schedule created successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      showToast({
        message: getErrorMessage(
          error,
          "Failed to create schedule. Please try again.",
        ),
        variant: "error",
      });
    },
  });

  // ─── Update ──────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (config: Partial<ScheduleConfigRequest>) =>
      dashboardService.updateSchedule(dashboardId, config),
    onSuccess: (data) => {
      queryClient.setQueryData<DashboardScheduleResponse>(queryKey, data);
      showToast({
        message: "Refresh schedule updated successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      showToast({
        message: getErrorMessage(
          error,
          "Failed to update schedule. Please try again.",
        ),
        variant: "error",
      });
    },
  });

  // ─── Pause ───────────────────────────────────────────────────
  const pauseMutation = useMutation({
    mutationFn: () => dashboardService.pauseSchedule(dashboardId),
    onSuccess: (data) => {
      queryClient.setQueryData<DashboardScheduleResponse>(queryKey, data);
      showToast({
        message: "Refresh schedule paused.",
        variant: "success",
      });
    },
    onError: (error) => {
      showToast({
        message: getErrorMessage(
          error,
          "Failed to pause schedule. Please try again.",
        ),
        variant: "error",
      });
    },
  });

  // ─── Resume ──────────────────────────────────────────────────
  const resumeMutation = useMutation({
    mutationFn: () => dashboardService.resumeSchedule(dashboardId),
    onSuccess: (data) => {
      queryClient.setQueryData<DashboardScheduleResponse>(queryKey, data);
      showToast({
        message: "Refresh schedule resumed.",
        variant: "success",
      });
    },
    onError: (error) => {
      showToast({
        message: getErrorMessage(
          error,
          "Failed to resume schedule. Please try again.",
        ),
        variant: "error",
      });
    },
  });

  // ─── Delete ──────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => dashboardService.deleteSchedule(dashboardId),
    onSuccess: () => {
      queryClient.setQueryData<DashboardScheduleResponse>(queryKey, {
        dashboard_id: dashboardId,
        schedule_config: null,
        schedule_trigger_id: null,
        next_run_time: null,
        is_scheduled: false,
        created_at: null,
        updated_at: null,
      });
      showToast({
        message: "Refresh schedule removed.",
        variant: "success",
      });
    },
    onError: (error) => {
      showToast({
        message: getErrorMessage(
          error,
          "Failed to remove schedule. Please try again.",
        ),
        variant: "error",
      });
    },
  });

  // ─── Derived state ──────────────────────────────────────────
  const schedule = scheduleQuery.data ?? null;
  const isScheduled = schedule?.is_scheduled ?? false;
  const isPaused = isScheduled && schedule?.schedule_config?.enabled === false;
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    deleteMutation.isPending;

  // ─── Handlers ───────────────────────────────────────────────
  const handleCreateSchedule = useCallback(
    (config: ScheduleConfigRequest) => createMutation.mutateAsync(config),
    [createMutation],
  );

  const handleUpdateSchedule = useCallback(
    (config: Partial<ScheduleConfigRequest>) =>
      updateMutation.mutateAsync(config),
    [updateMutation],
  );

  const handlePauseSchedule = useCallback(
    () => pauseMutation.mutateAsync(),
    [pauseMutation],
  );

  const handleResumeSchedule = useCallback(
    () => resumeMutation.mutateAsync(),
    [resumeMutation],
  );

  const handleDeleteSchedule = useCallback(
    () => deleteMutation.mutateAsync(),
    [deleteMutation],
  );

  return {
    schedule,
    isScheduled,
    isPaused,
    isLoading: scheduleQuery.isLoading,
    isMutating,
    handleCreateSchedule,
    handleUpdateSchedule,
    handlePauseSchedule,
    handleResumeSchedule,
    handleDeleteSchedule,
    invalidate,
  };
}
