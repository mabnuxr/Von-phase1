import { useState, useCallback } from "react";

export interface DashboardPaneState {
  isOpen: boolean;
  dashboardId: string | null;
}

/**
 * Hook to manage the dashboard preview pane state.
 * Opens when user clicks "View Dashboard" in chat, showing AnalyticsView inline.
 */
export function useDashboardPane() {
  const [state, setState] = useState<DashboardPaneState>({
    isOpen: false,
    dashboardId: null,
  });

  const openDashboardPane = useCallback((dashboardId: string) => {
    setState({ isOpen: true, dashboardId });
  }, []);

  const closeDashboardPane = useCallback(() => {
    setState({ isOpen: false, dashboardId: null });
  }, []);

  return {
    dashboardPaneState: state,
    openDashboardPane,
    closeDashboardPane,
  };
}
