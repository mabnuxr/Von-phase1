import type {
  DrilldownV2ColumnMapping,
  WidgetConfig,
} from "../types/dashboard";

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

/**
 * Pick each level's default-variant column_map from a widget's V2 drilldown
 * config and return them in level order.
 *
 * Used by both ``pages/Analytics.tsx`` and ``components/DashboardPreviewPane.tsx``
 * to feed the breadcrumb its per-depth label/format hints. Picks the
 * default variant per level (with first-variant fallback) — this matches
 * the active-variant resolution rule in `useDrilldownV2`, so the
 * breadcrumb's title/pipe formatting stays consistent with what the user
 * sees in the table. Centralised here so a future change to that rule
 * (e.g. honoring `currentVariantId`) only needs to land once.
 */
export function getLevelColumnMaps(
  widget: WidgetConfig | undefined,
): DrilldownV2ColumnMapping[][] {
  return (
    widget?.drilldown_v2?.levels?.map(
      (lvl) =>
        (lvl.variants.find((v) => v.is_default) ?? lvl.variants[0])
          ?.column_map ?? [],
    ) ?? []
  );
}
