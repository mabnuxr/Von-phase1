import { apiClient } from "./apiClient";
import type {
  AppCatalogEntry,
  AppTool,
  CatalogType,
  ConnectionMode,
  AvailabilityStatus,
  PublishAppPayload,
  TenantIntegrationEnriched,
  TenantIntegrationSummary,
  UpdateTenantIntegrationPayload,
} from "../types/appCatalog";

const BASE = "/api/v1/app-catalog";

export class AppCatalogService {
  async getCatalog(opts?: {
    catalogType?: "native_integration" | "mcp";
    statusFilter?: "all" | "published" | "unsubscribed";
    includeBuiltins?: boolean;
  }): Promise<AppCatalogEntry[]> {
    const p = new URLSearchParams();
    if (opts?.catalogType) p.set("catalog_type", opts.catalogType);
    if (opts?.statusFilter) p.set("status_filter", opts.statusFilter);
    if (opts?.includeBuiltins === false) p.set("include_builtins", "false");
    const qs = p.toString();
    return apiClient.get<AppCatalogEntry[]>(`${BASE}/${qs ? `?${qs}` : ""}`);
  }

  async getTenantIntegrations(opts?: {
    catalogType?: CatalogType;
    connectionMode?: ConnectionMode;
    availabilityStatus?: AvailabilityStatus;
  }): Promise<TenantIntegrationEnriched[]> {
    const p = new URLSearchParams();
    if (opts?.catalogType) p.set("catalog_type", opts.catalogType);
    if (opts?.connectionMode) p.set("connection_mode", opts.connectionMode);
    if (opts?.availabilityStatus) p.set("availability_status", opts.availabilityStatus);
    const qs = p.toString();
    return apiClient.get<TenantIntegrationEnriched[]>(
      `${BASE}/tenant-integrations${qs ? `?${qs}` : ""}`,
    );
  }

  async publish(
    catalogId: string,
    payload: PublishAppPayload,
  ): Promise<TenantIntegrationSummary> {
    return apiClient.post<TenantIntegrationSummary>(
      `${BASE}/${catalogId}/publish`,
      payload,
    );
  }

  async updateTenantIntegration(
    catalogId: string,
    payload: UpdateTenantIntegrationPayload,
  ): Promise<TenantIntegrationSummary> {
    return apiClient.patch<TenantIntegrationSummary>(
      `${BASE}/${catalogId}/tenant-integration`,
      payload,
    );
  }

  async deleteConnections(catalogId: string): Promise<void> {
    await apiClient.delete(`${BASE}/${catalogId}/connections`);
  }

  async deleteTenantIntegration(
    catalogId: string,
    catalogType: string,
    connectionMode: string,
  ): Promise<void> {
    await apiClient.delete(
      `${BASE}/${catalogId}/tenant-integration?catalog_type=${catalogType}&connection_mode=${connectionMode}`,
    );
  }

  async getTools(
    catalogId: string,
    source: "catalog" | "discovered" = "catalog",
    catalogType: "mcp" | "native_integration" = "mcp",
  ): Promise<AppTool[]> {
    const p = new URLSearchParams({ catalog_type: catalogType, source });
    return apiClient.get<AppTool[]>(`${BASE}/${catalogId}/tools?${p}`);
  }

  async discoverTools(
    tenantIntegrationId: string,
  ): Promise<{ tools: AppTool[]; manifest_refreshed_at: string }> {
    return apiClient.post(
      `/api/v1/mcp-servers/${tenantIntegrationId}/discover`,
    );
  }

  async startPersonalOAuth(
    tenantIntegrationId: string,
  ): Promise<{ authorization_url: string; integration_id: string }> {
    return apiClient.get(
      `/api/v1/mcp-servers/${tenantIntegrationId}/personal-connect`,
    );
  }

  async connectPersonalApiKey(
    tenantIntegrationId: string,
    apiKey: string,
  ): Promise<{ integration_id: string; authentication_status: string }> {
    return apiClient.post(
      `/api/v1/mcp-servers/${tenantIntegrationId}/personal-connect`,
      { api_key: apiKey },
    );
  }

  async connect(
    catalogId: string,
    payload: { catalog_type: CatalogType; connection_mode: ConnectionMode; api_key?: string },
  ): Promise<{ integration_id: string; authentication_status: string; authorization_url: string | null }> {
    return apiClient.post(`${BASE}/${catalogId}/connect`, payload);
  }

  async getConnectStatus(
    catalogId: string,
    params: { catalog_type: CatalogType; connection_mode: ConnectionMode },
  ): Promise<{ integration_id: string; authentication_status: string; authorization_url: string | null }> {
    const p = new URLSearchParams({
      catalog_type: params.catalog_type,
      connection_mode: params.connection_mode,
    });
    return apiClient.get(`${BASE}/${catalogId}/connect/status?${p}`);
  }

}

export const appCatalogService = new AppCatalogService();
