export type SearchResultType = "chat" | "dashboard" | "widget" | "artifact";

export interface SearchResult {
  // Always populated
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  updated_at: string;
  score: number;
  is_shared: boolean;
  /**
   * Canonical click-through target (absolute URL). Returned by /api/v1/search.
   * Optional because /api/v1/search/recents may omit it on older backends —
   * consumers should fall back to building a path from ids if missing.
   */
  url?: string;
  shared_by_name?: string;

  // Chat hits — informational only (citations / analytics). Not used for routing.
  conversation_id?: string;
  message_id?: string;
  role?: "user" | "assistant";

  // Dashboard hits
  dashboard_id?: string;

  // Widget hits
  parent_dashboard_id?: string;
  parent_dashboard_name?: string;

  // Artifact hits — informational only. Not used for routing.
  anchor_message_id?: string;
}

export interface SearchMeta {
  confidence: number;
  used_deep: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  meta: SearchMeta;
}

export interface SearchRecentsResponse {
  results: SearchResult[];
}

/** `deep`: false = Quick only; null = Auto; true = always Deep+Quick. */
export interface SearchRequest {
  query: string;
  limit?: number;
  deep?: boolean | null;
}
