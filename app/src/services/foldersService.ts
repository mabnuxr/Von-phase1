import { apiClient } from "./apiClient";
import type {
  Folder,
  FoldersListResponse,
  FolderContentsResponse,
  FolderItemsResponse,
  FolderConversationRow,
  FolderDashboardRow,
  CreateFolderRequest,
  UpdateFolderRequest,
  AddItemRequest,
  ReorderItemsRequest,
  FolderOperationResponse,
  FolderItemType,
  PaginationMetadata,
} from "../types/chatSidebar";
import type {
  Conversation,
  PaginatedConversationsResponse,
} from "../types/conversation";
import type {
  DashboardListItem,
  DashboardListResponse,
} from "./dashboardService";

interface ContentsParams {
  types?: FolderItemType[];
  dashboardsLimit?: number;
  conversationsLimit?: number;
}

interface ItemsParams {
  itemType: FolderItemType;
  page?: number;
  limit?: number;
}

interface UnfiledItemsParams {
  itemType: FolderItemType;
  page?: number;
  limit?: number;
}

class FoldersService {
  /** GET /folders — paginated list of the current user's folders */
  async list(
    page: number = 1,
    limit: number = 100,
  ): Promise<FoldersListResponse> {
    return apiClient.get<FoldersListResponse>(
      `/api/v1/folders?page=${page}&limit=${limit}`,
    );
  }

  /** GET /folders/{id} */
  async get(folderId: string): Promise<Folder> {
    return apiClient.get<Folder>(`/api/v1/folders/${folderId}`);
  }

  /** POST /folders */
  async create(payload: CreateFolderRequest): Promise<Folder> {
    return apiClient.post<Folder>(`/api/v1/folders`, payload);
  }

  /** PATCH /folders/{id} */
  async update(folderId: string, patch: UpdateFolderRequest): Promise<Folder> {
    return apiClient.patch<Folder>(`/api/v1/folders/${folderId}`, patch);
  }

