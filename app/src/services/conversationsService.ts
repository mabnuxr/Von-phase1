import { apiClient } from "./apiClient";
import type {
  Conversation,
  PaginatedConversationsResponse,
  PaginatedMessagesResponse,
  CreateConversationResponse,
  CreateMessageResponse,
} from "../types/conversation";

/**
 * Service for managing conversations and messages
 * Uses ApiClient for consistent error handling and auth
 */
class ConversationsService {
  /**
   * Fetch paginated list of user's conversations
   * Backend returns sorted by updatedAt DESC
   */
  async getConversations(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedConversationsResponse> {
    return apiClient.get<PaginatedConversationsResponse>(
      `/api/v1/chat/conversations?page=${page}&limit=${limit}`,
    );
  }

  /**
   * Create a new conversation
   */
  async createConversation(title: string): Promise<CreateConversationResponse> {
    return apiClient.post<CreateConversationResponse>(
      `/api/v1/chat/conversations`,
      { title },
    );
  }

  /**
   * Get single conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    return apiClient.get<Conversation>(
      `/api/v1/chat/conversations/${conversationId}`,
    );
  }

  /**
   * Fetch paginated messages for a conversation
   */
  async getConversationMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedMessagesResponse> {
    return apiClient.get<PaginatedMessagesResponse>(
      `/api/v1/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    );
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: "text" | "json" | "markdown" = "text",
  ): Promise<CreateMessageResponse> {
    return apiClient.post<CreateMessageResponse>(
      `/api/v1/chat/conversations/${conversationId}/messages`,
      { content, messageType },
    );
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(conversationId: string): Promise<void> {
    return apiClient.delete<void>(
      `/api/v1/chat/conversations/${conversationId}`,
    );
  }
}

// Singleton instance
export const conversationsService = new ConversationsService();
