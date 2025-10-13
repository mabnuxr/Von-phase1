import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsService } from "../services";
import type {
  PaginatedConversationsResponse,
  PaginatedMessagesResponse,
} from "../types/conversation";

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
export function useConversations(page: number = 1, limit: number = 20) {
  return useQuery<PaginatedConversationsResponse>({
    queryKey: conversationKeys.list(page, limit),
    queryFn: () => conversationsService.getConversations(page, limit),
    staleTime: 30000, // Consider data fresh for 30s
  });
}

/**
 * Fetch messages for a conversation
 * Only enabled when conversationId is provided
 */
export function useConversationMessages(
  conversationId: string | null,
  page: number = 1,
  limit: number = 50,
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
    staleTime: 10000, // Messages stay fresh for 10s
  });
}

/**
 * Create a new conversation
 * Invalidates conversation list on success
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: string) =>
      conversationsService.createConversation(title),
    onSuccess: (data) => {
      if (import.meta.env.DEV) {
        console.log("[useCreateConversation] Created:", data.conversation.id);
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
