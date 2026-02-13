import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
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
    { previousData: InfiniteData<ChatSidebarResponse> | undefined }
  >({
    mutationFn: ({ folderId, displayOrder }: PinFolderParams) =>
      conversationsService.updateFolderDisplayOrder(folderId, displayOrder),
    onMutate: async ({ folderId, displayOrder }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: chatSidebarKeys.sidebar() });

      // Snapshot previous value (InfiniteData shape from useInfiniteQuery)
      const previousData = queryClient.getQueryData<
        InfiniteData<ChatSidebarResponse>
      >(chatSidebarKeys.sidebar());

      // Optimistically update the folder's displayOrder on the first page
      if (previousData) {
        queryClient.setQueryData<InfiniteData<ChatSidebarResponse>>(
          chatSidebarKeys.sidebar(),
          {
            ...previousData,
            pages: previousData.pages.map((page, index) =>
              index === 0
                ? {
                    ...page,
                    folders: page.folders.map((folder) =>
                      folder.folderId === folderId
                        ? {
                            ...folder,
                            displayOrder,
                            updatedAt: new Date().toISOString(),
                          }
                        : folder,
                    ),
                  }
                : page,
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
