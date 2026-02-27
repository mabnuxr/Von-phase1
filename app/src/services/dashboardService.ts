import { apiClient } from "./apiClient";
import type { WidgetDataRequest, WidgetDataResponse } from "../types/dashboard";

/**
 * Service for dashboard API endpoints.
 */
class DashboardService {
  async getDashboard(dashboardId: string) {
    return apiClient.get(`/api/v1/dashboards/${dashboardId}`);
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
}

export const dashboardService = new DashboardService();
