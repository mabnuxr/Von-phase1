import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
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
    { previousData: InfiniteData<ChatSidebarResponse> | undefined }
  >({
    mutationFn: (folderId: string) =>
      conversationsService.deleteFolder(folderId),
    onMutate: async (folderId) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: chatSidebarKeys.sidebar() });

      // Snapshot previous value (InfiniteData shape from useInfiniteQuery)
      const previousData = queryClient.getQueryData<
        InfiniteData<ChatSidebarResponse>
      >(chatSidebarKeys.sidebar());

      // Optimistically remove the folder from the first page
      if (previousData) {
        queryClient.setQueryData<InfiniteData<ChatSidebarResponse>>(
          chatSidebarKeys.sidebar(),
          {
            ...previousData,
            pages: previousData.pages.map((page, index) =>
              index === 0
                ? {
                    ...page,
                    folders: page.folders.filter(
                      (folder) => folder.folderId !== folderId,
                    ),
                  }
                : page,
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
