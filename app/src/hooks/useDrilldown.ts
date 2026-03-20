import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import type { PanelDrilldownPagination } from "../types/dashboard";

const PAGE_LIMIT = 10;

interface DrilldownState {
  panelId: string;
  widgetTitle: string;
  page: number;
}

export function useDrilldown(
  dashboardId: string,
  widgets: Record<string, { title: string }>,
) {
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null);
  // Track the last successful data so we can show it while loading a new page
  const lastDataRef = useRef<Record<string, unknown>[]>([]);
  const lastPaginationRef = useRef<PanelDrilldownPagination | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["drilldown", dashboardId, drilldown?.panelId, drilldown?.page],
    queryFn: async () => {
      if (!drilldown) throw new Error("No drilldown state");
      return dashboardService.drilldownPanel(dashboardId, {
        panel_id: drilldown.panelId,
        page_limit: PAGE_LIMIT,
        page: drilldown.page,
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
      setDrilldown({
        panelId,
        widgetTitle: widget?.title ?? "Drilldown",
        page: 1,
      });
    },
    [widgets],
  );

  const closeDrilldown = useCallback(() => {
    setDrilldown(null);
    lastDataRef.current = [];
    lastPaginationRef.current = null;
  }, []);

  const changePage = useCallback((page: number) => {
    setDrilldown((prev) => (prev ? { ...prev, page } : null));
  }, []);

  return {
    isOpen: !!drilldown,
    widgetTitle: drilldown?.widgetTitle ?? "",
    data: data?.data ?? lastDataRef.current,
    pagination: data?.pagination ?? lastPaginationRef.current,
    isLoading: isLoading || isFetching,
    openDrilldown,
    closeDrilldown,
    changePage,
  };
}
