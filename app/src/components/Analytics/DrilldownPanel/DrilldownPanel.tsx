import { useRef, useCallback, useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon } from "@phosphor-icons/react";
import {
  ReportTable,
  buildGridOptions,
} from "@vonlabs/design-components";
import type { ReportColumn } from "@vonlabs/design-components";
import type { PanelDrilldownPagination } from "../../../types/dashboard";
import { DrilldownPagination } from "./DrilldownPagination";

// ─── Helpers ────────────────────────────────────────────────────

/** Infer a ReportColumn type from a sample value */
function inferColumnType(
  key: string,
  value: unknown,
): ReportColumn["type"] {
  if (value === null || value === undefined) return "text";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    if (key.toLowerCase().includes("amount") || key.toLowerCase().includes("price"))
      return "currency";
    if (key.toLowerCase().includes("probability") || key.toLowerCase().includes("percent"))
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

/** Build ReportColumn definitions from the first data row */
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

// ─── Props ──────────────────────────────────────────────────────

export interface DrilldownPanelProps {
  isOpen: boolean;
  onClose: () => void;
  widgetTitle: string;
  data: Record<string, unknown>[];
  pagination: PanelDrilldownPagination | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

// ─── Component ──────────────────────────────────────────────────

export const DrilldownPanel: React.FC<DrilldownPanelProps> = ({
  isOpen,
  onClose,
  widgetTitle,
  data,
  pagination,
  isLoading,
  onPageChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState(90);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Derive columns from data
  const columns = useMemo(() => columnsFromData(data), [data]);

  // Build grid options
  const gridOptions = useMemo(() => {
    if (columns.length === 0 || data.length === 0) return null;
    return buildGridOptions(columns, data, {
      pageSize: data.length,
      showPagination: false,
    });
  }, [columns, data]);

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
    if (!isDraggingRef.current) return;
    const containerHeight = window.innerHeight;
    const deltaY = startYRef.current - e.clientY;
    const deltaPercent = (deltaY / containerHeight) * 100;
    const newHeight = Math.min(95, Math.max(20, startHeightRef.current + deltaPercent));
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
    };
  }, [handleMouseMove, handleMouseUp]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={containerRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl border-t border-gray-200 flex flex-col z-50 overflow-hidden"
            style={{ height: `${panelHeight}vh` }}
          >
            {/* Resize Handle */}
            <div
              onMouseDown={handleMouseDown}
              className="absolute -top-2 left-0 right-0 h-4 cursor-ns-resize flex justify-center items-center group"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full group-hover:bg-gray-400 transition-colors" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <span className="text-sm font-medium text-gray-900 truncate">
                {widgetTitle}
              </span>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                title="Close"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-hidden p-4">
              {gridOptions ? (
                <ReportTable options={gridOptions} isLoading={isLoading} />
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
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};
