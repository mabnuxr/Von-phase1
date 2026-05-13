import { apiClient } from "./apiClient";
import type {
  CatalogEntry,
  PublishIntegrationPayload,
  TenantIntegrationPolicy,
  UpdatePolicyPayload,
} from "../types/integrationCatalog";

class IntegrationCatalogService {
  async getCatalog(opts?: {
    statusFilter?: "all" | "published" | "unsubscribed";
    includeBuiltins?: boolean;
  }): Promise<CatalogEntry[]> {
    const params = new URLSearchParams();
    if (opts?.statusFilter) params.set("status_filter", opts.statusFilter);
    if (opts?.includeBuiltins) params.set("include_builtins", "true");
    const query = params.toString();
    return apiClient.get<CatalogEntry[]>(
      `/api/v1/integrations/catalog${query ? `?${query}` : ""}`,
    );
  }

  async publishIntegration(
    catalogId: string,
    payload: PublishIntegrationPayload,
  ): Promise<TenantIntegrationPolicy> {
    return apiClient.post<TenantIntegrationPolicy>(
      `/api/v1/integrations/catalog/${catalogId}/publish`,
      payload,
    );
  }

  async updatePolicy(
    catalogId: string,
    payload: UpdatePolicyPayload,
  ): Promise<TenantIntegrationPolicy> {
    return apiClient.patch<TenantIntegrationPolicy>(
      `/api/v1/integrations/catalog/${catalogId}/policy`,
      payload,
    );
  }

  async deletePolicy(catalogId: string): Promise<void> {
    await apiClient.delete(`/api/v1/integrations/catalog/${catalogId}/policy`);
  }
}

export const integrationCatalogService = new IntegrationCatalogService();
