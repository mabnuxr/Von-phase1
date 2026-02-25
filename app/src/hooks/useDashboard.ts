import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { Dashboard, RefreshInfo } from '../types/dashboard';

export interface UseDashboardReturn {
  dashboard: Dashboard | null;
  refreshInfo: RefreshInfo | null;
  loading: boolean;
  error: string | null;
  activeFilters: Record<string, unknown>;
  refresh: () => Promise<void>;
}

/**
 * Single hook that encapsulates all dashboard business logic:
 * fetching metadata, managing filters (view-only defaults), and refresh.
 */
export function useDashboard(dashboardId: string | undefined): UseDashboardReturn {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [refreshInfo, setRefreshInfo] = useState<RefreshInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>({});

  const fetchDashboard = useCallback(async () => {
    if (!dashboardId) {
      setError('No dashboard ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await dashboardService.getDashboard(dashboardId);

      if (!response.success) {
        setError(response.error?.message ?? 'Failed to load dashboard');
        return;
      }

      const { dashboard: dashData, refreshInfo: refInfo } = response.data;
      setDashboard(dashData);
      setRefreshInfo(refInfo);

      // Set default filter values
      const defaults: Record<string, unknown> = {};
      dashData.filters?.forEach((filter) => {
        if (filter.defaultValue !== undefined) {
          defaults[filter.id] = filter.defaultValue;
        }
      });
      setActiveFilters(defaults);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dashboardId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const refresh = useCallback(async () => {
    if (!dashboardId) return;

    try {
      setRefreshInfo((prev) =>
        prev ? { ...prev, refreshStatus: 'refreshing' as const } : prev,
      );
      await dashboardService.triggerRefresh(dashboardId);
      // Re-fetch the entire dashboard to get updated data
      await fetchDashboard();
    } catch {
      setRefreshInfo((prev) =>
        prev ? { ...prev, refreshStatus: 'failed' as const } : prev,
      );
    }
  }, [dashboardId, fetchDashboard]);

  return { dashboard, refreshInfo, loading, error, activeFilters, refresh };
}
