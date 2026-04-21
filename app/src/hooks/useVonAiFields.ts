import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vonAiFieldsService } from "../services/vonAiFieldsService";
import { useToast } from "./useToast";
import { ApiError } from "../services/apiClient";
import type {
  CreateIqColumnRequest,
  UpdateIqColumnRequest,
  DryRunRequest,
  IqScheduleConfigRequest,
  IqScheduleResponse,
} from "../types/vonAiFields";

// ─── Query Keys ───────────────────────────────────────────────
export const iqColumnKeys = {
  all: ["iq-columns"] as const,
  list: (status?: string) =>
    [...iqColumnKeys.all, "list", status ?? "all"] as const,
  execution: (id: string) => [...iqColumnKeys.all, "execution", id] as const,
  results: (id: string) => [...iqColumnKeys.all, "results", id] as const,
  schedule: () => [...iqColumnKeys.all, "schedule"] as const,
  opportunities: (search: string) =>
    [...iqColumnKeys.all, "opportunities", search] as const,
};

// ─── Column CRUD ──────────────────────────────────────────────
export function useIqColumns(status?: string) {
  return useQuery({
    queryKey: iqColumnKeys.list(status),
    queryFn: () =>
      vonAiFieldsService.listColumns(status !== "all" ? status : undefined),
  });
}

export function useCreateIqColumn() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateIqColumnRequest) =>
      vonAiFieldsService.createColumn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iqColumnKeys.all });
      showToast({ message: "Field created successfully.", variant: "success" });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError ? error.message : "Failed to create field.";
      showToast({ message: msg, variant: "error" });
    },
  });
}

export function useUpdateIqColumn() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      columnId,
      data,
    }: {
      columnId: string;
      data: UpdateIqColumnRequest;
    }) => vonAiFieldsService.updateColumn(columnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iqColumnKeys.all });
      showToast({ message: "Field updated successfully.", variant: "success" });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError ? error.message : "Failed to update field.";
      showToast({ message: msg, variant: "error" });
    },
  });
}

export function useDeleteIqColumn() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (columnId: string) => vonAiFieldsService.deleteColumn(columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iqColumnKeys.all });
      showToast({ message: "Field deleted.", variant: "success" });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError ? error.message : "Failed to delete field.";
      showToast({ message: msg, variant: "error" });
    },
  });
}

// ─── Opportunity Search ───────────────────────────────────────
export function useOpportunitySearch(search: string, enabled = true) {
  return useQuery({
    queryKey: iqColumnKeys.opportunities(search),
    queryFn: () => vonAiFieldsService.searchOpportunities(search),
    enabled,
    staleTime: 30_000,
  });
}

// ─── Execution ────────────────────────────────────────────────
export function useDryRun() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: DryRunRequest) => vonAiFieldsService.dryRun(data),
    onError: (error) => {
      const msg =
        error instanceof ApiError ? error.message : "Failed to start dry run.";
      showToast({ message: msg, variant: "error" });
    },
  });
}

export function useExecutionStatus(executionId: string | null) {
  return useQuery({
    queryKey: iqColumnKeys.execution(executionId ?? ""),
    queryFn: () => vonAiFieldsService.getExecution(executionId!),
    enabled: !!executionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 4000;
    },
  });
}

export function useExecutionResults(executionId: string | null) {
  return useQuery({
    queryKey: iqColumnKeys.results(executionId ?? ""),
    queryFn: () => vonAiFieldsService.getResults(executionId!),
    enabled: !!executionId,
  });
}

// ─── Schedule ─────────────────────────────────────────────────
export function useIqSchedule() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const queryKey = iqColumnKeys.schedule();

  const scheduleQuery = useQuery({
    queryKey,
    queryFn: () => vonAiFieldsService.getSchedule(),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && [404, 403].includes(error.statusCode)) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const createMutation = useMutation({
    mutationFn: (config: IqScheduleConfigRequest) =>
      vonAiFieldsService.createSchedule(config),
    onSuccess: (data) => {
      queryClient.setQueryData<IqScheduleResponse>(queryKey, data);
      showToast({
        message: "Schedule created successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError
          ? error.message
          : "Failed to create schedule.";
      showToast({ message: msg, variant: "error" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (config: IqScheduleConfigRequest) =>
      vonAiFieldsService.updateSchedule(config),
    onSuccess: (data) => {
      queryClient.setQueryData<IqScheduleResponse>(queryKey, data);
      showToast({
        message: "Schedule updated successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError
          ? error.message
          : "Failed to update schedule.";
      showToast({ message: msg, variant: "error" });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => vonAiFieldsService.pauseSchedule(),
    onSuccess: (data) => {
      queryClient.setQueryData<IqScheduleResponse>(queryKey, data);
      showToast({ message: "Schedule paused.", variant: "success" });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError ? error.message : "Failed to pause schedule.";
      showToast({ message: msg, variant: "error" });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => vonAiFieldsService.resumeSchedule(),
    onSuccess: (data) => {
      queryClient.setQueryData<IqScheduleResponse>(queryKey, data);
      showToast({ message: "Schedule resumed.", variant: "success" });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError
          ? error.message
          : "Failed to resume schedule.";
      showToast({ message: msg, variant: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => vonAiFieldsService.deleteSchedule(),
    onSuccess: () => {
      queryClient.setQueryData<IqScheduleResponse>(queryKey, {
        schedule_config: null,
        schedule_trigger_id: null,
        is_scheduled: false,
        status: "none",
      });
      showToast({ message: "Schedule removed.", variant: "success" });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError
          ? error.message
          : "Failed to remove schedule.";
      showToast({ message: msg, variant: "error" });
    },
  });

  const schedule = scheduleQuery.data ?? null;
  const isScheduled = schedule?.is_scheduled ?? false;
  const isPaused =
    isScheduled &&
    (schedule?.status === "paused" ||
      schedule?.schedule_config?.enabled === false);
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    deleteMutation.isPending;

  return {
    schedule,
    isScheduled,
    isPaused,
    isLoading: scheduleQuery.isLoading,
    isMutating,
    handleCreateSchedule: useCallback(
      (config: IqScheduleConfigRequest) => createMutation.mutateAsync(config),
      [createMutation],
    ),
    handleUpdateSchedule: useCallback(
      (config: IqScheduleConfigRequest) => updateMutation.mutateAsync(config),
      [updateMutation],
    ),
    handlePauseSchedule: useCallback(
      () => pauseMutation.mutateAsync(),
      [pauseMutation],
    ),
    handleResumeSchedule: useCallback(
      () => resumeMutation.mutateAsync(),
      [resumeMutation],
    ),
    handleDeleteSchedule: useCallback(
      () => deleteMutation.mutateAsync(),
      [deleteMutation],
    ),
  };
}
