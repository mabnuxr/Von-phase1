import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { foldersService } from "../../services";
import { folderKeys } from "./folderKeys";
import { useToast } from "../useToast";
import { getFolderErrorToast } from "../../utils/folderErrors";
import type {
  Folder,
  FolderItemType,
  CreateFolderRequest,
  UpdateFolderRequest,
  SetItemFoldersResponse,
} from "../../types/chatSidebar";

interface SetItemFoldersParams {
  itemType: FolderItemType;
  itemId: string;
  folderIds: string[];
}

interface RemoveItemParams {
  folderId: string;
  itemType: FolderItemType;
  itemId: string;
}

interface CreateFolderForItemParams {
  name: string;
  itemType: FolderItemType;
  itemId: string;
}

interface PinFolderParams {
  folderId: string;
  isPinned: boolean;
}

/**
 * Bundle of every Folders v2 mutation. Each callback is stable (`useCallback`)
 * so consumers can pass them straight into props without churning React keys.
 *
 * Cache strategy:
 *   - On success: invalidate folders list + every contents/items/unfiled
 *     touchpoint affected by the diff so live counts and slices come back fresh.
 *   - On error: surface a toast keyed off the standard APP_* error envelope.
 *
 * Item membership is multi-folder; the only write paths are `setItemFolders`
 * (PUT, replace-all-or-nothing) and `removeItemFromFolder` (DELETE, single).
 */
