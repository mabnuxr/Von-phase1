import { useState, useCallback, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import type { WidgetConfig } from "../types/dashboard";
import type { PanelRenderResponse } from "../types/dashboard";

// ─── Types ───────────────────────────────────────────────────────

interface TablePanelMeta {
  id: string;
  limit: number;
  currentPage: number;
}

interface ServerPagination {
  page: number;
  limit: number;
  totalRows: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Query key factory ──────────────────────────────────────────

export const panelPageKeys = {
  page: (dashboardId: string, panelId: string, page: number, limit: number) =>
    ["panel-page", dashboardId, panelId, page, limit] as const,
};

// ─── Helpers ────────────────────────────────────────────────────

function adaptPagination(raw: {
  page: number;
  limit: number;
  total_rows: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}): ServerPagination {
  return {
    page: raw.page,
    limit: raw.limit,
    totalRows: raw.total_rows,
    totalPages: raw.total_pages,
    hasNextPage: raw.has_next_page,
    hasPrevPage: raw.has_prev_page,
  };
}

/**
 * Manages server-side table pagination for dashboard table widgets.
 *
 * Uses `useQueries` so each (dashboardId, panelId, page, limit) tuple
 * gets its own React Query cache entry. Navigating back to a previously
 * visited page is an instant cache hit — no duplicate requests.
 *
 * Page 1 data always comes from the initial dashboard render response;
 * the hook only fetches pages > 1.
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
        return {
          id,
          limit: cfg.serverPagination.limit,
          currentPage: pageState[id] ?? 1,
        };
      });
  }, [widgets, pageState]);

  // Only fetch pages beyond the initial page (page 1 is in dashboard data)
  const panelsNeedingFetch = useMemo(
    () => tablePanels.filter((p) => p.currentPage > 1),
    [tablePanels],
  );

  const pageQueries = useQueries({
    queries: panelsNeedingFetch.map((panel) => ({
      queryKey: panelPageKeys.page(
        dashboardId!,
        panel.id,
        panel.currentPage,
        panel.limit,
      ),
      queryFn: (): Promise<PanelRenderResponse> =>
        dashboardService.renderPanels(dashboardId!, {
          panels: [
            {
              panel_id: panel.id,
              table_limit: panel.limit,
              table_page: panel.currentPage,
            },
          ],
        }),
      enabled: !!dashboardId,
      staleTime: 5 * 60 * 1000, // 5 min — cached pages stay fresh
    })),
  });

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
          result[panel.id] = {
            ...existingWidget,
            config: {
              gridOptions: rendered.gridOptions ?? {},
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

  return { mergedWidgets, handlePageChange, loadingPanels };
}
