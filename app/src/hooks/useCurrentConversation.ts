import { useQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { CONVERSATIONS_STALE_TIME } from "../config/constants";

/**
 * Fetch a single conversation's metadata by ID.
 *
 * Uses the dedicated GET /api/v1/chat/conversations/:id endpoint
 * so it works regardless of sidebar pagination state.
 *
 * @param conversationId - The conversation to fetch, or null to disable
 */
export function useCurrentConversation(conversationId: string | null) {
  return useQuery({
    queryKey: conversationId ? ["conversation", conversationId] : [],
    queryFn: () => conversationsService.getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: CONVERSATIONS_STALE_TIME,
  });
}
