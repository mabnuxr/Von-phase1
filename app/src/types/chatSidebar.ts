/**
 * Folders v2 Types
 *
 * Generic, item-type-aware folder API. A folder holds memberships to items
 * identified by (itemType, itemId). The two item types we render today are
 * `conversation` and `dashboard`.
 *
 * Convention from the backend handoff:
 *   - Folder + pagination wrappers are camelCase (folderId, hasNextPage, …).
 *   - Item rows inside `items[]` are snake_case (conversation_id, dashboard_id, …).
 * We don't normalise both directions; adapter hooks map snake_case → the
 * design-components UI types only where required.
 */

import type { ConversationMode } from "./conversation";

/**
 * Canonical Folders v2 item-type vocabulary (matches the backend enum).
 * Exposed as both a const object (for value-position use, e.g.
 * `FolderItemType.Dashboard`) and a string union type (for type positions).
 */
export const FolderItemType = {
  Conversation: "conversation",
  Dashboard: "dashboard",
} as const;

export type FolderItemType =
  (typeof FolderItemType)[keyof typeof FolderItemType];

/**
 * Translate the design-system sidebar's display-side vocabulary
 * (`'chat' | 'dashboard'`) to the API's `FolderItemType`. `'chat' →
 * 'conversation'`; `'dashboard'` is identical.
 */
export function toFolderItemType(
  sidebarType: "chat" | "dashboard",
): FolderItemType {
  return sidebarType === "dashboard"
    ? FolderItemType.Dashboard
    : FolderItemType.Conversation;
}

/**
 * Approval indicator state for a conversation in the sidebar.
 * - "pending": awaiting user approval, not yet expired
 * - "expired": TTL passed without a user decision
 * - absent / undefined: no approval needing surfacing
 */
export type ConversationApprovalState = "pending" | "expired";

/**
 * Folder entity. User-scoped; carries display metadata only — membership is
 * the source of truth for "what's inside".
 */
export interface Folder {
  id: string;
  folderId: string;
  name: string;
  description: string | null;
  maxItems: number;
  itemCount: number;
  displayOrder: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

/**
 * Pagination metadata wrapper used across all folder list endpoints.
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  sortConfig: unknown;
}

export interface FoldersListResponse {
  data: Folder[];
  total: number;
  pagination: PaginationMetadata;
}

// ──────────────────────────────────────────────────────────────────────────
// Item rows (snake_case) returned by per-type adapters
// ──────────────────────────────────────────────────────────────────────────

export interface FolderConversationRow {
  id: string;
  conversation_id: string;
  user_id: string;
  tenant_id: string;
  title: string;
  mode: ConversationMode;
  agent_version: "v1" | "v2";
  created_at: string;
  created_by: string;
  updated_at: string;
  approval_state: ConversationApprovalState | null;
}

export interface FolderDashboardRow {
  dashboard_id: string;
  dashboard_name: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  is_editable: boolean;
  is_owner: boolean;
  last_refreshed_at: string | null;
  updated_at: string;
  created_by: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Endpoint response shapes
// ──────────────────────────────────────────────────────────────────────────

/** A typed slice of items inside a folder. `items` is empty when type is
 *  excluded from the request; `total` is the live total of THIS type. */
export interface FolderTypedSlice<T> {
  items: T[];
  total: number;
}

/** Response from `GET /folders/{id}/contents`. */
export interface FolderContentsResponse {
  folder: Folder;
  dashboards: FolderTypedSlice<FolderDashboardRow> | null;
  conversations: FolderTypedSlice<FolderConversationRow> | null;
}

/** Response from `GET /folders/{id}/items?itemType=…` and
 *  `GET /folders/unfiled-items?itemType=…`.
 *  `folder` is null on the unfiled endpoint. */
export interface FolderItemsResponse<
  T = FolderConversationRow | FolderDashboardRow,
> {
  folder: Folder | null;
  itemType: FolderItemType;
  items: T[];
  pagination: PaginationMetadata;
}

// ──────────────────────────────────────────────────────────────────────────
// Mutation request / response shapes
// ──────────────────────────────────────────────────────────────────────────

export interface CreateFolderRequest {
  name: string;
  description?: string | null;
  maxItems?: number;
}

export interface UpdateFolderRequest {
  name?: string | null;
  description?: string | null;
  maxItems?: number | null;
  displayOrder?: number | null;
}

export interface ReorderItemsRequest {
  itemType: FolderItemType;
  itemIds: string[];
}

/**
 * Response shape of `GET /folders/item-memberships?dashboardId|conversationId=`.
 * The server enforces multi-folder membership now, so `count >= 0` and
 * `folders` lists every folder the calling user has filed the item in,
 * pre-sorted by `displayOrder` then `name`.
 */
export interface FolderMembershipLookupResponse {
  itemType: FolderItemType;
  itemId: string;
  count: number;
  folders: Folder[];
}

/**
 * Request body for `PUT /folders/item-memberships`. The server diffs against
 * the calling user's current memberships for this item and applies adds /
 * removes atomically — `folderIds` is the desired *full* set, not a delta.
 */
export interface SetItemFoldersRequest {
  itemType: FolderItemType;
  itemId: string;
  folderIds: string[];
}

/**
 * Response from the PUT endpoint. `added` / `removed` / `unchanged` are
 * disjoint and together describe the diff the server applied.
 */
export interface SetItemFoldersResponse {
  itemType: FolderItemType;
  itemId: string;
  added: string[];
  removed: string[];
  unchanged: string[];
}

export interface FolderOperationResponse {
  success: boolean;
  folderId: string;
  itemType?: FolderItemType;
  itemId?: string;
  message?: string;
}
