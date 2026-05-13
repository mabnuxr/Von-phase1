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
  ReorderItemsRequest,
  FolderOperationResponse,
  FolderItemType,
  FolderMembershipLookupResponse,
  SetItemFoldersRequest,
  SetItemFoldersResponse,
} from "../types/chatSidebar";

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

  /**
   * GET /folders/item-memberships?dashboardId|conversationId=…
   *
   * Returns every folder the calling user has filed the item in, sorted by
   * `displayOrder` then `name`. Multi-folder is supported server-side, so
   * `count` can exceed 1.
   */
  async getItemMemberships(params: {
    itemType: FolderItemType;
    itemId: string;
  }): Promise<FolderMembershipLookupResponse> {
    const qs = new URLSearchParams();
    if (params.itemType === "dashboard") qs.set("dashboardId", params.itemId);
    else qs.set("conversationId", params.itemId);
    return apiClient.get<FolderMembershipLookupResponse>(
      `/api/v1/folders/item-memberships?${qs.toString()}`,
    );
  }

  /**
   * PUT /folders/item-memberships — replace the calling user's folder
   * memberships for an item with the given target set. All-or-nothing on the
   * server side: if any folder is missing or over capacity, no changes apply
   * and an `APP_FOLDER_SET_FAILED` envelope comes back.
   */
  async setItemFolders(
    payload: SetItemFoldersRequest,
  ): Promise<SetItemFoldersResponse> {
    return apiClient.put<SetItemFoldersResponse>(
      `/api/v1/folders/item-memberships`,
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

  /** GET /folders/unfiled-items?itemType=…&page=…&limit=… */
  async unfiledItems<T extends FolderConversationRow | FolderDashboardRow>(
    params: UnfiledItemsParams,
  ): Promise<FolderItemsResponse<T>> {
    const { itemType, page = 1, limit = 20 } = params;
    return apiClient.get<FolderItemsResponse<T>>(
      `/api/v1/folders/unfiled-items?itemType=${encodeURIComponent(
        itemType,
      )}&page=${page}&limit=${limit}`,
    );
  }
}

export const foldersService = new FoldersService();
