import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { conversationsService } from "../services";
import { chatSidebarKeys } from "./useChatSidebar";
import { conversationKeys } from "./useConversations";
import { folderConversationsKeys } from "./useFolderConversations";
import type { Conversation } from "../types/conversation";
import type { ChatSidebarResponse } from "../types/chatSidebar";

/**
 * Parameters for renaming a conversation
 */
export interface RenameConversationParams {
  conversationId: string;
  title: string;
}

/**
 * Rename a conversation
 * Uses optimistic updates for instant UI feedback
 */
export function useRenameConversation() {
  const queryClient = useQueryClient();

  return useMutation<
    Conversation,
    Error,
    RenameConversationParams,
    { previousSidebarData: InfiniteData<ChatSidebarResponse> | undefined }
  >({
    mutationFn: ({ conversationId, title }: RenameConversationParams) =>
      conversationsService.renameConversation(conversationId, title),
    onMutate: async ({ conversationId, title }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: chatSidebarKeys.sidebar() });

      // Snapshot previous value (InfiniteData shape from useInfiniteQuery)
      const previousSidebarData = queryClient.getQueryData<
        InfiniteData<ChatSidebarResponse>
      >(chatSidebarKeys.sidebar());

      // Optimistically update the conversation title in unfiled conversations
      if (previousSidebarData) {
        queryClient.setQueryData<InfiniteData<ChatSidebarResponse>>(
          chatSidebarKeys.sidebar(),
          {
            ...previousSidebarData,
            pages: previousSidebarData.pages.map((page) => ({
              ...page,
              unfiled: {
                ...page.unfiled,
                conversations: page.unfiled.conversations.map((conv) =>
                  conv.conversationId === conversationId
                    ? { ...conv, title }
                    : conv,
                ),
              },
            })),
          },
        );
      }

      // Also update in any cached folder conversations
      queryClient
        .getQueriesData<unknown>({
          queryKey: folderConversationsKeys.all,
        })
        .forEach(([queryKey, data]) => {
          if (!data || typeof data !== "object" || !("conversations" in data))
            return;
          const folderData = data as {
            conversations: Array<{
              conversationId: string;
              title: string;
            }>;
          };
          const hasConv = folderData.conversations.some(
            (c) => c.conversationId === conversationId,
          );
          if (hasConv) {
            queryClient.setQueryData(queryKey, {
              ...folderData,
              conversations: folderData.conversations.map((conv) =>
                conv.conversationId === conversationId
                  ? { ...conv, title }
                  : conv,
              ),
            });
          }
        });

      return { previousSidebarData };
    },
    onSuccess: (_, { conversationId, title }) => {
      if (import.meta.env.DEV) {
        console.log(
          "[useRenameConversation] Renamed conversation:",
          conversationId,
          "to:",
          title,
        );
      }
      // Invalidate conversation list queries so V1 sidebar and currentConversationTitle stay in sync
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
    onError: (error, _, context) => {
      console.error("[useRenameConversation] Error:", error);
      // Rollback to previous data on error
      if (context?.previousSidebarData) {
        queryClient.setQueryData(
          chatSidebarKeys.sidebar(),
          context.previousSidebarData,
        );
      }
      // Invalidate folder conversations to refetch correct data
      queryClient.invalidateQueries({
        queryKey: folderConversationsKeys.all,
      });
    },
  });
}
