import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQueries } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import type { WidgetConfig } from "../types/dashboard";
import type { PanelRenderResponse } from "../types/dashboard";

// ─── Types ───────────────────────────────────────────────────────

interface TablePanelMeta {
  id: string;
  limit: number;
  currentPage: number;
  orderBy: string | undefined;
  orderByAsc: boolean | undefined;
}

interface ServerPagination {
  page: number;
  limit: number;
  totalRows: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  orderBy?: string;
  orderByAsc?: boolean;
}

interface SortInfo {
  orderBy: string;
  orderByAsc: boolean;
}

// ─── Query key factory ──────────────────────────────────────────

export const panelPageKeys = {
  page: (
    dashboardId: string,
    panelId: string,
    page: number,
    limit: number,
    orderBy?: string,
    orderByAsc?: boolean,
  ) =>
    [
      "panel-page",
      dashboardId,
      panelId,
      page,
      limit,
      orderBy ?? null,
      orderByAsc ?? null,
    ] as const,
};

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Inject `sorting.order` into gridOptions columns so Grid Lite knows which
 * column is sorted and can maintain its sort cycle (asc → desc → none)
 * correctly across data updates.  Without this, `grid.update()` resets
 * Grid Lite's internal sort state, causing the cycle to restart at "asc"
 * on every click and preventing queries from firing for repeated clicks.
 */
function injectSortOrder(
  gridOptions: Record<string, unknown>,
  orderBy: string | undefined,
  orderByAsc: boolean | undefined,
): Record<string, unknown> {
  if (!orderBy) return gridOptions;
  const columns = gridOptions.columns as
    | Array<{ id?: string; sorting?: Record<string, unknown> }>
    | undefined;
  if (!Array.isArray(columns)) return gridOptions;

  return {
    ...gridOptions,
    columns: columns.map((col) => ({
      ...col,
      sorting: {
        ...(col.sorting ?? {}),
        order: col.id === orderBy ? (orderByAsc ? "asc" : "desc") : undefined,
      },
    })),
  };
}

function adaptPagination(raw: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  orderBy?: string;
  orderByAsc?: boolean;
}): ServerPagination {
  return {
    page: raw.page,
    limit: raw.limit,
    totalRows: raw.total,
    totalPages: raw.totalPages,
    hasNextPage: raw.hasNextPage,
    hasPrevPage: raw.hasPrevPage,
    orderBy: raw.orderBy,
    orderByAsc: raw.orderByAsc,
  };
}

/**
 * Manages server-side table pagination and sorting for dashboard table widgets.
 *
 * Uses `useQueries` so each (dashboardId, panelId, page, limit, sort) tuple
 * gets its own React Query cache entry. Navigating back to a previously
 * visited page is an instant cache hit — no duplicate requests.
 *
 * Page 1 data always comes from the initial dashboard render response;
 * the hook only fetches pages > 1 or when a sort is applied.
 *
 * Returns `mergedWidgets` — the original widgets map with table widgets
 * overridden by their current page data when available. When a page is
 * still loading, `serverPagination.page` is updated optimistically so
 * the pagination bar immediately reflects the requested page.
 */
