import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { conversationKeys } from "./useConversations";
import useChatStore from "../store/chatStore";
import { MESSAGES_STALE_TIME, MESSAGES_PAGE_LIMIT } from "../config/constants";

/**
 * Hook to manage messages for a conversation
 * - Fetches messages from backend using React Query infinite scroll
 * - Automatically syncs messages to Zustand store (centralized state)
 * - Handles pagination for loading older messages
 *
 * @param conversationId - Current conversation ID
 * @param limit - Messages per page (default: 50)
 *
 * @returns Infinite query controls for pagination
 *
 * @example
 * ```tsx
 * const { fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
 *   useMessages(currentConversationId, 50);
 *
 * // Read messages from Zustand store
 * const messages = useChatStore.use.messages()[currentConversationId] || [];
 * ```
 */
export function useMessages(
  conversationId: string | null,
  limit: number = MESSAGES_PAGE_LIMIT,
) {
  const { setMessages, setIsLoadingMessages } = useChatStore();

  // Fetch messages with infinite scroll pagination
  const {
    data: infiniteMessagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: conversationKeys.messagesList(conversationId || "none", 1, limit),
    queryFn: ({ pageParam }) => {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      return conversationsService.getConversationMessages(
        conversationId,
        pageParam,
        limit,
      );
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.hasNextPage ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!conversationId,
    staleTime: MESSAGES_STALE_TIME,
  });

  // Sync messages to Zustand store when data changes
  useEffect(() => {
    if (!conversationId || !infiniteMessagesData) return;

    // Backend now implements reverse pagination:
    // - Page 1: Latest 50 messages in chronological order (oldest→newest)
    // - Page 2: Next older 50 messages in chronological order
    // - Page N: Prepend to the beginning
    //
    // Example: Total 100 messages, limit=50
    // Page 1: [msg 51, 52, ..., 100] (latest, already oldest→newest)
    // Page 2: [msg 1, 2, ..., 50]    (older, already oldest→newest)
    //
    // To build final array: [Page 2 data] + [Page 1 data]
    // Result: [msg 1, 2, ..., 50, 51, ..., 100] ✅

    const pages = infiniteMessagesData.pages;
    const allMessages =
      pages.length === 1
        ? pages[0].data // Single page: use as-is
        : [
            // Multiple pages: reverse page order, keep message order within each page
            ...pages
              .slice()
              .reverse()
              .flatMap((page) => page.data),
          ];

    // Update Zustand store with properly ordered messages
    setMessages(conversationId, allMessages);

    if (import.meta.env.DEV) {
      console.log(
        `[useMessages] Synced ${allMessages.length} messages from ${pages.length} page(s) for conversation ${conversationId}`,
      );
    }
  }, [infiniteMessagesData, conversationId, setMessages]);

  // Sync loading state to Zustand
  useEffect(() => {
    setIsLoadingMessages(isLoading);
  }, [isLoading, setIsLoadingMessages]);

  // Log errors in development
  useEffect(() => {
    if (error && import.meta.env.DEV) {
      console.error("[useMessages] Error fetching messages:", error);
    }
  }, [error]);

  return {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  };
}
