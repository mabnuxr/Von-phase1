import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChatSidebar, ItemType } from "@vonlabs/design-components";
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
}

export function ChatSidebarContainer({
  currentConversationId,
  user,
  onNewChatClick,
  isCollapsed,
  onToggleCollapse,
  onSettingsClick,
  onLogoutClick,
}: ChatSidebarContainerProps) {
  const navigate = useGuardedNavigate();
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const { openShareModal } = useAppShell();
  const { isChatSharingEnabled, isDeepResearchEnabled } = useFeatureFlag();

  // Track which conversation's context menu is open to fetch its share status
  const [contextMenuConvId, setContextMenuConvId] = useState<string | null>(
    null,
  );
  const handleContextMenuOpen = useCallback((itemId: string) => {
    setContextMenuConvId(itemId);
  }, []);
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
    deleteFolder,
    renameFolder,
    pinFolder,
    toggleFolderExpanded,
    deleteConversation,
    renameConversation,
    removeItemFromFolder,
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
      navigate(`/chat/${conversationId}`);
    },
    [navigate],
  );

  const handleDeleteItem = useCallback(
    (id: string) => {
      deleteConversation(id);
      if (id === currentConversationId) {
        navigate("/chat");
      }
    },
    [deleteConversation, currentConversationId, navigate],
  );

  const [manageFoldersState, setManageFoldersState] = useState<
    | {
        open: true;
        itemType: FolderItemType;
        itemId: string;
        itemName: string;
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
      setManageFoldersState({
        open: true,
        itemType: folderItemType,
        itemId,
        itemName,
      });
    },
    [chatLabelById, dashboardLabelById],
  );

  // Single unfile callback; forwards the design-component's `ItemType` to the
  // app's `removeItemFromFolder`, which expects `FolderItemType`.
  const handleRemoveItemFromFolder = useCallback(
    (itemId: string, itemType: ItemType) => {
      removeItemFromFolder(itemId, toFolderItemType(itemType));
    },
    [removeItemFromFolder],
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
        onNewChatFolderClick={createFolder}
        onRenameItem={renameConversation}
        onShareItem={isChatSharingEnabled ? openShareModal : undefined}
        onContextMenuOpen={
          isChatSharingEnabled ? handleContextMenuOpen : undefined
        }
        contextMenuShareInfo={contextMenuShareInfo}
        onDeleteItem={handleDeleteItem}
        onDeleteFolder={deleteFolder}
        onRenameFolder={renameFolder}
        onPinFolder={pinFolder}
        onFolderToggle={toggleFolderExpanded}
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
        isNewChatActive={isNewChatActive}
        isDashboardsEnabled={isDeepResearchEnabled}
        dashboards={dashboards}
        selectedDashboardId={dashboardId}
        hasMoreDashboards={hasNextDashboardPage}
        onLoadMoreDashboards={fetchNextDashboardPage}
        isLoadingMoreDashboards={isFetchingNextDashboardPage}
        onRenameDashboard={renameDashboard}
        onDeleteDashboard={deleteDashboard}
        onDashboardClick={(id: string) => navigate(`/dashboard/${id}`)}
      />
      {manageFoldersState.open && (
        <ManageFoldersModal
          isOpen
          itemName={manageFoldersState.itemName}
          itemType={manageFoldersState.itemType}
          itemId={manageFoldersState.itemId}
          onClose={() => setManageFoldersState({ open: false })}
        />
      )}
    </>
  );
}
