import type { FolderItemType } from "../../types/chatSidebar";

/**
 * Query key factory for the Folders v2 cache. Centralised so mutations and
 * cross-reference invalidations stay in lock-step with the query hooks.
 */
export const folderKeys = {
  all: ["folders"] as const,
  list: () => [...folderKeys.all, "list"] as const,
  detail: (folderId: string) =>
    [...folderKeys.all, "detail", folderId] as const,
  contents: (folderId: string) =>
    [...folderKeys.all, "contents", folderId] as const,
  /** All cached `/items` pages for a (folder, type) — useful as a broad
   *  invalidation target when memberships change. */
  items: (folderId: string, itemType: FolderItemType) =>
    [...folderKeys.all, "items", folderId, itemType] as const,
  /** A single page within `/items` — drives per-page caches for the
   *  "Show 5 more" expander (page 2, 3, …). Page 1 is served by `/contents`. */
  itemsPage: (folderId: string, itemType: FolderItemType, page: number) =>
    [...folderKeys.all, "items", folderId, itemType, "page", page] as const,
  unfiled: (itemType: FolderItemType) =>
    [...folderKeys.all, "unfiled", itemType] as const,
};
