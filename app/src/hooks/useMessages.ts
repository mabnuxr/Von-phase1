import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { conversationKeys } from "./useConversations";
import useChatStore from "../store/chatStore";
import { MESSAGES_STALE_TIME, MESSAGES_PAGE_LIMIT } from "../config/constants";
import { replayAguiEvents } from "../utils/replayAguiEvents";

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

  // Track the last dataUpdatedAt we synced per conversation.
  // Prevents overwriting chatStore with stale React Query cache on conversation switch,
  // which causes a flash of old content before the background refetch completes.
  const syncedAtRef = useRef<Record<string, number>>({});

  // Fetch messages with infinite scroll pagination

  const {
    data: infiniteMessagesData,
    dataUpdatedAt,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
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

    // Skip syncing stale React Query cache when chatStore already has messages.
    // On conversation switch, RQ serves cached data while a background refetch runs.
    // Without this guard, setMessages overwrites chatStore (which may have newer data
    // from optimistic updates or Pusher events) with stale cache, causing a flash
    // of old content. The sync will happen when the background refetch completes
    // (dataUpdatedAt will be newer than what we last synced).
    const lastSynced = syncedAtRef.current[conversationId] ?? 0;
    if (dataUpdatedAt <= lastSynced) {
      const existingMessages = useChatStore.getState().messages[conversationId];
      if (existingMessages && existingMessages.length > 0) {
        if (import.meta.env.DEV) {
          console.log(
            `[useMessages] Skipping stale cache sync for ${conversationId} (dataUpdatedAt=${dataUpdatedAt}, lastSynced=${lastSynced})`,
          );
        }
        return;
      }
    }
    syncedAtRef.current[conversationId] = dataUpdatedAt;

    // Messages are keyed by conversationId in the store,
    // so writing data for a previous conversation is harmless (goes to its own slot).

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
    const allMessagesRaw =
      pages.length === 1
        ? pages[0].data // Single page: use as-is
        : [
            // Multiple pages: reverse page order, keep message order within each page
            ...pages
              .slice()
              .reverse()
              .flatMap((page) => page.data),
          ];

    // Dedup by message ID — page boundary shifts between fetches can cause overlap
    const seenIds = new Set<string>();
    const allMessages = allMessagesRaw.filter((msg) => {
      if (seenIds.has(msg.id)) return false;
      seenIds.add(msg.id);
      return true;
    });

    // Replay events for streaming messages to reconstruct partial content
    const messagesWithReplayedContent = allMessages.map((msg) => {
      // EDGE CASE 1: First-time streaming (no events yet)
      if (msg.isStreaming && (!msg.events || msg.events.length === 0)) {
        return msg; // Return as-is, Pusher will fill content
      }

      // EDGE CASE 2: Refresh during streaming (has events from Redis)
      if (msg.isStreaming && msg.events && msg.events.length > 0) {
        const { content, stepMessages, toolCalls } = replayAguiEvents(
          msg.events,
        );
        return {
          ...msg,
          messageContent: content, // Pre-fill from Redis events
          stepMessages,
          toolCalls,
        };
      }

      // EDGE CASE 3: Completed message (no replay needed)
      return msg;
    });

    // Don't overwrite live chatStore messages with an empty backend response.
    // A newly-created conversation has 0 messages on the backend until Pusher
    // events reconcile them — preserve the optimistic chatStore messages seeded
    // by useCreateAndSendMessage.
    if (
      messagesWithReplayedContent.length === 0 &&
      (useChatStore.getState().messages[conversationId]?.length ?? 0) > 0
    ) {
      if (import.meta.env.DEV) {
        console.log(
          `[useMessages] Skipping empty response sync for ${conversationId} — chatStore has optimistic messages`,
        );
      }
      return;
    }

    // Update Zustand store with properly ordered messages
    setMessages(conversationId, messagesWithReplayedContent);

    if (import.meta.env.DEV) {
      console.log(
        `[useMessages] Synced ${allMessages.length} messages from ${pages.length} page(s) for conversation ${conversationId}`,
      );
    }
  }, [infiniteMessagesData, conversationId, setMessages, dataUpdatedAt]);

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
    refetch,
  };
}
