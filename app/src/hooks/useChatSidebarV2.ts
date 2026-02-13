import { useMemo, useCallback, useState, useRef } from "react";
import {
  useQueries,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useChatSidebar, chatSidebarKeys } from "./useChatSidebar";
import { useCreateFolder } from "./useCreateFolder";
import { useDeleteFolder } from "./useDeleteFolder";
import { useRenameFolder } from "./useRenameFolder";
import { usePinFolder } from "./usePinFolder";
import {
  useAddConversationToFolder,
  useRemoveConversationFromFolder,
} from "./useMoveConversationToFolder";
import { useDeleteConversation } from "./useConversations";
import { folderConversationsKeys } from "./useFolderConversations";
import { conversationsService } from "../services";
import { CONVERSATIONS_STALE_TIME } from "../config/constants";
import type {
  SidebarConversation,
  SidebarPagination,
  ChatSidebarResponse,
  FolderConversationsResponse,
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
  /** Fetch next page of unfiled conversations */
  fetchNextPage: () => void;
  /** Whether there are more unfiled conversations to load */
  hasNextPage: boolean;
  /** Whether next page is currently being fetched */
  isFetchingNextPage: boolean;
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
  /** Whether conversation move is in progress */
  isMovingConversation: boolean;
  /** Delete a conversation */
  deleteConversation: (conversationId: string) => void;
  /** Whether conversation deletion is in progress */
  isDeletingConversation: boolean;
  /** Pin/unpin a folder (placeholder — backend TBD) */
  pinFolder: (folderId: string, isPinned: boolean) => void;
  /** Move an item to a folder (auto-resolves source folder) */
  moveItemToFolder: (itemId: string, targetFolderId: string) => void;
  /** Create a new folder and move an item to it (auto-resolves source folder) */
  createFolderForItem: (itemId: string, folderName: string) => void;
  /** Remove an item from its current folder (auto-resolves source folder) */
  removeItemFromFolder: (itemId: string) => void;
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
    data: infiniteData,
    isLoading: isQueryLoading,
    isError,
    error,
    refetch,
    fetchNextPage: fetchNextPageRQ,
    hasNextPage: hasNextPageRQ,
    isFetchingNextPage,
  } = useChatSidebar();

  // First page contains folders (same across all pages)
  const firstPage = infiniteData?.pages[0];

  // Track expanded folder IDs
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(),
  );

  // Track pending move operation (for create folder + move flow)
  const [pendingMoveItem, setPendingMoveItem] = useState<{
    conversationId: string;
    sourceFolderId: string | null;
  } | null>(null);

  // Get folder IDs for querying
  const folderIds = useMemo(
    () => firstPage?.folders?.map((f) => f.folderId) ?? [],
    [firstPage?.folders],
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

  // Folder pin/unpin mutation
  const { mutate: pinFolderMutation } = usePinFolder();

  // Add conversation to folder mutation
  const { mutate: addToFolderMutation, isPending: isAddingToFolder } =
    useAddConversationToFolder();

  // Remove conversation from folder mutation
  const { mutate: removeFromFolderMutation, isPending: isRemovingFromFolder } =
    useRemoveConversationFromFolder();

  // Delete conversation mutation
  const queryClient = useQueryClient();
  const {
    mutate: deleteConversationMutation,
    isPending: isDeletingConversation,
  } = useDeleteConversation();

  // Combined loading state for move operations
  const isMovingConversation = isAddingToFolder || isRemovingFromFolder;

  // Transform folders to ChatSidebarV2 format with expansion state
  const folders = useMemo(
    () =>
      (firstPage?.folders ?? []).map((folder) => ({
        id: folder.folderId,
        label: folder.name,
        type: folder.folderType,
        isExpanded: expandedFolderIds.has(folder.folderId),
        isPinned: folder.displayOrder === 0,
        displayOrder: folder.displayOrder,
      })),
    [firstPage?.folders, expandedFolderIds],
  );

  // Flatten unfiled conversations across all pages
  const allUnfiledConversations = useMemo(
    () =>
      infiniteData?.pages.flatMap((page) => page.unfiled.conversations) ?? [],
    [infiniteData?.pages],
  );

  // Transform unfiled conversations to ChatSidebarV2 SidebarItem format
  const items = useMemo(
    () => transformConversationsToSidebarItems(allUnfiledConversations),
    [allUnfiledConversations],
  );

  // Raw unfiled conversations
  const unfiledConversations = allUnfiledConversations;

  // Pagination info from the last page
  const lastPage = infiniteData?.pages[infiniteData.pages.length - 1];
  const pagination = lastPage?.unfiled?.pagination ?? null;

  // Stable callback for creating folders
  const createFolder = useCallback(
    (name: string) => {
      createFolderMutation(name, {
        onSuccess: (data) => {
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

  // Stable callback for deleting a conversation with optimistic updates
  const deleteConversation = useCallback(
    (conversationId: string) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      queryClient.cancelQueries({ queryKey: chatSidebarKeys.sidebar() });
      queryClient.cancelQueries({ queryKey: folderConversationsKeys.all });

      // Snapshot sidebar data for rollback (InfiniteData shape)
      const previousSidebarData = queryClient.getQueryData<
        InfiniteData<ChatSidebarResponse>
      >(chatSidebarKeys.sidebar());

      // Snapshot folder conversations for rollback
      const previousFolderSnapshots: Record<
        string,
        FolderConversationsResponse | undefined
      > = {};
      folderIds.forEach((folderId) => {
        previousFolderSnapshots[folderId] =
          queryClient.getQueryData<FolderConversationsResponse>(
            folderConversationsKeys.folder(folderId),
          );
      });

      // Optimistically remove from unfiled conversations across all pages
      if (previousSidebarData) {
        queryClient.setQueryData<InfiniteData<ChatSidebarResponse>>(
          chatSidebarKeys.sidebar(),
          {
            ...previousSidebarData,
            pages: previousSidebarData.pages.map((page) => ({
              ...page,
              unfiled: {
                ...page.unfiled,
                conversations: page.unfiled.conversations.filter(
                  (c) => c.conversationId !== conversationId,
                ),
              },
            })),
          },
        );
      }

      // Optimistically remove from any folder conversations cache
      folderIds.forEach((folderId) => {
        const folderData = previousFolderSnapshots[folderId];
        if (
          folderData?.conversations.some(
            (c) => c.conversationId === conversationId,
          )
        ) {
          queryClient.setQueryData<FolderConversationsResponse>(
            folderConversationsKeys.folder(folderId),
            {
              ...folderData,
              conversations: folderData.conversations.filter(
                (c) => c.conversationId !== conversationId,
              ),
            },
          );
        }
      });

      deleteConversationMutation(conversationId, {
        onSuccess: () => {
          // Invalidate to refetch fresh data from server
          queryClient.invalidateQueries({
            queryKey: chatSidebarKeys.sidebar(),
          });
          queryClient.invalidateQueries({
            queryKey: folderConversationsKeys.all,
          });
        },
        onError: () => {
          // Rollback sidebar data
          if (previousSidebarData) {
            queryClient.setQueryData(
              chatSidebarKeys.sidebar(),
              previousSidebarData,
            );
          }
          // Rollback folder conversations
          Object.entries(previousFolderSnapshots).forEach(
            ([folderId, data]) => {
              if (data) {
                queryClient.setQueryData(
                  folderConversationsKeys.folder(folderId),
                  data,
                );
              }
            },
          );
        },
      });
    },
    [deleteConversationMutation, queryClient, folderIds],
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

  // Refs for stable callback access to latest data (avoids unstable deps)
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const folderItemsRef = useRef(folderItems);
  folderItemsRef.current = folderItems;

  // Stable helper: find item across unfiled + folder items
  const findItemById = useCallback(
    (itemId: string): SidebarItem | undefined => {
      const unfiled = itemsRef.current.find((i) => i.id === itemId);
      if (unfiled) return unfiled;
      for (const list of Object.values(folderItemsRef.current)) {
        const found = list.find((i) => i.id === itemId);
        if (found) return found;
      }
      return undefined;
    },
    [],
  );

  // Move item to a folder (auto-resolves source folder from current data)
  const moveItemToFolder = useCallback(
    (itemId: string, targetFolderId: string) => {
      const item = findItemById(itemId);
      moveConversationToFolder(itemId, targetFolderId, item?.folderId);
    },
    [findItemById, moveConversationToFolder],
  );

  // Create a new folder and move item to it (auto-resolves source folder)
  const createFolderForItem = useCallback(
    (itemId: string, folderName: string) => {
      const item = findItemById(itemId);
      createFolderAndMoveItem(itemId, folderName, item?.folderId);
    },
    [findItemById, createFolderAndMoveItem],
  );

  // Remove item from its current folder (auto-resolves source folder)
  const removeItemFromFolder = useCallback(
    (itemId: string) => {
      const item = findItemById(itemId);
      moveConversationToFolder(itemId, null, item?.folderId);
    },
    [findItemById, moveConversationToFolder],
  );

  // Pin/unpin a folder by updating its displayOrder
  // Pin: displayOrder = 0, Unpin: displayOrder = 100 (default)
  const pinFolder = useCallback(
    (folderId: string, isPinned: boolean) => {
      const displayOrder = isPinned ? 0 : 100;
      pinFolderMutation({ folderId, displayOrder });
    },
    [pinFolderMutation],
  );

  const fetchNextPage = useCallback(() => {
    fetchNextPageRQ();
  }, [fetchNextPageRQ]);

  return {
    folders,
    items,
    folderItems,
    folderLoadingMap,
    unfiledConversations,
    pagination,
    fetchNextPage,
    hasNextPage: !!hasNextPageRQ,
    isFetchingNextPage,
    isLoading: isQueryLoading,
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
    isMovingConversation,
    deleteConversation,
    isDeletingConversation,
    pinFolder,
    moveItemToFolder,
    createFolderForItem,
    removeItemFromFolder,
  };
}

// Re-export query keys for cache invalidation
export { chatSidebarKeys };
