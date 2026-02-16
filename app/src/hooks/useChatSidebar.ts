import { useInfiniteQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import type { ChatSidebarResponse } from "../types/chatSidebar";
import {
  CONVERSATIONS_STALE_TIME,
  CONVERSATIONS_PAGE_LIMIT,
} from "../config/constants";

/**
 * Query keys for chat sidebar
 * Centralized to avoid typos and ensure consistency
 */
export const chatSidebarKeys = {
  all: ["chatSidebar"] as const,
  sidebar: () => [...chatSidebarKeys.all, "data"] as const,
};

/**
 * Fetch chat sidebar data with folders and infinite-scroll unfiled conversations.
 *
 * Page 1 returns folders + first page of unfiled conversations.
 * Subsequent pages only add more unfiled conversations (folders stay the same).
 */
export function useChatSidebar(
  limit: number = CONVERSATIONS_PAGE_LIMIT,
  enabled: boolean = true,
) {
  return useInfiniteQuery<ChatSidebarResponse>({
    queryKey: chatSidebarKeys.sidebar(),
    queryFn: ({ pageParam }) =>
      conversationsService.getChatSidebar(pageParam as number, limit),
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.unfiled;
      return pagination.hasNextPage ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: CONVERSATIONS_STALE_TIME,
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled,
  });
}
