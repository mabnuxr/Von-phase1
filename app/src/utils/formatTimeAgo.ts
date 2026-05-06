/**
 * Human-friendly relative time formatter.
 * Backend may omit timezone — treat bare ISO strings as UTC.
 */
export function formatTimeAgo(dateStr: string): string {
  // Backend may omit timezone — treat as UTC
  const normalized =
    dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : dateStr + "Z";
  const then = new Date(normalized).getTime();
  if (Number.isNaN(then)) return "\u2014";

  const now = Date.now();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`;

  // Yesterday
  const nowDate = new Date(now);
  const yesterday = new Date(nowDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const thenDate = new Date(normalized);
  if (thenDate.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${thenDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  }

  // Older
  return thenDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
