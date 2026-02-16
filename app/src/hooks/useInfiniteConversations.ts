import { useInfiniteQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { conversationKeys } from "./useConversations";
import {
  CONVERSATIONS_STALE_TIME,
  CONVERSATIONS_PAGE_LIMIT,
} from "../config/constants";

/**
 * Fetch conversations with infinite scroll pagination
 *
 * Uses React Query's useInfiniteQuery for:
 * - Automatic page management
 * - Data merging across pages
 * - hasNextPage detection
 * - Efficient caching
 *
 * @param limit - Number of conversations per page
 * @returns Infinite query result with flattened conversations
 */
export function useInfiniteConversations(
  limit: number = CONVERSATIONS_PAGE_LIMIT,
  enabled: boolean = true,
) {
  return useInfiniteQuery({
    queryKey: conversationKeys.lists(),
    queryFn: ({ pageParam }) =>
      conversationsService.getConversations(pageParam, limit),
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.hasNextPage ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: CONVERSATIONS_STALE_TIME,
    enabled,
  });
}
