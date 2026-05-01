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
} from "../../types/chatSidebar";

interface AddItemParams {
  folderId: string;
  itemType: FolderItemType;
  itemId: string;
  /** Optional source folder so we also invalidate the source's contents/items caches. */
  sourceFolderId?: string | null;
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
  sourceFolderId?: string | null;
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
 *   - Optimistic: where applicable (folder-list reorders/renames) so the UI
 *     feels instant. Item-membership mutations no longer remove the item
 *     from the top-level "Chats" / "Dashboards" cache: that list now holds
 *     EVERY item the user can see — filed or not — so a chat added to a
 *     folder must remain visible at the top level too.
 *   - On success: invalidate folders list + every contents/items touchpoint
 *     so live counts and slices come back fresh.
 *   - On error: roll back the optimistic updates and surface a toast keyed
 *     off the standard APP_* error envelope.
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

  const invalidateMembershipCaches = useCallback(
    ({
      folderId,
      itemType,
      sourceFolderId,
    }: {
      folderId: string;
      itemType: FolderItemType;
      sourceFolderId?: string | null;
    }) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.list() });
      queryClient.invalidateQueries({
        queryKey: folderKeys.contents(folderId),
      });
      queryClient.invalidateQueries({
        queryKey: folderKeys.items(folderId, itemType),
      });
      queryClient.invalidateQueries({
        queryKey: folderKeys.unfiled(itemType),
      });
      if (sourceFolderId && sourceFolderId !== folderId) {
        queryClient.invalidateQueries({
          queryKey: folderKeys.contents(sourceFolderId),
        });
        queryClient.invalidateQueries({
          queryKey: folderKeys.items(sourceFolderId, itemType),
        });
      }
    },
    [queryClient],
  );

  const addItemMutation = useMutation<void, unknown, AddItemParams>({
    mutationFn: async ({ folderId, itemType, itemId }) => {
      await foldersService.addItem(folderId, { itemType, itemId });
    },
    // Note: we deliberately do NOT optimistically remove the item from the
    // top-level "Chats" / "Dashboards" cache here. That list is the global
    // list of items (filed + unfiled) — adding to a folder should leave the
    // top-level row in place. See the docstring on this hook for the wider
    // cache strategy.
    onError: (error) => {
      reportError(error, "Couldn't add to folder.");
    },
    onSuccess: (_data, { folderId, itemType, sourceFolderId }) => {
      invalidateMembershipCaches({ folderId, itemType, sourceFolderId });

      const folders = queryClient.getQueryData<Folder[]>(folderKeys.list());
      const folderName = folders?.find(
        (f) => f.folderId === folderId,
      )?.name;
      const itemLabel = itemType === "dashboard" ? "Dashboard" : "Chat";
      showToast({
        message: folderName
          ? `${itemLabel} moved to "${folderName}"`
          : `${itemLabel} moved to folder`,
        variant: "success",
      });
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
    onSuccess: (_data, { folderId, itemType }) => {
      invalidateMembershipCaches({ folderId, itemType });
    },
  });

  // Compose: create folder, then file the item into it. Two server calls,
  // one user intent.
  const createFolderForItem = useCallback(
    async ({
      name,
      itemType,
      itemId,
      sourceFolderId,
    }: CreateFolderForItemParams): Promise<Folder | null> => {
      try {
        const folder = await createFolderMutation.mutateAsync({ name });
        await addItemMutation.mutateAsync({
          folderId: folder.folderId,
          itemType,
          itemId,
          sourceFolderId: sourceFolderId ?? null,
        });
        return folder;
      } catch {
        return null;
      }
    },
    [createFolderMutation, addItemMutation],
  );

  return {
    createFolder: createFolderMutation.mutate,
    createFolderAsync: createFolderMutation.mutateAsync,
    isCreatingFolder: createFolderMutation.isPending,

    renameFolder: (folderId: string, name: string) =>
      renameFolderMutation.mutate({ folderId, name }),
    isRenamingFolder: renameFolderMutation.isPending,

    deleteFolder: deleteFolderMutation.mutate,
    isDeletingFolder: deleteFolderMutation.isPending,

    pinFolder: (folderId: string, isPinned: boolean) =>
      pinFolderMutation.mutate({ folderId, isPinned }),

    updateFolder: (folderId: string, patch: UpdateFolderRequest) =>
      updateFolderMutation.mutate({ folderId, patch }),

    addItemToFolder: addItemMutation.mutate,
    isAddingItem: addItemMutation.isPending,

    removeItemFromFolder: removeItemMutation.mutate,
    isRemovingItem: removeItemMutation.isPending,

    createFolderForItem,
  };
}
