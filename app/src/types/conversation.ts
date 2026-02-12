/**
 * Conversation mode values supported by the backend API
 * Maps to frontend AgentMode:
 *   - "auto" -> "auto"
 *   - "deep_research" -> "deep-research"
 *   - "dashboard_builder" -> "build-dashboard"
 */
export type ConversationMode = "auto" | "deep_research" | "dashboard_builder";

/**
 * Conversation entity from backend
 * Sorted by updatedAt DESC by default from API
 */
export interface Conversation {
  conversationId: string; // UUID for Pusher channels and external references
  userId: string;
  tenantId: string;
  title: string;
  /**
   * Conversation mode - determines which agent/workflow handles the conversation
   * Default: "auto"
   */
  mode: ConversationMode;
  agentVersion: "v1" | "v2";
  createdAt: string;
  createdBy: string | null; // Optional - can be null if context not set
  updatedAt: string | null;
}

/**
 * Message status enum (matches backend MessageStatus)
 *
 * Note: Stuck/timed-out messages are soft-deleted by the backend,
 * so they simply disappear from the list rather than showing timeout status.
 * However, client-side timeout recovery may set status to "timeout" temporarily.
 */
export type MessageStatus =
  | "created"
  | "streaming"
  | "completed"
  | "failed"
  | "timeout";

/**
 * Denormalized file metadata stored on a message.
 * Enables rendering file pills without extra API calls.
 */
export interface MessageFileAttachment {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extension: string;
  category: string;
}

/**
 * Message entity from backend
 */
export interface Message {
  id: string;
  runId: string;
  conversationId: string;
  messageType: "text" | "json" | "markdown";
  messageContent: string;
  role: "user" | "assistant";
  createdAt: string;
  createdBy: string | null;
  fileAttachments?: MessageFileAttachment[];
}

/**
 * User message data from Pusher (legacy non-chunked format)
 * Subset of Message interface for user messages received via websocket
 */
export type PusherUserMessageData = Pick<
  Message,
  | "id"
  | "conversationId"
  | "messageContent"
  | "messageType"
  | "role"
  | "createdAt"
  | "createdBy"
  | "fileAttachments"
>;

/**
 * Chunked user message events for large messages
 * Used when message content exceeds Pusher's size limit (~10KB)
 */

/** Event: user_message.start - Initializes a chunked message */
export interface PusherUserMessageStartData {
  id: string;
  conversationId: string;
  messageType: string;
  role: "user";
  createdAt: string;
  createdBy: string | null;
  fileAttachments?: MessageFileAttachment[];
}

/** Event: user_message.content - Content chunk with sequence number */
export interface PusherUserMessageContentData {
  id: string;
  sequence: number;
  delta: string;
}

/** Event: user_message.end - Signals end of chunked message */
export interface PusherUserMessageEndData {
  id: string;
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

  messageId?: string;

  // Status tracking (from backend persistence)
  status?: MessageStatus;
  lastStreamedAt?: string;
  errorMessage?: string;

  // Event array from backend (event-driven rendering)
  events?: AguiEventWrapper[];

  // AGUI streaming data (reconstructed from events or received during live streaming)
  stepMessages?: import("@vonlabs/design-components").StepMessage[];
  toolCalls?: import("@vonlabs/design-components").ToolCall[];

  // User-stopped indicator
  stoppedByUser?: boolean;

  // V2 Thinking Process fields (TimelineThinkingProcess component)
  timelineSteps?: import("@vonlabs/design-components").TimelineStep[];
  thinkingElapsedTime?: number;
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
// Backend returns MessageWithStreaming (includes events, isStreaming, etc.)
export type PaginatedMessagesResponse = PaginatedResponse<MessageWithStreaming>;

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
