import { useCallback, useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  folderKeys,
  useFoldersList,
  useFolderMutations,
  useUnfiledItems,
} from "./folders";
import { foldersService } from "../services";
import { CONVERSATIONS_STALE_TIME } from "../config/constants";
import { useDeleteConversation } from "./useConversations";
import { useRenameConversation } from "./useRenameConversation";
import type {
  Folder as ApiFolder,
  FolderItemType,
  FolderContentsResponse,
  FolderConversationRow,
  FolderDashboardRow,
} from "../types/chatSidebar";
import type {
  DashboardSidebarItem,
  Folder as UiFolder,
  SidebarItem,
} from "@vonlabs/design-components";
import { FOLDER_CONTENTS_LIMIT } from "./folders";

// ──────────────────────────────────────────────────────────────────────────
// Public type aliases for consumers (Container, ConversationMoreMenu, …)
// ──────────────────────────────────────────────────────────────────────────

export type FolderItemsMap = Record<string, SidebarItem[]>;
/**
 * Per-folder dashboards. Same row shape as `FolderItemsMap` — both render
 * through the shared `ConversationItem`, with `type` distinguishing them.
 */
export type FolderDashboardsMap = Record<string, SidebarItem[]>;
export type FolderConversationsMap = Record<string, FolderConversationRow[]>;
export type FolderLoadingMap = Record<string, boolean>;

/**
 * Per-section "Show all" state. When `true`, the section is rendered from
 * the paginated `useFolderItems` infinite query; otherwise the first
 * `FOLDER_CONTENTS_LIMIT` items from `useFolderContents` drive the UI.
 */
export type SectionShowMoreMap = Record<string, boolean>;

// ──────────────────────────────────────────────────────────────────────────
// Adapters: API rows (snake_case) → design-components UI types (camelCase)
// ──────────────────────────────────────────────────────────────────────────

function conversationRowToSidebarItem(
  conv: FolderConversationRow,
  folderId: string | null,
): SidebarItem {
  return {
    id: conv.conversation_id,
    label: conv.title,
    type: "chat",
    href: `/chat/${conv.conversation_id}`,
    folderId,
    approvalState:
      conv.approval_state === "pending" || conv.approval_state === "expired"
        ? conv.approval_state
        : undefined,
  };
}

function dashboardRowToSidebarItem(
  dash: FolderDashboardRow,
): DashboardSidebarItem {
  return {
    id: dash.dashboard_id,
    label: dash.dashboard_name,
    state: dash.status === "draft" ? "draft" : "published",
    visibility: dash.is_owner ? "private" : "org",
    isOwner: dash.is_owner,
    lastSaved: dash.updated_at,
    href: `/dashboard/${dash.dashboard_id}`,
  };
}

/**
 * Adapter for in-folder dashboards. Returns the unified `SidebarItem` shape
 * (`type: 'dashboard'`) so the folder body renders dashboards through the
 * same `ConversationItem` row used for chats — matching height, padding,
 * hover, and kebab placement.
 */
function dashboardRowToFolderItem(
  dash: FolderDashboardRow,
  folderId: string,
): SidebarItem {
  return {
    id: dash.dashboard_id,
    label: dash.dashboard_name,
    type: "dashboard",
    href: `/dashboard/${dash.dashboard_id}`,
    folderId,
    isOwner: dash.is_owner,
  };
}

