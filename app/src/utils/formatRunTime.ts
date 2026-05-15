/**
 * Locale-aware absolute date+time formatter for AI field runs.
 *
 * Backend may omit the timezone — bare ISO strings are treated as UTC,
 * matching the behavior in `formatTimeAgo` so the same input produces
 * consistent local times regardless of which formatter is used.
 *
 * Returns "—" for missing/unparseable input. Example output:
 *   "May 14, 2026, 2:35 PM"
 */
export function formatRunTime(value: string | null | undefined): string {
  if (!value) return "—";
  const normalized =
    value.endsWith("Z") || value.includes("+") ? value : value + "Z";
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
