import { useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsService } from "../services";
import { chatSidebarKeys } from "./useChatSidebar";
import { folderConversationsKeys } from "./useFolderConversations";
import type {
  ChatSidebarResponse,
  FolderConversationsResponse,
  SidebarConversation,
  FolderConversation,
} from "../types/chatSidebar";

/**
 * Parameters for adding a conversation to a folder
 */
export interface AddToFolderParams {
  /** The conversation ID to add */
  conversationId: string;
  /** Target folder ID */
  targetFolderId: string;
  /** Source folder ID (for cache invalidation - null if from root) */
  sourceFolderId?: string | null;
}

/**
 * Parameters for removing a conversation from a folder
 */
export interface RemoveFromFolderParams {
  /** The conversation ID to remove */
  conversationId: string;
  /** Source folder ID to remove from */
  sourceFolderId: string;
}

interface MoveConversationContext {
  previousSidebarData: ChatSidebarResponse | undefined;
  previousSourceFolderData: FolderConversationsResponse | undefined;
  previousTargetFolderData: FolderConversationsResponse | undefined;
}

/**
 * Add a conversation to a folder
 * Uses optimistic updates for instant UI feedback and invalidates
 * relevant caches on success
 */
export function useAddConversationToFolder() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, AddToFolderParams, MoveConversationContext>({
    mutationFn: ({ conversationId, targetFolderId }: AddToFolderParams) =>
      conversationsService.addConversationToFolder(
        targetFolderId,
        conversationId,
      ),

    onMutate: async ({ conversationId, targetFolderId, sourceFolderId }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: chatSidebarKeys.sidebar() });

      if (sourceFolderId) {
        await queryClient.cancelQueries({
          queryKey: folderConversationsKeys.folder(sourceFolderId),
        });
      }

      await queryClient.cancelQueries({
        queryKey: folderConversationsKeys.folder(targetFolderId),
      });

      // Snapshot previous values for rollback
      const previousSidebarData = queryClient.getQueryData<ChatSidebarResponse>(
        chatSidebarKeys.sidebar(),
      );

      const previousSourceFolderData = sourceFolderId
        ? queryClient.getQueryData<FolderConversationsResponse>(
            folderConversationsKeys.folder(sourceFolderId),
          )
        : undefined;

      const previousTargetFolderData =
        queryClient.getQueryData<FolderConversationsResponse>(
          folderConversationsKeys.folder(targetFolderId),
        );

      // Find the conversation to move
      let conversationToMove:
        | SidebarConversation
        | FolderConversation
        | undefined;

      // Check unfiled conversations first
      if (previousSidebarData?.unfiled?.conversations) {
        conversationToMove = previousSidebarData.unfiled.conversations.find(
          (c) => c.conversationId === conversationId,
        );
      }

      // Check source folder if provided and not found in unfiled
      if (!conversationToMove && sourceFolderId && previousSourceFolderData) {
        conversationToMove = previousSourceFolderData.conversations.find(
          (c) => c.conversationId === conversationId,
        );
      }

      // Optimistically update sidebar (remove from unfiled if present)
      if (previousSidebarData) {
        queryClient.setQueryData<ChatSidebarResponse>(
          chatSidebarKeys.sidebar(),
          {
            ...previousSidebarData,
            unfiled: {
              ...previousSidebarData.unfiled,
              conversations: previousSidebarData.unfiled.conversations.filter(
                (c) => c.conversationId !== conversationId,
              ),
            },
          },
        );
      }

      // Optimistically update source folder (remove conversation)
      if (sourceFolderId && previousSourceFolderData) {
        queryClient.setQueryData<FolderConversationsResponse>(
          folderConversationsKeys.folder(sourceFolderId),
          {
            ...previousSourceFolderData,
            conversations: previousSourceFolderData.conversations.filter(
              (c) => c.conversationId !== conversationId,
            ),
          },
        );
      }

      // Optimistically update target folder (add conversation)
      if (previousTargetFolderData && conversationToMove) {
        const newConversation: FolderConversation = {
          id: conversationId,
          conversationId,
          userId: "",
          tenantId: "",
          title: conversationToMove.title,
          folderId: targetFolderId,
          createdAt: conversationToMove.createdAt,
          createdBy: "",
          updatedAt: conversationToMove.updatedAt,
        };

        queryClient.setQueryData<FolderConversationsResponse>(
          folderConversationsKeys.folder(targetFolderId),
          {
            ...previousTargetFolderData,
            conversations: [
              ...previousTargetFolderData.conversations,
              newConversation,
            ],
          },
        );
      }

      return {
        previousSidebarData,
        previousSourceFolderData,
        previousTargetFolderData,
      };
    },

    onSuccess: (_, { targetFolderId, sourceFolderId }) => {
      if (import.meta.env.DEV) {
        console.log(
          "[useAddConversationToFolder] Add successful:",
          `source=${sourceFolderId || "root"} -> target=${targetFolderId}`,
        );
      }

      // Invalidate all affected caches to refetch fresh data
      queryClient.invalidateQueries({ queryKey: chatSidebarKeys.sidebar() });

      if (sourceFolderId) {
        queryClient.invalidateQueries({
          queryKey: folderConversationsKeys.folder(sourceFolderId),
        });
      }

      queryClient.invalidateQueries({
        queryKey: folderConversationsKeys.folder(targetFolderId),
      });
    },

    onError: (error, _, context) => {
      console.error("[useAddConversationToFolder] Error:", error);

      // Rollback to previous data on error
      if (context?.previousSidebarData) {
        queryClient.setQueryData(
          chatSidebarKeys.sidebar(),
          context.previousSidebarData,
        );
      }

      if (context?.previousSourceFolderData) {
        queryClient.setQueryData(
          folderConversationsKeys.folder(
            context.previousSourceFolderData.folder.folderId,
          ),
          context.previousSourceFolderData,
        );
      }

      if (context?.previousTargetFolderData) {
        queryClient.setQueryData(
          folderConversationsKeys.folder(
            context.previousTargetFolderData.folder.folderId,
          ),
          context.previousTargetFolderData,
        );
      }
    },
  });
}

