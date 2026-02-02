import { apiClient } from "./apiClient";
import type {
  Conversation,
  ConversationMode,
  PaginatedConversationsResponse,
  PaginatedMessagesResponse,
  CreateConversationResponse,
  CreateMessageResponse,
} from "../types/conversation";
import type {
  ChatSidebarResponse,
  CreateFolderResponse,
  FolderConversationsResponse,
} from "../types/chatSidebar";

/**
 * Response type for resuming an interrupted conversation
 */
export interface ResumeConversationResponse {
  status: string;
  conversationId: string;
  error?: string;
}

/**
 * Response type for artifact retrieval
 */
export interface ArtifactResponse {
  artifact_id: string;
  tool_call_id: string;
  tool_name: string;
  artifact_type: string;
  category?: string;
  content: Record<string, unknown>;
  size_bytes: number;
  persisted_at: string;
}

/**
 * Summary of an artifact (without full content)
 */
export interface ArtifactSummary {
  artifact_id: string;
  tool_call_id: string;
  tool_name: string;
  artifact_type: string;
  category?: string;
  query_name?: string;
  size_bytes: number;
  persisted_at: string;
}

/**
 * Response type for listing all artifacts for a message/run
 */
export interface MessageArtifactsResponse {
  conversation_id: string;
  run_id: string;
  total_count: number;
  artifacts: ArtifactSummary[];
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
   * Backend expects: { title: string, mode?: ConversationMode }
   * @param title - Conversation title
   * @param mode - Optional conversation mode (auto, deep_research, dashboard_builder)
   */
  async createConversation(
    title: string,
    mode?: ConversationMode,
  ): Promise<CreateConversationResponse> {
    return apiClient.post<CreateConversationResponse>(
      `/api/v1/chat/conversations`,
      {
        title,
        mode,
      },
    );
  }

  /**
   * Update a conversation's mode
   * Backend expects: { mode: ConversationMode }
   * Note: Frontend prevents mode changes after creation, but backend supports it
   * @param conversationId - Conversation UUID
   * @param mode - New conversation mode
   */
  async updateConversationMode(
    conversationId: string,
    mode: ConversationMode,
  ): Promise<Conversation> {
    return apiClient.patch<Conversation>(
      `/api/v1/chat/conversations/${conversationId}`,
      { mode },
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
   * Fetch list of all artifacts for a message/run
   * Used for transparency drawer to show data sources
   */
  async getMessageArtifacts(
    conversationId: string,
    runId: string,
  ): Promise<MessageArtifactsResponse> {
    return apiClient.get<MessageArtifactsResponse>(
      `/api/v1/chat/conversations/${conversationId}/messages/${runId}/artifacts`,
    );
  }

  /**
   * Fetch full artifact content by ID (alternative signature using runId)
   * Used for transparency drawer to load artifact content
   */
  async getArtifactByRunId(
    conversationId: string,
    runId: string,
    artifactId: string,
  ): Promise<ArtifactResponse> {
    return apiClient.get<ArtifactResponse>(
      `/api/v1/chat/conversations/${conversationId}/messages/${runId}/artifacts/${artifactId}`,
    );
  }

  /**
   * Fetch multiple artifacts in bulk by their IDs
   * Used for transparency drawer Calls tab to load all RAG artifacts at once
   */
  async getBulkArtifacts(
    conversationId: string,
    runId: string,
    artifactIds: string[],
  ): Promise<ArtifactResponse[]> {
    return apiClient.post<ArtifactResponse[]>(
      `/api/v1/chat/conversations/${conversationId}/messages/${runId}/artifacts/bulk`,
      { artifact_ids: artifactIds },
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

  /**
   * Fetch conversations within a folder
   * Returns folder details and list of conversations
   */
  async getFolderConversations(
    folderId: string,
  ): Promise<FolderConversationsResponse> {
    return apiClient.get<FolderConversationsResponse>(
      `/api/v1/folders/${folderId}/conversations`,
    );
  }

  /**
   * Add a conversation to a folder
   * @param folderId - Target folder ID
   * @param conversationId - The conversation to add
   */
  async addConversationToFolder(
    folderId: string,
    conversationId: string,
  ): Promise<void> {
    return apiClient.post<void>(`/api/v1/folders/${folderId}/conversations`, {
      conversation_id: conversationId,
    });
  }

  /**
   * Remove a conversation from a folder
   * @param folderId - Folder ID to remove from
   * @param conversationId - The conversation to remove
   */
  async removeConversationFromFolder(
    folderId: string,
    conversationId: string,
  ): Promise<void> {
    return apiClient.delete<void>(
      `/api/v1/folders/${folderId}/conversations/${conversationId}`,
    );
  }

  /**
   * Resume an interrupted conversation with user's approval decision
   *
   * Used when the agent has paused execution (e.g., for Salesforce CRUD approval)
   * and needs the user's approval or rejection to continue.
   *
   * @param conversationId - ID of the conversation to resume
   * @param approved - Whether the user approved the pending operation
   * @param runId - The run_id of the interrupted workflow to continue
   * @param message - Optional message from the user about their decision
   * @returns Promise with the resume status
   */
  async resumeConversation(
    conversationId: string,
    approved: boolean,
    runId: string,
    message: string = "",
  ): Promise<ResumeConversationResponse> {
    return apiClient.post<ResumeConversationResponse>(
      `/api/v1/chat/conversations/${conversationId}/resume`,
      {
        approved,
        message,
        run_id: runId,
      },
    );
  }
}

// Singleton instance
export const conversationsService = new ConversationsService();
