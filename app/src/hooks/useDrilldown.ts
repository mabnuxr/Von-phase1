import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import type { PanelDrilldownPagination } from "../types/dashboard";

const PAGE_LIMIT = 20;

interface SortInfo {
  orderBy: string;
  orderByAsc: boolean;
}

interface DrilldownState {
  panelId: string;
  widgetTitle: string;
  page: number;
  sort: SortInfo | null;
}

export function useDrilldown(
  dashboardId: string,
  widgets: Record<string, { title: string }>,
) {
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null);
  // Track the last successful data so we can show it while loading a new page
  const lastDataRef = useRef<Record<string, unknown>[]>([]);
  const lastPaginationRef = useRef<PanelDrilldownPagination | null>(null);

  // Reset all state when the dashboard changes so stale panel data never bleeds across
  useEffect(() => {
    setDrilldown(null);
    lastDataRef.current = [];
    lastPaginationRef.current = null;
  }, [dashboardId]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: [
      "drilldown",
      dashboardId,
      drilldown?.panelId,
      drilldown?.page,
      drilldown?.sort?.orderBy ?? null,
      drilldown?.sort?.orderByAsc ?? null,
    ],
    queryFn: async () => {
      if (!drilldown) throw new Error("No drilldown state");
      return dashboardService.drilldownPanel(dashboardId, {
        panel_id: drilldown.panelId,
        page_limit: PAGE_LIMIT,
        page: drilldown.page,
        ...(drilldown.sort && {
          order_by: drilldown.sort.orderBy,
          order_by_asc: drilldown.sort.orderByAsc,
        }),
      });
    },
    enabled: !!drilldown,
    staleTime: 5 * 60 * 1000,
  });

  // Keep last successful data for smooth page transitions
  if (data) {
    lastDataRef.current = data.data;
    lastPaginationRef.current = data.pagination;
  }

  const openDrilldown = useCallback(
    (panelId: string) => {
      const widget = widgets[panelId];
      // Clear cached rows when switching to a different panel so the previous
      // panel's data is never shown while the new panel's first fetch is in-flight.
      if (drilldown?.panelId !== panelId) {
        lastDataRef.current = [];
        lastPaginationRef.current = null;
      }
      setDrilldown({
        panelId,
        widgetTitle: widget?.title ?? "Drilldown",
        page: 1,
        sort: null,
      });
    },
    [widgets, drilldown?.panelId],
  );

  const closeDrilldown = useCallback(() => {
    setDrilldown(null);
    lastDataRef.current = [];
    lastPaginationRef.current = null;
  }, []);

  const changePage = useCallback((page: number) => {
    setDrilldown((prev) => (prev ? { ...prev, page } : null));
  }, []);

  const changeSort = useCallback(
    (columnId: string, order: "asc" | "desc" | null) => {
      setDrilldown((prev) => {
        if (!prev) return null;
        const nextSort: SortInfo | null =
          order === null
            ? null
            : { orderBy: columnId, orderByAsc: order === "asc" };
        return { ...prev, page: 1, sort: nextSort };
      });
    },
    [],
  );

  return {
    isOpen: !!drilldown,
    widgetTitle: drilldown?.widgetTitle ?? "",
    data: data?.data ?? lastDataRef.current,
    pagination: data?.pagination ?? lastPaginationRef.current,
    currentSort: drilldown?.sort ?? null,
    isLoading: isLoading || isFetching,
    isError,
    error,
    openDrilldown,
    closeDrilldown,
    changePage,
    changeSort,
  };
}
