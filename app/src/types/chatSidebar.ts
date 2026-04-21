/**
 * Chat Sidebar V2 Types
 * Types for the new sidebar API that supports folders and organized conversations
 */

import type { ConversationMode } from "./conversation";

/**
 * Approval indicator state for a conversation in the sidebar.
 * - "pending": awaiting user approval, not yet expired
 * - "expired": TTL passed without a user decision
 * - absent / undefined: no approval needing surfacing
 */
export type ConversationApprovalState = "pending" | "expired";

/**
 * Folder entity for organizing conversations
 */
export interface ChatFolder {
  folderId: string;
  name: string;
  folderType: "chat" | "dashboard";
  conversationCount: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Conversation summary for sidebar display
 */
export interface SidebarConversation {
  conversationId: string;
  title: string;
  mode: ConversationMode;
  agentVersion: "v1" | "v2";
  createdAt: string;
  updatedAt: string;
  approvalState?: ConversationApprovalState | null;
  /** @deprecated — use `approvalState` instead. Kept during backend rollout. */
  hasPendingApproval?: boolean;
}

/**
 * Pagination metadata for unfiled conversations
 */
export interface SidebarPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Unfiled conversations section with pagination
 */
export interface UnfiledConversations {
  conversations: SidebarConversation[];
  pagination: SidebarPagination;
}

/**
 * Chat Sidebar API Response
 * Contains folders and unfiled conversations
 */
export interface ChatSidebarResponse {
  folders: ChatFolder[];
  unfiled: UnfiledConversations;
}

// ============================================================================
// Folder Mutation Types
// ============================================================================

/**
 * Request body for creating a new folder
 */
export interface CreateFolderRequest {
  name: string;
}

/**
 * Response from create folder API
 */
export interface CreateFolderResponse {
  id: string;
  folderId: string;
  name: string;
  folderType: "chat" | "dashboard";
  description: string | null;
  maxItems: number;
  itemCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

// ============================================================================
// Folder Conversations Types
// ============================================================================

/**
 * Detailed folder info from folder conversations API
 */
export interface FolderDetail {
  id: string;
  folderId: string;
  name: string;
  folderType: "chat" | "dashboard";
  description: string | null;
  maxItems: number;
  itemCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

/**
 * Conversation within a folder
 */
export interface FolderConversation {
  id: string;
  conversationId: string;
  userId: string;
  tenantId: string;
  title: string;
  folderId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  approvalState?: ConversationApprovalState | null;
  /** @deprecated — use `approvalState` instead. Kept during backend rollout. */
  hasPendingApproval?: boolean;
}

/**
 * Response from GET /api/v1/folders/{folder_id}/conversations
 */
export interface FolderConversationsResponse {
  folder: FolderDetail;
  conversations: FolderConversation[];
}
