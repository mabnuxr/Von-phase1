import { apiClient } from "./apiClient";
import type {
  SearchRequest,
  SearchResponse,
  SearchRecentsResponse,
} from "../types/search";

class SearchService {
  /**
   * POST /api/v1/search — live search.
   * `signal` is optional; pass it from useSearch so keystroke aborts cancel
   * in-flight requests.
   */
  async search(
    body: SearchRequest,
    signal?: AbortSignal,
  ): Promise<SearchResponse> {
    return apiClient.post<SearchResponse>("/api/v1/search", body, { signal });
  }

  /** GET /api/v1/search/recents — flat chrono list of chats + dashboards. */
  async recents(limit = 10): Promise<SearchRecentsResponse> {
    return apiClient.get<SearchRecentsResponse>(
      `/api/v1/search/recents?limit=${limit}`,
    );
  }
}

export const searchService = new SearchService();
