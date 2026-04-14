import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { DashboardStatus } from "../types/dashboard";
import type {
  Dashboard,
  DashboardFilters,
  DataBoundary,
  DataSourceGroup,
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
    value: number | null;
    format: string | null;
    prefix?: string | null;
    suffix?: string | null;
    comparison: {
      value: number | null;
      format: string | null;
      suffix?: string | null;
      label?: string | null;
      positive_is_good: boolean;
    };
    target: {
      value: number | null;
      format: string | null;
      label: string;
      inverted?: boolean;
    } | null;
  } | null;
  highcharts: Record<string, unknown> | null;
  gridOptions: Record<string, unknown> | null;
  query_failed?: boolean;
  drilldown?: {
    query_ref: string;
    column_map: Array<{ data_key: string; sql_expression: string }>;
  } | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    orderBy?: string;
    orderByAsc?: boolean;
  };
}

interface RawApiQuery {
  sql: string;
  description?: string;
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
  widgets: Record<string, RawApiWidget>;
  queries?: Record<string, RawApiQuery>;
  is_editable?: boolean;
  ui_config?: {
    panel_layouts?: Record<
      string,
      { x: number; y: number; w: number; h: number }
    >;
    color_palette?: string | null;
  };
  filters?: DashboardFilters;
  data_boundary?: DataBoundary;
  data_sources?: DataSourceGroup[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  created_by_name?: string;
  refresh_info: {
    last_refreshed_at: string;
  };
}

// ─── API Response Adapter ───────────────────────────────────────

function adaptWidget(
  raw: RawApiWidget,
  queries?: Record<string, RawApiQuery>,
): WidgetConfig {
  const queryInfo =
    raw.query_ref && queries?.[raw.query_ref]
      ? {
          sql: queries[raw.query_ref].sql,
          description: queries[raw.query_ref].description,
        }
      : undefined;

  if (raw.type === "kpi" && raw.kpi) {
    return {
      id: raw.id,
      type: "counter",
      title: raw.title,
      config: raw.kpi,
      query_failed: raw.query_failed,
      drilldown: raw.drilldown ?? null,
      queryInfo,
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
        queryInfo,
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
      drilldown: raw.drilldown ?? null,
      queryInfo,
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
        serverPagination: raw.pagination
          ? {
              page: raw.pagination.page,
              limit: raw.pagination.limit,
              totalRows: raw.pagination.total,
              totalPages: raw.pagination.totalPages,
              hasNextPage: raw.pagination.hasNextPage,
              hasPrevPage: raw.pagination.hasPrevPage,
            }
          : undefined,
      },
      drilldown: raw.drilldown ?? null,
      queryInfo,
    } as unknown as WidgetConfig;
  }

  // Fallback for unknown widget types
  return {
    id: raw.id,
    type: raw.type as WidgetConfig["type"],
    title: raw.title,
    config: {},
    drilldown: raw.drilldown ?? null,
    queryInfo,
  } as WidgetConfig;
}

function adaptApiResponse(
  raw: RawApiDashboardResponse,
): DashboardMetadataResponse {
  const widgets: Record<string, WidgetConfig> = {};
  for (const [key, apiWidget] of Object.entries(raw.widgets)) {
    widgets[key] = adaptWidget(apiWidget, raw.queries);
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
        sharedDataScope: raw.shared_data_scope ?? null,
        gridConfig: raw.gridConfig,
        // Prefer panel_layouts when it has entries; fall back to each widget's
        // own layout field when panel_layouts is absent or an empty object (the
        // backend may return {} for dashboards with no customised layouts).
        layout: (() => {
          const pl = raw.ui_config?.panel_layouts;
          if (pl && Object.keys(pl).length > 0) {
            return Object.entries(pl).map(([id, pos]) => ({
              i: id,
              x: pos.x,
              y: pos.y,
              w: pos.w,
              h: pos.h,
            }));
          }
          return Object.entries(raw.widgets).map(([id, w]) => ({
            i: id,
            x: w.layout.x,
            y: w.layout.y,
            w: w.layout.w,
            h: w.layout.h,
          }));
        })(),
        widgets,
        filters: raw.filters
          ? {
              definitions: Array.isArray(raw.filters.definitions)
                ? raw.filters.definitions
                : [],
              state: raw.filters.state ?? {},
              defaults: raw.filters.defaults ?? {},
              // v2 additions — pass through as-is (already snake_case on response)
              panel_state: raw.filters.panel_state ?? {},
              locked_filter_state: raw.filters.locked_filter_state ?? {},
              locked_panel_filter_state:
                raw.filters.locked_panel_filter_state ?? {},
              source_applicability: raw.filters.source_applicability ?? {},
              query_sources: raw.filters.query_sources ?? {},
            }
          : undefined,
        data_boundary: raw.data_boundary,
        data_sources: raw.data_sources,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        createdBy: raw.created_by ?? "",
        createdByName: raw.created_by_name ?? undefined,
        analysisId: "",
        isEditable: raw.is_editable ?? false,
        uiConfig: raw.ui_config
          ? {
              panelLayouts: raw.ui_config.panel_layouts,
            }
          : undefined,
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

        // Extract active filter values from the filter state
        const activeFilters: Record<string, unknown> =
          dashboard.filters?.state ?? {};

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
