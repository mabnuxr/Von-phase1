import { useQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import type { SharedConversationsResponse } from "../services/conversationsService";
import { CONVERSATIONS_STALE_TIME } from "../config/constants";

export const sharedConversationsKey = ["conversations", "shared"] as const;

export function useSharedConversations(enabled: boolean = true) {
  return useQuery<SharedConversationsResponse>({
    queryKey: sharedConversationsKey,
    queryFn: () => conversationsService.getSharedConversations(),
    staleTime: CONVERSATIONS_STALE_TIME,
    enabled,
  });
}
