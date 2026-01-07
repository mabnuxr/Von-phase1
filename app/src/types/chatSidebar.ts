/**
 * Chat Sidebar V2 Types
 * Types for the new sidebar API that supports folders and organized conversations
 */

/**
 * Folder entity for organizing conversations
 */
export interface ChatFolder {
  folderId: string;
  name: string;
  folderType: "chat" | "dashboard";
  conversationCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Conversation summary for sidebar display
 */
export interface SidebarConversation {
  conversationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
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
