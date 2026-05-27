import { useQuery } from "@tanstack/react-query";
import { searchService } from "../services";
import type { SearchRecentsResponse } from "../types/search";

export const searchKeys = {
  all: ["search"] as const,
  recents: (limit: number) => [...searchKeys.all, "recents", limit] as const,
};

/**
 * Fetches the empty-state list of recently-touched chats + dashboards.
 * Enabled only while the modal is open so we don't pay for the request
 * on every page load.
 */
export function useSearchRecents(enabled: boolean, limit = 10) {
  return useQuery<SearchRecentsResponse>({
    queryKey: searchKeys.recents(limit),
    queryFn: () => searchService.recents(limit),
    enabled,
    staleTime: 30_000,
  });
}