function apiFolderToUiFolder(folder: ApiFolder, isExpanded: boolean): UiFolder {
  return {
    id: folder.folderId,
    label: folder.name,
    isExpanded,
    isPinned: folder.displayOrder === 0,
    displayOrder: folder.displayOrder,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Aggregator hook
// ──────────────────────────────────────────────────────────────────────────

export interface UseChatSidebarReturn {
  /** Folders list, sorted by displayOrder asc then name (server-sorted). */
  folders: UiFolder[];
  /** Top-level (unfiled) chat items for the design-components Chats section. */
  items: SidebarItem[];
  /** Top-level (unfiled) dashboard items for the design-components Dashboards section. */
  dashboards: DashboardSidebarItem[];
  /** Per-folder chat items (UI shape). */
  folderItems: FolderItemsMap;
  /** Per-folder dashboard items (UI shape). */
  folderDashboards: FolderDashboardsMap;
  /** Per-folder raw conversation rows (snake_case) — needed by approval / rename hooks. */
  folderConversationsMap: FolderConversationsMap;
  /** Per-folder loading flag (true while contents are being fetched). */
  folderLoadingMap: FolderLoadingMap;
  /** Raw unfiled conversation rows (snake_case). */
  unfiledConversations: FolderConversationRow[];

  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;

  hasNextDashboardPage: boolean;
  isFetchingNextDashboardPage: boolean;
  fetchNextDashboardPage: () => void;

  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;

  // Folder collapse/expand
  expandedFolderIds: Set<string>;
  toggleFolderExpanded: (folderId: string) => void;

  // Per-section "Show more" state
  sectionShowMore: SectionShowMoreMap;
  toggleSectionShowMore: (folderId: string, itemType: FolderItemType) => void;

  // Folder mutations
  createFolder: (name: string) => void;
  isCreatingFolder: boolean;
  renameFolder: (folderId: string, newName: string) => void;
  isRenamingFolder: boolean;
  deleteFolder: (folderId: string) => void;
  isDeletingFolder: boolean;
  pinFolder: (folderId: string, isPinned: boolean) => void;

  // Conversation mutations
  renameConversation: (conversationId: string, newName: string) => void;
  isRenamingConversation: boolean;
  deleteConversation: (conversationId: string) => void;
  isDeletingConversation: boolean;

  // Item membership mutations (generic over chat + dashboard)
  moveItemToFolder: (
    itemId: string,
    targetFolderId: string,
    itemType?: FolderItemType,
  ) => void;
  createFolderForItem: (
    itemId: string,
    folderName: string,
    itemType?: FolderItemType,
  ) => void;
  removeItemFromFolder: (itemId: string, itemType?: FolderItemType) => void;
  isMovingItem: boolean;
}

/**
 * Aggregator hook for the sidebar. Wires the new Folders v2 hooks together,
 * adapts API rows to the design-components UI shape, and exposes a single
 * stable surface to the container so the JSX layer does no business logic.
 */
export function useChatSidebar(): UseChatSidebarReturn {
  const queryClient = useQueryClient();

  // ── Top-level lists ────────────────────────────────────────────────────
  const {
    data: foldersData = [],
    isLoading: isFoldersLoading,
    isError: isFoldersError,
    error: foldersError,
    refetch: refetchFolders,
  } = useFoldersList();

  const {
    data: unfiledChatsData,
    isLoading: isUnfiledChatsLoading,
    fetchNextPage: fetchNextChatPage,
    hasNextPage: hasNextChatPage,
    isFetchingNextPage: isFetchingNextChatPage,
    refetch: refetchUnfiledChats,
  } = useUnfiledItems<FolderConversationRow>({ itemType: "conversation" });

  const {
    data: unfiledDashboardsData,
    isLoading: isUnfiledDashboardsLoading,
    fetchNextPage: fetchNextDashboardPage,
    hasNextPage: hasNextDashboardPage,
    isFetchingNextPage: isFetchingNextDashboardPage,
    refetch: refetchUnfiledDashboards,
  } = useUnfiledItems<FolderDashboardRow>({
    itemType: "dashboard",
    limit: FOLDER_CONTENTS_LIMIT,
  });

  // ── Folder expansion state ─────────────────────────────────────────────
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(),
  );
  const toggleFolderExpanded = useCallback((folderId: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  // ── Per-section show-more state ────────────────────────────────────────
  const [sectionShowMore, setSectionShowMore] = useState<SectionShowMoreMap>(
    {},
  );
  const toggleSectionShowMore = useCallback(
    (folderId: string, itemType: FolderItemType) => {
      const key = `${folderId}:${itemType}`;
      setSectionShowMore((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    [],
  );

  // ── Per-folder contents (lazy on expand) ───────────────────────────────
  const folderIds = useMemo(
    () => foldersData.map((f) => f.folderId),
    [foldersData],
  );

  const folderContentsQueries = useQueries({
    queries: folderIds.map((folderId) => ({
      queryKey: folderKeys.contents(folderId),
      queryFn: () =>
        foldersService.contents(folderId, {
          types: ["dashboard", "conversation"] as FolderItemType[],
          dashboardsLimit: FOLDER_CONTENTS_LIMIT,
          conversationsLimit: FOLDER_CONTENTS_LIMIT,
        }),
      enabled: expandedFolderIds.has(folderId),
      staleTime: CONVERSATIONS_STALE_TIME,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    })),
  });

  // ── Derived UI shapes ──────────────────────────────────────────────────

  const folders: UiFolder[] = useMemo(
    () =>
      foldersData.map((f) =>
        apiFolderToUiFolder(f, expandedFolderIds.has(f.folderId)),
      ),
    [foldersData, expandedFolderIds],
  );

  const allUnfiledConversations: FolderConversationRow[] = useMemo(
    () => unfiledChatsData?.pages.flatMap((page) => page.items) ?? [],
    [unfiledChatsData?.pages],
  );

  const items: SidebarItem[] = useMemo(
    () =>
      allUnfiledConversations
        .filter((c) => c.title && c.title.trim() !== "")
        .map((c) => conversationRowToSidebarItem(c, null)),
    [allUnfiledConversations],
  );

  const dashboards: DashboardSidebarItem[] = useMemo(
    () =>
      (unfiledDashboardsData?.pages.flatMap((page) => page.items) ?? []).map(
        dashboardRowToSidebarItem,
      ),
    [unfiledDashboardsData?.pages],
  );

  const {
    folderItems,
    folderDashboards,
    folderConversationsMap,
    folderLoadingMap,
  } = useMemo(() => {
    const itemsMap: FolderItemsMap = {};
    const dashMap: FolderDashboardsMap = {};
    const rawMap: FolderConversationsMap = {};
    const loadingMap: FolderLoadingMap = {};
    folderIds.forEach((folderId, idx) => {
      const query = folderContentsQueries[idx];
      const data = query?.data as FolderContentsResponse | undefined;
      loadingMap[folderId] = !!query?.isLoading;
      const conversations = data?.conversations?.items ?? [];
      const dashRows = data?.dashboards?.items ?? [];
      rawMap[folderId] = conversations;
      itemsMap[folderId] = conversations
        .filter((c) => c.title && c.title.trim() !== "")
        .map((c) => conversationRowToSidebarItem(c, folderId));
      dashMap[folderId] = dashRows.map((d) =>
        dashboardRowToFolderItem(d, folderId),
      );
    });
    return {
      folderItems: itemsMap,
      folderDashboards: dashMap,
      folderConversationsMap: rawMap,
      folderLoadingMap: loadingMap,
    };
  }, [folderIds, folderContentsQueries]);

  // ── Mutations ──────────────────────────────────────────────────────────
  const {
    createFolder: createFolderRaw,
    createFolderAsync,
    isCreatingFolder,
    renameFolder,
    isRenamingFolder,
    deleteFolder,
    isDeletingFolder,
    pinFolder,
    addItemToFolder,
    removeItemFromFolder: removeItemFromFolderRaw,
    isAddingItem,
    isRemovingItem,
  } = useFolderMutations();

  const {
    mutate: renameConversationMutation,
    isPending: isRenamingConversation,
  } = useRenameConversation();

  const {
    mutate: deleteConversationMutation,
    isPending: isDeletingConversation,
  } = useDeleteConversation();

  const renameConversation = useCallback(
    (conversationId: string, newName: string) =>
      renameConversationMutation({ conversationId, title: newName }),
    [renameConversationMutation],
  );

  const deleteConversation = useCallback(
    (conversationId: string) => deleteConversationMutation(conversationId),
    [deleteConversationMutation],
  );

  // Source-folder lookup — used so move/remove/createFolderForItem can
  // invalidate the source folder's contents alongside the target's.
  const findSourceFolderId = useCallback(
    (itemId: string, itemType: FolderItemType): string | null => {
      const map = itemType === "conversation" ? folderItems : folderDashboards;
      for (const [folderId, list] of Object.entries(map)) {
        if (list.some((it) => it.id === itemId)) return folderId;
      }
      return null;
    },
    [folderItems, folderDashboards],
  );

  const moveItemToFolder = useCallback(
    (
      itemId: string,
      targetFolderId: string,
      itemType: FolderItemType = "conversation",
    ) => {
      const sourceFolderId = findSourceFolderId(itemId, itemType);
      addItemToFolder({
        folderId: targetFolderId,
        itemType,
        itemId,
        sourceFolderId,
      });
    },
    [addItemToFolder, findSourceFolderId],
  );

  const removeItemFromFolder = useCallback(
    (itemId: string, itemType: FolderItemType = "conversation") => {
      const sourceFolderId = findSourceFolderId(itemId, itemType);
      if (!sourceFolderId) return;
      removeItemFromFolderRaw({ folderId: sourceFolderId, itemType, itemId });
    },
    [findSourceFolderId, removeItemFromFolderRaw],
  );

  const createFolderForItem = useCallback(
    (
      itemId: string,
      folderName: string,
      itemType: FolderItemType = "conversation",
    ) => {
      const sourceFolderId = findSourceFolderId(itemId, itemType);
      // Compose: create then file. createFolderAsync resolves with the new folder.
      createFolderAsync({ name: folderName }).then((folder) => {
        if (!folder) return;
        addItemToFolder({
          folderId: folder.folderId,
          itemType,
          itemId,
          sourceFolderId,
        });
      });
    },
    [addItemToFolder, createFolderAsync, findSourceFolderId],
  );

  const refetch = useCallback(() => {
    refetchFolders();
    refetchUnfiledChats();
    refetchUnfiledDashboards();
    queryClient.invalidateQueries({ queryKey: folderKeys.all });
  }, [
    refetchFolders,
    refetchUnfiledChats,
    refetchUnfiledDashboards,
    queryClient,
  ]);

  return {
    folders,
    items,
    dashboards,
    folderItems,
    folderDashboards,
    folderConversationsMap,
    folderLoadingMap,
    unfiledConversations: allUnfiledConversations,

    hasNextPage: !!hasNextChatPage,
    isFetchingNextPage: isFetchingNextChatPage,
    fetchNextPage: () => {
      void fetchNextChatPage();
    },

    hasNextDashboardPage: !!hasNextDashboardPage,
    isFetchingNextDashboardPage,
    fetchNextDashboardPage: () => {
      void fetchNextDashboardPage();
    },

    isLoading:
      isFoldersLoading || isUnfiledChatsLoading || isUnfiledDashboardsLoading,
    isError: isFoldersError,
    error: (foldersError as Error | null) ?? null,
    refetch,

    expandedFolderIds,
    toggleFolderExpanded,

    sectionShowMore,
    toggleSectionShowMore,

    createFolder: (name: string) => createFolderRaw({ name }),
    isCreatingFolder,
    renameFolder,
    isRenamingFolder,
    deleteFolder,
    isDeletingFolder,
    pinFolder,

    renameConversation,
    isRenamingConversation,
    deleteConversation,
    isDeletingConversation,

    moveItemToFolder,
    createFolderForItem,
    removeItemFromFolder,
    isMovingItem: isAddingItem || isRemovingItem,
  };
}
