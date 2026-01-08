import { useQuery } from "@tanstack/react-query";
import { conversationsService } from "../services";
import type { FolderConversationsResponse } from "../types/chatSidebar";
import { CONVERSATIONS_STALE_TIME } from "../config/constants";

/**
 * Query keys for folder conversations
 */
export const folderConversationsKeys = {
  all: ["folderConversations"] as const,
  folder: (folderId: string) =>
    [...folderConversationsKeys.all, folderId] as const,
};

/**
 * Fetch conversations within a specific folder
 * Only fetches when the folder is expanded (enabled)
 *
 * @param folderId - The folder ID to fetch conversations for
 * @param enabled - Whether the query should be enabled (typically when folder is expanded)
 */
export function useFolderConversations(
  folderId: string | null,
  enabled: boolean = true,
) {
  return useQuery<FolderConversationsResponse>({
    queryKey: folderConversationsKeys.folder(folderId ?? ""),
    queryFn: () => conversationsService.getFolderConversations(folderId!),
    enabled: enabled && !!folderId,
    staleTime: CONVERSATIONS_STALE_TIME,
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
