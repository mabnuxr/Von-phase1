import type {
  DrilldownV2ColumnMapping,
  WidgetConfig,
} from "../types/dashboard";

/**
 * Pick the row values that should propagate as filters when descending one
 * level deeper in the V2 drill chain.
 *
 * The pyramid model is *cumulative*: each chain entry captures only the
 * axes *newly introduced* at that depth, and the backend merges chain
 * entries when resolving the drill at level N. So when a user clicks a
 * row in the level-N drill view to descend to level N+1, we should keep
 * only the row values that:
 *
 * 1. Are scalar (string / number / boolean — JSON arrays / objects can't
 *    be expressed as a SQL drill filter).
 * 2. Match a `data_key` in the NEXT level's column_map. Aggregate metric
 *    columns (counts, sums, percentages) live in the row but aren't
 *    filterable knobs — they belong only to the displayed table, not the
 *    drill chain.
 * 3. Are NOT already declared at the current level's column_map. The
 *    chain entry at depth d-1 already captures those, so re-emitting them
 *    in chain[d].filters duplicates them in the breadcrumb without adding
 *    any signal. Keeping each chain entry "just the new axes" makes the
 *    breadcrumb read like "Stage: X › Owner: Y" instead of
 *    "Stage: X › Stage: X, Owner: Y".
 *
 * Empty `currentColumnMap` (or undefined) is treated as "no axes captured
 * yet" — every column_map data_key on `nextColumnMap` is eligible.
 *
 * Shared between the full Analytics page (`pages/Analytics.tsx`) and the
 * chat-side preview pane (`components/DashboardPreviewPane.tsx`) so both
 * paths produce byte-identical drill_filters payloads. Preview parity
 * with full mode is a hard requirement (a divergence is what landed the
 * V1-only preview bug that this util replaces).
 */
export function rowDescentFilters(
  rowData: Record<string, unknown>,
  nextColumnMap: DrilldownV2ColumnMapping[] = [],
  currentColumnMap: DrilldownV2ColumnMapping[] = [],
): Record<string, unknown> {
  const currentKeys = new Set(currentColumnMap.map((cm) => cm.data_key));
  const newAxes = nextColumnMap
    .map((cm) => cm.data_key)
    .filter((k) => !currentKeys.has(k));
  if (newAxes.length === 0) return {};

  const filters: Record<string, unknown> = {};
  for (const key of newAxes) {
    const value = rowData[key];
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
