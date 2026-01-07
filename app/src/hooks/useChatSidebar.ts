import { useQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import type { ChatSidebarResponse } from "../types/chatSidebar";
import { CONVERSATIONS_STALE_TIME } from "../config/constants";

/**
 * Query keys for chat sidebar
 * Centralized to avoid typos and ensure consistency
 */
export const chatSidebarKeys = {
  all: ["chatSidebar"] as const,
  sidebar: () => [...chatSidebarKeys.all, "data"] as const,
};

/**
 * Fetch chat sidebar data with folders and unfiled conversations
 * Returns folders and paginated unfiled conversations for sidebar display
 */
export function useChatSidebar() {
  return useQuery<ChatSidebarResponse>({
    queryKey: chatSidebarKeys.sidebar(),
    queryFn: () => conversationsService.getChatSidebar(),
    staleTime: CONVERSATIONS_STALE_TIME,
  });
}
