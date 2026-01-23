import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsService } from "../services";
import type {
  ConversationMode,
  PaginatedConversationsResponse,
  PaginatedMessagesResponse,
} from "../types/conversation";
import {
  CONVERSATIONS_STALE_TIME,
  MESSAGES_STALE_TIME,
  CONVERSATIONS_PAGE_LIMIT,
  MESSAGES_PAGE_LIMIT,
} from "../config/constants";

/**
 * Parameters for creating a conversation
 */
export interface CreateConversationParams {
  title: string;
  mode?: ConversationMode;
}

/**
 * Query keys for conversations
 * Centralized to avoid typos and ensure consistency
 */
export const conversationKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationKeys.all, "list"] as const,
  list: (page: number, limit: number) =>
    [...conversationKeys.lists(), page, limit] as const,
  messages: (conversationId: string) =>
    ["conversation-messages", conversationId] as const,
  messagesList: (conversationId: string, page: number, limit: number) =>
    [...conversationKeys.messages(conversationId), page, limit] as const,
};

/**
 * Fetch paginated conversations
 * Auto-refetches on window focus for fresh data
 */
export function useConversations(
  page: number = 1,
  limit: number = CONVERSATIONS_PAGE_LIMIT,
) {
  return useQuery<PaginatedConversationsResponse>({
    queryKey: conversationKeys.list(page, limit),
    queryFn: () => conversationsService.getConversations(page, limit),
    staleTime: CONVERSATIONS_STALE_TIME,
  });
}

/**
 * Fetch messages for a conversation
 * Only enabled when conversationId is provided
 */
export function useConversationMessages(
  conversationId: string | null,
  page: number = 1,
  limit: number = MESSAGES_PAGE_LIMIT,
) {
  return useQuery<PaginatedMessagesResponse>({
    queryKey: conversationId
      ? conversationKeys.messagesList(conversationId, page, limit)
      : ["conversation-messages", null],
    queryFn: () => {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }
      return conversationsService.getConversationMessages(
        conversationId,
        page,
        limit,
      );
    },
    enabled: !!conversationId,
    staleTime: MESSAGES_STALE_TIME,
  });
}

/**
 * Create a new conversation
 * Invalidates conversation list on success
 * @param params - { title: string, mode?: ConversationMode }
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateConversationParams) =>
      conversationsService.createConversation(params.title, params.mode),
    onSuccess: (data) => {
      if (import.meta.env.DEV) {
        console.log(
          "[useCreateConversation] Created:",
          data.conversation.conversationId,
          "mode:",
          data.conversation.mode,
        );
      }
      // Invalidate all conversation lists to refetch
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
    onError: (error: Error) => {
      console.error("[useCreateConversation] Error:", error);
    },
  });
}

/**
 * Delete a conversation
 * Invalidates conversation list on success
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      conversationsService.deleteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      if (import.meta.env.DEV) {
        console.log("[useDeleteConversation] Deleted:", conversationId);
      }
      // Invalidate all conversation lists
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      // Remove messages cache for deleted conversation
      queryClient.removeQueries({
        queryKey: conversationKeys.messages(conversationId),
      });
    },
    onError: (error: Error) => {
      console.error("[useDeleteConversation] Error:", error);
    },
  });
}
