import { apiClient } from "./apiClient";
import { mockPaginatedConversations } from "../mocks/dashboardMockData";
import type {
  Conversation,
  ConversationMode,
  MessageFileAttachment,
  PaginatedConversationsResponse,
  PaginatedMessagesResponse,
  PaginationMeta,
  CreateConversationResponse,
  CreateMessageResponse,
  MessageCommand,
  MessageReference,
} from "../types/conversation";
import type { DashboardAssociatedChatsResponse } from "../types/dashboardAssociatedChats";

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
  /** Self-describing envelope fields (present when backend uses new format) */
  kind?: string;
  display_name?: string;
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

/** One entry in the shared-conversations payload — a conversation visible to
 *  the caller via a share. `shareId` is the navigation target (the read-only
 *  viewer lives at /shared/{shareId}, NOT /chat/{conversationId}). */
export interface SharedConversationItem {
  shareId: string;
  conversation: Conversation;
  ownerName: string;
  ownerEmail: string;
  sharedAt: string;
}

/** Response shape of GET /api/v1/chat/conversations/shared.
 *  Items arrive sorted by sharedAt desc — newest shares first. */
export interface SharedConversationsResponse {
  items: SharedConversationItem[];
  pagination: PaginationMeta;
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
    _page: number = 1,
    _limit: number = 20,
  ): Promise<PaginatedConversationsResponse> {
    return Promise.resolve(mockPaginatedConversations);
  }

  async getSharedConversations(
    page: number = 1,
    limit: number = 20,
  ): Promise<SharedConversationsResponse> {
    return apiClient.get<SharedConversationsResponse>(
      `/api/v1/chat/conversations/shared?page=${page}&limit=${limit}`,
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
   * Generate a narrative summary of a conversation synchronously.
   * Works in shared context when X-Share-Id is set on apiClient — the
   * backend middleware elevates the request to the owner's identity.
   */
  async summarizeConversation(
    conversationId: string,
  ): Promise<ConversationSummaryResponse> {
    return apiClient.post<ConversationSummaryResponse>(
      `/api/v1/chat/conversations/${conversationId}/summarize`,
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
   * Fetch chats associated with a specific dashboard — either created in that
   * chat or containing an @[dashboardId] mention. Sorted server-side by
   * lastMessageAt DESC. See frontend-handoff.md.
   */
  async getDashboardAssociatedChats(
    dashboardId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<DashboardAssociatedChatsResponse> {
    return apiClient.get<DashboardAssociatedChatsResponse>(
      `/api/v1/chat/dashboard/${encodeURIComponent(dashboardId)}?page=${page}&limit=${limit}`,
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
    allowFileAttachments: boolean = true,
  ): Promise<ConversationShareResponse> {
    return apiClient.post<ConversationShareResponse>(
      `/api/v1/chat/conversations/${conversationId}/share`,
      { accessType, allowedUserIds, allowFileAttachments },
    );
  }

  /** Update access type, recipients, and/or file attachment setting */
  async updateShare(
    conversationId: string,
    accessType?: "org_wide" | "restricted",
    allowedUserIds?: string[],
    allowFileAttachments?: boolean,
  ): Promise<ConversationShareResponse> {
    const body: Record<string, unknown> = {};
    if (accessType !== undefined) body.accessType = accessType;
    if (allowedUserIds !== undefined) body.allowedUserIds = allowedUserIds;
    if (allowFileAttachments !== undefined)
      body.allowFileAttachments = allowFileAttachments;
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
  async validateShare(
    shareId: string,
  ): Promise<SharedConversationValidationResponse> {
    return apiClient.get<SharedConversationValidationResponse>(
      `/api/v1/chat/shared/${shareId}/validate`,
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
  shareId: string;
  shareUrl: string;
  isActive: boolean;
  accessType: "org_wide" | "restricted";
  sharedWith: ShareRecipient[];
  sharedAt: string;
  allowFileAttachments: boolean;
}

export interface ConversationShareStatusResponse {
  isShared: boolean;
  shareId?: string;
  shareUrl?: string;
  accessType?: "org_wide" | "restricted";
  sharedWith?: ShareRecipient[];
  sharedAt?: string;
  allowFileAttachments?: boolean;
}

/**
 * Lightweight response from the share-validation endpoint. Recipients use
 * this to bootstrap the read-only view; subsequent message/file/artifact
 * fetches go through the normal endpoints with `X-Share-Id` set, and
 * the shared_read_context dependency elevates them to the owner's context.
 */
export interface SharedConversationValidationResponse {
  conversationId: string;
  sharedByName: string;
  sharedByEmail: string;
  sharedAt: string;
  allowFileAttachments: boolean;
}

export interface ConversationSummaryResponse {
  summary: string;
  message_count: number;
}

// Singleton instance
export const conversationsService = new ConversationsService();
