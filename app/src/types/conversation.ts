/**
 * Conversation entity from backend
 * Sorted by updatedAt DESC by default from API
 */
export interface Conversation {
  conversationId: string; // UUID for Pusher channels and external references
  userId: string;
  tenantId: string;
  title: string;
  createdAt: string;
  createdBy: string | null; // Optional - can be null if context not set
  updatedAt: string | null;
}

/**
 * Message status enum (matches backend MessageStatus)
 *
 * Note: Stuck/timed-out messages are soft-deleted by the backend,
 * so they simply disappear from the list rather than showing timeout status.
 */
export type MessageStatus = "created" | "streaming" | "completed" | "failed";

/**
 * Message entity from backend
 */
export interface Message {
  id: string;
  conversationId: string;
  messageType: "text" | "json" | "markdown";
  messageContent: string;
  role: "user" | "assistant";
  createdAt: string;
  createdBy: string | null; // Optional - can be null if context not set
}

/**
 * AG-UI Event Wrapper (imported and re-exported from design-components)
 * Matches PusherEnvelope format from backend
 */
import type { AguiEventWrapper } from "@vonlabs/design-components";
export type { AguiEventWrapper } from "@vonlabs/design-components";

/**
 * Extended message type with streaming properties
 * Used for real-time streaming updates via Pusher
 */
export interface MessageWithStreaming extends Message {
  isStreaming?: boolean;
  isReasoningStreaming?: boolean;
  reasoningContent?: string;

  // Status tracking (from backend persistence)
  status?: MessageStatus;
  runId?: string;
  lastStreamedAt?: string;
  errorMessage?: string;

  // Event array from backend (event-driven rendering)
  events?: AguiEventWrapper[];

  // AGUI streaming data (reconstructed from events or received during live streaming)
  stepMessages?: import("@vonlabs/design-components").StepMessage[];
  toolCalls?: import("@vonlabs/design-components").ToolCall[];
}

/**
 * Pagination metadata from backend
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * API response types
 */
export type PaginatedConversationsResponse = PaginatedResponse<Conversation>;
export type PaginatedMessagesResponse = PaginatedResponse<Message>;

export interface CreateConversationResponse {
  conversation: Conversation;
}

export interface CreateMessageResponse {
  id: string;
  messageId: string;
  conversationId: string;
  success: boolean;
  timestamp: string;
  pusher_triggered?: boolean;
}
