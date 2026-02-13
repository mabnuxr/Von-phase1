import { useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { chatSidebarKeys } from "./useChatSidebar";
import type { ChatSidebarResponse } from "../types/chatSidebar";

/**
 * Parameters for pinning/unpinning a folder
 */
export interface PinFolderParams {
  folderId: string;
  displayOrder: number;
}

/**
 * Pin or unpin a folder by updating its displayOrder
 * Uses optimistic updates for instant UI feedback
 */
export function usePinFolder() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    PinFolderParams,
    { previousData: ChatSidebarResponse | undefined }
  >({
    mutationFn: ({ folderId, displayOrder }: PinFolderParams) =>
      conversationsService.updateFolderDisplayOrder(folderId, displayOrder),
    onMutate: async ({ folderId, displayOrder }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: chatSidebarKeys.sidebar() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ChatSidebarResponse>(
        chatSidebarKeys.sidebar(),
      );

      // Optimistically update the folder's displayOrder
      if (previousData) {
        queryClient.setQueryData<ChatSidebarResponse>(
          chatSidebarKeys.sidebar(),
          {
            ...previousData,
            folders: previousData.folders.map((folder) =>
              folder.folderId === folderId
                ? {
                    ...folder,
                    displayOrder,
                    updatedAt: new Date().toISOString(),
                  }
                : folder,
            ),
          },
        );
      }

      return { previousData };
    },
    onSuccess: (_, { folderId, displayOrder }) => {
      if (import.meta.env.DEV) {
        console.log(
          "[usePinFolder] Updated displayOrder:",
          folderId,
          "to:",
          displayOrder,
        );
      }
    },
    onError: (error, _, context) => {
      console.error("[usePinFolder] Error:", error);
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
