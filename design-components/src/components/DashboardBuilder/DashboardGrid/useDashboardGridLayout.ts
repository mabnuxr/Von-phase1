import { useCallback, useEffect, useState } from 'react';
import type { DashboardData, UseDashboardGridLayoutParams } from './types';
import type { Layout, LayoutItem } from 'react-grid-layout';

const normalizeLayoutItem = (item: {
  i: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}): LayoutItem => ({
  i: String(item.i),
  x: Number(item.x ?? 0),
  y: Number(item.y ?? 0),
  w: Number(item.w ?? 1),
  h: Number(item.h ?? 1),
});

/**
 * Hook to manage dashboard grid layout state and persistence.
 * Use this hook in the parent component (e.g., DashboardCanvas) and pass
 * the returned values to DashboardGrid as props.
 *
 * @example
 * ```tsx
 * const { dashboardData, loading, onLayoutChange, saving } = useDashboardGridLayout({
 *   fetchDashboardData,
 *   updateDashboardLayout,
 * });
 *
 * return (
 *   <DashboardGrid
 *     dashboardData={dashboardData}
 *     loading={loading}
 *     onLayoutChange={onLayoutChange}
 *   />
 * );
 * ```
 */
export const useDashboardGridLayout = ({
  fetchDashboardData,
  updateDashboardLayout,
}: UseDashboardGridLayoutParams) => {
  const [layout, setLayout] = useState<Layout>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [widgets, setWidgets] = useState<DashboardData['widgets']>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!mounted) return;

      try {
        setLoading(true);
        const response = await fetchDashboardData();

        const parsedLayout: Layout = response.layout.map(normalizeLayoutItem);

        setLayout(parsedLayout);
        setWidgets(response.widgets);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [fetchDashboardData]);

  const saveLayout = useCallback(
    async ({ layout: newLayout }: { layout: Layout }) => {
      setSaving(true);
      try {
        await updateDashboardLayout({ layout: newLayout });
      } catch (e) {
        console.error('save failed', e);
      } finally {
        setSaving(false);
      }
    },
    [updateDashboardLayout]
  );

  const onLayoutChange = useCallback(
    (newLayout: Layout) => {
      const normalized = newLayout.map(normalizeLayoutItem);
      setLayout(normalized);
      saveLayout({ layout: normalized });
    },
    [saveLayout]
  );

  // Construct dashboardData object for DashboardGrid
  const dashboardData: DashboardData = {
    layout,
    widgets,
  };

  return {
    dashboardData,
    loading,
    saving,
    onLayoutChange,
  };
};
