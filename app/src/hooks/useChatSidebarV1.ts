import { useCallback, useMemo } from "react";
import { useGuardedNavigate } from "../providers/NavigationGuard";
import { useInfiniteConversations } from "./useInfiniteConversations";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { useTitleAnimation } from "./useTitleAnimation";
import { useUserPusherChannel } from "./useUserPusherChannel";
import { transformConversationsToChatItems } from "../lib/dashboardUtils";
import { getUserInitials, getDisplayName } from "../lib/userUtils";
import { CONVERSATIONS_PAGE_LIMIT } from "../config/constants";
import type { User } from "../services";

interface UseChatSidebarV1Params {
  currentConversationId: string | null;
  user: User | null;
}

/**
 * Business logic hook for ChatSidebar V1.
 *
 * Encapsulates:
 * - Infinite conversation fetching & scroll
 * - Title animation via shared useTitleAnimation hook
 * - Chat item transformation
 * - Avatar props derivation
 */
export function useChatSidebarV1({
  currentConversationId,
  user,
}: UseChatSidebarV1Params) {
  const navigate = useGuardedNavigate();

  // Fetch conversations with infinite scroll
  const {
    data: infiniteConversationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteConversations(CONVERSATIONS_PAGE_LIMIT);

  // Infinite scroll ref
  const loadMoreRef = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
  });

  // Title animation (shared with V2)
  const { channel: userChannel } = useUserPusherChannel({
    tenantId: user?.tenantId,
    userId: user?.id,
  });
  const { animatedTitles } = useTitleAnimation({ userChannel });

  // Flatten paginated conversations
  const allConversations = useMemo(
    () => infiniteConversationsData?.pages.flatMap((page) => page.data) || [],
    [infiniteConversationsData?.pages],
  );

  // Transform to ChatSidebar items
  const chatItems = useMemo(
    () => transformConversationsToChatItems(allConversations, animatedTitles),
    [allConversations, animatedTitles],
  );

  // Handlers
  const handleChatClick = useCallback(
    (conversationId: string) => {
      navigate(`/chat/${conversationId}`);
    },
    [navigate],
  );

  // Avatar props
  const avatarLabel = user ? getUserInitials(user.name, user.email) : undefined;
  const avatarSrc =
    typeof user?.avatarUrl === "string" ? user.avatarUrl : undefined;
  const displayName = user
    ? getDisplayName(user.name, user.firstName, user.lastName, user.email)
    : undefined;

  return {
    chatItems,
    loadMoreRef,
    isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    handleChatClick,
    avatarLabel,
    avatarSrc,
    displayName,
    currentConversationId,
  };
}
