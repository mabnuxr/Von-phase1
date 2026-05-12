import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiFieldsService } from "../services/vonAiFieldsService";
import { useToast } from "./useToast";
import { ApiError } from "../services/apiClient";
import type {
  AiFieldStatus,
  CreateAiFieldRequest,
  DefaultAiFieldDefinition,
  PlaygroundRequest,
} from "../types/vonAiFields";

// ─── Query Keys ──────────────────────────────────────────────
export const aiFieldKeys = {
  all: ["ai-fields"] as const,
  list: (status?: AiFieldStatus, page = 1, limit = 10, isDefault?: boolean) =>
    [
      ...aiFieldKeys.all,
      "list",
      status ?? "all",
      page,
      limit,
      isDefault ?? "any",
    ] as const,
  detail: (fieldId: string) => [...aiFieldKeys.all, "detail", fieldId] as const,
  runs: (fieldId: string, page = 1, limit = 20) =>
    [...aiFieldKeys.all, "runs", fieldId, page, limit] as const,
  opportunities: (query: string) =>
    [...aiFieldKeys.all, "opportunities", query] as const,
  byName: (name: string) => [...aiFieldKeys.all, "byName", name] as const,
  conversations: (fieldId: string) =>
    [...aiFieldKeys.all, "conversations", fieldId] as const,
};

// ─── List Fields ─────────────────────────────────────────────
export function useAiFields(
  status?: AiFieldStatus | undefined,
  page = 1,
  limit = 10,
  enabled = true,
  isDefault?: boolean,
) {
  return useQuery({
    queryKey: aiFieldKeys.list(status, page, limit, isDefault),
    queryFn: () => aiFieldsService.listFields(status, page, limit, isDefault),
    enabled,
  });
}

// ─── Single Field ────────────────────────────────────────────
interface UseAiFieldOptions {
  staleTime?: number;
  refetchOnMount?: boolean | "always";
}

export function useAiField(
  fieldId: string | null,
  options?: UseAiFieldOptions,
) {
  return useQuery({
    queryKey: aiFieldKeys.detail(fieldId ?? ""),
    queryFn: () => aiFieldsService.getField(fieldId!),
    enabled: !!fieldId,
    staleTime: options?.staleTime,
    refetchOnMount: options?.refetchOnMount,
  });
}

// ─── Find existing field (check if field exists for button state) ──
// If fieldId is provided (update flow), fetch by ID.
// If only name is provided (create flow), search by name.
export function useExistingAiField(
  fieldId: string | null | undefined,
  name: string | null | undefined,
) {
  const hasFieldId = !!fieldId;
  const hasName = !hasFieldId && !!name;

  const byIdQuery = useQuery({
    queryKey: aiFieldKeys.detail(fieldId ?? ""),
    queryFn: () => aiFieldsService.getField(fieldId!),
    enabled: hasFieldId,
  });

  const byNameQuery = useQuery({
    queryKey: aiFieldKeys.byName(name ?? ""),
    queryFn: async () => {
      const result = await aiFieldsService.findByName(name!);
      return result.data[0] ?? null;
    },
    enabled: hasName,
  });

  if (hasFieldId)
    return { data: byIdQuery.data ?? null, isLoading: byIdQuery.isLoading };
  if (hasName)
    return { data: byNameQuery.data ?? null, isLoading: byNameQuery.isLoading };
  return { data: null, isLoading: false };
}

// ─── Create Field ────────────────────────────────────────────
export function useCreateAiField() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateAiFieldRequest) =>
      aiFieldsService.createField(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiFieldKeys.all });
      showToast({ message: "AI Field created.", variant: "success" });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError ? error.message : "Failed to create field.";
      showToast({ message: msg, variant: "error" });
    },
  });
}

// ─── Delete Field ────────────────────────────────────────────
export function useDeleteAiField() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (fieldId: string) => aiFieldsService.deleteField(fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiFieldKeys.all });
      showToast({ message: "AI field deleted.", variant: "success" });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError
          ? error.message
          : "Failed to delete AI field.";
      showToast({ message: msg, variant: "error" });
    },
  });
}

// ─── Activate Field ──────────────────────────────────────────
export function useActivateField() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (fieldId: string) => aiFieldsService.activateField(fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiFieldKeys.all });
      showToast({ message: "AI field activated.", variant: "success" });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError
          ? error.message
          : "Failed to activate AI field.";
      showToast({ message: msg, variant: "error" });
    },
  });
}

// ─── Enable Default Field ────────────────────────────────────
// Materializes a hardcoded default into a real AiField (or re-activates if
// it already exists). Disabling a default reuses useDisableField with the
// materialized field's fieldId.
export function useEnableDefaultAiField() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (definition: DefaultAiFieldDefinition) =>
      aiFieldsService.enableDefaultField(definition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiFieldKeys.all });
      showToast({ message: "AI field enabled.", variant: "success" });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError
          ? error.message
          : "Failed to enable AI field.";
      showToast({ message: msg, variant: "error" });
    },
  });
}

// ─── Disable Field ───────────────────────────────────────────
export function useDisableField() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (fieldId: string) => aiFieldsService.disableField(fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiFieldKeys.all });
      showToast({ message: "AI field disabled.", variant: "success" });
    },
    onError: (error) => {
      const msg =
        error instanceof ApiError
          ? error.message
          : "Failed to disable AI field.";
      showToast({ message: msg, variant: "error" });
    },
  });
}

// ─── Run Playground ──────────────────────────────────────────
export function useRunPlayground() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: PlaygroundRequest) =>
      aiFieldsService.runPlayground(data),
    onError: (error) => {
      const msg =
        error instanceof ApiError
          ? error.message
          : "Failed to start playground run.";
      showToast({ message: msg, variant: "error" });
    },
  });
}

// ─── Opportunity Search ──────────────────────────────────────
export function useOpportunitySearch(
  query: string,
  enabled = true,
  opportunityFilter?: string | null,
) {
  return useQuery({
    queryKey: [...aiFieldKeys.opportunities(query), opportunityFilter ?? ""],
    queryFn: () =>
      aiFieldsService.searchOpportunities(query, 10, opportunityFilter),
    enabled,
    staleTime: 30_000,
  });
}

// ─── Run History ─────────────────────────────────────────────
export function useAiFieldRuns(fieldId: string | null, page = 1, limit = 20) {
  return useQuery({
    queryKey: aiFieldKeys.runs(fieldId ?? "", page, limit),
    queryFn: () => aiFieldsService.getRunHistory(fieldId!, page, limit),
    enabled: !!fieldId,
  });
}

// ─── Associated Conversations ────────────────────────────────
export function useAiFieldConversations(fieldId: string | null) {
  return useQuery({
    queryKey: aiFieldKeys.conversations(fieldId ?? ""),
    queryFn: () => aiFieldsService.getConversations(fieldId!),
    enabled: !!fieldId,
  });
}
