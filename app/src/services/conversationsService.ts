import { apiClient } from "./apiClient";
import type {
  Conversation,
  ConversationMode,
  MessageFileAttachment,
  PaginatedConversationsResponse,
  PaginatedMessagesResponse,
  CreateConversationResponse,
  CreateMessageResponse,
  MessageCommand,
  MessageReference,
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
  row_count?: number;
  size_bytes: number;
  persisted_at: string;
  source_context?: string | null;
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
   * Backend expects: { title: string, mode?: ConversationMode, agentVersion?: string }
   * @param title - Conversation title
   * @param mode - Optional conversation mode (auto, dashboard-builder)
   * @param agentVersion - Optional agent version ("v1" or "v2")
   */
  async createConversation(
    title: string,
    mode?: ConversationMode,
    agentVersion?: "v1" | "v2",
  ): Promise<CreateConversationResponse> {
    const body: Record<string, unknown> = { title, mode, agentVersion };
    return apiClient.post<CreateConversationResponse>(
      `/api/v1/chat/conversations`,
      body,
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
   * Backend expects: { content: string, messageType: string, fileAttachments?: [...] }
   */
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: "text" | "json" | "markdown" = "text",
    fileAttachments?: MessageFileAttachment[],
    command?: MessageCommand,
    references?: MessageReference[],
  ): Promise<CreateMessageResponse> {
    const body: Record<string, unknown> = { content, messageType };
    if (fileAttachments?.length) {
      body.fileAttachments = fileAttachments;
    }
    if (command) {
      body.command = command;
    }
    if (references?.length) {
      body.references = references;
    }
    return apiClient.post<CreateMessageResponse>(
      `/api/v1/chat/conversations/${conversationId}/messages`,
      body,
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
   * Rename a conversation
   * Backend expects: { title: string }
   * @param conversationId - Conversation UUID
   * @param title - New conversation title
   */
  async renameConversation(
    conversationId: string,
    title: string,
  ): Promise<Conversation> {
    return apiClient.patch<Conversation>(
      `/api/v1/chat/conversations/${conversationId}`,
      { title },
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
  async getChatSidebar(
    unfiledPage: number = 1,
    unfiledLimit: number = 20,
  ): Promise<ChatSidebarResponse> {
    return apiClient.get<ChatSidebarResponse>(
      `/api/v1/chat/sidebar?unfiledPage=${unfiledPage}&unfiledLimit=${unfiledLimit}`,
    );
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
   * Update a folder's display order (used for pinning/unpinning)
   * Pin: displayOrder = 0, Unpin: displayOrder = 100 (default)
   */
  async updateFolderDisplayOrder(
    folderId: string,
    displayOrder: number,
  ): Promise<void> {
    return apiClient.patch<void>(`/api/v1/folders/${folderId}`, {
      displayOrder,
    });
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
    executionId?: string,
  ): Promise<ResumeConversationResponse> {
    return apiClient.post<ResumeConversationResponse>(
      `/api/v1/chat/conversations/${conversationId}/resume`,
      {
        approved,
        message,
        run_id: runId,
        ...(executionId ? { execution_id: executionId } : {}),
      },
    );
  }

  // ── Sharing ──────────────────────────────────────────────────────

  /** Get the share status for a conversation */
  async getShareStatus(
    conversationId: string,
  ): Promise<ConversationShareStatusResponse> {
    return apiClient.get<ConversationShareStatusResponse>(
      `/api/v1/chat/conversations/${conversationId}/share`,
    );
  }

  /** Create (or update-if-exists) a share link */
  async createShareLink(
    conversationId: string,
    accessType: "org_wide" | "restricted" = "org_wide",
    allowedUserIds: string[] = [],
  ): Promise<ConversationShareResponse> {
    return apiClient.post<ConversationShareResponse>(
      `/api/v1/chat/conversations/${conversationId}/share`,
      { accessType, allowedUserIds },
    );
  }

  /** Advance snapshot and/or change access type / recipients */
  async updateShare(
    conversationId: string,
    accessType?: "org_wide" | "restricted",
    allowedUserIds?: string[],
  ): Promise<ConversationShareResponse> {
    const body: Record<string, unknown> = {};
    if (accessType !== undefined) body.accessType = accessType;
    if (allowedUserIds !== undefined) body.allowedUserIds = allowedUserIds;
    return apiClient.patch<ConversationShareResponse>(
      `/api/v1/chat/conversations/${conversationId}/share`,
      body,
    );
  }

  /** Deactivate the share link ("Keep private") */
  async deactivateShareLink(conversationId: string): Promise<void> {
    return apiClient.delete<void>(
      `/api/v1/chat/conversations/${conversationId}/share`,
    );
  }

  /**
   * Validate a share token and return just enough metadata to bootstrap
   * the read-only view. After validation, set the share token on
   * `apiClient` and reuse the normal conversation/messages/files endpoints —
   * the auth middleware elevates the requests to the owner's context.
   */
  async validateShareToken(
    shareToken: string,
  ): Promise<SharedConversationValidationResponse> {
    return apiClient.get<SharedConversationValidationResponse>(
      `/api/v1/chat/shared/${shareToken}/validate`,
    );
  }
}

// ── Sharing response types ─────────────────────────────────────────

export interface ShareRecipient {
  userId: string;
  email: string;
  displayName: string;
}

export interface ConversationShareResponse {
  shareToken: string;
  shareUrl: string;
  isActive: boolean;
  accessType: "org_wide" | "restricted";
  sharedWith: ShareRecipient[];
  sharedAt: string;
  snapshotAt: string;
  hasNewMessages: boolean;
}

export interface ConversationShareStatusResponse {
  isShared: boolean;
  shareToken?: string;
  shareUrl?: string;
  accessType?: "org_wide" | "restricted";
  sharedWith?: ShareRecipient[];
  sharedAt?: string;
  snapshotAt?: string;
  hasNewMessages?: boolean;
}

/**
 * Lightweight response from the share-validation endpoint. Recipients use
 * this to bootstrap the read-only view; subsequent message/file/artifact
 * fetches go through the normal endpoints with `X-Share-Token` set, and
 * the auth middleware elevates them to the owner's context.
 */
export interface SharedConversationValidationResponse {
  conversationId: string;
  sharedByName: string;
  sharedByEmail: string;
  sharedAt: string;
  snapshotAt: string;
}

// Singleton instance
export const conversationsService = new ConversationsService();
