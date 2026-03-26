import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChatSidebarV2 } from "@vonlabs/design-components";
import type { SidebarItem } from "@vonlabs/design-components";
import { useChatSidebarV2 } from "../hooks/useChatSidebarV2";
import type { FolderItemsMap } from "../hooks/useChatSidebarV2";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useTitleAnimation } from "../hooks/useTitleAnimation";
import { useSidebarDashboards } from "../hooks/useSidebarDashboards";
import { useSidebarDashboardRename } from "../hooks/useSidebarDashboardRename";
import { getUserInitials, getDisplayName } from "../lib/userUtils";
import type { User } from "../services";

/**
 * Overlay animated titles onto sidebar items.
 * When a title is animating, replace the item label with the partial string.
 */
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

interface ChatSidebarV2ContainerProps {
  currentConversationId: string | null;
  user: User | null;
  onNewChatClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
}

export function ChatSidebarV2Container({
  currentConversationId,
  user,
  onNewChatClick,
  isCollapsed,
  onToggleCollapse,
  onSettingsClick,
  onLogoutClick,
}: ChatSidebarV2ContainerProps) {
  const navigate = useNavigate();

  const {
    folders,
    items,
    folderItems,
    folderLoadingMap,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    createFolder,
    deleteFolder,
    renameFolder,
    pinFolder,
    toggleFolderExpanded,
    deleteConversation,
    renameConversation,
    moveItemToFolder,
    createFolderForItem,
    removeItemFromFolder,
    unfiledConversations,
  } = useChatSidebarV2();

  // Dashboard data for sidebar
  const {
    dashboards: sidebarDashboards,
    hasNextPage: hasMoreDashboards,
    loadMore: loadMoreDashboards,
  } = useSidebarDashboards();

  const renameDashboard = useSidebarDashboardRename();

  // Title animation (shared with V1)
  const { animatedTitles } = useTitleAnimation({
    tenantId: user?.tenantId,
    userId: user?.id,
  });

  // Apply animated titles to items and folder items
  const animatedItems = useMemo(
    () => applyAnimatedTitles(items, animatedTitles),
    [items, animatedTitles],
  );
  const animatedFolderItems = useMemo(
    () => applyAnimatedTitlesToFolderItems(folderItems, animatedTitles),
    [folderItems, animatedTitles],
  );

  // Infinite scroll for unfiled conversations
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

  // Avatar props
  const avatarLabel = user ? getUserInitials(user.name, user.email) : undefined;
  const avatarSrc =
    typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined;
  const displayName = user
    ? getDisplayName(user.name, user.firstName, user.lastName, user.email)
    : undefined;

  // Show "New Chat" button in active state when the current conversation
  // is definitively an untitled chat (exists in raw data with empty title).
  // We cannot assume "not found" means "new" because items/folderItems only
  // cover fetched pages and expanded folders — a conversation in a collapsed
  // folder or unfetched page would be absent without being untitled.
  const isNewChatActive = useMemo(() => {
    if (!currentConversationId) return false;
    // Already visible in the sidebar — not a new/untitled chat
    if (items.some((item) => item.id === currentConversationId)) return false;
    for (const folderItemList of Object.values(folderItems)) {
      if (folderItemList.some((item) => item.id === currentConversationId))
        return false;
    }
    // Definitive check: the conversation exists in raw unfiled data with an
    // empty title (these are filtered out of `items` but still present in the
    // pre-filter list). If the conversation isn't in raw data at all, it could
    // live in a collapsed folder or unfetched page — default to false.
    return unfiledConversations.some(
      (conv) =>
        conv.conversationId === currentConversationId &&
        (!conv.title || conv.title.trim() === ""),
    );
  }, [currentConversationId, items, folderItems, unfiledConversations]);

  return (
    <ChatSidebarV2
      items={animatedItems}
      folders={folders}
      folderItems={animatedFolderItems}
      folderLoadingMap={folderLoadingMap}
      isLoading={isLoading}
      selectedItemId={currentConversationId || undefined}
      onItemClick={handleChatClick}
      onNewChatClick={onNewChatClick}
      onNewChatFolderClick={createFolder}
      onRenameItem={renameConversation}
      onDeleteItem={handleDeleteItem}
      onDeleteFolder={deleteFolder}
      onRenameFolder={renameFolder}
      onPinFolder={pinFolder}
      onFolderToggle={toggleFolderExpanded}
      onMoveItemToFolder={moveItemToFolder}
      onCreateFolderAndMoveItem={createFolderForItem}
      onRemoveItemFromFolder={removeItemFromFolder}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      loadMoreRef={loadMoreRef}
      isFetchingMore={isFetchingNextPage}
      avatarSrc={avatarSrc}
      avatarLabel={avatarLabel}
      userName={displayName}
      userEmail={user?.email}
      onSignOutClick={onLogoutClick}
      onSettingsClick={onSettingsClick}
      isNewChatActive={isNewChatActive}
      dashboards={sidebarDashboards}
      hasMoreDashboards={hasMoreDashboards}
      onLoadMoreDashboards={loadMoreDashboards}
      onRenameDashboard={renameDashboard}
      onDashboardClick={(id: string) => navigate(`/dashboard/${id}`)}
    />
  );
}
