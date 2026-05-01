import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { conversationsService } from "../services";
import { folderKeys } from "./folders";
import { conversationKeys } from "./useConversations";
import { dashboardAssociatedChatsKeys } from "./useDashboardAssociatedChats";
import type { Conversation } from "../types/conversation";
import type {
  FolderContentsResponse,
  FolderConversationRow,
  FolderItemsResponse,
} from "../types/chatSidebar";
import type { DashboardAssociatedChatsResponse } from "../types/dashboardAssociatedChats";

/** Parameters for renaming a conversation */
export interface RenameConversationParams {
  conversationId: string;
  title: string;
}

type UnfiledChatsCache = InfiniteData<
  FolderItemsResponse<FolderConversationRow>
>;

/**
 * Rename a conversation. Optimistically updates every place the conversation
 * could appear in cache: top-level unfiled chats, every expanded folder's
 * contents, and every cached "associated chats" list (used by the chat picker).
 */
export function useRenameConversation() {
  const queryClient = useQueryClient();

  return useMutation<
    Conversation,
    Error,
    RenameConversationParams,
    {
      previousUnfiled: UnfiledChatsCache | undefined;
      previousFolderContents: Array<
        [readonly unknown[], FolderContentsResponse | undefined]
      >;
      previousAssociated: Array<
        [readonly unknown[], DashboardAssociatedChatsResponse | undefined]
      >;
    }
  >({
    mutationFn: ({ conversationId, title }) =>
      conversationsService.renameConversation(conversationId, title),
    onMutate: async ({ conversationId, title }) => {
      await queryClient.cancelQueries({
        queryKey: folderKeys.unfiled("conversation"),
      });
      await queryClient.cancelQueries({ queryKey: folderKeys.all });
      await queryClient.cancelQueries({
        queryKey: dashboardAssociatedChatsKeys.all,
      });

      // Top-level unfiled chats — InfiniteData of FolderItemsResponse
      const previousUnfiled = queryClient.getQueryData<UnfiledChatsCache>(
        folderKeys.unfiled("conversation"),
      );
      if (previousUnfiled) {
        queryClient.setQueryData<UnfiledChatsCache>(
          folderKeys.unfiled("conversation"),
          {
            ...previousUnfiled,
            pages: previousUnfiled.pages.map((page) => ({
              ...page,
              items: page.items.map((row) =>
                row.conversation_id === conversationId
                  ? { ...row, title }
                  : row,
              ),
            })),
          },
        );
      }

      // Per-folder contents — FolderContentsResponse with conversations.items
      const previousFolderContents: Array<
        [readonly unknown[], FolderContentsResponse | undefined]
      > = [];
      queryClient
        .getQueriesData<FolderContentsResponse>({
          queryKey: [...folderKeys.all, "contents"],
        })
        .forEach(([queryKey, data]) => {
          previousFolderContents.push([queryKey, data]);
          if (!data?.conversations) return;
          const hasConv = data.conversations.items.some(
            (c) => c.conversation_id === conversationId,
          );
          if (!hasConv) return;
          queryClient.setQueryData<FolderContentsResponse>(queryKey, {
            ...data,
            conversations: {
              ...data.conversations,
              items: data.conversations.items.map((c) =>
                c.conversation_id === conversationId ? { ...c, title } : c,
              ),
            },
          });
        });

      // By-dashboard associated chats — read by ChatPicker in dashboard mode
      const previousAssociated: Array<
        [readonly unknown[], DashboardAssociatedChatsResponse | undefined]
      > = [];
      queryClient
        .getQueriesData<DashboardAssociatedChatsResponse>({
          queryKey: dashboardAssociatedChatsKeys.all,
        })
        .forEach(([queryKey, data]) => {
          previousAssociated.push([queryKey, data]);
          if (!data) return;
          const hasConv = data.conversations.some(
            (c) => c.conversationId === conversationId,
          );
          if (!hasConv) return;
          queryClient.setQueryData<DashboardAssociatedChatsResponse>(queryKey, {
            ...data,
            conversations: data.conversations.map((c) =>
              c.conversationId === conversationId ? { ...c, title } : c,
            ),
          });
        });

      return { previousUnfiled, previousFolderContents, previousAssociated };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: dashboardAssociatedChatsKeys.all,
      });
    },
    onError: (_error, _vars, context) => {
      if (context?.previousUnfiled) {
        queryClient.setQueryData(
          folderKeys.unfiled("conversation"),
          context.previousUnfiled,
        );
      }
      context?.previousFolderContents.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      context?.previousAssociated.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
  });
}