/**
 * Remove a conversation from a folder (moves to root/unfiled)
 * Uses optimistic updates for instant UI feedback and invalidates
 * relevant caches on success
 */
export function useRemoveConversationFromFolder() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    RemoveFromFolderParams,
    {
      previousSidebarData: ChatSidebarResponse | undefined;
      previousFolderData: FolderConversationsResponse | undefined;
    }
  >({
    mutationFn: ({ conversationId, sourceFolderId }: RemoveFromFolderParams) =>
      conversationsService.removeConversationFromFolder(
        sourceFolderId,
        conversationId,
      ),

    onMutate: async ({ conversationId, sourceFolderId }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: chatSidebarKeys.sidebar() });
      await queryClient.cancelQueries({
        queryKey: folderConversationsKeys.folder(sourceFolderId),
      });

      // Snapshot previous values for rollback
      const previousSidebarData = queryClient.getQueryData<ChatSidebarResponse>(
        chatSidebarKeys.sidebar(),
      );

      const previousFolderData =
        queryClient.getQueryData<FolderConversationsResponse>(
          folderConversationsKeys.folder(sourceFolderId),
        );

      // Find the conversation to remove from folder
      const conversationToMove = previousFolderData?.conversations.find(
        (c) => c.conversationId === conversationId,
      );

      // Optimistically update folder (remove conversation)
      if (previousFolderData) {
        queryClient.setQueryData<FolderConversationsResponse>(
          folderConversationsKeys.folder(sourceFolderId),
          {
            ...previousFolderData,
            conversations: previousFolderData.conversations.filter(
              (c) => c.conversationId !== conversationId,
            ),
          },
        );
      }

      // Optimistically update sidebar (add to unfiled)
      if (previousSidebarData && conversationToMove) {
        const newUnfiledConversation: SidebarConversation = {
          conversationId: conversationToMove.conversationId,
          title: conversationToMove.title,
          createdAt: conversationToMove.createdAt,
          updatedAt: conversationToMove.updatedAt,
        };

        queryClient.setQueryData<ChatSidebarResponse>(
          chatSidebarKeys.sidebar(),
          {
            ...previousSidebarData,
            unfiled: {
              ...previousSidebarData.unfiled,
              conversations: [
                newUnfiledConversation,
                ...previousSidebarData.unfiled.conversations,
              ],
            },
          },
        );
      }

      return {
        previousSidebarData,
        previousFolderData,
      };
    },

    onSuccess: (_, { sourceFolderId }) => {
      if (import.meta.env.DEV) {
        console.log(
          "[useRemoveConversationFromFolder] Remove successful:",
          `removed from folder=${sourceFolderId}`,
        );
      }

      // Invalidate all affected caches to refetch fresh data
      queryClient.invalidateQueries({ queryKey: chatSidebarKeys.sidebar() });
      queryClient.invalidateQueries({
        queryKey: folderConversationsKeys.folder(sourceFolderId),
      });
    },

    onError: (error, { sourceFolderId }, context) => {
      console.error("[useRemoveConversationFromFolder] Error:", error);

      // Rollback to previous data on error
      if (context?.previousSidebarData) {
        queryClient.setQueryData(
          chatSidebarKeys.sidebar(),
          context.previousSidebarData,
        );
      }

      if (context?.previousFolderData) {
        queryClient.setQueryData(
          folderConversationsKeys.folder(sourceFolderId),
          context.previousFolderData,
        );
      }
    },
  });
}
