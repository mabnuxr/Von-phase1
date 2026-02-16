import { useQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { useFeatureFlag } from "./useFeatureFlag";
import { CONVERSATIONS_STALE_TIME } from "../config/constants";

/**
 * Fetch only the most recent conversation ID.
 *
 * Lightweight query (limit=1) used by useConversationInit to redirect
 * when no conversation ID is in the URL.
 *
 * - V2: hits sidebar endpoint → first unfiled conversation
 * - V1: hits conversations endpoint → first conversation
 *
 * Uses its own query key so it never interferes with the full
 * sidebar or conversations caches.
 */
export function useFirstConversationId() {
  const { isSidebarV2 } = useFeatureFlag();

  return useQuery({
    queryKey: ["firstConversation", isSidebarV2 ? "sidebar" : "conversations"],
    queryFn: async () => {
      if (isSidebarV2) {
        const res = await conversationsService.getChatSidebar(1, 1);
        return res.unfiled.conversations[0]?.conversationId ?? null;
      }
      const res = await conversationsService.getConversations(1, 1);
      return res.data[0]?.conversationId ?? null;
    },
    staleTime: CONVERSATIONS_STALE_TIME,
  });
}
