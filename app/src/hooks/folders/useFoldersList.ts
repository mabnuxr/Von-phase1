import { useQuery } from "@tanstack/react-query";
import { foldersService } from "../../services";
import { CONVERSATIONS_STALE_TIME } from "../../config/constants";
import { folderKeys } from "./folderKeys";
import type { Folder } from "../../types/chatSidebar";

/**
 * Fetch the current user's folders. The list itself is small (≤ ~10 folders
 * typical), so we fetch the full first page (limit 100) — pagination is
 * available but not currently exercised.
 */
export function useFoldersList() {
  return useQuery<Folder[]>({
    queryKey: folderKeys.list(),
    queryFn: async () => {
      const res = await foldersService.list(1, 100);
      return res.data;
    },
    staleTime: CONVERSATIONS_STALE_TIME,
    gcTime: 5 * 60 * 1000,
  });
}
