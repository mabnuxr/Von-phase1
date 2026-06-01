import { useInfiniteQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import type { SharedConversationsResponse } from "../services/conversationsService";
import { CONVERSATIONS_STALE_TIME } from "../config/constants";
import { UNFILED_ITEMS_PAGE_SIZE } from "./folders/useUnfiledItems";

export const sharedConversationsKey = ["conversations", "shared"] as const;

/**
 * Paginated view of conversations shared into the caller's tenant — used by
 * the View Only sidebar in place of the regular Chats list. Matches the
 * unfiled-items pattern so the existing "Show 5 more" / loadMoreRef infinite
 * scroll plumbing in `ChatSidebar` works without modification.
 */
export function useSharedConversations(enabled: boolean = true) {
  return useInfiniteQuery<SharedConversationsResponse>({
    queryKey: sharedConversationsKey,
    queryFn: ({ pageParam }) =>
      conversationsService.getSharedConversations(
        pageParam as number,
        UNFILED_ITEMS_PAGE_SIZE,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
    initialPageParam: 1,
    enabled,
    staleTime: CONVERSATIONS_STALE_TIME,
    gcTime: 5 * 60 * 1000,
  });
}
