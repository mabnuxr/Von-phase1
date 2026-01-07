import { useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { chatSidebarKeys } from "./useChatSidebar";
import type { CreateFolderResponse } from "../types/chatSidebar";

/**
 * Create a new folder for organizing conversations
 * Invalidates sidebar cache on success to refetch folder list
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation<CreateFolderResponse, Error, string>({
    mutationFn: (name: string) => conversationsService.createFolder(name),
    onSuccess: (data) => {
      if (import.meta.env.DEV) {
        console.log("[useCreateFolder] Created folder:", data.name, data.folderId);
      }
      // Invalidate sidebar cache to refetch with new folder
      queryClient.invalidateQueries({ queryKey: chatSidebarKeys.all });
    },
    onError: (error: Error) => {
      console.error("[useCreateFolder] Error:", error);
    },
  });
}
