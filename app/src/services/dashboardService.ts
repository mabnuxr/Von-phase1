import { apiClient } from "./apiClient";
import { getDashboardFixture } from "../fixtures/dashboards";
import type {
  DashboardMetadataResponse,
  WidgetDataRequest,
  WidgetDataResponse,
} from "../types/dashboard";

/**
 * Service for dashboard API endpoints.
 * Falls back to fixture data when the API is unavailable.
 */
class DashboardService {
  async getDashboard(dashboardId: string): Promise<DashboardMetadataResponse> {
    try {
      return await apiClient.get<DashboardMetadataResponse>(
        `/api/v1/dashboards/${dashboardId}`,
      );
    } catch {
      // Fall back to fixtures during development
      const fixture = getDashboardFixture(dashboardId);
      if (fixture) return fixture;
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }
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
