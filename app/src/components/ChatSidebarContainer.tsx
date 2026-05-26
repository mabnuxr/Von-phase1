import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChatSidebar } from "@vonlabs/design-components";
import type { ItemType } from "@vonlabs/design-components";
import type { ApprovalState, SidebarItem } from "@vonlabs/design-components";
import { ManageFoldersModal } from "./Analytics/ManageFoldersModal";
import { FolderItemType, toFolderItemType } from "../types/chatSidebar";
import { useAppShell } from "../hooks/useAppShell";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useShareStatus } from "../hooks/useShareStatus";
import { useChatSidebar } from "../hooks/useChatSidebar";
import type { FolderItemsMap } from "../hooks/useChatSidebar";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useTitleAnimation } from "../hooks/useTitleAnimation";
import { useUserPusherChannel } from "../hooks/useUserPusherChannel";
import { useApprovalStates } from "../hooks/useApprovalStates";
import { useSidebarDashboardRename } from "../hooks/useSidebarDashboardRename";
import { useSidebarDashboardDelete } from "../hooks/useSidebarDashboardDelete";
import { getUserInitials, getDisplayName } from "../lib/userUtils";
import { useGuardedNavigate } from "../providers/NavigationGuard";
import type { User } from "../services";
import { report } from "../lib/analytics/tracker";

/** Overlay animated titles onto sidebar items. */
function applyAnimatedTitles(
  items: SidebarItem[],
  animatedTitles: Map<string, string>,
): SidebarItem[] {
  if (animatedTitles.size === 0) return items;
  return items.map((item) => {
    const animated = animatedTitles.get(item.id);
    return animated !== undefined ? { ...item, label: animated } : item;
  });
}

function applyAnimatedTitlesToFolderItems(
  folderItems: FolderItemsMap,
  animatedTitles: Map<string, string>,
): FolderItemsMap {
  if (animatedTitles.size === 0) return folderItems;
  const result: FolderItemsMap = {};
  for (const [folderId, items] of Object.entries(folderItems)) {
    result[folderId] = applyAnimatedTitles(items, animatedTitles);
  }
  return result;
}

/** Stamp `approvalState` onto each item from the live state map. */
function applyApprovalStates(
  items: SidebarItem[],
  approvalStates: Map<string, ApprovalState>,
): SidebarItem[] {
  if (approvalStates.size === 0) {
    return items.some((item) => item.approvalState)
      ? items.map((item) =>
          item.approvalState ? { ...item, approvalState: undefined } : item,
        )
      : items;
  }
  return items.map((item) => {
    const next = approvalStates.get(item.id);
    if (next === item.approvalState) return item;
    return { ...item, approvalState: next };
  });
}

function applyApprovalStatesToFolderItems(
  folderItems: FolderItemsMap,
  approvalStates: Map<string, ApprovalState>,
): FolderItemsMap {
  const result: FolderItemsMap = {};
  for (const [folderId, items] of Object.entries(folderItems)) {
    result[folderId] = applyApprovalStates(items, approvalStates);
  }
  return result;
}

interface ChatSidebarContainerProps {
  currentConversationId: string | null;
  user: User | null;
  onNewChatClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
  onHelpDocsClick?: () => void;
}

