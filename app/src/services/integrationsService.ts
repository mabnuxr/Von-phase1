import { apiClient } from "./apiClient";

/**
 * Integration type constants matching backend
 */
export const IntegrationType = {
  SALESFORCE: "SALESFORCE",
  GONG: "GONG",
  HUBSPOT: "HUBSPOT",
} as const;

export type IntegrationType =
  (typeof IntegrationType)[keyof typeof IntegrationType];

/**
 * Integration status constants matching backend
 */
export const IntegrationStatus = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  ERROR: "ERROR",
} as const;

export type IntegrationStatus =
  (typeof IntegrationStatus)[keyof typeof IntegrationStatus];

/**
 * Backend integration response (snake_case)
 */
export interface IntegrationBackendResponse {
  id: string;
  tenant_id: string;
  tenant_name: string;
  type: IntegrationType;
  name: string;
  description: string | null;
  provider: string;
  status: IntegrationStatus;
  is_active: boolean;
  is_configured: boolean;
  features_enabled: string[];
  last_sync: string | null;
  sync_success_rate: number;
}

/**
 * Integration list response from backend
 */
export interface IntegrationListResponse {
  integrations: IntegrationBackendResponse[];
  total: number;
  tenant_id: string;
  tenant_name: string;
  user_email: string;
}

/**
 * Frontend integration object (camelCase)
 */
export interface Integration {
  id: string;
  tenantId: string;
  tenantName: string;
  type: IntegrationType;
  name: string;
  description: string | null;
  provider: string;
  status: IntegrationStatus;
  isActive: boolean;
  isConfigured: boolean;
  featuresEnabled: string[];
  lastSync: string | null;
  syncSuccessRate: number;
}

/**
 * Transform backend integration to frontend format
 */
function transformIntegration(
  backendIntegration: IntegrationBackendResponse,
): Integration {
  return {
    id: backendIntegration.id,
    tenantId: backendIntegration.tenant_id,
    tenantName: backendIntegration.tenant_name,
    type: backendIntegration.type,
    name: backendIntegration.name,
    description: backendIntegration.description,
    provider: backendIntegration.provider,
    status: backendIntegration.status,
    isActive: backendIntegration.is_active,
    isConfigured: backendIntegration.is_configured,
    featuresEnabled: backendIntegration.features_enabled,
    lastSync: backendIntegration.last_sync,
    syncSuccessRate: backendIntegration.sync_success_rate,
  };
}

/**
 * Integrations Service - Handles integration-related API calls
 */
export class IntegrationsService {
  /**
   * Get integrations for a specific tenant and user
   *
   * @param tenantId - MongoDB tenant ID
   * @param userId - MongoDB user ID
   * @param activeOnly - Optional flag to return only active integrations
   * @param configuredOnly - Optional flag to return only configured integrations
   * @returns Integration list with metadata
   *
   * @example
   * ```ts
   * const result = await integrationsService.getIntegrationsByTenantAndUser(
   *   "68e6f5d9473f2e641e306209",
   *   "68e6f5da473f2e641e306221"
   * );
   * console.log(`Found ${result.total} integrations for ${result.tenantName}`);
   * ```
   */
  async getIntegrationsByTenantAndUser(
    tenantId: string,
    userId: string,
    activeOnly = false,
    configuredOnly = false,
  ): Promise<{
    integrations: Integration[];
    total: number;
    tenantId: string;
    tenantName: string;
    userEmail: string;
  }> {
    const params = new URLSearchParams();
    if (activeOnly) params.set("active_only", "true");
    if (configuredOnly) params.set("configured_only", "true");

    const queryString = params.toString();
    const endpoint = `/api/v1/integrations/tenant/${tenantId}/user/${userId}${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await apiClient.get<IntegrationListResponse>(endpoint);

    return {
      integrations: response.integrations.map(transformIntegration),
      total: response.total,
      tenantId: response.tenant_id,
      tenantName: response.tenant_name,
      userEmail: response.user_email,
    };
  }

  /**
   * Get a single integration by ID
   *
   * @param integrationId - MongoDB integration ID
   * @returns Integration details
   *
   * @example
   * ```ts
   * const integration = await integrationsService.getIntegrationById(
   *   "68e6f5da473f2e641e30622d"
   * );
   * console.log(`Integration: ${integration.name} (${integration.status})`);
   * ```
   */
  async getIntegrationById(integrationId: string): Promise<Integration> {
    const response = await apiClient.get<IntegrationBackendResponse>(
      `/api/v1/integrations/${integrationId}`,
    );
    return transformIntegration(response);
  }
}

// Export a default instance
export const integrationsService = new IntegrationsService();
