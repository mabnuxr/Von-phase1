import type { Layout } from "react-grid-layout";
import type { DashboardWidget } from "../types";

export type DashboardData = {
    layout: Layout;
    widgets: {
        [key: string]: DashboardWidget
    };
}

export type UseDashboardGridLayoutParams = {
    fetchDashboardData: () => Promise<DashboardData>;
    updateDashboardLayout: (params: {layout: Layout}) => Promise<void>;
};

export type DashboardGridProps = UseDashboardGridLayoutParams & {
	width?: number;
}