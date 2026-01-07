import { useMemo, useCallback } from "react";
import { useChatSidebar, chatSidebarKeys } from "./useChatSidebar";
import { useCreateFolder } from "./useCreateFolder";
import { useDeleteFolder } from "./useDeleteFolder";
import { useRenameFolder } from "./useRenameFolder";
import type {
  ChatFolder,
  SidebarConversation,
  SidebarPagination,
} from "../types/chatSidebar";
import type { Folder, SidebarItem } from "@vonlabs/design-components";

/**
 * Transform API folders to ChatSidebarV2 Folder format
 */
function transformFoldersToSidebarFormat(folders: ChatFolder[]): Folder[] {
  return folders.map((folder) => ({
    id: folder.folderId,
    label: folder.name,
    type: folder.folderType,
    isExpanded: true,
  }));
}

/**
 * Transform API conversations to ChatSidebarV2 SidebarItem format
 */
function transformConversationsToSidebarItems(
  conversations: SidebarConversation[],
): SidebarItem[] {
  return conversations.map((conv) => ({
    id: conv.conversationId,
    label: conv.title,
    type: "chat" as const,
    href: `/chat/${conv.conversationId}`,
    folderId: null,
  }));
}

/**
 * Return type for the useChatSidebarV2 hook
 */
export interface UseChatSidebarV2Return {
  /** Transformed folders for ChatSidebarV2 component */
  folders: Folder[];
  /** Transformed sidebar items (unfiled conversations) for ChatSidebarV2 component */
  items: SidebarItem[];
  /** Raw unfiled conversations from API */
  unfiledConversations: SidebarConversation[];
  /** Pagination info for unfiled conversations */
  pagination: SidebarPagination | null;
  /** Whether any data is loading */
  isLoading: boolean;
  /** Whether there's an error */
  isError: boolean;
  /** Error object if any */
  error: Error | null;
  /** Refetch sidebar data */
  refetch: () => void;
  /** Create a new folder */
  createFolder: (name: string) => void;
  /** Whether folder creation is in progress */
  isCreatingFolder: boolean;
  /** Delete a folder by ID */
  deleteFolder: (folderId: string) => void;
  /** Whether folder deletion is in progress */
  isDeletingFolder: boolean;
  /** Rename a folder */
  renameFolder: (folderId: string, newName: string) => void;
  /** Whether folder renaming is in progress */
  isRenamingFolder: boolean;
}

/**
 * Aggregator hook for ChatSidebarV2
 *
 * This hook combines all sidebar-related API calls and provides
 * a clean interface for the Dashboard component. It handles:
 * - Data fetching via useChatSidebar
 * - Data transformation to ChatSidebarV2 format
 *
 * Usage:
 * ```tsx
 * const { folders, items, isLoading, error, refetch } = useChatSidebarV2();
 * ```
 */
export function useChatSidebarV2(): UseChatSidebarV2Return {
  const {
    data: sidebarData,
    isLoading,
    isError,
    error,
    refetch,
  } = useChatSidebar();

  // Folder creation mutation
  const { mutate: createFolderMutation, isPending: isCreatingFolder } =
    useCreateFolder();

  // Folder deletion mutation
  const { mutate: deleteFolderMutation, isPending: isDeletingFolder } =
    useDeleteFolder();

  // Folder rename mutation
  const { mutate: renameFolderMutation, isPending: isRenamingFolder } =
    useRenameFolder();

  // Transform folders to ChatSidebarV2 format
  const folders = useMemo(
    () => transformFoldersToSidebarFormat(sidebarData?.folders ?? []),
    [sidebarData?.folders],
  );

  // Transform unfiled conversations to ChatSidebarV2 SidebarItem format
  const items = useMemo(
    () =>
      transformConversationsToSidebarItems(
        sidebarData?.unfiled?.conversations ?? [],
      ),
    [sidebarData?.unfiled?.conversations],
  );

  // Raw unfiled conversations
  const unfiledConversations = useMemo(
    () => sidebarData?.unfiled?.conversations ?? [],
    [sidebarData?.unfiled?.conversations],
  );

  // Pagination info
  const pagination = sidebarData?.unfiled?.pagination ?? null;

  // Stable callback for creating folders
  const createFolder = useCallback(
    (name: string) => {
      createFolderMutation(name);
    },
    [createFolderMutation],
  );

  // Stable callback for deleting folders
  const deleteFolder = useCallback(
    (folderId: string) => {
      deleteFolderMutation(folderId);
    },
    [deleteFolderMutation],
  );

  // Stable callback for renaming folders
  const renameFolder = useCallback(
    (folderId: string, newName: string) => {
      renameFolderMutation({ folderId, name: newName });
    },
    [renameFolderMutation],
  );

  return {
    folders,
    items,
    unfiledConversations,
    pagination,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    createFolder,
    isCreatingFolder,
    deleteFolder,
    isDeletingFolder,
    renameFolder,
    isRenamingFolder,
  };
}

// Re-export query keys for cache invalidation
export { chatSidebarKeys };
