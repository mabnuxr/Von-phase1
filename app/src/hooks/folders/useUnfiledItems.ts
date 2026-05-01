import { useInfiniteQuery } from "@tanstack/react-query";
import { foldersService } from "../../services";
import { CONVERSATIONS_STALE_TIME } from "../../config/constants";
import { folderKeys } from "./folderKeys";
import type {
  FolderConversationRow,
  FolderDashboardRow,
  FolderItemType,
  FolderItemsResponse,
} from "../../types/chatSidebar";

/** Default page size for the top-level Chats / Dashboards lists. */
export const UNFILED_ITEMS_PAGE_SIZE = 20;

interface UseUnfiledItemsParams {
  itemType: FolderItemType;
  limit?: number;
  enabled?: boolean;
}

/**
 * Items the user can see but hasn't filed in any folder. Drives the
 * top-level "Dashboards" and "Chats" sidebar groups — one instance per type.
 */
export function useUnfiledItems<
  T extends FolderConversationRow | FolderDashboardRow,
>({
  itemType,
  limit = UNFILED_ITEMS_PAGE_SIZE,
  enabled = true,
}: UseUnfiledItemsParams) {
  return useInfiniteQuery<FolderItemsResponse<T>>({
    queryKey: folderKeys.unfiled(itemType),
    queryFn: ({ pageParam }) =>
      foldersService.unfiledItems<T>({
        itemType,
        page: pageParam as number,
        limit,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
    initialPageParam: 1,
    enabled,
    staleTime: CONVERSATIONS_STALE_TIME,
    gcTime: 5 * 60 * 1000,
  });
}
