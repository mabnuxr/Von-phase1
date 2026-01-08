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
 *
 * Uses optimized settings to prevent unnecessary refetches:
 * - staleTime: Data considered fresh for 30 seconds
 * - gcTime: Keep cached data for 5 minutes
 * - refetchOnWindowFocus: Disabled to prevent refetch when switching tabs
 * - refetchOnMount: Only refetch if data is stale
 */
export function useChatSidebar() {
  return useQuery<ChatSidebarResponse>({
    queryKey: chatSidebarKeys.sidebar(),
    queryFn: () => conversationsService.getChatSidebar(),
    staleTime: CONVERSATIONS_STALE_TIME,
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
