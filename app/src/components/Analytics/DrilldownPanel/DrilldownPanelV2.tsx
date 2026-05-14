/**
 * DrilldownPanelV2 — bottom-sheet renderer for the V2 drilldown flow
 * (pyramid model).
 *
 * The FE wires this panel alongside the legacy DrilldownPanel — callers
 * pick the V2 variant when the clicked widget's loaded config has a
 * `drilldown_v2` field populated. Legacy panels (no `drilldown_v2`)
 * fall through to the V1 DrilldownPanel.
 *
 * Contract:
 * - 95vh bottom sheet with scrim + grip handle; ESC / close button to dismiss.
 * - Breadcrumb: Widget › L1-segment › L2-segment › … (one segment per click);
 *   click any segment to pop to that level.
 * - Pill-shaped variant-dropdown selector when `variants.length > 1`
 *   (replaces older row-of-buttons UI; dropdown scales better past 2-3
 *   variants and competes less for header space against the breadcrumb).
 * - Data table reuses the existing ReportTable component for consistent UX.
 * - **Whole-row descent.** When `hasNextLevel === true`, every row is
 *   clickable — clicking ANY cell descends to the next level using the entire
 *   row's grouping-key column values as cumulative filters. When false (floor
 *   of the pyramid), rows are inert.
 * - Empty state: "No records found". Error state: "Could not load records."
 * - Advisory banner when click-chain depth >= 8 (deep drilling — suggests
 *   switching to chat if the user is lost).
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XIcon,
  CaretRightIcon,
  CaretDownIcon,
  CheckIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import {
  ReportTable,
  buildGridOptions,
  markdownCellFormatter,
  Dropdown,
} from "@vonlabs/design-components";
import type {
  ReportColumn,
  ServerSortState,
  DropdownItem,
} from "@vonlabs/design-components";
import type { UseDrilldownV2Return } from "../../../hooks/useDrilldownV2";
import type {
  DrilldownV2ColumnMapping,
  DrilldownV2VariantSummary,
} from "../../../types/dashboard";
import { DrilldownPagination } from "./DrilldownPagination";
import "./drilldown-panel.css";

// ─── Helpers ────────────────────────────────────────────────────

function inferColumnType(key: string, value: unknown): ReportColumn["type"] {
  if (value === null || value === undefined) return "text";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    if (
      key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("price")
    )
      return "currency";
    if (
      key.toLowerCase().includes("probability") ||
      key.toLowerCase().includes("percent")
    )
      return "percentage";
    return "number";
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) {
    return "date";
  }
  return "text";
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function columnsFromData(rows: Record<string, unknown>[]): ReportColumn[] {
  if (rows.length === 0) return [];
  const sample = rows[0];
  return Object.keys(sample).map((key) => ({
    id: key,
    label: formatLabel(key),
    type: inferColumnType(key, sample[key]),
    sortable: true,
  }));
}

/**
 * Append ``drillable-cell`` to ``column.cells.className`` for each column
 * id in ``drillableColumns``. ``null`` whitelist means the variant didn't
 * author one — paint NO cells as drillable (no highlight, no pointer
 * cursor, no ↳ glyph). The bottom-sheet click handler still passes
 * through clicks on null (see ``handleGridClick``), so legacy
 * V1→V2-migrated variants without a whitelist still respond to clicks
 * even though the visual affordance is suppressed.
 *
 * Mirror of ``applyDrillableCellClass`` in ``TableWidget`` — kept inline
 * here rather than imported because the helper isn't exported from
 * design-components and the logic is small.
 *
 * Removed the previous "null = every cell clickable + highlighted"
 * back-compat. It produced misleading affordance on agent-authored
 * variants where the agent simply omitted the whitelist — every
 * dimension column appeared drillable. The validator now rejects null
 * on agent-authored configs
 * (``_validate_v2_drillable_columns_required``); this FE change drops
 * the matching visual back-compat so legacy migrations + accidental
 * nulls fail closed visually.
 */
