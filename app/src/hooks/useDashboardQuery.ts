import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { applyWidgetTheme } from "../utils/applyWidgetTheme";
import type {
  Dashboard,
  RefreshInfo,
  DashboardMetadataResponse,
  WidgetConfig,
  ChartType,
} from "../types/dashboard";

/**
 * Query keys for dashboard data.
 */
export const dashboardKeys = {
  all: ["dashboards"] as const,
  detail: (id: string) => [...dashboardKeys.all, id] as const,
};

// ─── Raw API Response Types ─────────────────────────────────────

interface RawApiWidget {
  id: string;
  type: string;
  title: string;
  query_ref: string;
  layout: { x: number; y: number; w: number; h: number };
  kpi: { value: number[]; format: string } | null;
  highcharts: Record<string, unknown> | null;
}

interface RawApiDashboardResponse {
  id: string;
  title: string;
  description?: string;
  gridConfig: Dashboard["gridConfig"];
  layout: Dashboard["layout"];
  widgets: Record<string, RawApiWidget>;
  filters: Dashboard["filters"];
  created_at: string;
  updated_at: string;
  refresh_info: {
    last_refreshed_at: string;
  };
}

// ─── API Response Adapter ───────────────────────────────────────

function parseKpiFormat(format: string) {
  let fmt: "number" | "currency" | "percentage" = "number";
  let prefix: string | undefined;
  let suffix: string | undefined;

  if (format.includes("$")) {
    fmt = "currency";
    prefix = "$";
  } else if (format.includes("%")) {
    fmt = "percentage";
    suffix = "%";
  }

  const decimalMatch = format.match(/\.(\d+)/);
  const decimals = decimalMatch ? decimalMatch[1].length : 0;

  return { format: fmt, prefix, suffix, decimals };
}

function adaptWidget(raw: RawApiWidget): WidgetConfig {
  if (raw.type === "kpi" && raw.kpi) {
    const { format, prefix, suffix, decimals } = parseKpiFormat(raw.kpi.format);
    return {
      id: raw.id,
      type: "counter",
      title: raw.title,
      config: {
        value: raw.kpi.value[0] ?? 0,
        format,
        ...(prefix && { prefix }),
        ...(suffix && { suffix }),
        decimals,
      },
    };
  }

  if (raw.type === "chart" && raw.highcharts) {
    const hc = raw.highcharts as Record<string, unknown>;
    // Normalize yAxis to array — API may return a single object
    const normalizedHc = {
      ...hc,
      ...(hc.yAxis && !Array.isArray(hc.yAxis) ? { yAxis: [hc.yAxis] } : {}),
    };
    return {
      id: raw.id,
      type: "chart",
      title: raw.title,
      config: {
        chartType: (((hc.chart as Record<string, unknown>)?.type as string) ??
          "bar") as ChartType,
        highchartsOptions: normalizedHc,
      } as unknown as WidgetConfig["config"],
    };
  }

  // Fallback for unknown widget types
  return {
    id: raw.id,
    type: raw.type as WidgetConfig["type"],
    title: raw.title,
    config: {},
  } as WidgetConfig;
}

function adaptApiResponse(
  raw: RawApiDashboardResponse,
): DashboardMetadataResponse {
  const widgets: Record<string, WidgetConfig> = {};
  for (const [key, apiWidget] of Object.entries(raw.widgets)) {
    widgets[key] = adaptWidget(apiWidget);
  }

  return {
    success: true,
    data: {
      dashboard: {
        id: raw.id,
        title: raw.title,
        description: raw.description,
        gridConfig: raw.gridConfig,
        layout: raw.layout,
        widgets,
        filters: raw.filters,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        createdBy: "",
        analysisId: "",
      },
      refreshInfo: {
        lastRefreshedAt: raw.refresh_info.last_refreshed_at,
        refreshStatus: "idle",
        dataSource: {
          analysisId: "",
          analysisName: "",
          dataFreshness: "fresh",
        },
      },
    },
  };
}

// ─── Query Data ─────────────────────────────────────────────────

interface DashboardQueryData {
  dashboard: Dashboard;
  refreshInfo: RefreshInfo;
  activeFilters: Record<string, unknown>;
}

/**
 * Fetch and transform a single dashboard by ID.
 * Uses `select` to apply widget theme and extract default filters.
 */
export function useDashboardQuery(dashboardId: string | undefined) {
  return useQuery<DashboardQueryData>({
    queryKey: dashboardKeys.detail(dashboardId!),
    queryFn: async () => {
      try {
        const rawResponse = await dashboardService.getDashboard(dashboardId!);

        if (
          !rawResponse ||
          typeof rawResponse !== "object" ||
          !("id" in rawResponse)
        ) {
          throw new Error("Invalid dashboard response structure");
        }

        if (
          "success" in rawResponse &&
          !(rawResponse as { success: boolean }).success
        ) {
          throw new Error(
            (rawResponse as { error?: { message?: string } }).error?.message ??
              "Failed to load dashboard",
          );
        }

        const response = adaptApiResponse(
          rawResponse as RawApiDashboardResponse,
        );

        const { dashboard, refreshInfo } = response.data;

        // Inject frontend color palette into widget configs
        dashboard.widgets = applyWidgetTheme(
          dashboard.widgets,
        ) as typeof dashboard.widgets;

        // Extract default filter values
        const activeFilters: Record<string, unknown> = {};
        dashboard.filters?.forEach((filter) => {
          if (filter.defaultValue !== undefined) {
            activeFilters[filter.id] = filter.defaultValue;
          }
        });

        return { dashboard, refreshInfo, activeFilters };
      } catch (error) {
        console.error("[useDashboardQuery] Failed to load dashboard:", error);
        throw error;
      }
    },
    enabled: !!dashboardId,
  });
}

/**
 * Trigger a dashboard refresh and invalidate the cache to refetch.
 */
export function useRefreshDashboardMutation(dashboardId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dashboardService.triggerRefresh(dashboardId!),
    onSuccess: () => {
      if (dashboardId) {
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.detail(dashboardId),
        });
      }
    },
  });
}
