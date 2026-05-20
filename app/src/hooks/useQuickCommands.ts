import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Command } from "@vonlabs/design-components";
import type { FileCategory } from "@vonlabs/design-components";
import {
  quickCommandsService,
  apiConfigsToSchedule,
  type CreateQuickCommandInput,
  type UpdateQuickCommandInput,
  type QuickCommand,
} from "../services/quickCommandsService";

export const QUICK_COMMANDS_QUERY_KEY = ["quick-commands"] as const;

// ---------------------------------------------------------------------------
// Mapping helpers: QuickCommand (API) <-> Command (UI)
// ---------------------------------------------------------------------------

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function getFileCategory(mimeType: string, extension: string): FileCategory {
  if (mimeType.startsWith("image/")) return "image";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    ["xlsx", "xls", "csv"].includes(extension)
  )
    return "spreadsheet";
  if (
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint") ||
    ["pptx", "ppt"].includes(extension)
  )
    return "presentation";
  if (["txt", "md", "json"].includes(extension)) return "text";
  return "document";
}

/**
 * Convert an API QuickCommand to the UI Command type used by design-components
 */
export function apiCommandToUICommand(
  cmd: QuickCommand,
  currentUserId?: string,
): Command {
  return {
    id: cmd.id,
    name: cmd.name,
    prompt: cmd.prompt,
    prefillText: cmd.prefillText || undefined,
    dataSources: (cmd.dataSources ?? []).map((ds) => {
      const ext = ds.extension ?? getExtension(ds.fileName);
      const mime = ds.mimeType || "application/octet-stream";
      return {
        id: ds.fileId,
        name: ds.fileName,
        size: ds.fileSize ?? 0,
        type: mime,
        extension: ext,
        category:
          (ds.category as FileCategory | undefined) ??
          getFileCategory(mime, ext),
        previewUrl: ds.url,
        s3Key: ds.s3Key,
      };
    }),
    references: cmd.references,
    actionType: "no_action",
    sharingScope:
      cmd.accessLevel === "tenant"
        ? "org"
        : (cmd.sharedUserIds ?? []).length > 0
          ? "specific"
          : "private",
    sharedUserIds: cmd.sharedUserIds ?? [],
    isFavorite: cmd.isBookmarked,
    usageCount: cmd.usageCount,
    lastUsedAt: cmd.lastUsedAt ?? undefined,
    createdBy: currentUserId && cmd.createdBy === currentUserId ? "me" : "team",
    createdAt: cmd.createdAt,
    updatedAt: cmd.updatedAt ?? cmd.createdAt,
    schedule:
      cmd.triggerConfig?.scheduleConfig && cmd.deliveryConfig
        ? apiConfigsToSchedule(cmd.triggerConfig, cmd.deliveryConfig)
        : undefined,
    autoApprove: cmd.autoApprove ?? false,
  };
}

/**
 * Convert UI Command save data to the API CreateQuickCommandInput
 */
export function uiCommandToApiInput(
  data: Omit<Command, "id" | "createdAt" | "updatedAt">,
): Omit<CreateQuickCommandInput, "dataSources"> {
  const accessLevel: "tenant" | "user" =
    data.sharingScope === "org" ? "tenant" : "user";
  return {
    name: data.name,
    prompt: data.prompt,
    prefillText: data.prefillText,
    accessLevel,
    sharedUserIds:
      accessLevel === "user" && data.sharingScope === "specific"
        ? (data.sharedUserIds ?? [])
        : undefined,
    autoApprove: data.autoApprove,
  };
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

/**
 * Fetch all quick commands and return them as UI Command type
 */
export function useQuickCommandsList(
  params?: { search?: string },
  currentUserId?: string,
) {
  return useQuery({
    // currentUserId is part of the key so that cache entries are never shared
    // across users — apiCommandToUICommand derives createdBy from it.
    enabled: !!currentUserId,
    queryKey: [...QUICK_COMMANDS_QUERY_KEY, params, { userId: currentUserId }],
    queryFn: async () => {
      const result = await quickCommandsService.list({
        orderBy: "lastUsed",
        ...params,
      });
      return {
        ...result,
        data: result.data.map((cmd) =>
          apiCommandToUICommand(cmd, currentUserId),
        ),
      };
    },
    staleTime: 30_000,
  });
}

export function useCreateQuickCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuickCommandInput) =>
      quickCommandsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUICK_COMMANDS_QUERY_KEY });
    },
  });
}

export function useUpdateQuickCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuickCommandInput }) =>
      quickCommandsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUICK_COMMANDS_QUERY_KEY });
    },
  });
}

export function useDeleteQuickCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quickCommandsService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUICK_COMMANDS_QUERY_KEY });

      type RegularPage = { data: Command[]; pagination: unknown };

      const previousEntries = queryClient.getQueriesData({
        queryKey: QUICK_COMMANDS_QUERY_KEY,
      });

      queryClient.setQueriesData<RegularPage>(
        { queryKey: QUICK_COMMANDS_QUERY_KEY },
        (old) => {
          if (!old) return old;
          return { ...old, data: old.data.filter((cmd) => cmd.id !== id) };
        },
      );

      return { previousEntries };
    },
    onError: (_err, _id, context) => {
      context?.previousEntries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUICK_COMMANDS_QUERY_KEY });
    },
  });
}

export function useBookmarkQuickCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    scope: { id: "bookmark-quick-command" },
    mutationFn: ({ id, bookmark }: { id: string; bookmark: boolean }) =>
      bookmark
        ? quickCommandsService.bookmark(id)
        : quickCommandsService.unbookmark(id),
    onMutate: async ({ id, bookmark }) => {
      await queryClient.cancelQueries({ queryKey: QUICK_COMMANDS_QUERY_KEY });

      type RegularPage = { data: Command[]; pagination: unknown };

      const previousEntries = queryClient.getQueriesData({
        queryKey: QUICK_COMMANDS_QUERY_KEY,
      });

      const updateCmd = (cmd: Command) =>
        cmd.id === id ? { ...cmd, isFavorite: bookmark } : cmd;

      queryClient.setQueriesData<RegularPage>(
        { queryKey: QUICK_COMMANDS_QUERY_KEY },
        (old) => {
          if (!old) return old;
          return { ...old, data: old.data.map(updateCmd) };
        },
      );

      return { previousEntries };
    },
    onError: (_err, _vars, context) => {
      // Restore each cache entry to its pre-mutation snapshot
      context?.previousEntries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUICK_COMMANDS_QUERY_KEY });
    },
  });
}
