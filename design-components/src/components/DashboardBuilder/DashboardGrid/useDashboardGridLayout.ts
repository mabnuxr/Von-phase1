import { useCallback, useEffect, useState } from "react";
import type { DashboardData, UseDashboardGridLayoutParams } from "./types";
import type { Layout, LayoutItem } from "react-grid-layout";


const normalizeLayoutItem = (item: {i: string; x?: number; y?: number; w?: number; h?: number}): LayoutItem => ({
	i: String(item.i),
	x: Number(item.x ?? 0),
	y: Number(item.y ?? 0),
	w: Number(item.w ?? 1),
	h: Number(item.h ?? 1)
});

export const useDashboardGridLayout = ({fetchDashboardData, updateDashboardLayout}: UseDashboardGridLayoutParams) => {
	const [layout, setLayout] = useState<Layout>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [widgetData, setWidgetData] = useState<DashboardData["widgets"]>({});
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
				setWidgetData(response.widgets);
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


	const saveLayout = useCallback(async ({layout: newLayout}: {layout: Layout}) => {
		setSaving(true);
		try {
		await updateDashboardLayout({ layout: newLayout });
	} catch (e) {
		console.error("save failed", e);
	} finally {
		setSaving(false);
	}
	}, [updateDashboardLayout]);


  const onLayoutChange = useCallback((newLayout: Layout) =>{
    const normalized = newLayout.map(normalizeLayoutItem);
    setLayout(normalized);
    saveLayout({layout: normalized});
  }, []);

	return {
		layout,
		widgetData,
		loading,
		saving,
		onLayoutChange,
	}
};