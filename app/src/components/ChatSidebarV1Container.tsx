import { useState, useCallback } from "react";
import { ChatSidebar } from "@vonlabs/design-components";
import { useChatSidebarV1 } from "../hooks/useChatSidebarV1";
import { AvatarMenu } from "./AvatarMenu";
import type { User } from "../services";

interface ChatSidebarV1ContainerProps {
  currentConversationId: string | null;
  user: User | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogoutClick: () => void;
  onSettingsClick: () => void;
}

export function ChatSidebarV1Container({
  currentConversationId,
  user,
  isCollapsed,
  onToggleCollapse,
  onLogoutClick,
  onSettingsClick,
}: ChatSidebarV1ContainerProps) {
  const {
    chatItems,
    loadMoreRef,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    handleChatClick,
    avatarLabel,
    avatarSrc,
    displayName,
  } = useChatSidebarV1({ currentConversationId, user });

  // Avatar menu state (V1 uses click-based avatar menu)
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [avatarRect, setAvatarRect] = useState<DOMRect | undefined>();

  const handleAvatarClick = useCallback((rect: DOMRect) => {
    setAvatarRect(rect);
    setIsAvatarMenuOpen(true);
  }, []);

  return (
    <>
      <ChatSidebar
        chatItems={chatItems}
        selectedChatId={currentConversationId || undefined}
        onChatClick={handleChatClick}
        searchPlaceholder="Search conversations..."
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        loadMoreRef={loadMoreRef}
        isFetchingMore={isFetchingNextPage}
        hasNextPage={hasNextPage}
        onLoadMore={fetchNextPage}
        avatarSrc={avatarSrc}
        avatarLabel={avatarLabel}
        userName={displayName}
        userEmail={user?.email}
        onAvatarClick={handleAvatarClick}
      />
      <AvatarMenu
        userEmail={user?.email}
        isOpen={isAvatarMenuOpen}
        onClose={() => setIsAvatarMenuOpen(false)}
        onSettingsClick={onSettingsClick}
        onLogoutClick={onLogoutClick}
        triggerRect={avatarRect}
      />
    </>
  );
}
