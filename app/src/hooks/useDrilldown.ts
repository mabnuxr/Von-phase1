import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import type { PanelDrilldownResponse } from "../types/dashboard";

const PAGE_LIMIT = 20;

interface SortInfo {
  orderBy: string;
  orderByAsc: boolean;
}

interface DrilldownState {
  panelId: string;
  page: number;
  sort: SortInfo | null;
  drillFilters: Record<string, unknown> | null;
}

export function useDrilldown(dashboardId: string) {
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null);
  // Track the last successful response so we can show it while loading a new page
  const lastResponseRef = useRef<PanelDrilldownResponse | null>(null);

  // Reset all state when the dashboard changes so stale panel data never bleeds across
  useEffect(() => {
    setDrilldown(null);
    lastResponseRef.current = null;
  }, [dashboardId]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: [
      "drilldown",
      dashboardId,
      drilldown?.panelId,
      drilldown?.page,
      drilldown?.sort?.orderBy ?? null,
      drilldown?.sort?.orderByAsc ?? null,
      drilldown?.drillFilters ?? null,
    ],
    queryFn: async () => {
      if (!drilldown) throw new Error("No drilldown state");
      return dashboardService.drilldownPanel(dashboardId, {
        panel_id: drilldown.panelId,
        page_limit: PAGE_LIMIT,
        page: drilldown.page,
        ...(drilldown.drillFilters && {
          drill_filters: drilldown.drillFilters,
        }),
        ...(drilldown.sort && {
          sort_config: [
            {
              order_by: drilldown.sort.orderBy,
              order_by_asc: drilldown.sort.orderByAsc,
            },
          ],
        }),
      });
    },
    enabled: !!drilldown,
    staleTime: 5 * 60 * 1000,
  });

  // Keep last successful response for smooth page transitions
  if (data) {
    lastResponseRef.current = data;
  }

  /** Chart-level drilldown — shows all rows (no filters). */
  const openDrilldown = useCallback(
    (panelId: string) => {
      // Clear cached rows when switching to a different panel so the previous
      // panel's data is never shown while the new panel's first fetch is in-flight.
      if (drilldown?.panelId !== panelId) {
        lastResponseRef.current = null;
      }
      setDrilldown({
        panelId,
        page: 1,
        sort: null,
        drillFilters: null,
      });
    },
    [drilldown?.panelId],
  );

  /** Point-level drilldown — filters to the clicked chart element. */
  const openPointDrilldown = useCallback(
    (panelId: string, drillFilters: Record<string, unknown>) => {
      // Always clear cached data — drill_filters change means new result set,
      // even when clicking a different point on the same panel.
      lastResponseRef.current = null;
      setDrilldown({
        panelId,
        page: 1,
        sort: null,
        drillFilters,
      });
    },
    [],
  );

  const closeDrilldown = useCallback(() => {
    setDrilldown(null);
    lastResponseRef.current = null;
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

  const response = data ?? lastResponseRef.current;

  return {
    isOpen: !!drilldown,
    panelId: drilldown?.panelId ?? null,
    title: response?.title ?? "",
    query: response?.query ?? "",
    data: response?.data ?? [],
    pagination: response?.pagination ?? null,
    currentSort: drilldown?.sort ?? null,
    isLoading: isLoading || isFetching,
    isError,
    error,
    openDrilldown,
    openPointDrilldown,
    closeDrilldown,
    changePage,
    changeSort,
  };
}
