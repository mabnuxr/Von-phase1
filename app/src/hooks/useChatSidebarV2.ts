import { useMemo, useCallback, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useChatSidebar, chatSidebarKeys } from "./useChatSidebar";
import { useCreateFolder } from "./useCreateFolder";
import { useDeleteFolder } from "./useDeleteFolder";
import { useRenameFolder } from "./useRenameFolder";
import {
  useAddConversationToFolder,
  useRemoveConversationFromFolder,
} from "./useMoveConversationToFolder";
import { folderConversationsKeys } from "./useFolderConversations";
import { conversationsService } from "../services";
import { CONVERSATIONS_STALE_TIME } from "../config/constants";
import type {
  SidebarConversation,
  SidebarPagination,
} from "../types/chatSidebar";
import type { Folder, SidebarItem } from "@vonlabs/design-components";

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
 * Map of folder ID to items within that folder
 */
export type FolderItemsMap = Record<string, SidebarItem[]>;

/**
 * Map of folder ID to loading state
 */
export type FolderLoadingMap = Record<string, boolean>;

/**
 * Return type for the useChatSidebarV2 hook
 */
export interface UseChatSidebarV2Return {
  /** Transformed folders for ChatSidebarV2 component */
  folders: Folder[];
  /** Transformed sidebar items (unfiled conversations) for ChatSidebarV2 component */
  items: SidebarItem[];
  /** Map of folder ID to items within that folder */
  folderItems: FolderItemsMap;
  /** Map of folder ID to loading state */
  folderLoadingMap: FolderLoadingMap;
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
  /** Set of expanded folder IDs */
  expandedFolderIds: Set<string>;
  /** Toggle folder expansion and trigger fetch if needed */
  toggleFolderExpanded: (folderId: string) => void;
  /** Move a conversation to a folder (or remove from folder if targetFolderId is null) */
  moveConversationToFolder: (
    conversationId: string,
    targetFolderId: string | null,
    sourceFolderId?: string | null,
  ) => void;
  /** Whether conversation move is in progress */
  isMovingConversation: boolean;
  /** ID of newly created folder (for auto-edit mode) */
  newlyCreatedFolderId: string | null;
  /** Clear the newly created folder ID after editing is complete */
  clearNewlyCreatedFolderId: () => void;
  /** Create a new folder and move a conversation to it */
  createFolderAndMoveItem: (
    conversationId: string,
    folderName: string,
    sourceFolderId?: string | null,
  ) => void;
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

