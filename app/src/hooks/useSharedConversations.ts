import { useInfiniteQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import type { SharedConversationsResponse } from "../services/conversationsService";
import { CONVERSATIONS_STALE_TIME } from "../config/constants";

export const sharedConversationsKey = ["conversations", "shared"] as const;

/**
 * Paginated view of conversations shared into the caller's tenant — used by
 * the View Only sidebar in place of the regular Chats list. Page size of 20
 * because the list is a flat scroll surface with no per-folder grouping, so
 * the per-folder "Show 5 more" sizing doesn't apply.
 */
export function useSharedConversations(enabled: boolean = true) {
  return useInfiniteQuery<SharedConversationsResponse>({
    queryKey: sharedConversationsKey,
    queryFn: ({ pageParam }) =>
      conversationsService.getSharedConversations(pageParam as number, 20),
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