function applyDrillableCellClass(
  options: ReturnType<typeof buildGridOptions>,
  drillableColumns: string[] | null,
): ReturnType<typeof buildGridOptions> {
  const cols = (options as { columns?: unknown[] }).columns;
  if (!Array.isArray(cols)) return options;
  // null whitelist → don't tag any column. Click still works (the
  // per-cell click handler treats null as "no gate"); just no visual
  // affordance.
  if (drillableColumns === null) return options;
  const allow = new Set(drillableColumns);
  const mapped = cols.map((col) => {
    const c = col as { id?: string; cells?: { className?: string } };
    const id = c.id;
    if (!id) return col;
    if (!allow.has(id)) return col;
    const existing =
      typeof c.cells?.className === "string" ? c.cells.className : "";
    const next = existing.includes("drillable-cell")
      ? existing
      : [existing, "drillable-cell"].filter(Boolean).join(" ");
    return { ...c, cells: { ...(c.cells ?? {}), className: next } };
  });
  return { ...options, columns: mapped } as ReturnType<typeof buildGridOptions>;
}

// ─── Component props ─────────────────────────────────────────────

export interface DrilldownPanelV2Props {
  drill: UseDrilldownV2Return;
  /**
   * Human-readable widget title — shown as the first breadcrumb segment. Caller
   * supplies this (e.g. from the panel's `title`) because the hook doesn't
   * carry it.
   */
  widgetTitle?: string;
  /**
   * Per-depth column_map slices, indexed by chain depth. Used by the breadcrumb
   * to (a) order filter pieces by column_map declaration (not insertion order),
   * (b) resolve display titles per data_key (`column_map.title || formatLabel`),
   * and (c) apply pipe formatting (e.g. `pipe: "timestamp"` + `value_format`)
   * so the breadcrumb shows "Week: 2026-04-27" instead of the raw epoch-ms the
   * FE captured from `point.x`. Pass the panel's drilldown_v2 levels' column_map
   * arrays in order; the breadcrumb only reads up to `chain.length` so missing
   * deeper indices are tolerated.
   */
  levelColumnMaps?: DrilldownV2ColumnMapping[][];
  /**
   * Called when the user clicks any cell in a row, while `hasNextLevel` is
   * true. The parent issues `drill.pushLevel(...)` with the row's grouping-key
   * dict as the new filter contribution — whole-row descent. The optional
   * ``metricValue`` + ``metricLabel`` args carry the clicked cell's value
   * and column label so deeper breadcrumb segments can render the
   * "Column Name: value" parenthesized suffix. ``variantId`` carries the
   * next-level variant id resolved from the current variant's
   * ``column_variant_map`` for the clicked column; null = next level uses
   * its is_default.
   */
  onRowDrill?: (
    rowIndex: number,
    rowData: Record<string, unknown>,
    metricValue?: unknown,
    metricLabel?: string,
    variantId?: string | null,
  ) => void;
  /**
   * Per-depth drillable-column whitelists indexed by chain depth (same
   * indexing convention as ``levelColumnMaps``). Sourced from the active
   * variant at each level: ``levels[N].variants[active].drillable_columns``.
   * When the entry at the current chain depth is a non-null list, only
   * those column ids in the drill output get the ``drillable-cell`` class
   * (hover affordance + click registration). null/undefined → back-compat
   * (every cell drillable).
   */
  levelDrillableColumns?: (string[] | null | undefined)[];
  /**
   * The currently-viewed variant's ``column_variant_map`` at the active
   * drill depth. Resolved by the parent because it can read drill state
   * (``currentVariantId`` + chain length) before passing in. null/undefined
   * means no map declared → every clicked column descends into the next
   * level's is_default variant. See ``getCurrentVariantColumnVariantMap``
   * in utils/drilldownFilters.ts for resolution rules.
   */
  currentLevelColumnVariantMap?: Record<string, string> | null;
}

