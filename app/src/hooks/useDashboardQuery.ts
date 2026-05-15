import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboardService";
import { useDashboardMetadata } from "./useDashboardMetadata";
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
  PanelDrilldownV2Config,
} from "../types/dashboard";

/**
 * Query keys for dashboard data.
 *
 * `detail(id)` is the **parent** key shared by every per-dashboard
 * query (render, metadata, versions, etc.). Invalidating it cascades
 * through all of them. Writes target the leaf keys directly.
 *
 * `render(id, version)` is keyed by version so `is_editable` flips and
 * `acquireLock` responses (which carry a new `editable_version`)
 * naturally bust the cache and trigger a refetch with the new param.
 */
export const dashboardKeys = {
  all: ["dashboards"] as const,
  detail: (id: string) => [...dashboardKeys.all, id] as const,
  render: (id: string, version: number | null) =>
    [...dashboardKeys.all, id, "render", version] as const,
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
  text_content?: string | null;
  query_failed?: boolean;
  drilldown_v2?: PanelDrilldownV2Config | null;
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
  /** M2 (VON-1283): canonical caller access level. Replaces `is_owner`. */
  access_level?: "viewer" | "editor" | "owner";
  is_shared_with_tenant: boolean;
  /** M2: canonical sharing scope. Replaces `is_shared_with_tenant`. */
  scope?: "restricted" | "tenant";
  /** M2: explicit per-user grants (excludes the owner). */
  user_grants?: Array<{
    user_id: string;
    role: "viewer" | "editor";
    granted_by: string;
    granted_at: string;
  }>;
  /** M1: embedded edit-lock — drives the "currently edited" badge. */
  edit_lock?: { user_id: string; acquired_at: string } | null;
  shared_data_scope?: string | null;
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
  /** BE PR #1109 — last meaningful editor of the dashboard's content. */
  last_edited_by?: string | null;
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
      queryRef: raw.query_ref,
      drilldown_v2: raw.drilldown_v2 ?? null,
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
        queryRef: raw.query_ref,
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
      queryRef: raw.query_ref,
      drilldown_v2: raw.drilldown_v2 ?? null,
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
      queryRef: raw.query_ref,
      drilldown_v2: raw.drilldown_v2 ?? null,
      queryInfo,
    } as unknown as WidgetConfig;
  }

  if (raw.type === "text") {
    // Backend sends markdown with JSON-escape sequences (\n, \t, \") that
    // survive JSON.parse as literal backslash-n pairs. Convert to real
    // newlines so marked can parse paragraphs, tables, and blockquotes.
    const rawContent = raw.text_content ?? "";
    const content = rawContent
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"');
    return {
      id: raw.id,
      type: "text",
      title: raw.title,
      config: { content },
      queryRef: raw.query_ref,
      queryInfo,
    } as WidgetConfig;
  }

  // Fallback for unknown widget types
  return {
    id: raw.id,
    type: raw.type as WidgetConfig["type"],
    title: raw.title,
    config: {},
    queryRef: raw.query_ref,
    drilldown_v2: raw.drilldown_v2 ?? null,
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
        // M2 — `access_level` is canonical; fall back from `is_owner` when
        // BE is on an older deploy. Equivalent to the legacy boolean once
        // BE serves the new field (owner→"owner", everyone else→"viewer").
        accessLevel: raw.access_level ?? (raw.is_owner ? "owner" : "viewer"),
        // M2 — `scope` is canonical; fall back from `is_shared_with_tenant`.
        scope:
          raw.scope ?? (raw.is_shared_with_tenant ? "tenant" : "restricted"),
        userGrants: raw.user_grants ?? [],
        editLock: raw.edit_lock
          ? {
              userId: raw.edit_lock.user_id,
              acquiredAt: raw.edit_lock.acquired_at,
            }
          : null,
        isSharedWithTenant: raw.is_shared_with_tenant ?? false,
        sharedDataScope: (raw.shared_data_scope ??
          null) as Dashboard["sharedDataScope"],
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
        lastEditedBy: raw.last_edited_by ?? null,
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
 *
 * Two-step flow (BE M1+M2):
 *
 *   1. Fetch metadata via `useDashboardMetadata`. It carries
 *      `is_editable` plus the version pair (`editable_version` /
 *      `latest_published_version`).
 *   2. Pick the version: editable when the caller holds the lock,
 *      latest published otherwise. That version is in the render
 *      query key, so any flip — entering edit mode, discarding,
 *      publishing — naturally busts the render cache and refetches
 *      the right snapshot.
 *
 * `previewVersion` (when provided) bypasses step 2 and pins render to
 * a specific historical `dashboard_version`. Used by the
 * version-history panel: clicking a row swaps the canvas to that
 * version without touching metadata. Passing `null` (the default)
 * keeps the metadata-driven version.
 *
 * Consumers see the same `{ dashboard, refreshInfo, activeFilters }`
 * shape and `isLoading` semantics (true while either step is in
 * flight) so no caller code changes shape.
 */
export function useDashboardQuery(
  dashboardId: string | undefined,
  previewVersion?: number | null,
) {
  const metadataQuery = useDashboardMetadata(dashboardId, {
    enabled: !!dashboardId,
  });

  const metadataVersion = metadataQuery.data
    ? metadataQuery.data.is_editable
      ? metadataQuery.data.editable_version
      : metadataQuery.data.latest_published_version
    : null;
  // Preview wins — the version-history panel's selection takes
  // precedence over the metadata-derived default while open.
  const version =
    previewVersion !== undefined && previewVersion !== null
      ? previewVersion
      : metadataVersion;

  const renderQuery = useQuery<DashboardQueryData>({
    queryKey: dashboardKeys.render(dashboardId ?? "", version),
    queryFn: async () => {
      try {
        const rawResponse = await dashboardService.getDashboardWithRenderData(
          dashboardId!,
          version,
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

        const activeFilters: Record<string, unknown> =
          dashboard.filters?.state ?? {};

        return { dashboard, refreshInfo, activeFilters };
      } catch (error) {
        console.error("[useDashboardQuery] Failed to load dashboard:", error);
        throw error;
      }
    },
    // Render waits for metadata. Metadata may legitimately return
    // `null` for both versions on a brand-new draft that hasn't been
    // published yet — we still call render in that case (omitting the
    // version param) so the BE returns its default "latest".
    enabled: !!dashboardId && metadataQuery.isSuccess,
  });

  return {
    data: renderQuery.data,
    error: metadataQuery.error ?? renderQuery.error,
    isLoading: metadataQuery.isLoading || renderQuery.isLoading,
    isFetching: metadataQuery.isFetching || renderQuery.isFetching,
    isError: metadataQuery.isError || renderQuery.isError,
    isSuccess: metadataQuery.isSuccess && renderQuery.isSuccess,
    refetch: renderQuery.refetch,
    // Surfaced separately because consumers (e.g. the version-history
    // preview chip) need to compare the currently-rendered version
    // against the live published pointer — and that pointer lives only
    // on the metadata payload, not on the render response itself.
    latestPublishedVersion:
      metadataQuery.data?.latest_published_version ?? null,
  };
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