  /** DELETE /folders/{id} */
  async remove(folderId: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/folders/${folderId}`);
  }

  /** GET /folders/{id}/contents — sidebar one-shot, both slices in parallel */
  async contents(
    folderId: string,
    params: ContentsParams = {},
  ): Promise<FolderContentsResponse> {
    const query = new URLSearchParams();
    if (params.types && params.types.length > 0) {
      query.set("types", params.types.join(","));
    }
    if (params.dashboardsLimit !== undefined) {
      query.set("dashboardsLimit", String(params.dashboardsLimit));
    }
    if (params.conversationsLimit !== undefined) {
      query.set("conversationsLimit", String(params.conversationsLimit));
    }
    const qs = query.toString();
    return apiClient.get<FolderContentsResponse>(
      `/api/v1/folders/${folderId}/contents${qs ? `?${qs}` : ""}`,
    );
  }

  /** GET /folders/{id}/items?itemType=…&page=…&limit=… — paginated single-type list */
  async items<T extends FolderConversationRow | FolderDashboardRow>(
    folderId: string,
    params: ItemsParams,
  ): Promise<FolderItemsResponse<T>> {
    const { itemType, page = 1, limit = 20 } = params;
    return apiClient.get<FolderItemsResponse<T>>(
      `/api/v1/folders/${folderId}/items?itemType=${encodeURIComponent(
        itemType,
      )}&page=${page}&limit=${limit}`,
    );
  }

  /** POST /folders/{id}/items — file or move an item */
  async addItem(
    folderId: string,
    payload: AddItemRequest,
  ): Promise<FolderOperationResponse> {
    return apiClient.post<FolderOperationResponse>(
      `/api/v1/folders/${folderId}/items`,
      payload,
    );
  }

  /** DELETE /folders/{id}/items/{itemType}/{itemId} */
  async removeItem(
    folderId: string,
    itemType: FolderItemType,
    itemId: string,
  ): Promise<FolderOperationResponse> {
    return apiClient.delete<FolderOperationResponse>(
      `/api/v1/folders/${folderId}/items/${encodeURIComponent(
        itemType,
      )}/${encodeURIComponent(itemId)}`,
    );
  }

  /** PATCH /folders/{id}/items/order */
  async reorderItems(
    folderId: string,
    payload: ReorderItemsRequest,
  ): Promise<FolderOperationResponse> {
    return apiClient.patch<FolderOperationResponse>(
      `/api/v1/folders/${folderId}/items/order`,
      payload,
    );
  }

  /**
   * Top-level sidebar list for an item type.
   *
   * Historically backed by `/folders/unfiled-items`, which returns ONLY items
   * that aren't filed in any folder. That semantic surfaced as a UX bug: a
   * chat or dashboard added to a folder vanished from the main "Chats" /
   * "Dashboards" sections at the bottom of the sidebar. We now back this with
   * the global list endpoints (`/chat/conversations` for chats,
   * `/dashboards` for dashboards) and adapt the responses to the existing
   * `FolderItemsResponse<T>` shape so consumers (sidebar render, optimistic
   * cache writes, approval-state seeding) keep working unchanged.
   *
   * Items filed in a folder now appear in BOTH the folder body and the
   * top-level section — matching the user's mental model of folders as
   * organisational tags rather than exclusive containers.
   */
  async unfiledItems<T extends FolderConversationRow | FolderDashboardRow>(
    params: UnfiledItemsParams,
  ): Promise<FolderItemsResponse<T>> {
    const { itemType, page = 1, limit = 20 } = params;
    if (itemType === "conversation") {
      const res = await apiClient.get<PaginatedConversationsResponse>(
        `/api/v1/chat/conversations?page=${page}&limit=${limit}`,
      );
      return {
        folder: null,
        itemType,
        items: res.data.map(conversationToFolderRow) as T[],
        pagination: toPaginationMetadata(res.pagination),
      };
    }
    // dashboard
    const res = await apiClient.get<DashboardListResponse>(
      `/api/v1/dashboards?page=${page}&limit=${limit}`,
    );
    return {
      folder: null,
      itemType,
      items: res.data.map(dashboardListItemToFolderRow) as T[],
      pagination: toPaginationMetadata(res.pagination),
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Adapters: global list endpoint shapes → `FolderConversationRow` /
// `FolderDashboardRow`. Keeping them here (rather than inside the hook) so
// every consumer of `foldersService.unfiledItems` sees the same row shape
// regardless of whether the data came from the legacy unfiled endpoint or
// the global lists.
// ──────────────────────────────────────────────────────────────────────────

function conversationToFolderRow(c: Conversation): FolderConversationRow {
  return {
    id: c.conversationId,
    conversation_id: c.conversationId,
    user_id: c.userId,
    tenant_id: c.tenantId,
    title: c.title,
    mode: c.mode,
    agent_version: c.agentVersion,
    created_at: c.createdAt,
    created_by: c.createdBy ?? "",
    // The chat list endpoint doesn't always populate `updatedAt`; fall back
    // to creation time so recency sort and rendering still see a value.
    updated_at: c.updatedAt ?? c.createdAt,
    // Approval state is delivered live via Pusher (see useApprovalStates);
    // the global chat list doesn't carry it, so seed null.
    approval_state: null,
  };
}

/**
 * Pad the global-list pagination shape (no `sortConfig`) up to the
 * folder-API `PaginationMetadata` shape so the two flow through the same
 * consumers without type gymnastics.
 */
function toPaginationMetadata(p: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}): PaginationMetadata {
  return { ...p, sortConfig: null };
}

function dashboardListItemToFolderRow(
  d: DashboardListItem,
): FolderDashboardRow {
  return {
    dashboard_id: d.dashboard_id,
    dashboard_name: d.dashboard_name,
    description: null,
    status: d.status,
    is_editable: d.is_owner,
    is_owner: d.is_owner,
    last_refreshed_at: null,
    updated_at: d.updated_at,
    created_by: "",
  };
}

export const foldersService = new FoldersService();