export function ChatSidebarContainer({
  currentConversationId,
  user,
  onNewChatClick,
  isCollapsed,
  onToggleCollapse,
  onSettingsClick,
  onLogoutClick,
  onHelpDocsClick,
}: ChatSidebarContainerProps) {
  const navigate = useGuardedNavigate();
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const { openShareModal } = useAppShell();
  const { isChatSharingEnabled, isDeepResearchEnabled } = useFeatureFlag();

  // Track which conversation's context menu is open to fetch its share status
  const [contextMenuConvId, setContextMenuConvId] = useState<string | null>(
    null,
  );
  const { data: contextMenuShareStatus } = useShareStatus(
    isChatSharingEnabled ? contextMenuConvId : null,
  );
  const contextMenuShareInfo = contextMenuConvId
    ? {
        isShared: contextMenuShareStatus?.isShared ?? false,
        accessType: contextMenuShareStatus?.accessType,
      }
    : undefined;

  const {
    folders,
    items,
    dashboards,
    folderItems,
    folderDashboards,
    folderConversationsMap,
    folderLoadingMap,
    folderSectionTotals,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    hasNextDashboardPage,
    isFetchingNextDashboardPage,
    fetchNextDashboardPage,
    sectionShowMore,
    revealMoreInSection,
    collapseSection,
    createFolder,
    deleteFolderAsync,
    renameFolderAsync,
    pinFolder,
    toggleFolderExpanded,
    deleteConversationAsync,
    renameConversationAsync,
    removeItemFromFolder,
    removeItemFromFolderAsync,
    unfiledConversations,
  } = useChatSidebar();

  const { channel: userChannel } = useUserPusherChannel({
    tenantId: user?.tenantId,
    userId: user?.id,
  });

  const { approvalStates } = useApprovalStates({
    unfiledConversations,
    folderConversations: folderConversationsMap,
    userChannel,
  });

  const renameDashboard = useSidebarDashboardRename();

  const handleDeleteDashboard = useCallback(
    (id: string) => {
      // Only navigate if we're currently viewing the deleted dashboard
      if (id !== dashboardId) return;
      const nextDashboard = dashboards.find((d) => d.id !== id);
      if (nextDashboard) {
        navigate(`/dashboard/${nextDashboard.id}`);
        return;
      }
      const firstChat = items[0];
      navigate(firstChat ? `/chat/${firstChat.id}` : "/chat");
    },
    [dashboardId, dashboards, items, navigate],
  );

  const deleteDashboard = useSidebarDashboardDelete(handleDeleteDashboard);

  const { animatedTitles } = useTitleAnimation({ userChannel });

  // Apply animated titles then approval badges. Order matters only in that
  // both transforms are pure — badges layer on top of the title overlay.
  const animatedItems = useMemo(
    () => applyAnimatedTitles(items, animatedTitles),
    [items, animatedTitles],
  );
  const animatedFolderItems = useMemo(
    () => applyAnimatedTitlesToFolderItems(folderItems, animatedTitles),
    [folderItems, animatedTitles],
  );
  const decoratedItems = useMemo(
    () => applyApprovalStates(animatedItems, approvalStates),
    [animatedItems, approvalStates],
  );
  const decoratedFolderItems = useMemo(
    () => applyApprovalStatesToFolderItems(animatedFolderItems, approvalStates),
    [animatedFolderItems, approvalStates],
  );

  // Infinite scroll for the top-level Chats section (unfiled conversations).
  const loadMoreRef = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoading: isFetchingNextPage,
  });

  const handleChatClick = useCallback(
    (conversationId: string) => {
      const isInFolder = Object.values(folderItems).some((items) =>
        items.some((item) => item.id === conversationId),
      );
      report.chatChatOpened(isInFolder ? "folder" : "root");
      navigate(`/chat/${conversationId}`);
    },
    [navigate, folderItems],
  );

  const handleNewChatFolderClick = useCallback(
    (folderName: string) => {
      report.chatNewFolderClicked();
      createFolder(folderName);
      report.foldersNewFolderCreated(folderName, true, null);
    },
    [createFolder],
  );

  const handleFolderToggle = useCallback(
    (folderId: string) => {
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        report.chatFolderClicked(folder.label);
        if (!folder.isExpanded) {
          report.foldersFolderExpanded(
            folder.label,
            folderSectionTotals[folderId]?.conversation ?? 0,
          );
        }
      }
      toggleFolderExpanded(folderId);
    },
    [folders, toggleFolderExpanded, folderSectionTotals],
  );

  const [manageFoldersState, setManageFoldersState] = useState<
    | {
        open: true;
        itemType: FolderItemType;
        itemId: string;
        itemName: string;
        fromLocation: string;
      }
    | { open: false }
  >({ open: false });

  // Precomputed (type, id) → label maps. Replaces the previous per-callback
  // O(folders × items) scans with O(1) lookups. Two maps so ids that collide
  // across types (rare but legal) stay separated; each is recomputed only
  // when its underlying source list changes.
  const chatLabelById = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const it of items) map.set(it.id, it.label);
    for (const list of Object.values(folderItems)) {
      for (const it of list) map.set(it.id, it.label);
    }
    return map;
  }, [items, folderItems]);

  const dashboardLabelById = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const d of dashboards) map.set(d.id, d.label);
    for (const list of Object.values(folderDashboards)) {
      for (const d of list) map.set(d.id, d.label);
    }
    return map;
  }, [dashboards, folderDashboards]);

  const folderLabelById = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const f of folders) map.set(f.id, f.label);
    return map;
  }, [folders]);

  // Returns the folder label if the chat lives in an expanded folder, or
  // "outside" if it is unfiled. Collapsed-folder chats are not in the
  // `folderItems` cache and will resolve to "outside" (acceptable edge case).
  const getChatLocation = useCallback(
    (chatId: string): string => {
      for (const [folderId, folderChatItems] of Object.entries(folderItems)) {
        if (folderChatItems.some((item) => item.id === chatId)) {
          return folderLabelById.get(folderId) ?? "unknown folder";
        }
      }
      return "outside";
    },
    [folderItems, folderLabelById],
  );

  const handleContextMenuOpen = useCallback(
    (itemId: string) => {
      setContextMenuConvId(itemId);
      const chatName = chatLabelById.get(itemId) ?? "";
      const location = getChatLocation(itemId);
      report.chatListChatActionsMenuOpened(itemId, chatName);
      report.foldersChatActionsMenuOpened(itemId, chatName, location);
    },
    [chatLabelById, getChatLocation],
  );

  const handleDeleteItem = useCallback(
    async (id: string) => {
      const chatName = chatLabelById.get(id) ?? "";
      const location = getChatLocation(id);
      try {
        await deleteConversationAsync(id);
        report.chatListChatDeleted({
          chatId: id,
          chatName,
          success: true,
          error: null,
        });
        report.foldersChatDeleted({
          chatId: id,
          chatName,
          location,
          success: true,
          error: null,
        });
        if (id === currentConversationId)
          navigate("/chat/new", { replace: true });
      } catch (e) {
        const error = e instanceof Error ? e.message : "Unknown error";
        report.chatListChatDeleted({
          chatId: id,
          chatName,
          success: false,
          error,
        });
        report.foldersChatDeleted({
          chatId: id,
          chatName,
          location,
          success: false,
          error,
        });
      }
    },
    [
      deleteConversationAsync,
      currentConversationId,
      navigate,
      chatLabelById,
      getChatLocation,
    ],
  );

  const handleRenameItem = useCallback(
    async (id: string, newName: string) => {
      const oldName = chatLabelById.get(id) ?? "";
      const location = getChatLocation(id);
      try {
        await renameConversationAsync(id, newName);
        report.chatListChatRenamed({
          chatId: id,
          oldName,
          newName,
          success: true,
          error: null,
        });
        report.foldersChatRenamed({
          chatId: id,
          oldName,
          newName,
          location,
          success: true,
          error: null,
        });
      } catch (e) {
        const error = e instanceof Error ? e.message : "Unknown error";
        report.chatListChatRenamed({
          chatId: id,
          oldName,
          newName,
          success: false,
          error,
        });
        report.foldersChatRenamed({
          chatId: id,
          oldName,
          newName,
          location,
          success: false,
          error,
        });
      }
    },
    [renameConversationAsync, chatLabelById, getChatLocation],
  );

  // Unified callback for both chats and dashboards. The design-component
  // forwards the row's `ItemType`; we translate to the API's vocabulary and
  // resolve the display name from the precomputed map.
  const handleManageItemFolders = useCallback(
    (itemId: string, itemType: ItemType) => {
      const folderItemType = toFolderItemType(itemType);
      const itemName =
        folderItemType === FolderItemType.Dashboard
          ? (dashboardLabelById.get(itemId) ?? "this dashboard")
          : (chatLabelById.get(itemId) ?? "this chat");
      const fromLocation =
        folderItemType === FolderItemType.Conversation
          ? getChatLocation(itemId)
          : "outside";
      setManageFoldersState({
        open: true,
        itemType: folderItemType,
        itemId,
        itemName,
        fromLocation,
      });
    },
    [chatLabelById, dashboardLabelById, getChatLocation],
  );

  // Single unfile callback; infer FolderItemType from the dashboard map since
  // the design-component no longer forwards itemType in this callback.
  const handleRemoveItemFromFolder = useCallback(
    async (itemId: string) => {
      const folderItemType = dashboardLabelById.has(itemId)
        ? FolderItemType.Dashboard
        : FolderItemType.Conversation;
      if (folderItemType === FolderItemType.Conversation) {
        const chatName = chatLabelById.get(itemId) ?? "";
        let folderName = "";
        for (const [folderId, folderChatItems] of Object.entries(folderItems)) {
          if (folderChatItems.some((item) => item.id === itemId)) {
            folderName = folderLabelById.get(folderId) ?? "";
            break;
          }
        }
        try {
          await removeItemFromFolderAsync(itemId, folderItemType);
          report.foldersChatRemovedFromFolder({
            chatId: itemId,
            chatName,
            folderName,
            success: true,
            error: null,
          });
        } catch (e) {
          const error = e instanceof Error ? e.message : "Unknown error";
          report.foldersChatRemovedFromFolder({
            chatId: itemId,
            chatName,
            folderName,
            success: false,
            error,
          });
        }
      } else {
        removeItemFromFolder(itemId, folderItemType);
      }
    },
    [
      removeItemFromFolder,
      removeItemFromFolderAsync,
      dashboardLabelById,
      chatLabelById,
      folderItems,
      folderLabelById,
    ],
  );

  const handleRenameFolder = useCallback(
    async (folderId: string, newName: string) => {
      const oldName = folderLabelById.get(folderId) ?? "";
      try {
        await renameFolderAsync(folderId, newName);
        report.foldersFolderRenamed({
          oldFolderName: oldName,
          newFolderName: newName,
          success: true,
          error: null,
        });
      } catch (e) {
        const error = e instanceof Error ? e.message : "Unknown error";
        report.foldersFolderRenamed({
          oldFolderName: oldName,
          newFolderName: newName,
          success: false,
          error,
        });
      }
    },
    [renameFolderAsync, folderLabelById],
  );

  const handlePinFolder = useCallback(
    (folderId: string, isPinned: boolean) => {
      pinFolder(folderId, isPinned);
      if (isPinned) {
        report.foldersFolderPinned(folderLabelById.get(folderId) ?? "");
      }
    },
    [pinFolder, folderLabelById],
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      const folderName = folderLabelById.get(folderId) ?? "";
      const chatCount = folderSectionTotals[folderId]?.conversation ?? 0;
      try {
        await deleteFolderAsync(folderId);
        report.foldersFolderDeleted({
          folderName,
          chatCount,
          success: true,
          error: null,
        });
      } catch (e) {
        const error = e instanceof Error ? e.message : "Unknown error";
        report.foldersFolderDeleted({
          folderName,
          chatCount,
          success: false,
          error,
        });
      }
    },
    [deleteFolderAsync, folderLabelById, folderSectionTotals],
  );

  const handleDeleteFolderClick = useCallback(
    (folderId: string) => {
      const folderName = folderLabelById.get(folderId) ?? "";
      const chatCount = folderSectionTotals[folderId]?.conversation ?? 0;
      report.foldersFolderDeleteClicked(folderName, chatCount);
    },
    [folderLabelById, folderSectionTotals],
  );

  const handleDeleteFolderCancelled = useCallback(
    (folderId: string) => {
      report.foldersFolderDeleteCancelled(folderLabelById.get(folderId) ?? "");
    },
    [folderLabelById],
  );

  const handleDashboardClick = useCallback(
    (id: string) => {
      report.dashboardOpened(dashboardLabelById.get(id) ?? "");
      navigate(`/dashboard/${id}`);
    },
    [navigate, dashboardLabelById],
  );

  // Avatar props
  const avatarLabel = user ? getUserInitials(user.name, user.email) : undefined;
  const avatarSrc =
    typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined;
  const displayName = user
    ? getDisplayName(user.name, user.firstName, user.lastName, user.email)
    : undefined;

  // "New Chat" lights up only for a definitively-untitled chat — not just
  // "current id not in cache", since the chat could live in a collapsed
  // folder or unfetched page.
  const isNewChatActive = useMemo(() => {
    if (!currentConversationId) return false;
    if (items.some((item) => item.id === currentConversationId)) return false;
    for (const folderItemList of Object.values(folderItems)) {
      if (folderItemList.some((item) => item.id === currentConversationId))
        return false;
    }
    return unfiledConversations.some(
      (conv) =>
        conv.conversation_id === currentConversationId &&
        (!conv.title || conv.title.trim() === ""),
    );
  }, [currentConversationId, items, folderItems, unfiledConversations]);

  return (
    <>
      <ChatSidebar
        items={decoratedItems}
        folders={folders}
        folderItems={decoratedFolderItems}
        folderDashboards={folderDashboards}
        folderSectionTotals={folderSectionTotals}
        folderLoadingMap={folderLoadingMap}
        isLoading={isLoading}
        selectedItemId={currentConversationId || undefined}
        onItemClick={handleChatClick}
        onNewChatClick={onNewChatClick}
        onNewChatFolderClick={handleNewChatFolderClick}
        onRenameItem={handleRenameItem}
        onShareItem={isChatSharingEnabled ? openShareModal : undefined}
        onContextMenuOpen={
          isChatSharingEnabled ? handleContextMenuOpen : undefined
        }
        contextMenuShareInfo={contextMenuShareInfo}
        onDeleteItem={handleDeleteItem}
        onDeleteFolderClick={handleDeleteFolderClick}
        onDeleteFolderCancelled={handleDeleteFolderCancelled}
        onFolderToggle={handleFolderToggle}
        onDeleteFolder={handleDeleteFolder}
        onRenameFolder={handleRenameFolder}
        onPinFolder={handlePinFolder}
        onRemoveItemFromFolder={handleRemoveItemFromFolder}
        onManageItemFolders={handleManageItemFolders}
        sectionShowMore={sectionShowMore}
        onRevealMoreInSection={revealMoreInSection}
        onCollapseSection={collapseSection}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        loadMoreRef={loadMoreRef}
        isFetchingMore={isFetchingNextPage}
        hasMoreChats={hasNextPage}
        onLoadMoreChats={fetchNextPage}
        avatarSrc={avatarSrc}
        avatarLabel={avatarLabel}
        userName={displayName}
        userEmail={user?.email}
        onSignOutClick={onLogoutClick}
        onSettingsClick={onSettingsClick}
        onHelpDocsClick={onHelpDocsClick}
        isNewChatActive={isNewChatActive}
        isDashboardsEnabled={isDeepResearchEnabled}
        dashboards={dashboards}
        selectedDashboardId={dashboardId}
        hasMoreDashboards={hasNextDashboardPage}
        onLoadMoreDashboards={fetchNextDashboardPage}
        isLoadingMoreDashboards={isFetchingNextDashboardPage}
        onRenameDashboard={renameDashboard}
        onDeleteDashboard={deleteDashboard}
        onDashboardClick={handleDashboardClick}
      />
      {manageFoldersState.open && (
        <ManageFoldersModal
          isOpen
          itemName={manageFoldersState.itemName}
          itemType={manageFoldersState.itemType}
          itemId={manageFoldersState.itemId}
          fromLocation={manageFoldersState.fromLocation}
          onClose={() => setManageFoldersState({ open: false })}
        />
      )}
    </>
  );
}
