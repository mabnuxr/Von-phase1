import { apiClient } from "./apiClient";
import type {
  DashboardMetadataResponse,
  WidgetDataRequest,
  WidgetDataResponse,
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
  updated_at: string;
}

export interface DashboardListResponse {
  data: DashboardListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
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
}

export const dashboardService = new DashboardService();
