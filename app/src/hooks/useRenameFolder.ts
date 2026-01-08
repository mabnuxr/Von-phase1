import { useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { chatSidebarKeys } from "./useChatSidebar";
import type { ChatSidebarResponse } from "../types/chatSidebar";

/**
 * Parameters for renaming a folder
 */
export interface RenameFolderParams {
  folderId: string;
  name: string;
}

/**
 * Rename a folder
 * Uses optimistic updates for instant UI feedback
 */
export function useRenameFolder() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    RenameFolderParams,
    { previousData: ChatSidebarResponse | undefined }
  >({
    mutationFn: ({ folderId, name }: RenameFolderParams) =>
      conversationsService.renameFolder(folderId, name),
    onMutate: async ({ folderId, name }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: chatSidebarKeys.sidebar() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ChatSidebarResponse>(
        chatSidebarKeys.sidebar(),
      );

      // Optimistically update the folder name
      if (previousData) {
        queryClient.setQueryData<ChatSidebarResponse>(
          chatSidebarKeys.sidebar(),
          {
            ...previousData,
            folders: previousData.folders.map((folder) =>
              folder.folderId === folderId
                ? { ...folder, name, updatedAt: new Date().toISOString() }
                : folder,
            ),
          },
        );
      }

      return { previousData };
    },
    onSuccess: (_, { folderId, name }) => {
      if (import.meta.env.DEV) {
        console.log("[useRenameFolder] Renamed folder:", folderId, "to:", name);
      }
    },
    onError: (error, _, context) => {
      console.error("[useRenameFolder] Error:", error);
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
