import { ReactGridLayout } from "react-grid-layout";
import type { LayoutItem } from "react-grid-layout";
import type { DashboardGridProps } from "./types";
import { useDashboardGridLayout } from "./useDashboardGridLayout";
import { useRef } from "react";
import { motion } from "framer-motion";
import { ChartWidget } from "..";

const DASHBOARD_GRID_CONFIG = {
	cols: 12,
	rowHeight: 30,
	draggableHandle: ".widget-drag-handle",
}

const DashboardGrid = ({ fetchDashboardData, updateDashboardLayout, width }: DashboardGridProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
  const { layout, widgetData, loading, onLayoutChange } = useDashboardGridLayout({ fetchDashboardData, updateDashboardLayout });

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
						className="w-10 h-10 border-3 border-gray-200 border-t-gray-600 rounded-full mx-auto mb-4"
					/>
					<p className="text-sm text-gray-500">Loading dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<motion.div
			className="h-full"
			style={{ width: width || '100%' }}
			ref={containerRef}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
		>
			<ReactGridLayout
				className="layout"
				layout={layout}
				gridConfig={DASHBOARD_GRID_CONFIG}
				onLayoutChange={onLayoutChange}
				width={(width ?? containerRef.current?.offsetWidth) || 1200}
			>
				{layout.map((item: LayoutItem, index: number) => (
					<motion.div
						key={item.i}
						data-grid={item}
						className="p-1"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
					>
						<ChartWidget widget={widgetData[item.i]}/>
					</motion.div>
				))}
			</ReactGridLayout>
		</motion.div>
	)
}

export { DashboardGrid };