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

/**
 * Page size used by the per-section "Show 5 more" expander. Each click of
 * the inline expander fires `fetchNextPage` and surfaces exactly this many
 * additional rows.
 */
export const FOLDER_ITEMS_PAGE_SIZE = 5;

interface UseFolderItemsParams {
  folderId: string;
  itemType: FolderItemType;
  /** Only fire after the user clicks "Show more" — stays disabled by default. */
  enabled?: boolean;
}

/**
 * Paginated single-type list within a folder. Driven by the per-section
 * "Show N more" expander; stays disabled until the user opts into the
 * full list. Reuses the standard `useInfiniteQuery` cursor pattern.
 */
export function useFolderItems<
  T extends FolderConversationRow | FolderDashboardRow,
>({ folderId, itemType, enabled = false }: UseFolderItemsParams) {
  return useInfiniteQuery<FolderItemsResponse<T>>({
    queryKey: folderKeys.items(folderId, itemType),
    queryFn: ({ pageParam }) =>
      foldersService.items<T>(folderId, {
        itemType,
        page: pageParam as number,
        limit: FOLDER_ITEMS_PAGE_SIZE,
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
