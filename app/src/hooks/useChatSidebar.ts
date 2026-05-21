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
 * Per-folder, per-type totals from `/contents` — drives the "Show 5 more"
 * expander's visibility (the button hides when `visible.length >= total`).
 */
export type FolderSectionTotalsMap = Record<
  string,
  { conversation: number; dashboard: number }
>;

/**
 * Per-section pagination state. Keyed by `sectionKey(folderId, itemType)`.
 * Value is the count of *additional* pages fetched beyond page 1 (which
 * comes from `/contents`). Each "Show 5 more" click increments; "Show less"
 * resets to 0.
 */
export type SectionShowMoreMap = Record<string, number>;

const sectionKey = (folderId: string, itemType: FolderItemType) =>
  `${folderId}:${itemType}`;

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
  const isSystem = folder.systemFolderType != null;
  return {
    id: folder.folderId,
    label: folder.name,
    isExpanded,
    isPinned: folder.displayOrder === 0,
    displayOrder: folder.displayOrder,
    isSystem,
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
  /** Per-folder totals per item type, from `/contents` — used by the
   *  in-folder "Show 5 more" expander to decide when to hide itself. */
  folderSectionTotals: FolderSectionTotalsMap;
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

  // Per-section pagination state.
  sectionShowMore: SectionShowMoreMap;
  revealMoreInSection: (folderId: string, itemType: FolderItemType) => void;
  collapseSection: (folderId: string, itemType: FolderItemType) => void;

  // Folder mutations
  createFolder: (name: string) => void;
  isCreatingFolder: boolean;
  renameFolder: (folderId: string, newName: string) => void;
  renameFolderAsync: (folderId: string, newName: string) => Promise<unknown>;
  isRenamingFolder: boolean;
  deleteFolder: (folderId: string) => void;
  deleteFolderAsync: (folderId: string) => Promise<void>;
  isDeletingFolder: boolean;
  pinFolder: (folderId: string, isPinned: boolean) => void;

  // Conversation mutations
  renameConversation: (conversationId: string, newName: string) => void;
  renameConversationAsync: (
    conversationId: string,
    newName: string,
  ) => Promise<unknown>;
  isRenamingConversation: boolean;
  deleteConversation: (conversationId: string) => void;
  deleteConversationAsync: (conversationId: string) => Promise<unknown>;
  isDeletingConversation: boolean;

  // Item membership mutations (generic over chat + dashboard).
  //
  // `setItemFolders` is the canonical write path for multi-folder membership:
  // the modal sends the full target set and the server diffs against current.
  // `createFolderForItem` is a composition helper used by the inline
  // "+ Create New Folder" flow. `removeItemFromFolder` is the single-DELETE
  // "Remove from this folder" action.
  setItemFolders: (
    itemType: FolderItemType,
    itemId: string,
    folderIds: string[],
  ) => Promise<void>;
  createFolderForItem: (
    itemId: string,
    folderName: string,
    itemType?: FolderItemType,
  ) => void;
  removeItemFromFolder: (itemId: string, itemType?: FolderItemType) => void;
  removeItemFromFolderAsync: (
    itemId: string,
    itemType?: FolderItemType,
  ) => Promise<void>;
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

  // ── Per-section pagination state ───────────────────────────────────────
  const [sectionShowMore, setSectionShowMore] = useState<SectionShowMoreMap>(
    {},
  );
  const revealMoreInSection = useCallback(
    (folderId: string, itemType: FolderItemType) => {
      const key = sectionKey(folderId, itemType);
      setSectionShowMore((prev) => ({
        ...prev,
        [key]: (prev[key] ?? 0) + 1,
      }));
    },
    [],
  );
  const collapseSection = useCallback(
    (folderId: string, itemType: FolderItemType) => {
      const key = sectionKey(folderId, itemType);
      setSectionShowMore((prev) => {
        if (!prev[key]) return prev;
        return { ...prev, [key]: 0 };
      });
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

  // ── Per-section pagination queries ─────────────────────────────────────
  // One /items?page=N query per "Show 5 more" click. Page 1 comes from
  // /contents; pages 2..(extraPages + 1) come from /items.
  const pageSlots = useMemo(() => {
    const slots: Array<{
      folderId: string;
      itemType: FolderItemType;
      page: number;
    }> = [];
    for (const folderId of folderIds) {
      if (!expandedFolderIds.has(folderId)) continue;
      for (const itemType of [
        "conversation",
        "dashboard",
      ] as FolderItemType[]) {
        const extraPages = sectionShowMore[sectionKey(folderId, itemType)] ?? 0;
        for (let i = 0; i < extraPages; i++) {
          slots.push({ folderId, itemType, page: 2 + i });
        }
      }
    }
    return slots;
  }, [folderIds, expandedFolderIds, sectionShowMore]);

  const pageQueries = useQueries({
    queries: pageSlots.map(({ folderId, itemType, page }) => ({
      queryKey: folderKeys.itemsPage(folderId, itemType, page),
      queryFn: () =>
        foldersService.items<FolderConversationRow | FolderDashboardRow>(
          folderId,
          { itemType, page, limit: FOLDER_CONTENTS_LIMIT },
        ),
      staleTime: CONVERSATIONS_STALE_TIME,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    })),
  });

  // `useQueries` returns a fresh outer array each render. We need the memo
  // to recompute when any individual slot's data settles, but a spread
  // dep array (`[...pageDataRefs]`) violates the constant-length rule and
  // breaks under rapid expand/collapse. Instead, fold all slot identities
  // and their resolved page numbers into a single deterministic signature
  // so the dep array stays a fixed shape.
  const pageQueriesSignature = pageSlots
    .map((slot, idx) => {
      const data = pageQueries[idx]?.data;
      return `${slot.folderId}:${slot.itemType}:${slot.page}:${
        data ? data.items.length : "pending"
      }`;
    })
    .join("|");
  const sectionExtraRows = useMemo(() => {
    const map: Record<
      string,
      Array<FolderConversationRow | FolderDashboardRow>
    > = {};
    pageSlots.forEach((slot, idx) => {
      const key = sectionKey(slot.folderId, slot.itemType);
      const rows = pageQueries[idx]?.data?.items ?? [];
      if (!map[key]) map[key] = [];
      map[key].push(...rows);
    });
    return map;
    // pageQueriesSignature already encodes pageSlots identity + each slot's
    // settled state, so re-running the memo when it changes is sufficient.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageQueriesSignature]);

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
    folderSectionTotals,
  } = useMemo(() => {
    const itemsMap: FolderItemsMap = {};
    const dashMap: FolderDashboardsMap = {};
    const rawMap: FolderConversationsMap = {};
    const loadingMap: FolderLoadingMap = {};
    const totals: FolderSectionTotalsMap = {};
    folderIds.forEach((folderId, idx) => {
      const query = folderContentsQueries[idx];
      const data = query?.data as FolderContentsResponse | undefined;
      loadingMap[folderId] = !!query?.isLoading;

      // System folders (e.g. "Schedule Command") are conversation-only —
      // we never surface dashboards inside them even if the server returns
      // any. The /set-item-folders endpoint also rejects adds, so in
      // practice this slice should always be empty, but rendering is
      // gated here so a stray membership row can't leak through.
      const folderMeta = foldersData[idx];
      const isSystem = folderMeta?.systemFolderType != null;

      const baseConvs = data?.conversations?.items ?? [];
      const baseDashs = isSystem ? [] : (data?.dashboards?.items ?? []);
      const extraConvs = (sectionExtraRows[
        sectionKey(folderId, "conversation")
      ] ?? []) as FolderConversationRow[];
      const extraDashs = isSystem
        ? []
        : ((sectionExtraRows[sectionKey(folderId, "dashboard")] ??
            []) as FolderDashboardRow[]);
      const convsTotal = data?.conversations?.total;
      const dashsTotal = isSystem ? 0 : data?.dashboards?.total;
      // Server total can be smaller than what we hold from earlier pages
      // (e.g. items deleted server-side); never render past it.
      const conversations = [...baseConvs, ...extraConvs].slice(
        0,
        convsTotal ?? Infinity,
      );
      const dashRows = [...baseDashs, ...extraDashs].slice(
        0,
        dashsTotal ?? Infinity,
      );

      rawMap[folderId] = conversations;
      itemsMap[folderId] = conversations
        .filter((c) => c.title && c.title.trim() !== "")
        .map((c) => conversationRowToSidebarItem(c, folderId));
      dashMap[folderId] = dashRows.map((d) =>
        dashboardRowToFolderItem(d, folderId),
      );

      totals[folderId] = {
        conversation: convsTotal ?? conversations.length,
        dashboard: dashsTotal ?? dashRows.length,
      };
    });
    return {
      folderItems: itemsMap,
      folderDashboards: dashMap,
      folderConversationsMap: rawMap,
      folderLoadingMap: loadingMap,
      folderSectionTotals: totals,
    };
  }, [folderIds, foldersData, folderContentsQueries, sectionExtraRows]);

  // ── Mutations ──────────────────────────────────────────────────────────
  const {
    createFolder: createFolderRaw,
    isCreatingFolder,
    renameFolder,
    renameFolderAsync,
    isRenamingFolder,
    deleteFolder,
    deleteFolderAsync,
    isDeletingFolder,
    pinFolder,
    setItemFoldersAsync,
    removeItemFromFolder: removeItemFromFolderRaw,
    removeItemFromFolderAsync: removeItemFromFolderAsyncRaw,
    createFolderForItem: createFolderForItemRaw,
    isSettingFolders,
    isRemovingItem,
  } = useFolderMutations();

  const {
    mutate: renameConversationMutation,
    mutateAsync: renameConversationMutationAsync,
    isPending: isRenamingConversation,
  } = useRenameConversation();

  const {
    mutate: deleteConversationMutation,
    mutateAsync: deleteConversationMutationAsync,
    isPending: isDeletingConversation,
  } = useDeleteConversation();

  const renameConversation = useCallback(
    (conversationId: string, newName: string) =>
      renameConversationMutation({ conversationId, title: newName }),
    [renameConversationMutation],
  );

  const renameConversationAsync = useCallback(
    (conversationId: string, newName: string) =>
      renameConversationMutationAsync({ conversationId, title: newName }),
    [renameConversationMutationAsync],
  );

  const deleteConversation = useCallback(
    (conversationId: string) => deleteConversationMutation(conversationId),
    [deleteConversationMutation],
  );

  const deleteConversationAsync = useCallback(
    (conversationId: string) => deleteConversationMutationAsync(conversationId),
    [deleteConversationMutationAsync],
  );

  // Source-folder lookup — only needed by removeItemFromFolder, which still
  // operates on a single (folder, item) pair via the DELETE endpoint.
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

  const setItemFolders = useCallback(
    async (
      itemType: FolderItemType,
      itemId: string,
      folderIds: string[],
    ): Promise<void> => {
      await setItemFoldersAsync({ itemType, itemId, folderIds });
    },
    [setItemFoldersAsync],
  );

  const removeItemFromFolder = useCallback(
    (itemId: string, itemType: FolderItemType = "conversation") => {
      const sourceFolderId = findSourceFolderId(itemId, itemType);
      if (!sourceFolderId) return;
      removeItemFromFolderRaw({ folderId: sourceFolderId, itemType, itemId });
    },
    [findSourceFolderId, removeItemFromFolderRaw],
  );

  const removeItemFromFolderAsync = useCallback(
    async (itemId: string, itemType: FolderItemType = "conversation") => {
      const sourceFolderId = findSourceFolderId(itemId, itemType);
      if (!sourceFolderId) return;
      await removeItemFromFolderAsyncRaw({
        folderId: sourceFolderId,
        itemType,
        itemId,
      });
    },
    [findSourceFolderId, removeItemFromFolderAsyncRaw],
  );

  const createFolderForItem = useCallback(
    (
      itemId: string,
      folderName: string,
      itemType: FolderItemType = "conversation",
    ) => {
      // Fire-and-forget; the mutation handles toasts on its own.
      void createFolderForItemRaw({ name: folderName, itemType, itemId });
    },
    [createFolderForItemRaw],
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
    folderSectionTotals,
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
    revealMoreInSection,
    collapseSection,

    createFolder: (name: string) => createFolderRaw({ name }),
    isCreatingFolder,
    renameFolder,
    renameFolderAsync,
    isRenamingFolder,
    deleteFolder,
    deleteFolderAsync,
    isDeletingFolder,
    pinFolder,

    renameConversation,
    renameConversationAsync,
    isRenamingConversation,
    deleteConversation,
    deleteConversationAsync,
    isDeletingConversation,

    setItemFolders,
    createFolderForItem,
    removeItemFromFolder,
    removeItemFromFolderAsync,
    isMovingItem: isSettingFolders || isRemovingItem,
  };
}
