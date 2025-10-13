import { useInfiniteQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { conversationKeys } from "./useConversations";

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
export function useInfiniteConversations(limit: number = 20) {
  return useInfiniteQuery({
    queryKey: conversationKeys.lists(),
    queryFn: ({ pageParam }) =>
      conversationsService.getConversations(pageParam, limit),
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.hasNextPage ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30000, // Consider data fresh for 30s
  });
}
