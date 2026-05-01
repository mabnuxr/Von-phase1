import { useQuery } from "@tanstack/react-query";
import { foldersService } from "../../services";
import { CONVERSATIONS_STALE_TIME } from "../../config/constants";
import { folderKeys } from "./folderKeys";
import type { FolderContentsResponse } from "../../types/chatSidebar";

/**
 * Default visible cap per section before the inline "Show N more" expander.
 * Mirrors the design-components' FOLDER_SECTION_LIMIT.
 */
export const FOLDER_CONTENTS_LIMIT = 5;

/**
 * Max items fetched per type from the contents endpoint. We over-fetch
 * relative to FOLDER_CONTENTS_LIMIT so that "Show N more" reveals the
 * full set without an extra round trip. Keep in sync with the largest
 * folder we expect to render eagerly in the sidebar.
 */
export const FOLDER_CONTENTS_FETCH_LIMIT = 50;

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
        dashboardsLimit: FOLDER_CONTENTS_FETCH_LIMIT,
        conversationsLimit: FOLDER_CONTENTS_FETCH_LIMIT,
      }),
    enabled,
    staleTime: CONVERSATIONS_STALE_TIME,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
