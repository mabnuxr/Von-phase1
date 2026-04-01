import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, WarningCircleIcon } from "@phosphor-icons/react";
import {
  ReportTable,
  buildGridOptions,
  longTextExpandFormatter,
  handleLongTextHover,
  LongTextPopover,
} from "@vonlabs/design-components";
import type {
  ReportColumn,
  ServerSortState,
  ExpandPopoverState,
} from "@vonlabs/design-components";
import type { PanelDrilldownPagination } from "../../../types/dashboard";
import { DrilldownPagination } from "./DrilldownPagination";
import { DrilldownFilterQuery } from "./DrilldownFilterQuery";
import "./drilldown-panel.css";

// ─── Helpers ────────────────────────────────────────────────────

/** Infer a ReportColumn type from a sample value */
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
  if (typeof value === "string") {
    // ISO date pattern
    if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) return "date";
  }
  return "text";
}

/** Pretty-print a snake_case / camelCase key as a column label */
function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const MIN_COL_WIDTH: Record<ReportColumn["type"], number> = {
  boolean: 80,
  number: 100,
  currency: 110,
  percentage: 100,
  date: 120,
  text: 140,
  owner: 140,
  picklist: 120,
  multiPicklist: 140,
  sentiment: 120,
  email: 160,
  phone: 130,
  url: 160,
  longText: 160,
};

// Columns fill available width evenly; when there are many columns, each gets
// a minimum pixel width so headers aren't squeezed.
const EVEN_DISTRIBUTION_THRESHOLD = 6;

/** Build ReportColumn definitions from the first data row */
function columnsFromData(rows: Record<string, unknown>[]): ReportColumn[] {
  if (rows.length === 0) return [];
  const sample = rows[0];
  const keys = Object.keys(sample);
  const useMinWidths = keys.length > EVEN_DISTRIBUTION_THRESHOLD;
  return keys.map((key) => {
    const type = inferColumnType(key, sample[key]);
    return {
      id: key,
      label: formatLabel(key),
      type,
      sortable: true,
      ...(useMinWidths ? { width: MIN_COL_WIDTH[type] ?? 120 } : {}),
    };
  });
}

// ─── Props ──────────────────────────────────────────────────────

export interface DrilldownPanelProps {
  isOpen: boolean;
  onClose: () => void;
  widgetTitle: string;
  /** SQL query from the drilldown API — used to show active filter conditions */
  query?: string;
  data: Record<string, unknown>[];
  pagination: PanelDrilldownPagination | null;
  isLoading: boolean;
  isError?: boolean;
  onPageChange: (page: number) => void;
  /** Called when a column header is clicked for server-side sorting */
  onSortChange?: (columnId: string, order: "asc" | "desc" | null) => void;
  /** Current server sort state */
  sortState?: ServerSortState | null;
}

// ─── Component ──────────────────────────────────────────────────

