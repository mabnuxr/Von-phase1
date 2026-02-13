import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { conversationsService } from "../services";
import { chatSidebarKeys } from "./useChatSidebar";
import type {
  CreateFolderResponse,
  ChatSidebarResponse,
} from "../types/chatSidebar";

/**
 * Create a new folder for organizing conversations
 * Uses optimistic updates for instant UI feedback
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateFolderResponse,
    Error,
    string,
    { previousData: InfiniteData<ChatSidebarResponse> | undefined }
  >({
    mutationFn: (name: string) => conversationsService.createFolder(name),
    onMutate: async (name) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: chatSidebarKeys.sidebar() });

      // Snapshot previous value (InfiniteData shape from useInfiniteQuery)
      const previousData = queryClient.getQueryData<
        InfiniteData<ChatSidebarResponse>
      >(chatSidebarKeys.sidebar());

      // Optimistically add the new folder to the first page
      if (previousData) {
        const optimisticFolder = {
          folderId: `temp-${Date.now()}`,
          name,
          folderType: "chat" as const,
          conversationCount: 0,
          displayOrder: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        queryClient.setQueryData<InfiniteData<ChatSidebarResponse>>(
          chatSidebarKeys.sidebar(),
          {
            ...previousData,
            pages: previousData.pages.map((page, index) =>
              index === 0
                ? {
                    ...page,
                    folders: [...page.folders, optimisticFolder],
                  }
                : page,
            ),
          },
        );
      }

      return { previousData };
    },
    onSuccess: (data) => {
      if (import.meta.env.DEV) {
        console.log(
          "[useCreateFolder] Created folder:",
          data.name,
          data.folderId,
        );
      }

      // Replace optimistic folder with actual server response
      const currentData = queryClient.getQueryData<
        InfiniteData<ChatSidebarResponse>
      >(chatSidebarKeys.sidebar());

      if (currentData) {
        queryClient.setQueryData<InfiniteData<ChatSidebarResponse>>(
          chatSidebarKeys.sidebar(),
          {
            ...currentData,
            pages: currentData.pages.map((page, index) =>
              index === 0
                ? {
                    ...page,
                    folders: page.folders.map((folder) =>
                      folder.folderId.startsWith("temp-")
                        ? {
                            folderId: data.folderId,
                            name: data.name,
                            folderType: data.folderType,
                            conversationCount: data.itemCount,
                            displayOrder: 100,
                            createdAt: data.createdAt,
                            updatedAt: data.updatedAt,
                          }
                        : folder,
                    ),
                  }
                : page,
            ),
          },
        );
      }
    },
    onError: (error, _, context) => {
      console.error("[useCreateFolder] Error:", error);
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
