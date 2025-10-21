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
