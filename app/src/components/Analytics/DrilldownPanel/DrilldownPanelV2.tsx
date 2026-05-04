/**
 * DrilldownPanelV2 — bottom-sheet renderer for the V2 drilldown flow
 * (pyramid model).
 *
 * Feature-flagged on the backend via `drilldown_v2`. The FE wires this panel
 * alongside the legacy DrilldownPanel — callers pick the V2 variant when the
 * clicked widget's loaded config has a `drilldown_v2` field populated.
 *
 * Contract:
 * - 95vh bottom sheet with scrim + grip handle; ESC / close button to dismiss.
 * - Breadcrumb: Widget › L1-segment › L2-segment › … (one segment per click);
 *   click any segment to pop to that level.
 * - Button-style variant selector when `variants.length > 1`.
 * - Justification line rendered from the backend's `justification` string.
 * - Data table reuses the existing ReportTable component for consistent UX.
 * - **Whole-row descent.** When `hasNextLevel === true`, every row is
 *   clickable — clicking ANY cell descends to the next level using the entire
 *   row's grouping-key column values as cumulative filters. When false (floor
 *   of the pyramid), rows are inert.
 * - Empty state: "No records found". Error state: "Could not load records."
 * - Advisory banner when click-chain depth >= 8 (deep drilling — suggests
 *   switching to chat if the user is lost).
 */
import { useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, CaretRightIcon, WarningCircleIcon } from "@phosphor-icons/react";
import {
  ReportTable,
  buildGridOptions,
} from "@vonlabs/design-components";
import type { ReportColumn, ServerSortState } from "@vonlabs/design-components";
import type { UseDrilldownV2Return } from "../../../hooks/useDrilldownV2";
import type { DrilldownV2VariantSummary } from "../../../types/dashboard";
import { DrilldownPagination } from "./DrilldownPagination";
import "./drilldown-panel.css";

// ─── Helpers ────────────────────────────────────────────────────

function inferColumnType(key: string, value: unknown): ReportColumn["type"] {
  if (value === null || value === undefined) return "text";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    if (key.toLowerCase().includes("amount") || key.toLowerCase().includes("price"))
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
   * Called when the user clicks any cell in a row, while `hasNextLevel` is
   * true. The parent issues `drill.pushLevel(...)` with the row's grouping-key
   * dict as the new filter contribution — whole-row descent.
   */
  onRowDrill?: (rowIndex: number, rowData: Record<string, unknown>) => void;
}

export function DrilldownPanelV2({ drill, widgetTitle, onRowDrill }: DrilldownPanelV2Props) {
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

  const gridOptions = useMemo(() => {
    if (columns.length === 0 || drill.data.length === 0) return null;
    return buildGridOptions(columns, drill.data, {
      pageSize: drill.data.length,
      showPagination: false,
    });
  }, [columns, drill.data]);

  // Whole-row descent: clicking ANY cell in a row descends to the next level
  // when `hasNextLevel === true`. We don't discriminate per column — semantically
  // a click anywhere in row R means "show me what made up THIS row," and the
  // entire row's grouping-key values become cumulative filters at the next level.
  const handleGridClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onRowDrill || !drill.hasNextLevel) return;
      const target = e.target as HTMLElement;
      const td = target.closest("td");
      if (!td) return;
      const tr = td.closest("tr");
      if (!tr) return;

      const tbody = tr.parentElement;
      if (!tbody) return;
      const rowIndex = Array.prototype.indexOf.call(tbody.children, tr);
      if (rowIndex < 0 || rowIndex >= drill.data.length) return;

      e.stopPropagation();
      onRowDrill(rowIndex, drill.data[rowIndex]);
    },
    [drill.data, drill.hasNextLevel, onRowDrill],
  );

  const sortStateForTable: ServerSortState | null = drill.currentSort
    ? {
        columnId: drill.currentSort.orderBy,
        order: drill.currentSort.orderByAsc ? "asc" : "desc",
      }
    : null;

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

        {/* Header: breadcrumb + variant buttons + close */}
        <div className="dd-v2-header">
          <Breadcrumb
            widgetTitle={widgetTitle ?? drill.title ?? "Drilldown"}
            chain={drill.clickChain}
            onPopToLevel={drill.popToLevel}
          />
          <div className="dd-v2-header-actions">
            {drill.variants.length > 1 && (
              <VariantButtons
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

        {/* Justification */}
        {drill.justification && (
          <div className="dd-v2-justification">{drill.justification}</div>
        )}

        {/* Overflow advisory at 8+ levels */}
        {drill.overflowBannerVisible && (
          <div className="dd-v2-advisory">
            <WarningCircleIcon size={16} weight="fill" />
            <span>
              You've gone deep. If you're looking for something specific, asking in
              chat may be faster than continuing to drill.
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
                Zero rows is valid information — nothing matches the drilldown query.
              </div>
            </div>
          ) : (
            <div
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
  onPopToLevel,
}: {
  widgetTitle: string;
  chain: import("../../../hooks/useDrilldownV2").DrilldownV2ClickNode[];
  onPopToLevel: (depth: number) => void;
}) {
  return (
    <div className="dd-v2-breadcrumb">
      <span className="dd-v2-breadcrumb-widget" title={widgetTitle}>
        {widgetTitle || "Drilldown"}
      </span>
      {chain.map((node, idx) => {
        const label = formatSegment(node);
        return (
          <span key={`seg-${idx}`} className="dd-v2-breadcrumb-seg">
            <CaretRightIcon size={10} weight="bold" className="dd-v2-breadcrumb-sep" />
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

function formatSegment(
  node: import("../../../hooks/useDrilldownV2").DrilldownV2ClickNode,
): string {
  const pathLabel = node.columnPath.length
    ? node.columnPath[node.columnPath.length - 1]
    : "";
  const firstFilter = Object.entries(node.filters)[0];
  if (pathLabel) {
    if (firstFilter) return `${formatLabel(pathLabel)}: ${String(firstFilter[1])}`;
    return formatLabel(pathLabel);
  }
  if (firstFilter) return `${formatLabel(stripPrefix(firstFilter[0]))}: ${String(firstFilter[1])}`;
  return "Drill";
}

function stripPrefix(dataKey: string): string {
  const dot = dataKey.indexOf(".");
  return dot >= 0 ? dataKey.slice(dot + 1) : dataKey;
}

function VariantButtons({
  variants,
  currentVariantId,
  onChange,
}: {
  variants: DrilldownV2VariantSummary[];
  currentVariantId: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="dd-v2-variant-btns" role="group" aria-label="Variant selector">
      {variants.map((v) => (
        <button
          key={v.id}
          className={`dd-v2-variant-btn ${currentVariantId === v.id ? "dd-v2-variant-btn-active" : ""}`}
          onClick={() => onChange(v.id)}
          title={v.description}
        >
          {v.label}
          {v.is_default && currentVariantId !== v.id && (
            <span className="dd-v2-variant-default-tag">default</span>
          )}
        </button>
      ))}
    </div>
  );
}
