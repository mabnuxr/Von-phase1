import { useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { chatSidebarKeys } from "./useChatSidebar";
import type { ChatSidebarResponse } from "../types/chatSidebar";

/**
 * Delete a folder by ID
 * Uses optimistic updates for instant UI feedback
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    string,
    { previousData: ChatSidebarResponse | undefined }
  >({
    mutationFn: (folderId: string) =>
      conversationsService.deleteFolder(folderId),
    onMutate: async (folderId) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: chatSidebarKeys.sidebar() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ChatSidebarResponse>(
        chatSidebarKeys.sidebar(),
      );

      // Optimistically remove the folder
      if (previousData) {
        queryClient.setQueryData<ChatSidebarResponse>(
          chatSidebarKeys.sidebar(),
          {
            ...previousData,
            folders: previousData.folders.filter(
              (folder) => folder.folderId !== folderId,
            ),
          },
        );
      }

      return { previousData };
    },
    onSuccess: (_, folderId) => {
      if (import.meta.env.DEV) {
        console.log("[useDeleteFolder] Deleted folder:", folderId);
      }
    },
    onError: (error, _, context) => {
      console.error("[useDeleteFolder] Error:", error);
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(
          chatSidebarKeys.sidebar(),
          context.previousData,
        );
      }
    },
  });
}
