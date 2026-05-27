import type { SearchResult } from "../../types/search";

/**
 * Resolve the in-app path to navigate to. Prefers the backend-provided
 * absolute `url` (canonical); falls back to a plain conversation/dashboard
 * path built from ids when the field is missing — no anchors, no query
 * string, matching the current routing contract.
 */
export function pathForResult(r: SearchResult): string {
  if (r.url) {
    return new URL(r.url, window.location.origin).pathname;
  }
  switch (r.type) {
    case "chat":
    case "artifact":
      return `/chat/${r.conversation_id ?? ""}`;
    case "dashboard":
      return `/dashboard/${r.dashboard_id ?? ""}`;
    case "widget":
      return `/dashboard/${r.parent_dashboard_id ?? ""}`;
  }
}

/** Compact relative time like "2h", "Yesterday", "3d", "2w". */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMin = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d`;
  const diffWk = Math.round(diffDay / 7);
  if (diffWk < 5) return `${diffWk}w`;
  const diffMo = Math.round(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo`;
  return `${Math.round(diffDay / 365)}y`;
}
