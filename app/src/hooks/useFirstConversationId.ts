import { useQuery } from "@tanstack/react-query";
import { foldersService } from "../services";
import { CONVERSATIONS_STALE_TIME } from "../config/constants";

/**
 * Fetch only the most recent conversation ID.
 *
 * Lightweight query (limit=1) used by useConversationInit to redirect when
 * no conversation ID is in the URL. Reads from the unfiled-items endpoint
 * since that's the canonical source for "what chat to land on" — anything
 * filed in a folder is fine to skip past for this entry-point hop.
 */
export function useFirstConversationId() {
  return useQuery({
    queryKey: ["firstConversation"],
    queryFn: async () => {
      const res = await foldersService.unfiledItems({
        itemType: "conversation",
        page: 1,
        limit: 1,
      });
      const first = res.items[0];
      return first && "conversation_id" in first
        ? (first as { conversation_id: string }).conversation_id
        : null;
    },
    staleTime: CONVERSATIONS_STALE_TIME,
  });
}
