/**
 * Build the cumulative-filter dict for V2 drilldown row descent.
 *
 * The pyramid model treats every cell click as "show me what made up THIS
 * row." We pass the row's full grouping-key dict down — only the row's
 * columns whose values are scalar-ish (string / number / boolean). The
 * backend's column_map at level N+1 picks out the ones it knows how to
 * SQL-translate; extra keys are ignored with a debug log.
 *
 * Shared between the full Analytics page (`pages/Analytics.tsx`) and the
 * chat-side preview pane (`components/DashboardPreviewPane.tsx`) so both
 * paths produce byte-identical drill_filters payloads — preview parity
 * with full mode is a hard requirement (a divergence is what landed the
 * V1-only preview bug that this util replaces).
 */
export function rowDescentFilters(
  rowData: Record<string, unknown>,
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rowData)) {
    if (value === null || value === undefined) continue;
    const t = typeof value;
    if (t === "string" || t === "number" || t === "boolean") {
      filters[key] = value;
    }
    // Skip arrays / objects — they aren't meaningful filter contributions.
  }
  return filters;
}