export function useTableServerPagination(
  dashboardId: string | undefined,
  widgets: Record<string, WidgetConfig>,
) {
  // Current page per panel. Panels not in this map are on page 1.
  // Reset is handled by key={dashboardId} on the Analytics route component.
  const [pageState, setPageState] = useState<Record<string, number>>({});

  // Current sort per panel. Panels not in this map use default backend order.
  const [sortState, setSortState] = useState<Record<string, SortInfo>>({});

  // Identify table panels that have server pagination
  const tablePanels: TablePanelMeta[] = useMemo(() => {
    return Object.entries(widgets)
      .filter(([, w]) => {
        if (w.type !== "table") return false;
        const cfg = w.config as unknown as {
          serverPagination?: { limit: number };
        };
        return !!cfg.serverPagination;
      })
      .map(([id, w]) => {
        const cfg = w.config as unknown as {
          serverPagination: { limit: number };
        };
        const sort = sortState[id];
        return {
          id,
          limit: cfg.serverPagination.limit,
          currentPage: pageState[id] ?? 1,
          orderBy: sort?.orderBy,
          orderByAsc: sort?.orderByAsc,
        };
      });
  }, [widgets, pageState, sortState]);

  // Fetch pages beyond initial OR when sort is applied (even page 1 needs refetch with sort)
  const panelsNeedingFetch = useMemo(
    () =>
      tablePanels.filter((p) => p.currentPage > 1 || p.orderBy !== undefined),
    [tablePanels],
  );

  const pageQueries = useQueries({
    queries: panelsNeedingFetch.map((panel) => ({
      queryKey: panelPageKeys.page(
        dashboardId!,
        panel.id,
        panel.currentPage,
        panel.limit,
        panel.orderBy,
        panel.orderByAsc,
      ),
      queryFn: (): Promise<PanelRenderResponse> =>
        dashboardService.renderPanels(dashboardId!, {
          panels: [
            {
              panel_id: panel.id,
              table_limit: panel.limit,
              table_page: panel.currentPage,
              ...(panel.orderBy !== undefined && {
                order_by: panel.orderBy,
                order_by_asc: panel.orderByAsc,
              }),
            },
          ],
        }),
      enabled: !!dashboardId,
      staleTime: 5 * 60 * 1000, // 5 min — cached pages stay fresh
    })),
  });

  // Track the last successfully loaded page per panel so we can revert on error.
  const lastSuccessfulPage = useRef<Record<string, number>>({});
  const revertedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    panelsNeedingFetch.forEach((panel, idx) => {
      const query = pageQueries[idx];

      if (query?.data && !query.isError) {
        // Successful fetch — record this page as the last good one
        lastSuccessfulPage.current[panel.id] = panel.currentPage;
        revertedRef.current.delete(panel.id);
      } else if (query?.isError && !revertedRef.current.has(panel.id)) {
        // Failed fetch — revert to the last successful page (or page 1)
        revertedRef.current.add(panel.id);
        const fallbackPage = lastSuccessfulPage.current[panel.id] ?? 1;
        setPageState((prev) => {
          if (fallbackPage === 1) {
            const next = { ...prev };
            delete next[panel.id];
            return next;
          }
          return { ...prev, [panel.id]: fallbackPage };
        });
      }
    });
  }, [panelsNeedingFetch, pageQueries]);

  // Build the merged widgets: replace table widget configs with fetched page data
  // When a page is requested but data hasn't arrived, optimistically update
  // serverPagination.page so the pagination bar highlights the correct page.
  const mergedWidgets = useMemo(() => {
    if (panelsNeedingFetch.length === 0) return widgets;

    const result = { ...widgets };

    panelsNeedingFetch.forEach((panel, idx) => {
      const query = pageQueries[idx];
      const existingWidget = result[panel.id];
      const existingConfig = existingWidget?.config as unknown as
        | {
            serverPagination?: ServerPagination;
            gridOptions: Record<string, unknown>;
          }
        | undefined;

      if (!existingConfig?.serverPagination) return;

      if (query?.data) {
        // Data arrived — use it
        const rendered = query.data.widgets[panel.id];
        if (rendered) {
          const baseGridOpts =
            rendered.gridOptions ?? existingConfig.gridOptions;
          result[panel.id] = {
            ...existingWidget,
            config: {
              gridOptions: injectSortOrder(
                baseGridOpts as Record<string, unknown>,
                panel.orderBy,
                panel.orderByAsc,
              ),
              serverPagination: rendered.pagination
                ? adaptPagination(rendered.pagination)
                : existingConfig.serverPagination,
            },
          } as unknown as WidgetConfig;
        }
      } else {
        // Still loading — optimistically update page number in pagination
        result[panel.id] = {
          ...existingWidget,
          config: {
            ...existingConfig,
            serverPagination: {
              ...existingConfig.serverPagination,
              page: panel.currentPage,
              hasPrevPage: panel.currentPage > 1,
              hasNextPage:
                panel.currentPage < existingConfig.serverPagination.totalPages,
            },
          },
        } as unknown as WidgetConfig;
      }
    });

    return result;
  }, [widgets, panelsNeedingFetch, pageQueries]);

  // Loading state per panel
  const loadingPanels = useMemo(() => {
    const loading = new Set<string>();
    panelsNeedingFetch.forEach((panel, idx) => {
      if (pageQueries[idx]?.isFetching) loading.add(panel.id);
    });
    return loading;
  }, [panelsNeedingFetch, pageQueries]);

  const handlePageChange = useCallback((panelId: string, page: number) => {
    setPageState((prev) => ({ ...prev, [panelId]: page }));
  }, []);

  const handleSortChange = useCallback(
    (panelId: string, columnId: string, order: "asc" | "desc" | null) => {
      setSortState((prev) => {
        if (order === null) {
          // Sort cleared
          const next = { ...prev };
          delete next[panelId];
          return next;
        }
        return {
          ...prev,
          [panelId]: { orderBy: columnId, orderByAsc: order === "asc" },
        };
      });
      // Reset to page 1 when sort changes
      setPageState((prev) => {
        const next = { ...prev };
        delete next[panelId];
        return next;
      });
    },
    [],
  );

  // Expose current sort state so components can show sort indicators
  const activeSorts = useMemo(() => sortState, [sortState]);

  return {
    mergedWidgets,
    handlePageChange,
    handleSortChange,
    loadingPanels,
    activeSorts,
  };
}
