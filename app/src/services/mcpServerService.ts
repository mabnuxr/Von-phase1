import { apiClient } from "./apiClient";
import type {
  MCPServer,
  CatalogEntry,
  MCPSettings,
  MCPToolInfo,
  ServerGrant,
  RegistrationGrant,
} from "../types/mcp";

const BASE = "/api/v1/mcp-servers";

class MCPServerService {
  /* ── List & detail ── */

  async listServers(): Promise<MCPServer[]> {
    return apiClient.get<MCPServer[]>(BASE);
  }

  async getServer(id: string): Promise<MCPServer> {
    return apiClient.get<MCPServer>(`${BASE}/${id}`);
  }

  /* ── Catalog ── */

  async getCatalog(): Promise<CatalogEntry[]> {
    return apiClient.get<CatalogEntry[]>(`${BASE}/catalog`);
  }

  /* ── Create / Update / Delete ── */

  async createServer(data: {
    name: string;
    server_url: string;
    auth_type: string;
    api_key?: string;
    source: "catalog" | "custom";
    catalog_id?: string;
    description?: string;
  }): Promise<MCPServer> {
    return apiClient.post<MCPServer>(BASE, data);
  }

  async updateServer(
    id: string,
    data: Partial<
      Pick<
        MCPServer,
        "name" | "description" | "server_url" | "availability_status"
      >
    >,
  ): Promise<MCPServer> {
    return apiClient.patch<MCPServer>(`${BASE}/${id}`, data);
  }

  async deleteServer(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  }

  /* ── OAuth authorize ── */

  async authorize(id: string): Promise<{
    authorization_url: string;
    status: string;
    mcp_server_id: string;
    message: string;
  }> {
    return apiClient.post<{
      authorization_url: string;
      status: string;
      mcp_server_id: string;
      message: string;
    }>(`${BASE}/${id}/authorize`);
  }

  async checkAuthStatus(id: string): Promise<{
    authentication_status: string;
    last_authenticated_at: string | null;
    is_active: boolean;
  }> {
    const raw = await apiClient.get<{
      status?: string;
      authentication_status?: string;
      last_authenticated_at: string | null;
      is_active: boolean;
    }>(`${BASE}/${id}/check-auth-status`);
    return {
      authentication_status: raw.authentication_status ?? raw.status ?? "",
      last_authenticated_at: raw.last_authenticated_at,
      is_active: raw.is_active,
    };
  }

  /* ── Discover / Refresh tools ── */

  async discoverTools(id: string): Promise<{
    tools: MCPToolInfo[];
    manifest_refreshed_at: string;
  }> {
    return apiClient.post<{
      tools: MCPToolInfo[];
      manifest_refreshed_at: string;
    }>(`${BASE}/${id}/discover`);
  }

  async refreshTools(id: string): Promise<{
    tools: MCPToolInfo[];
    manifest_refreshed_at: string;
  }> {
    return apiClient.post<{
      tools: MCPToolInfo[];
      manifest_refreshed_at: string;
    }>(`${BASE}/${id}/refresh-tools`);
  }

  /* ── Availability (publish / unpublish / archive) ── */

  async setAvailability(
    id: string,
    data: {
      status: "published" | "draft" | "archived";
      type?: string;
      roles?: string[];
    },
  ): Promise<MCPServer> {
    return apiClient.patch<MCPServer>(`${BASE}/${id}/availability`, data);
  }

  /* ── Promotion ── */

  async requestPromotion(id: string): Promise<void> {
    await apiClient.post(`${BASE}/${id}/request-promotion`);
  }

  async promote(id: string): Promise<MCPServer> {
    return apiClient.post<MCPServer>(`${BASE}/${id}/promote`);
  }

  async declinePromotion(id: string): Promise<void> {
    await apiClient.post(`${BASE}/${id}/decline-promotion`);
  }

  /* ── Server grants (user allowlist) ── */

  async listServerGrants(id: string): Promise<ServerGrant[]> {
    return apiClient.get<ServerGrant[]>(`${BASE}/${id}/grants`);
  }

  async addServerGrant(serverId: string, userId: string): Promise<void> {
    await apiClient.post(`${BASE}/${serverId}/grants/${userId}`);
  }

  async removeServerGrant(serverId: string, userId: string): Promise<void> {
    await apiClient.delete(`${BASE}/${serverId}/grants/${userId}`);
  }

  /* ── Settings (admin) ── */

  async getSettings(): Promise<MCPSettings> {
    return apiClient.get<MCPSettings>(`${BASE}/settings`);
  }

  async updateSettings(data: Partial<MCPSettings>): Promise<MCPSettings> {
    return apiClient.patch<MCPSettings>(`${BASE}/settings`, data);
  }

  async listRegistrationGrants(): Promise<RegistrationGrant[]> {
    return apiClient.get<RegistrationGrant[]>(
      `${BASE}/settings/registration-grants`,
    );
  }

  async addRegistrationGrant(userId: string): Promise<void> {
    await apiClient.post(`${BASE}/settings/registration-grants/${userId}`);
  }

  async removeRegistrationGrant(userId: string): Promise<void> {
    await apiClient.delete(`${BASE}/settings/registration-grants/${userId}`);
  }
}

export const mcpServerService = new MCPServerService();