export function useFolderMutations() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const reportError = useCallback(
    (error: unknown, fallback: string) => {
      const toast = getFolderErrorToast(error, fallback);
      if (toast) showToast(toast);
    },
    [showToast],
  );

  // ── Folder CRUD ─────────────────────────────────────────────────────────

  const createFolderMutation = useMutation<
    Folder,
    unknown,
    CreateFolderRequest
  >({
    mutationFn: (payload) => foldersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.list() });
    },
    onError: (error) => reportError(error, "Couldn't create folder."),
  });

  const renameFolderMutation = useMutation<
    Folder,
    unknown,
    { folderId: string; name: string },
    { previousList: Folder[] | undefined }
  >({
    mutationFn: ({ folderId, name }) =>
      foldersService.update(folderId, { name }),
    onMutate: async ({ folderId, name }) => {
      await queryClient.cancelQueries({ queryKey: folderKeys.list() });
      const previousList = queryClient.getQueryData<Folder[]>(
        folderKeys.list(),
      );
      if (previousList) {
        queryClient.setQueryData<Folder[]>(
          folderKeys.list(),
          previousList.map((f) =>
            f.folderId === folderId ? { ...f, name } : f,
          ),
        );
      }
      return { previousList };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previousList) {
        queryClient.setQueryData(folderKeys.list(), ctx.previousList);
      }
      reportError(error, "Couldn't rename folder.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.list() });
    },
  });

  const deleteFolderMutation = useMutation<
    void,
    unknown,
    string,
    { previousList: Folder[] | undefined }
  >({
    mutationFn: (folderId) => foldersService.remove(folderId),
    onMutate: async (folderId) => {
      await queryClient.cancelQueries({ queryKey: folderKeys.list() });
      const previousList = queryClient.getQueryData<Folder[]>(
        folderKeys.list(),
      );
      if (previousList) {
        queryClient.setQueryData<Folder[]>(
          folderKeys.list(),
          previousList.filter((f) => f.folderId !== folderId),
        );
      }
      return { previousList };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previousList) {
        queryClient.setQueryData(folderKeys.list(), ctx.previousList);
      }
      reportError(error, "Couldn't delete folder.");
    },
    onSuccess: (_data, folderId) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.list() });
      queryClient.invalidateQueries({
        queryKey: folderKeys.contents(folderId),
      });
      // Items that lived in this folder become unfiled.
      queryClient.invalidateQueries({
        queryKey: folderKeys.unfiled("conversation"),
      });
      queryClient.invalidateQueries({
        queryKey: folderKeys.unfiled("dashboard"),
      });
    },
  });

  const pinFolderMutation = useMutation<
    Folder,
    unknown,
    PinFolderParams,
    { previousList: Folder[] | undefined }
  >({
    mutationFn: ({ folderId, isPinned }) =>
      foldersService.update(folderId, { displayOrder: isPinned ? 0 : 100 }),
    onMutate: async ({ folderId, isPinned }) => {
      await queryClient.cancelQueries({ queryKey: folderKeys.list() });
      const previousList = queryClient.getQueryData<Folder[]>(
        folderKeys.list(),
      );
      if (previousList) {
        queryClient.setQueryData<Folder[]>(
          folderKeys.list(),
          previousList.map((f) =>
            f.folderId === folderId
              ? { ...f, displayOrder: isPinned ? 0 : 100 }
              : f,
          ),
        );
      }
      return { previousList };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previousList) {
        queryClient.setQueryData(folderKeys.list(), ctx.previousList);
      }
      reportError(error, "Couldn't update folder.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.list() });
    },
  });

  const updateFolderMutation = useMutation<
    Folder,
    unknown,
    { folderId: string; patch: UpdateFolderRequest }
  >({
    mutationFn: ({ folderId, patch }) => foldersService.update(folderId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.list() });
    },
    onError: (error) => reportError(error, "Couldn't update folder."),
  });

  // ── Item membership mutations ───────────────────────────────────────────

  const invalidateAffectedFolderCaches = useCallback(
    (folderIds: Iterable<string>, itemType: FolderItemType) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.list() });
      queryClient.invalidateQueries({ queryKey: folderKeys.unfiled(itemType) });
      for (const folderId of folderIds) {
        queryClient.invalidateQueries({
          queryKey: folderKeys.contents(folderId),
        });
        queryClient.invalidateQueries({
          queryKey: folderKeys.items(folderId, itemType),
        });
      }
    },
    [queryClient],
  );

  const setItemFoldersMutation = useMutation<
    SetItemFoldersResponse,
    unknown,
    SetItemFoldersParams
  >({
    mutationFn: ({ itemType, itemId, folderIds }) =>
      foldersService.setItemFolders({ itemType, itemId, folderIds }),
    onError: (error) => reportError(error, "Couldn't update folders."),
    onSuccess: (result, { itemType, itemId }) => {
      // Defensive reads — the server should always return these arrays, but
      // unwrap with fallbacks so a payload-shape regression doesn't throw
      // inside onSuccess and silently swallow the toast.
      const added = result?.added ?? [];
      const removed = result?.removed ?? [];

      const touched = new Set<string>([...added, ...removed]);
      invalidateAffectedFolderCaches(touched, itemType);
      queryClient.invalidateQueries({
        queryKey: folderKeys.itemMemberships(itemType, itemId),
      });

      const itemLabel = itemType === "dashboard" ? "Dashboard" : "Chat";
      const addedCount = added.length;
      const removedCount = removed.length;
      let message: string;
      if (addedCount === 0 && removedCount === 0) {
        // Server replied with no diff — surface a neutral confirmation so the
        // user knows the save round-tripped, instead of an awkward silent close.
        message = `${itemLabel} folders are up to date`;
      } else if (addedCount > 0 && removedCount === 0) {
        message =
          addedCount === 1
            ? `${itemLabel} added to 1 folder`
            : `${itemLabel} added to ${addedCount} folders`;
      } else if (addedCount === 0 && removedCount > 0) {
        message =
          removedCount === 1
            ? `${itemLabel} removed from 1 folder`
            : `${itemLabel} removed from ${removedCount} folders`;
      } else {
        message = `${itemLabel} folders updated`;
      }
      showToast({ message, variant: "success" });
    },
  });

  const removeItemMutation = useMutation<
    void,
    unknown,
    RemoveItemParams,
    Record<string, never>
  >({
    mutationFn: async ({ folderId, itemType, itemId }) => {
      await foldersService.removeItem(folderId, itemType, itemId);
    },
    onError: (error) => reportError(error, "Couldn't remove from folder."),
    onSuccess: (_data, { folderId, itemType, itemId }) => {
      invalidateAffectedFolderCaches([folderId], itemType);
      queryClient.invalidateQueries({
        queryKey: folderKeys.itemMemberships(itemType, itemId),
      });
      const itemLabel = itemType === "dashboard" ? "Dashboard" : "Chat";
      showToast({
        message: `${itemLabel} removed from folder`,
        variant: "success",
      });
    },
  });

  /**
   * Compose: read the item's current memberships, create a new folder, then
   * PUT `current ∪ {newFolder}`. Server is the source of truth for current
   * memberships — the sidebar cache only knows about loaded slices and can
   * miss folders the user hasn't expanded yet.
   */
  const createFolderForItem = useCallback(
    async ({
      name,
      itemType,
      itemId,
    }: CreateFolderForItemParams): Promise<Folder | null> => {
      try {
        const current = await foldersService.getItemMemberships({
          itemType,
          itemId,
        });
        const folder = await createFolderMutation.mutateAsync({ name });
        const targetIds = Array.from(
          new Set([...current.folders.map((f) => f.folderId), folder.folderId]),
        );
        await setItemFoldersMutation.mutateAsync({
          itemType,
          itemId,
          folderIds: targetIds,
        });
        return folder;
      } catch {
        return null;
      }
    },
    [createFolderMutation, setItemFoldersMutation],
  );

  return {
    createFolder: createFolderMutation.mutate,
    createFolderAsync: createFolderMutation.mutateAsync,
    isCreatingFolder: createFolderMutation.isPending,

    renameFolder: (folderId: string, name: string) =>
      renameFolderMutation.mutate({ folderId, name }),
    renameFolderAsync: (folderId: string, name: string) =>
      renameFolderMutation.mutateAsync({ folderId, name }),
    isRenamingFolder: renameFolderMutation.isPending,

    deleteFolder: deleteFolderMutation.mutate,
    deleteFolderAsync: deleteFolderMutation.mutateAsync,
    isDeletingFolder: deleteFolderMutation.isPending,

    pinFolder: (folderId: string, isPinned: boolean) =>
      pinFolderMutation.mutate({ folderId, isPinned }),

    updateFolder: (folderId: string, patch: UpdateFolderRequest) =>
      updateFolderMutation.mutate({ folderId, patch }),

    setItemFolders: setItemFoldersMutation.mutate,
    setItemFoldersAsync: setItemFoldersMutation.mutateAsync,
    isSettingFolders: setItemFoldersMutation.isPending,

    removeItemFromFolder: removeItemMutation.mutate,
    removeItemFromFolderAsync: removeItemMutation.mutateAsync,
    isRemovingItem: removeItemMutation.isPending,

    createFolderForItem,
  };
}
