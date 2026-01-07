import { useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { chatSidebarKeys } from "./useChatSidebar";

/**
 * Delete a folder by ID
 * Invalidates sidebar cache on success to refetch folder list
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (folderId: string) => conversationsService.deleteFolder(folderId),
    onSuccess: (_, folderId) => {
      if (import.meta.env.DEV) {
        console.log("[useDeleteFolder] Deleted folder:", folderId);
      }
      // Invalidate sidebar cache to refetch without deleted folder
      queryClient.invalidateQueries({ queryKey: chatSidebarKeys.all });
    },
    onError: (error: Error) => {
      console.error("[useDeleteFolder] Error:", error);
    },
  });
}
