import { apiClient } from "./apiClient";
import type {
  Conversation,
  PaginatedConversationsResponse,
  PaginatedMessagesResponse,
  CreateConversationResponse,
  CreateMessageResponse,
} from "../types/conversation";
import type {
  ChatSidebarResponse,
  CreateFolderResponse,
} from "../types/chatSidebar";

/**
 * Response type for artifact retrieval
 */
export interface ArtifactResponse {
  artifact_id: string;
  tool_call_id: string;
  tool_name: string;
  artifact_type: string;
  content: Record<string, unknown>;
  size_bytes: number;
  persisted_at: string;
}

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
   * Backend expects: { title: string }
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
   * Backend expects: { content: string, messageType: string }
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

  /**
   * Fetch artifact (tool call result) by ID
   * Used for lazy loading of large tool results stored separately
   */
  async getArtifact(
    conversationId: string,
    messageId: string,
    artifactId: string,
  ): Promise<ArtifactResponse> {
    return apiClient.get<ArtifactResponse>(
      `/api/v1/chat/conversations/${conversationId}/messages/${messageId}/artifacts/${artifactId}`,
    );
  }

  /**
   * Send stop signal to interrupt streaming
   */
  async stopStreaming(conversationId: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(
      `/api/v1/chat/conversations/${conversationId}/stop`,
    );
  }

  /**
   * Fetch chat sidebar data with folders and unfiled conversations
   * Used for ChatSidebarV2 component
   */
  async getChatSidebar(): Promise<ChatSidebarResponse> {
    return apiClient.get<ChatSidebarResponse>(`/api/v1/chat/sidebar`);
  }

  /**
   * Create a new folder for organizing conversations
   * Backend expects: { name: string }
   */
  async createFolder(name: string): Promise<CreateFolderResponse> {
    return apiClient.post<CreateFolderResponse>(`/api/v1/folders`, { name });
  }

  /**
   * Delete a folder by ID
   */
  async deleteFolder(folderId: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/folders/${folderId}`);
  }

  /**
   * Rename a folder
   * Backend expects: { name: string }
   */
  async renameFolder(folderId: string, name: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/folders/${folderId}`, { name });
  }
}

// Singleton instance
export const conversationsService = new ConversationsService();
