import { apiClient } from "./apiClient";
import type {
  DashboardMetadataResponse,
  WidgetDataRequest,
  WidgetDataResponse,
  PanelRenderRequest,
  PanelRenderResponse,
  PanelDrilldownRequest,
  PanelDrilldownResponse,
  ScheduleConfigRequest,
  DashboardScheduleResponse,
  FilterPatchPayload,
  FilterPatchResponse,
} from "../types/dashboard";

/**
 * Summary item returned by the dashboard list endpoint.
 */
export interface DashboardListItem {
  dashboard_id: string;
  dashboard_name: string;
  status: "draft" | "published" | "archived";
  dashboard_version: number;
  is_owner: boolean;
  is_shared_with_tenant: boolean;
  updated_at: string;
}

export interface DashboardListResponse {
  data: DashboardListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface DashboardUpdateRequest {
  dashboard_name?: string;
  description?: string;
  is_editable?: boolean;
  ui_config?: {
    [key: string]: unknown;
  };
}

/**
 * Service for dashboard API endpoints.
 */
class DashboardService {
  /**
   * List dashboards with optional status filter.
   * Scoped by backend access rules (owner, shared_with_tenant, shared_with_users).
   */
  async getDashboards(
    status?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<DashboardListResponse> {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return apiClient.get<DashboardListResponse>(
      `/api/v1/dashboards?${params.toString()}`,
    );
  }

  async getDashboardWithRenderData(dashboardId: string) {
    return apiClient.get(`/api/v1/dashboards/${dashboardId}/render`);
  }

  async getWidgetData(
    dashboardId: string,
    request: WidgetDataRequest,
  ): Promise<WidgetDataResponse> {
    return apiClient.post<WidgetDataResponse>(
      `/api/v1/dashboards/${dashboardId}/widgets/data`,
      request,
    );
  }

  async triggerRefresh(dashboardId: string): Promise<{ jobId: string }> {
    return apiClient.post<{ jobId: string }>(
      `/api/v1/dashboards/${dashboardId}/refresh`,
    );
  }

  async getRefreshStatus(
    dashboardId: string,
  ): Promise<{ refreshStatus: string; lastRefreshedAt: string }> {
    return apiClient.get(`/api/v1/dashboards/${dashboardId}/refresh-status`);
  }

  async shareDashboard(
    dashboardId: string,
    isSharedWithTenant: boolean,
  ): Promise<DashboardMetadataResponse> {
    return apiClient.post<DashboardMetadataResponse>(
      `/api/v1/dashboards/${dashboardId}/share`,
      { is_shared_with_tenant: isSharedWithTenant },
    );
  }

  async revertToPublished(
    dashboardId: string,
  ): Promise<DashboardMetadataResponse> {
    return apiClient.post<DashboardMetadataResponse>(
      `/api/v1/dashboards/${dashboardId}/revert-to-published`,
    );
  }

  async publishDashboard(
    dashboardId: string,
    version?: number,
  ): Promise<DashboardMetadataResponse> {
    const params = version != null ? `?version=${version}` : "";
    return apiClient.post<DashboardMetadataResponse>(
      `/api/v1/dashboards/${dashboardId}/publish${params}`,
    );
  }

  async renderPanels(
    dashboardId: string,
    request: PanelRenderRequest,
  ): Promise<PanelRenderResponse> {
    return apiClient.post<PanelRenderResponse>(
      `/api/v1/dashboards/${dashboardId}/panels/render`,
      request,
    );
  }

  async updateDashboard(
    dashboardId: string,
    data: DashboardUpdateRequest,
  ): Promise<DashboardMetadataResponse> {
    return apiClient.patch<DashboardMetadataResponse>(
      `/api/v1/dashboards/${dashboardId}`,
      data,
    );
  }

  async drilldownPanel(
    dashboardId: string,
    request: PanelDrilldownRequest,
  ): Promise<PanelDrilldownResponse> {
    return apiClient.post<PanelDrilldownResponse>(
      `/api/v1/dashboards/${dashboardId}/panels/drilldown`,
      request,
    );
  }

  // ─── Schedule ───────────────────────────────────────────────────

  async getSchedule(dashboardId: string): Promise<DashboardScheduleResponse> {
    return apiClient.get<DashboardScheduleResponse>(
      `/api/v1/dashboards/${dashboardId}/schedule`,
    );
  }

  async createSchedule(
    dashboardId: string,
    config: ScheduleConfigRequest,
  ): Promise<DashboardScheduleResponse> {
    return apiClient.post<DashboardScheduleResponse>(
      `/api/v1/dashboards/${dashboardId}/schedule`,
      config,
    );
  }

  async updateSchedule(
    dashboardId: string,
    config: Partial<ScheduleConfigRequest>,
  ): Promise<DashboardScheduleResponse> {
    return apiClient.patch<DashboardScheduleResponse>(
      `/api/v1/dashboards/${dashboardId}/schedule`,
      config,
    );
  }

  async pauseSchedule(dashboardId: string): Promise<DashboardScheduleResponse> {
    return apiClient.post<DashboardScheduleResponse>(
      `/api/v1/dashboards/${dashboardId}/schedule/pause`,
    );
  }

  async resumeSchedule(
    dashboardId: string,
  ): Promise<DashboardScheduleResponse> {
    return apiClient.post<DashboardScheduleResponse>(
      `/api/v1/dashboards/${dashboardId}/schedule/resume`,
    );
  }

  async deleteSchedule(dashboardId: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/dashboards/${dashboardId}/schedule`);
  }

  // ─── Filters ────────────────────────────────────────────────────

  /**
   * PATCH /api/v1/dashboards/{id}/filters
   *
   * v2 additions:
   * - `panelId`: when present, the update is scoped to that panel's `panel_state`.
   * - `isLocked`: owner-only default for all filters in the payload. Individual
   *   `FilterValue.is_locked` in the payload overrides this default.
   */
  async updateFilters(
    dashboardId: string,
    filters?: FilterPatchPayload | null,
    resetFields?: string[],
    opts?: { panelId?: string; isLocked?: boolean },
  ): Promise<FilterPatchResponse> {
    const body: Record<string, unknown> = {};
    if (filters) body.filters = filters;
    if (resetFields?.length) body.reset_fields = resetFields;
    if (opts?.panelId) body.panel_id = opts.panelId;
    if (opts?.isLocked !== undefined) body.is_locked = opts.isLocked;
    return apiClient.patch<FilterPatchResponse>(
      `/api/v1/dashboards/${dashboardId}/filters`,
      body,
    );
  }

  async resetFilters(dashboardId: string): Promise<FilterPatchResponse> {
    return apiClient.post<FilterPatchResponse>(
      `/api/v1/dashboards/${dashboardId}/filters/reset`,
    );
  }
}

export const dashboardService = new DashboardService();
