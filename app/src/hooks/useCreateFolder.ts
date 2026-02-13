import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    { previousData: ChatSidebarResponse | undefined }
  >({
    mutationFn: (name: string) => conversationsService.createFolder(name),
    onMutate: async (name) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: chatSidebarKeys.sidebar() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ChatSidebarResponse>(
        chatSidebarKeys.sidebar(),
      );

      // Optimistically add the new folder
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

        queryClient.setQueryData<ChatSidebarResponse>(
          chatSidebarKeys.sidebar(),
          {
            ...previousData,
            folders: [...previousData.folders, optimisticFolder],
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
      const currentData = queryClient.getQueryData<ChatSidebarResponse>(
        chatSidebarKeys.sidebar(),
      );

      if (currentData) {
        queryClient.setQueryData<ChatSidebarResponse>(
          chatSidebarKeys.sidebar(),
          {
            ...currentData,
            folders: currentData.folders.map((folder) =>
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
