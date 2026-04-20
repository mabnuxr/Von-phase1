import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { conversationsService } from "../services";
import { chatSidebarKeys } from "./useChatSidebar";
import { conversationKeys } from "./useConversations";
import { folderConversationsKeys } from "./useFolderConversations";
import { dashboardAssociatedChatsKeys } from "./useDashboardAssociatedChats";
import type { Conversation } from "../types/conversation";
import type { ChatSidebarResponse } from "../types/chatSidebar";
import type { DashboardAssociatedChatsResponse } from "../types/dashboardAssociatedChats";

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
    {
      previousSidebarData: InfiniteData<ChatSidebarResponse> | undefined;
      previousAssociatedSnapshots: Array<
        [readonly unknown[], DashboardAssociatedChatsResponse | undefined]
      >;
    }
  >({
    mutationFn: ({ conversationId, title }: RenameConversationParams) =>
      conversationsService.renameConversation(conversationId, title),
    onMutate: async ({ conversationId, title }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: chatSidebarKeys.sidebar() });
      await queryClient.cancelQueries({
        queryKey: folderConversationsKeys.all,
      });
      await queryClient.cancelQueries({
        queryKey: dashboardAssociatedChatsKeys.all,
      });

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

      // Snapshot + optimistic update for every cached by-dashboard list.
      // The ChatPicker reads title from this cache first in dashboard mode,
      // so without this the rename appears to revert until the cache
      // naturally refreshes.
      const previousAssociatedSnapshots: Array<
        [readonly unknown[], DashboardAssociatedChatsResponse | undefined]
      > = [];
      queryClient
        .getQueriesData<DashboardAssociatedChatsResponse>({
          queryKey: dashboardAssociatedChatsKeys.all,
        })
        .forEach(([queryKey, data]) => {
          previousAssociatedSnapshots.push([queryKey, data]);
          if (!data) return;
          const hasConv = data.conversations.some(
            (c) => c.conversationId === conversationId,
          );
          if (hasConv) {
            queryClient.setQueryData<DashboardAssociatedChatsResponse>(
              queryKey,
              {
                ...data,
                conversations: data.conversations.map((c) =>
                  c.conversationId === conversationId ? { ...c, title } : c,
                ),
              },
            );
          }
        });

      return { previousSidebarData, previousAssociatedSnapshots };
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
      // Reconcile by-dashboard caches with the server (the optimistic patch
      // above keeps the UI instant; this catches any server-side changes
      // like lastMessageAt nudges that affect ordering).
      queryClient.invalidateQueries({
        queryKey: dashboardAssociatedChatsKeys.all,
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
      // Rollback by-dashboard associated-chats caches
      context?.previousAssociatedSnapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      // Invalidate folder conversations to refetch correct data
      queryClient.invalidateQueries({
        queryKey: folderConversationsKeys.all,
      });
    },
  });
}
