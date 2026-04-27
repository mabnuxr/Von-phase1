import { useQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import type { ConversationShareStatusResponse } from "../services/conversationsService";

/**
 * Fetch the share status for a conversation.
 *
 * Used by Conversation.tsx for the header CTA and passed as initial
 * data to the share modal so it doesn't need its own fetch on open.
 */
export function useShareStatus(conversationId: string | null) {
  return useQuery<ConversationShareStatusResponse>({
    queryKey: conversationId ? ["share-status", conversationId] : [],
    queryFn: () => conversationsService.getShareStatus(conversationId!),
    enabled: !!conversationId,
    staleTime: 30_000,
  });
}
