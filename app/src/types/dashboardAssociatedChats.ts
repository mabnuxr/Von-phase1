/**
 * Types for GET /api/v1/chat/sidebar/by-dashboard/{dashboardId}
 * See frontend-handoff.md for the full spec.
 */

export type MentionReason = "created" | "mentioned";

export type DashboardChatApprovalState = "pending" | "expired" | null;

/**
 * A chat associated with a dashboard — either the chat that created it
 * or a chat that @-mentions it anywhere in its message history.
 */
export interface DashboardAssociatedChat {
  conversationId: string;
  title: string;
  mode: string;
  agentVersion: "v1" | "v2";
  createdAt: string;
  updatedAt: string;
  approvalState: DashboardChatApprovalState;
  hasPendingApproval: boolean;
  /** Timestamp of the most recent message — this is the server-side sort key (DESC). */
  lastMessageAt: string;
  /** Timestamp of the most recent message referencing this dashboard. Use for the pill. */
  lastMentionedAt: string;
  mentionReason: MentionReason;
}

export interface DashboardAssociatedChatsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DashboardAssociatedChatsResponse {
  conversations: DashboardAssociatedChat[];
  pagination: DashboardAssociatedChatsPagination;
}