export const DrilldownPanel: React.FC<DrilldownPanelProps> = ({
  isOpen,
  onClose,
  widgetTitle,
  query,
  data,
  pagination,
  isLoading,
  isError = false,
  onPageChange,
  onSortChange,
  sortState,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(90);
  const [popover, setPopover] = useState<ExpandPopoverState | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Derive columns from data
  const columns = useMemo(() => columnsFromData(data), [data]);

  // Track which columns are text type for the expand-button click handler
  const textColIds = useMemo(
    () => new Set(columns.filter((c) => c.type === "text").map((c) => c.id)),
    [columns],
  );
  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  // Keep a ref to data rows so the click handler always sees fresh data
  const dataRef = useRef(data);
  dataRef.current = data;

  // Build grid options, injecting server sort state so Grid Lite preserves
  // its sort cycle correctly across data updates.
  // Override text column formatters with the longtext expand-button variant.
  const gridOptions = useMemo(() => {
    if (columns.length === 0 || data.length === 0) return null;
    const opts = buildGridOptions(columns, data, {
      pageSize: data.length,
      showPagination: false,
    });
    if (!opts.columns) return opts;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gridCols = (opts.columns as any[]).map((col: any) => ({
      ...col,
      // Override text columns with longtext expand formatter
      ...(textColIds.has(col.id)
        ? { cells: { ...col.cells, formatter: longTextExpandFormatter } }
        : {}),
      // Inject sort state
      ...(sortState?.orderBy
        ? {
            sorting: {
              ...(col.sorting ?? {}),
              order:
                col.id === sortState.orderBy
                  ? sortState.orderByAsc
                    ? ("asc" as const)
                    : ("desc" as const)
                  : undefined,
            },
          }
        : {}),
    }));

    return { ...opts, columns: gridCols };
  }, [columns, data, sortState, textColIds]);

  /** Click handler — detect expand-button clicks via DOM traversal */
  const handleGridClick = useCallback(
    (e: React.MouseEvent) => {
      const btn = (e.target as HTMLElement).closest(
        ".dt-expand-btn",
      ) as HTMLElement;
      if (!btn) return;

      e.stopPropagation();

      const td = btn.closest("td");
      const tr = btn.closest("tr");
      const tbody = tr?.closest("tbody");
      if (!td || !tr || !tbody) return;

      const colIdx = Array.from(tr.children).indexOf(td);
      const rowIdx = Array.from(tbody.children).indexOf(tr);
      const colId = columnIds[colIdx];

      if (rowIdx >= 0 && colId && textColIds.has(colId)) {
        const fullText = String(dataRef.current[rowIdx]?.[colId] ?? "");
        if (fullText) {
          setPopover({ text: fullText, rect: td.getBoundingClientRect() });
        }
      }
    },
    [columnIds, textColIds],
  );

  // ── Resize drag handlers ──────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      startHeightRef.current = panelHeight;
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
    },
    [panelHeight],
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const containerHeight =
      containerRef.current.parentElement?.clientHeight ?? window.innerHeight;
    const deltaY = startYRef.current - e.clientY;
    const deltaPercent = (deltaY / containerHeight) * 100;
    const newHeight = Math.min(
      95,
      Math.max(20, startHeightRef.current + deltaPercent),
    );
    setPanelHeight(newHeight);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Reset body styles in case the component unmounts mid-drag
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={containerRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl border-t border-gray-200 flex flex-col z-50 overflow-hidden"
            style={{ height: `${panelHeight}%` }}
          >
            {/* Resize Handle — kept inside panel bounds so overflow-hidden doesn't clip it */}
            <div
              onMouseDown={handleMouseDown}
              className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize flex justify-center items-center group"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full group-hover:bg-gray-400 transition-colors" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <span className="text-sm font-medium text-gray-900 truncate">
                {widgetTitle}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {query && <DrilldownFilterQuery query={query} />}
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                  title="Close"
                >
                  <XIcon size={16} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
              {isError ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-sm text-gray-500">
                  <WarningCircleIcon size={24} className="text-red-400" />
                  <span>Failed to load data. Please try again.</span>
                </div>
              ) : gridOptions ? (
                <div
                  ref={gridWrapperRef}
                  className="h-full relative drilldown-grid"
                  onClick={handleGridClick}
                  onMouseOver={handleLongTextHover}
                >
                  <ReportTable
                    options={gridOptions}
                    onSortChange={onSortChange}
                    sortState={sortState}
                    disableTooltip
                  />
                  {/* Shimmer overlay — same pattern as TableWidget: headers stay visible,
                      shimmer covers only body rows. top:36px clears the HCG header. */}
                  {isLoading && (
                    <div className="table-skeleton" style={{ top: 36 }}>
                      {Array.from({
                        length: pagination?.limit ?? 20,
                      }).map((_, i) => (
                        <div key={i} className="table-skeleton-row">
                          <div
                            className="table-skeleton-cell"
                            style={{ width: "25%" }}
                          />
                          <div
                            className="table-skeleton-cell"
                            style={{ width: "18%" }}
                          />
                          <div
                            className="table-skeleton-cell"
                            style={{ width: "15%" }}
                          />
                          <div
                            className="table-skeleton-cell"
                            style={{ width: "12%" }}
                          />
                          <div
                            className="table-skeleton-cell"
                            style={{ width: "14%" }}
                          />
                          <div
                            className="table-skeleton-cell"
                            style={{ width: "10%" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-500">
                  {isLoading ? "Loading..." : "No data available"}
                </div>
              )}
            </div>

            {/* Footer with pagination */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-sm text-gray-500">
                {pagination
                  ? `${pagination.total.toLocaleString()} row${pagination.total !== 1 ? "s" : ""}`
                  : ""}
              </span>
              {pagination && pagination.totalPages > 1 && (
                <DrilldownPagination
                  pagination={pagination}
                  onPageChange={onPageChange}
                />
              )}
            </div>
          </motion.div>

          {/* LongText expand popover */}
          <AnimatePresence>
            {popover && (
              <LongTextPopover
                text={popover.text}
                anchorRect={popover.rect}
                onClose={() => setPopover(null)}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};