export function DrilldownPanelV2({
  drill,
  widgetTitle,
  levelColumnMaps,
  onRowDrill,
  levelDrillableColumns,
  currentLevelColumnVariantMap,
}: DrilldownPanelV2Props) {
  // Close on ESC
  useEffect(() => {
    if (!drill.isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") drill.closeDrilldown();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drill]);

  const columns = useMemo(() => columnsFromData(drill.data), [drill.data]);

  // Active variant's drillable_columns whitelist for the level the user is
  // currently viewing. The drill view at chain depth N renders rows from
  // ``levels[N-1].variants[active]``'s drill query, so its drillable
  // columns live at index N-1 of ``levelDrillableColumns``. Anything
  // beyond chain.length is unreachable; a null/undefined entry means
  // back-compat (every cell drillable).
  const currentDrillableColumns: string[] | null | undefined = useMemo(() => {
    const depth = drill.clickChain.length;
    if (depth <= 0) return null;
    return levelDrillableColumns?.[depth - 1] ?? null;
  }, [drill.clickChain.length, levelDrillableColumns]);

  // Wrapper ref for the post-render effect that tags drillable headers
  // and writes the title attribute on drillable td's. Grid Lite owns
  // thead rendering and doesn't expose a header className API on the
  // column config, so we tag from the DOM instead. Mirror of the
  // equivalent effect in TableWidget.tsx.
  const gridWrapRef = useRef<HTMLDivElement>(null);

  const gridOptions = useMemo(() => {
    if (columns.length === 0 || drill.data.length === 0) return null;
    const opts = buildGridOptions(columns, drill.data, {
      pageSize: drill.data.length,
      showPagination: false,
    });
    // ``buildGridOptions`` stamps every column's ``cells.formatter`` with a
    // typed default from ``createCellFormatter``. Currency / date / number
    // formatters are fine — they format numerics. For text columns the
    // default just wraps the escaped value in a styled ``<span>``, so any
    // markdown source (e.g. ``[Acme](https://…)`` from drill SQL — see BE
    // generate_drilldowns prompt) renders as literal text. Replace the
    // formatter on text-typed columns with ``markdownCellFormatter`` so
    // those values render as proper ``<a>`` links / styled markdown.
    //
    // (We can't reuse the shared ``applyMarkdownCellFormatters`` helper
    // here — it skips columns whose ``cells.formatter`` is already set,
    // which is true for EVERY column after ``buildGridOptions``. The
    // helper's "preserve existing formatter" semantics are correct for
    // TableWidget, which never goes through ``buildGridOptions`` and
    // only has formatters on variant-renderer columns.)
    const textIds = new Set(
      columns.filter((c) => c.type === "text").map((c) => c.id),
    );
    const optsWithMarkdown =
      textIds.size === 0
        ? opts
        : ({
            ...opts,
            columns: (opts.columns ?? []).map((col) =>
              textIds.has(col.id)
                ? {
                    ...col,
                    cells: {
                      ...(col.cells ?? {}),
                      formatter: markdownCellFormatter,
                    },
                  }
                : col,
            ),
          } as typeof opts);
    // Tag the body cells of drillable columns with ``drillable-cell`` so
    // the per-cell hover CSS only paints those columns. null whitelist =
    // every column gets the class (back-compat). Same rule the dashboard
    // TableWidget applies via ``applyDrillableCellClass``.
    return applyDrillableCellClass(
      optsWithMarkdown,
      currentDrillableColumns ?? null,
    );
  }, [columns, drill.data, currentDrillableColumns]);

  // Drillable affordance — post-render DOM tagging.
  //
  // Grid Lite exposes ``cells.className`` on the column config (used by
  // ``applyDrillableCellClass`` above) but not a parallel
  // ``header.className`` — to tint matching column headers we tag the
  // ``<th>`` elements after Grid Lite commits its DOM. Same effect adds
  // the ``title="Click to drill deeper"`` native tooltip to drillable
  // td's (Grid Lite has no per-cell attributes API beyond className).
  //
  // Re-runs on every gridOptions identity change so it survives variant
  // / page / sort cycles. Mirror of the equivalent effect in
  // ``design-components/.../TableWidget.tsx``.
  useEffect(() => {
    const el = gridWrapRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      const table = el.querySelector(".hcg-table");
      if (!table) return;
      const firstRow = table.querySelector(
        "tbody tr:not(.hcg-mocked-row)",
      ) as HTMLTableRowElement | null;
      if (!firstRow) return;
      const drillableIdxs = new Set<number>();
      Array.from(firstRow.children).forEach((cell, i) => {
        if ((cell as HTMLElement).classList.contains("drillable-cell")) {
          drillableIdxs.add(i);
        }
      });
      const ths = table.querySelectorAll("thead th");
      ths.forEach((th, i) => {
        th.classList.toggle("drillable-header", drillableIdxs.has(i));
      });
      const tds = table.querySelectorAll("tbody td.drillable-cell");
      tds.forEach((td) => {
        (td as HTMLElement).title = "Click to drill deeper";
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [gridOptions]);

  // Whole-row descent: clicking a drillable cell descends to the next
  // level when ``hasNextLevel === true``. We DON'T discriminate at the
  // SQL filter level (the entire row's grouping-key values still propagate
  // — see ``rowDescentFilters``) but we DO gate which CELLS are clickable
  // based on the active variant's ``drillable_columns`` whitelist, so the
  // hover affordance + click registration only fire on aggregated metric
  // columns. null whitelist = every cell clickable (back-compat).
  const handleGridClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onRowDrill || !drill.hasNextLevel) return;
      const target = e.target as HTMLElement;
      // Clicks on markdown-rendered links (drill SQL emits ``'[name](url)'``
      // strings that render as ``<a target="_blank">``) should follow the
      // link only — never also trigger drill descent. Without this gate the
      // browser opens the link AND the drill descends in parallel.
      if (target.closest("a")) return;
      const td = target.closest("td");
      if (!td) return;
      // Per-column gate — the same ``drillable-cell`` className the CSS
      // hover rule keys on. Cells not in the whitelist are non-interactive.
      if (
        currentDrillableColumns != null &&
        !td.classList.contains("drillable-cell")
      ) {
        return;
      }
      const tr = td.closest("tr");
      if (!tr) return;

      const tbody = tr.parentElement;
      if (!tbody) return;
      const rowIndex = Array.prototype.indexOf.call(tbody.children, tr);
      if (rowIndex < 0 || rowIndex >= drill.data.length) return;

      // Look up the clicked cell's value AND the column's display label so
      // deeper-level breadcrumb segments can render "Column Name: value".
      // Map td position → column id from the rendered headers, then read
      // ``td.textContent`` for the FORMATTED string the user clicked
      // (e.g. ``"$1,096,367"`` rather than the raw ``1096366.67`` from
      // rowData[col.id]). The breadcrumb suffix is a display-only
      // affordance — surfacing the formatted value matches what the
      // user clicked, mirroring the KPI/chart pattern. Falls back to
      // the raw rowData value when the cell has no rendered text
      // (empty / null cells).
      const cells = Array.from(tr.children);
      const colIdx = cells.indexOf(td);
      const rowData = drill.data[rowIndex] as Record<string, unknown>;
      const col = columns[colIdx];
      const rawValue = col?.id != null ? (rowData[col.id] ?? null) : null;
      const displayText = td.textContent?.trim() ?? "";
      const metricValue = displayText.length > 0 ? displayText : rawValue;
      const metricLabel = col?.label;
      // Route to a specific next-level variant when the active variant's
      // ``column_variant_map`` declares one for the clicked column. Without
      // a match, fall back to the next level's is_default by passing null.
      const mappedVariantId =
        col?.id != null
          ? (currentLevelColumnVariantMap?.[col.id] ?? null)
          : null;

      e.stopPropagation();
      onRowDrill(rowIndex, rowData, metricValue, metricLabel, mappedVariantId);
    },
    [
      drill.data,
      drill.hasNextLevel,
      onRowDrill,
      currentDrillableColumns,
      columns,
      currentLevelColumnVariantMap,
    ],
  );

  // ServerSortState is ``{orderBy, orderByAsc}`` — same shape as the hook's
  // ``currentSort``. No translation needed; pass through directly.
  const sortStateForTable: ServerSortState | null = drill.currentSort;

  if (!drill.isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="dd-v2-scrim"
        className="dd-v2-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={drill.closeDrilldown}
      />
      <motion.div
        key="dd-v2-sheet"
        className="dd-v2-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        role="dialog"
        aria-modal="true"
        aria-label="Drilldown"
      >
        <div className="dd-v2-grip" />

        {/* Header: breadcrumb + variant dropdown + close */}
        <div className="dd-v2-header">
          <Breadcrumb
            widgetTitle={widgetTitle ?? drill.title ?? "Drilldown"}
            chain={drill.clickChain}
            levelColumnMaps={levelColumnMaps}
            variants={drill.variants}
            currentVariantId={drill.currentVariantId}
            onPopToLevel={drill.popToLevel}
          />
          <div className="dd-v2-header-actions">
            {drill.variants.length > 1 && (
              <VariantDropdown
                variants={drill.variants}
                currentVariantId={drill.currentVariantId}
                onChange={drill.changeVariant}
              />
            )}
            <button
              className="dd-v2-icon-btn"
              onClick={drill.closeDrilldown}
              title="Close drilldown"
              aria-label="Close drilldown"
            >
              <XIcon size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Overflow advisory at 8+ levels */}
        {drill.overflowBannerVisible && (
          <div className="dd-v2-advisory">
            <WarningCircleIcon size={16} weight="fill" />
            <span>
              You've gone deep. If you're looking for something specific, asking
              in chat may be faster than continuing to drill.
            </span>
          </div>
        )}

        {/* Body */}
        <div className="dd-v2-body">
          {drill.isError ? (
            <div className="dd-v2-empty dd-v2-error">
              <div className="dd-v2-empty-title">Could not load records.</div>
              <button
                className="dd-v2-retry"
                onClick={() => drill.changePage(drill.pagination?.page ?? 1)}
              >
                Try again
              </button>
            </div>
          ) : drill.isLoading && drill.data.length === 0 ? (
            <div className="dd-v2-loading">Loading…</div>
          ) : drill.data.length === 0 || gridOptions === null ? (
            <div className="dd-v2-empty">
              <div className="dd-v2-empty-title">No records found.</div>
              <div className="dd-v2-empty-sub">
                Zero rows is valid information — nothing matches the drilldown
                query.
              </div>
            </div>
          ) : (
            <div
              ref={gridWrapRef}
              className={`dd-v2-grid-wrap${drill.hasNextLevel ? " dd-v2-grid-wrap-drillable" : ""}`}
              onClick={handleGridClick}
            >
              <ReportTable
                options={gridOptions}
                sortState={sortStateForTable}
                onSortChange={(columnId, order) =>
                  drill.changeSort(columnId, order)
                }
                disableTooltip
              />
            </div>
          )}
        </div>

        {/* Pagination */}
        {drill.pagination && drill.data.length > 0 && (
          <DrilldownPagination
            pagination={drill.pagination}
            onPageChange={drill.changePage}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function Breadcrumb({
  widgetTitle,
  chain,
  levelColumnMaps,
  variants,
  currentVariantId,
  onPopToLevel,
}: {
  widgetTitle: string;
  chain: import("../../../hooks/useDrilldownV2").DrilldownV2ClickNode[];
  levelColumnMaps?: DrilldownV2ColumnMapping[][];
  variants: DrilldownV2VariantSummary[];
  currentVariantId: string | null;
  onPopToLevel: (depth: number) => void;
}) {
  // The widget title is the breadcrumb's "home" — clicking it pops to depth
  // 0, returning the user to the first drill view (L1). This is the only
  // way to reach L1 when chain[0] is a panel-level click (KPI tile / drill
  // icon), because formatSegment returns null for an empty-filters,
  // empty-columnPath chain entry and we skip rendering its segment. Without
  // a clickable title, the user could navigate back to L2/L3 via segment
  // buttons but had no affordance to return to L1 itself.
  //
  // The title button is interactive only when there's somewhere to go — at
  // chain length <= 1 the user is already at L1 (or before), so we render a
  // plain span to avoid a misleading hover affordance and a no-op click.
  const isInteractive = chain.length > 1;
  // The variant control acts on the CURRENT (deepest) view. When the user
  // picks a variant different from what the click originally routed to, the
  // parenthesized suffix on the segment representing that depth swaps from
  // the captured metric value to the variant label. "Originally routed"
  // means: the variant id passed at click-time (for table-cell clicks this
  // comes from ``column_variant_map``; for KPI / chart clicks it's null,
  // meaning "use is_default"). Comparing against the routed variant — not
  // the level's ``is_default`` — keeps the value visible when the column-
  // routed initial variant happens to be non-default (e.g. clicking
  // open_pipeline_arr routes to the "open" variant even though the level's
  // is_default is "all").
  const topIdx = chain.length - 1;
  const topNode = chain[topIdx];
  const activeVariant = currentVariantId
    ? (variants.find((v) => v.id === currentVariantId) ?? null)
    : null;
  const isOnRoutedVariant =
    topNode == null
      ? true
      : topNode.initialVariantId === null
        ? (activeVariant?.is_default ?? false)
        : topNode.initialVariantId === currentVariantId;
  const variantLabelOverride =
    activeVariant && !isOnRoutedVariant ? activeVariant.label : null;

  // For panel-level clicks (KPI tile, chart/table drill icon) chain[0] has
  // no filters and no columnPath, so formatSegment skips rendering a
  // segment for it. KPI clicks DO carry a metricValue (the resolved
  // numeric the tile rendered) — surface it as a suffix on the widget
  // title since for a KPI the title IS the metric label. Only attach
  // when the L0 click is truly panel-level (empty filters + empty
  // columnPath) so we never double-render against a real L0 segment.
  // When chain.length === 1 and the root is panel-level, the title
  // suffix IS the active depth's suffix — so the variant-label override
  // applies here too.
  const root = chain[0];
  const rootIsPanelLevel =
    !!root &&
    Object.keys(root.filters).length === 0 &&
    root.columnPath.length === 0;
  const titleSuffix = rootIsPanelLevel
    ? chain.length === 1 && variantLabelOverride
      ? ` (${variantLabelOverride})`
      : formatMetricSuffix(root.metricValue, root.metricLabel)
    : "";
  const titleText = (widgetTitle || "Drilldown") + titleSuffix;
  return (
    <div className="dd-v2-breadcrumb">
      {isInteractive ? (
        <button
          className="dd-v2-breadcrumb-widget dd-v2-breadcrumb-btn"
          title={`${widgetTitle} — back to first drill view`}
          onClick={() => onPopToLevel(0)}
        >
          {titleText}
        </button>
      ) : (
        <span className="dd-v2-breadcrumb-widget" title={widgetTitle}>
          {titleText}
        </span>
      )}
      {chain.map((node, idx) => {
        const segmentVariantOverride =
          idx === topIdx ? variantLabelOverride : null;
        const label = formatSegment(
          node,
          levelColumnMaps?.[idx],
          segmentVariantOverride,
        );
        // A null label indicates a panel-level click with no filters (e.g.
        // KPI tile click, chart drilldown-icon click). The widget title above
        // already absorbs the click target for that depth — emitting a
        // "Drill" segment here added noise without signal.
        if (label === null) return null;
        return (
          <span key={`seg-${idx}`} className="dd-v2-breadcrumb-seg">
            <CaretRightIcon
              size={10}
              weight="bold"
              className="dd-v2-breadcrumb-sep"
            />
            <button
              className="dd-v2-breadcrumb-btn"
              onClick={() => onPopToLevel(idx)}
              title={`Jump back to level ${idx + 1}`}
            >
              {label}
            </button>
          </span>
        );
      })}
    </div>
  );
}

/**
 * Build the breadcrumb segment label for one click node.
 *
 * Returns null for empty panel-level clicks (no filters, no columnPath) so
 * the caller can drop the segment + separator entirely — the widget title
 * is enough context for those.
 *
 * When filters exist, each filter is rendered as `{title}: {formatted_value}`,
 * with title/format pulled from the level's column_map when available:
 * - `column_map.title` (or a formatted data_key) → label
 * - `column_map.pipe` + `column_map.value_format` → reverse-format the click
 *   value (e.g. epoch-ms `1777248000000` → `2026-04-27` for `pipe="timestamp"`)
 *
 * Filters are emitted in column_map declaration order (so a chart click that
 * captures both `point.x` and `series.name` shows them in the order the agent
 * declared, not the order the FE happened to insert them in the dict).
 */
function formatSegment(
  node: import("../../../hooks/useDrilldownV2").DrilldownV2ClickNode,
  columnMap: DrilldownV2ColumnMapping[] | undefined,
  variantLabelOverride: string | null,
): string | null {
  // Append the clicked metric value as a parenthesized suffix when present
  // (e.g. " (47)" for a chart bar of height 47). For table widget cells +
  // drill-view cells, also include the column label so the user knows WHICH
  // metric they clicked: " (Opp Count: 40)". Captured at click time; null
  // for panel-level icon clicks. Numbers render via toLocaleString for
  // thousands separators; booleans / strings pass through verbatim.
  //
  // When the user picked a non-default variant on this depth, the suffix
  // swaps to the variant label — the variant choice is more informative than
  // the original click value once the view's slice has changed.
  const filterEntries = Object.entries(node.filters);
  const metricSuffix = variantLabelOverride
    ? ` (${variantLabelOverride})`
    : formatMetricSuffix(node.metricValue, node.metricLabel);
  if (filterEntries.length === 0) {
    if (node.columnPath.length === 0) {
      // Panel-level drill (KPI / icon click). Nothing to show.
      return null;
    }
    return (
      formatLabel(node.columnPath[node.columnPath.length - 1]) + metricSuffix
    );
  }

  const cmByKey = new Map<string, DrilldownV2ColumnMapping>();
  (columnMap ?? []).forEach((e) => cmByKey.set(e.data_key, e));

  // Emit in column_map declaration order. Filters are pre-narrowed to the
  // level's column_map at descent time (see rowDescentFilters), so any
  // ``filterEntries`` key that doesn't match the column_map at this depth
  // is residual noise from an older shape — surface it as a fallback so we
  // never silently drop a filter the user contributed, but in practice the
  // ordered loop covers everything.
  const seen = new Set<string>();
  const ordered: Array<[string, unknown]> = [];
  (columnMap ?? []).forEach((e) => {
    const match = filterEntries.find(([k]) => k === e.data_key);
    if (match) {
      ordered.push(match);
      seen.add(match[0]);
    }
  });
  filterEntries.forEach(([k, v]) => {
    if (!seen.has(k)) ordered.push([k, v]);
  });

  const labels = ordered.map(([key, val]) => {
    const entry = cmByKey.get(key);
    const label = entry?.title || formatLabel(stripPrefix(key));
    return `${label}: ${formatFilterValue(val, entry)}`;
  });
  return labels.join(", ") + metricSuffix;
}

/**
 * Render the clicked metric value as a " (value)" or " (label: value)"
 * suffix for the breadcrumb segment, or empty string when no metric is
 * captured.
 *
 * - When ``metricLabel`` is set (table widget / drill-view cell click), the
 *   suffix renders as ``(Opp Count: 40)`` so the user can see WHICH column's
 *   value they drilled into. Chart point clicks and KPI tile clicks leave
 *   ``metricLabel`` unset because the breadcrumb's main segment label
 *   already conveys the dimension (chart axis) or the widget title (KPI).
 * - Numbers → ``toLocaleString`` for thousands separators (`1234` → "1,234").
 * - Non-empty strings → verbatim. An empty string `""` (which CASE WHEN
 *   expressions or coalesced cells can produce) is treated as "no
 *   metric to show" rather than rendering as the awkward `" ()"`.
 * - Booleans → verbatim.
 * - null / undefined → empty (no suffix at all).
 */
function formatMetricSuffix(
  metricValue: unknown,
  metricLabel?: string,
): string {
  if (metricValue === null || metricValue === undefined) return "";
  let formatted: string;
  if (typeof metricValue === "number" && Number.isFinite(metricValue)) {
    formatted = metricValue.toLocaleString();
  } else if (typeof metricValue === "string") {
    if (metricValue.length === 0) return "";
    formatted = metricValue;
  } else if (typeof metricValue === "boolean") {
    formatted = String(metricValue);
  } else {
    return "";
  }
  return metricLabel ? ` (${metricLabel}: ${formatted})` : ` (${formatted})`;
}

function stripPrefix(dataKey: string): string {
  const dot = dataKey.indexOf(".");
  return dot >= 0 ? dataKey.slice(dot + 1) : dataKey;
}

/**
 * Format a click-captured filter value for display in the breadcrumb.
 *
 * Mirrors the small subset of pipe/format reversal the backend does in
 * `_translate_v2_drill_filters` so the user sees the same string in the
 * breadcrumb as appears in the resolved drill SQL. Only `pipe="timestamp"`
 * is implemented here — that's the only pipe in active use. Strings with
 * no pipe pass through verbatim.
 */
function formatFilterValue(
  rawValue: unknown,
  entry: DrilldownV2ColumnMapping | undefined,
): string {
  if (
    entry?.pipe === "timestamp" &&
    (typeof rawValue === "number" || typeof rawValue === "string")
  ) {
    const ts = typeof rawValue === "string" ? Number(rawValue) : rawValue;
    if (Number.isFinite(ts)) {
      return strftimeLite(new Date(ts), entry.value_format ?? "%Y-%m-%d");
    }
  }
  return String(rawValue);
}

function strftimeLite(d: Date, fmt: string): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return fmt
    .replace(/%Y/g, String(d.getUTCFullYear()))
    .replace(/%m/g, pad(d.getUTCMonth() + 1))
    .replace(/%d/g, pad(d.getUTCDate()))
    .replace(/%H/g, pad(d.getUTCHours()))
    .replace(/%M/g, pad(d.getUTCMinutes()))
    .replace(/%S/g, pad(d.getUTCSeconds()));
}

/**
 * Single pill-shaped dropdown that lets the user switch variants at the
 * current drill level. Replaces the older row-of-buttons UI — a row gets
 * unwieldy past 2-3 variants and competes with the breadcrumb for header
 * space. The dropdown trigger shows the active variant's label + chevron;
 * the menu lists every variant with a check icon next to the active one.
 *
 * Resolves the active variant from ``currentVariantId`` with a fallback to
 * the default variant, then to the first variant — matches the hook's own
 * resolution order so the trigger label is never empty.
 */
function VariantDropdown({
  variants,
  currentVariantId,
  onChange,
}: {
  variants: DrilldownV2VariantSummary[];
  currentVariantId: string | null;
  onChange: (id: string | null) => void;
}) {
  const activeVariant =
    variants.find((v) => v.id === currentVariantId) ??
    variants.find((v) => v.is_default) ??
    variants[0];

  // Reserve a small slot for the check icon on every menu item so labels
  // stay vertically aligned across rows (active + inactive). An invisible
  // spacer of the same width keeps non-active items in the same column.
  const items: DropdownItem[] = variants.map((v) => ({
    key: v.id,
    label: v.label,
    onClick: () => onChange(v.id),
    icon:
      v.id === activeVariant?.id ? (
        <CheckIcon size={14} weight="bold" />
      ) : (
        <span style={{ display: "inline-block", width: 14 }} />
      ),
  }));

  const trigger = (
    <button
      type="button"
      className="dd-v2-variant-trigger"
      aria-label="Select variant"
      title={activeVariant?.description}
    >
      <span className="dd-v2-variant-trigger-label">
        {activeVariant?.label ?? "Variant"}
      </span>
      <CaretDownIcon size={14} weight="bold" />
    </button>
  );

  return (
    <Dropdown
      trigger={trigger}
      items={items}
      position="bottom-right"
      className="dd-v2-variant-dropdown"
    />
  );
}