  // Track expanded folder IDs
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(),
  );

  // Track newly created folder ID for auto-edit mode
  const [newlyCreatedFolderId, setNewlyCreatedFolderId] = useState<
    string | null
  >(null);

  // Track pending move operation (for create folder + move flow)
  const [pendingMoveItem, setPendingMoveItem] = useState<{
    conversationId: string;
    sourceFolderId: string | null;
  } | null>(null);

  // Get folder IDs for querying
  const folderIds = useMemo(
    () => sidebarData?.folders?.map((f) => f.folderId) ?? [],
    [sidebarData?.folders],
  );

  // Fetch folder conversations for all expanded folders using useQueries
  const folderConversationsQueries = useQueries({
    queries: folderIds.map((folderId) => ({
      queryKey: folderConversationsKeys.folder(folderId),
      queryFn: () => conversationsService.getFolderConversations(folderId),
      enabled: expandedFolderIds.has(folderId),
      staleTime: CONVERSATIONS_STALE_TIME,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    })),
  });

  // Build folder items map from query results
  const folderItems = useMemo(() => {
    const map: FolderItemsMap = {};
    folderIds.forEach((folderId, index) => {
      const query = folderConversationsQueries[index];
      if (query?.data?.conversations) {
        map[folderId] = query.data.conversations.map((conv) => ({
          id: conv.conversationId,
          label: conv.title,
          type: "chat" as const,
          href: `/chat/${conv.conversationId}`,
          folderId: conv.folderId,
        }));
      } else {
        map[folderId] = [];
      }
    });
    return map;
  }, [folderIds, folderConversationsQueries]);

  // Build folder loading map
  const folderLoadingMap = useMemo(() => {
    const map: FolderLoadingMap = {};
    folderIds.forEach((folderId, index) => {
      const query = folderConversationsQueries[index];
      map[folderId] = query?.isLoading ?? false;
    });
    return map;
  }, [folderIds, folderConversationsQueries]);

  // Toggle folder expansion
  const toggleFolderExpanded = useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Folder creation mutation
  const { mutate: createFolderMutation, isPending: isCreatingFolder } =
    useCreateFolder();

  // Folder deletion mutation
  const { mutate: deleteFolderMutation, isPending: isDeletingFolder } =
    useDeleteFolder();

  // Folder rename mutation
  const { mutate: renameFolderMutation, isPending: isRenamingFolder } =
    useRenameFolder();

  // Add conversation to folder mutation
  const {
    mutate: addToFolderMutation,
    isPending: isAddingToFolder,
  } = useAddConversationToFolder();

  // Remove conversation from folder mutation
  const {
    mutate: removeFromFolderMutation,
    isPending: isRemovingFromFolder,
  } = useRemoveConversationFromFolder();

  // Combined loading state for move operations
  const isMovingConversation = isAddingToFolder || isRemovingFromFolder;

  // Transform folders to ChatSidebarV2 format with expansion state
  const folders = useMemo(
    () =>
      (sidebarData?.folders ?? []).map((folder) => ({
        id: folder.folderId,
        label: folder.name,
        type: folder.folderType,
        isExpanded: expandedFolderIds.has(folder.folderId),
      })),
    [sidebarData?.folders, expandedFolderIds],
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

  // Stable callback for creating folders - tracks newly created folder ID
  const createFolder = useCallback(
    (name: string) => {
      createFolderMutation(name, {
        onSuccess: (data) => {
          setNewlyCreatedFolderId(data.folderId);

          // If there's a pending move operation, execute it now
          if (pendingMoveItem) {
            addToFolderMutation({
              conversationId: pendingMoveItem.conversationId,
              targetFolderId: data.folderId,
              sourceFolderId: pendingMoveItem.sourceFolderId ?? undefined,
            });
            setPendingMoveItem(null);
          }
        },
      });
    },
    [createFolderMutation, pendingMoveItem, addToFolderMutation],
  );

  // Clear newly created folder ID after editing is complete
  const clearNewlyCreatedFolderId = useCallback(() => {
    setNewlyCreatedFolderId(null);
  }, []);

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

  // Stable callback for moving conversations to folders
  // If targetFolderId is null, removes from folder; otherwise adds to folder
  const moveConversationToFolder = useCallback(
    (
      conversationId: string,
      targetFolderId: string | null,
      sourceFolderId?: string | null,
    ) => {
      if (targetFolderId === null) {
        // Remove from folder (move to root)
        if (sourceFolderId) {
          removeFromFolderMutation({
            conversationId,
            sourceFolderId,
          });
        }
      } else {
        // Add to target folder
        addToFolderMutation({
          conversationId,
          targetFolderId,
          sourceFolderId,
        });
      }
    },
    [addToFolderMutation, removeFromFolderMutation],
  );

  // Create folder and move item in one flow
  const createFolderAndMoveItem = useCallback(
    (
      conversationId: string,
      folderName: string,
      sourceFolderId?: string | null,
    ) => {
      // Set pending move before creating folder
      setPendingMoveItem({
        conversationId,
        sourceFolderId: sourceFolderId ?? null,
      });
      // Create folder - move will happen in onSuccess callback
      createFolderMutation(folderName, {
        onSuccess: (data) => {
          setNewlyCreatedFolderId(data.folderId);
          // Execute the move (add to the new folder)
          addToFolderMutation({
            conversationId,
            targetFolderId: data.folderId,
            sourceFolderId: sourceFolderId ?? undefined,
          });
          setPendingMoveItem(null);
        },
      });
    },
    [createFolderMutation, addToFolderMutation],
  );

  return {
    folders,
    items,
    folderItems,
    folderLoadingMap,
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
    expandedFolderIds,
    toggleFolderExpanded,
    moveConversationToFolder,
    isMovingConversation,
    newlyCreatedFolderId,
    clearNewlyCreatedFolderId,
    createFolderAndMoveItem,
  };
}

// Re-export query keys for cache invalidation
export { chatSidebarKeys };
