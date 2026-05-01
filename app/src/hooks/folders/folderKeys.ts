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
  items: (folderId: string, itemType: FolderItemType) =>
    [...folderKeys.all, "items", folderId, itemType] as const,
  unfiled: (itemType: FolderItemType) =>
    [...folderKeys.all, "unfiled", itemType] as const,
};
