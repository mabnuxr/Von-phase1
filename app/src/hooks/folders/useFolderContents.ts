import { useQuery } from "@tanstack/react-query";
import { foldersService } from "../../services";
import { CONVERSATIONS_STALE_TIME } from "../../config/constants";
import { folderKeys } from "./folderKeys";
import type { FolderContentsResponse } from "../../types/chatSidebar";

/** Per-section cap that drives the inline "Show N more" expander. */
export const FOLDER_CONTENTS_LIMIT = 5;

interface UseFolderContentsParams {
  folderId: string;
  /** Disable until the user expands the folder — saves a round trip per folder. */
  enabled?: boolean;
}

/**
 * Sidebar one-shot for an expanded folder. Returns the folder header plus
 * first-N typed slices for both dashboards and conversations along with the
 * per-type totals (used by the "Show N more" expander).
 */
export function useFolderContents({
  folderId,
  enabled = true,
}: UseFolderContentsParams) {
  return useQuery<FolderContentsResponse>({
    queryKey: folderKeys.contents(folderId),
    queryFn: () =>
      foldersService.contents(folderId, {
        types: ["dashboard", "conversation"],
        dashboardsLimit: FOLDER_CONTENTS_LIMIT,
        conversationsLimit: FOLDER_CONTENTS_LIMIT,
      }),
    enabled,
    staleTime: CONVERSATIONS_STALE_TIME,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
