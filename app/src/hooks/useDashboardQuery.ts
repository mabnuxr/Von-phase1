import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { applyWidgetTheme } from "../utils/applyWidgetTheme";
import { DashboardStatus } from "../types/dashboard";
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
  kpi: {
    value: string | number | number[];
    format?: string;
    suffix?: string;
  } | null;
  highcharts: Record<string, unknown> | null;
  gridOptions: Record<string, unknown> | null;
}

interface RawApiDashboardResponse {
  id: string;
  title: string;
  description?: string;
  status: string;
  dashboard_version: number;
  is_owner: boolean;
  is_shared_with_tenant: boolean;
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
    const { format, prefix, suffix, decimals } = raw.kpi.format
      ? parseKpiFormat(raw.kpi.format)
      : {
          format: "number" as const,
          prefix: undefined,
          suffix: undefined,
          decimals: 0,
        };
    // Handle string, number, and array formats for KPI value
    const value = Array.isArray(raw.kpi.value)
      ? (raw.kpi.value[0] ?? 0)
      : raw.kpi.value;
    // Use API suffix if provided, otherwise use parsed suffix
    const finalSuffix = raw.kpi.suffix ?? suffix;

    return {
      id: raw.id,
      type: "counter",
      title: raw.title,
      config: {
        value,
        format,
        ...(prefix && { prefix }),
        ...(finalSuffix && { suffix: finalSuffix }),
        decimals,
      },
    };
  }

  if (raw.type === "chart" && raw.highcharts) {
    const hc = raw.highcharts as Record<string, unknown>;
    if (typeof hc !== "object" || hc === null) {
      console.error("[adaptWidget] Invalid highcharts config:", raw);
      return {
        id: raw.id,
        type: raw.type as WidgetConfig["type"],
        title: raw.title,
        config: {},
      } as WidgetConfig;
    }
    // Normalize yAxis to array — API may return a single object
    const normalizedHc = {
      ...hc,
      ...(hc.yAxis && !Array.isArray(hc.yAxis) ? { yAxis: [hc.yAxis] } : {}),
    };
    const chartObj =
      typeof hc.chart === "object" && hc.chart !== null
        ? (hc.chart as Record<string, unknown>)
        : {};
    return {
      id: raw.id,
      type: "chart",
      title: raw.title,
      config: {
        chartType: ((chartObj.type as string) ?? "bar") as ChartType,
        highchartsOptions: normalizedHc,
      } as unknown as WidgetConfig["config"],
    };
  }

  // Table widget - pass through gridOptions for ReportTable
  if (raw.type === "table") {
    return {
      id: raw.id,
      type: "table",
      title: raw.title,
      config: {
        gridOptions: raw.gridOptions ?? {},
      },
    } as unknown as WidgetConfig;
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
        status: (raw.status as DashboardStatus) ?? DashboardStatus.Draft,
        dashboardVersion: raw.dashboard_version ?? 1,
        isOwner: raw.is_owner ?? false,
        isSharedWithTenant: raw.is_shared_with_tenant ?? false,
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
        const rawResponse = await dashboardService.getDashboardWithRenderData(
          dashboardId!,
        );

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
        // dashboard.filters?.forEach((filter) => {
        //   if (filter.defaultValue !== undefined) {
        //     activeFilters[filter.id] = filter.defaultValue;
        //   }
        // });

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
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: dashboardKeys.detail(dashboardId!),
      });
    },
    gcTime: 0,
  });
}
