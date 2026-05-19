import { apiClient } from "./apiClient";

/**
 * Integration type constants matching backend
 */
export const IntegrationType = {
  SALESFORCE: "SALESFORCE",
  GONG: "GONG",
  HUBSPOT: "HUBSPOT",
  FATHOM: "FATHOM",
  GOOGLE_CALENDAR: "GOOGLE_CALENDAR",
  GOOGLE_DRIVE: "GOOGLE_DRIVE",
  BOX: "BOX",
  GMAIL: "GMAIL",
  ZOOM: "ZOOM",
  SNOWFLAKE: "SNOWFLAKE",
  DATABRICKS: "DATABRICKS",
  BIGQUERY: "BIGQUERY",
  NOTION: "NOTION",
  JIMINNY: "JIMINNY",
  SLACK_WORKSPACE: "SLACK_WORKSPACE",
  MCP_SERVER: "MCP_SERVER",
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
 * Authentication status constants matching backend
 */
export const AuthenticationStatus = {
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  AUTHENTICATING: "AUTHENTICATING",
  AUTHENTICATED: "AUTHENTICATED",
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",
} as const;

export type AuthenticationStatus =
  (typeof AuthenticationStatus)[keyof typeof AuthenticationStatus];

/**
 * Backend integration response (snake_case)
 */
export interface IntegrationBackendResponse {
  id: string;
  tenant_id: string;
  tenant_name: string;
  user_id?: string;
  type: IntegrationType;
  name: string;
  description: string | null;
  provider: string;
  status: IntegrationStatus;
  is_active: boolean;
  is_configured: boolean;
  access_level: string;
  config: Record<string, unknown>;
  features_enabled: string[];
  last_sync: string | null;
  sync_success_rate: number;
  authentication_status: AuthenticationStatus;
  last_authenticated_at: string | null;
  is_owner: boolean;
  readonly: boolean;
  // Credential metadata (NO actual credentials)
  has_credentials?: boolean;
  credentials_last_updated?: string | null;
  requires_oauth?: boolean;
  scope?: SalesforceWriteScope;
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
  userId?: string;
  type: IntegrationType;
  name: string;
  description: string | null;
  provider: string;
  status: IntegrationStatus;
  isActive: boolean;
  isConfigured: boolean;
  accessLevel: string;
  config: Record<string, unknown>;
  featuresEnabled: string[];
  lastSync: string | null;
  syncSuccessRate: number;
  authenticationStatus: AuthenticationStatus;
  lastAuthenticatedAt: string | null;
  isOwner: boolean;
  readonly: boolean;
  hasCredentials?: boolean;
  credentialsLastUpdated?: string | null;
  requiresOauth?: boolean;
  scope?: SalesforceWriteScope;
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
    userId: backendIntegration.user_id,
    type: backendIntegration.type,
    name: backendIntegration.name,
    description: backendIntegration.description,
    provider: backendIntegration.provider,
    status: backendIntegration.status,
    isActive: backendIntegration.is_active,
    isConfigured: backendIntegration.is_configured,
    accessLevel: backendIntegration.access_level,
    config: backendIntegration.config,
    featuresEnabled: backendIntegration.features_enabled,
    lastSync: backendIntegration.last_sync,
    syncSuccessRate: backendIntegration.sync_success_rate,
    authenticationStatus: backendIntegration.authentication_status,
    lastAuthenticatedAt: backendIntegration.last_authenticated_at,
    isOwner: backendIntegration.is_owner,
    readonly: backendIntegration.readonly,
    hasCredentials: backendIntegration.has_credentials,
    credentialsLastUpdated: backendIntegration.credentials_last_updated,
    requiresOauth: backendIntegration.requires_oauth,
    scope: backendIntegration.scope,
  };
}

/**
 * Integrations Service - Handles integration-related API calls
 *
 * Uses JWT-based authentication - tenant and user are automatically extracted from token
 */
export class IntegrationsService {
  /**
   * Get integrations for the authenticated user's organization
   *
   *
   * @param activeOnly - Optional flag to return only active integrations
   * @param configuredOnly - Optional flag to return only configured integrations
   * @returns Integration list with metadata
   *
   * @example
   * ```ts
   * const result = await integrationsService.getIntegrations();
   * console.log(`Found ${result.total} integrations for ${result.tenantName}`);
   * ```
   */
  async getIntegrations(
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
    const endpoint = `/api/v1/integrations${queryString ? `?${queryString}` : ""}`;

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

  /**
   * Initiate OAuth authorization for an integration
   *
   * @param integrationId - MongoDB integration ID
   * @returns Authorization URL and status
   *
   * @example
   * ```ts
   * const result = await integrationsService.authorizeIntegration(
   *   "68e6f5da473f2e641e30622d"
   * );
   * window.open(result.authorizationUrl, '_blank');
   * ```
   */
  async authorizeIntegration(integrationId: string): Promise<{
    authorizationUrl: string;
    status: AuthenticationStatus;
    integrationId: string;
    message: string;
  }> {
    const response = await apiClient.post<{
      authorization_url: string;
      status: AuthenticationStatus;
      integration_id: string;
      message: string;
    }>("/api/v1/integrations/authorize", {
      integration_id: integrationId,
    });

    return {
      authorizationUrl: response.authorization_url,
      status: response.status,
      integrationId: response.integration_id,
      message: response.message,
    };
  }

  /**
   * Check OAuth authorization status
   *
   * Poll this endpoint to check if OAuth authorization has completed.
   * Use this in a polling loop after opening the OAuth authorization URL.
   *
   * @param integrationId - MongoDB integration ID
   * @returns Current authorization status
   *
   * @example
   * ```ts
   * const status = await integrationsService.checkAuthStatus(
   *   "68e6f5da473f2e641e30622d"
   * );
   * if (status.status === 'AUTHENTICATED') {
   *   console.log('Authorization complete!');
   * }
   * ```
   */
  async checkAuthStatus(integrationId: string): Promise<{
    status: string;
    integrationId: string;
    message: string;
  }> {
    const response = await apiClient.post<{
      status: string;
      integration_id: string;
      message: string;
    }>(`/api/v1/integrations/${integrationId}/check-auth-status`);

    return {
      status: response.status,
      integrationId: response.integration_id,
      message: response.message,
    };
  }

  /**
   * Revoke OAuth authorization for an integration
   *
   * Clears OAuth credentials and resets the integration to NOT_AUTHENTICATED status.
   *
   * @param integrationId - MongoDB integration ID
   * @returns Revocation status
   *
   * @example
   * ```ts
   * const result = await integrationsService.revokeIntegration(
   *   "68e6f5da473f2e641e30622d"
   * );
   * console.log(result.message); // "Salesforce authorization has been revoked"
   * ```
   */
  async revokeIntegration(integrationId: string): Promise<{
    status: string;
    integrationId: string;
    message: string;
  }> {
    const response = await apiClient.post<{
      status: string;
      integration_id: string;
      message: string;
    }>(`/api/v1/integrations/${integrationId}/revoke`);

    return {
      status: response.status,
      integrationId: response.integration_id,
      message: response.message,
    };
  }

  /**
   * Cancel pending OAuth authorization
   *
   * Cancels an in-progress OAuth authorization and resets the integration to NOT_AUTHENTICATED status.
   * Useful when user closes popup or timeout occurs.
   *
   * @param integrationId - MongoDB integration ID
   * @returns Cancellation status
   *
   * @example
   * ```ts
   * const result = await integrationsService.cancelAuthorization(
   *   "68e6f5da473f2e641e30622d"
   * );
   * console.log(result.message); // "Authorization cancelled"
   * ```
   */
  async cancelAuthorization(integrationId: string): Promise<{
    status: string;
    integrationId: string;
    message: string;
  }> {
    // Use revoke endpoint to reset state - backend handles AUTHENTICATING -> NOT_AUTHENTICATED transition
    const response = await apiClient.post<{
      status: string;
      integration_id: string;
      message: string;
    }>(`/api/v1/integrations/${integrationId}/revoke`);

    return {
      status: response.status,
      integrationId: response.integration_id,
      message: response.message,
    };
  }

  /**
   * Create a new integration
   *
   * @param data - Integration creation data
   * @returns Created integration
   *
   * @example
   * ```ts
   * const integration = await integrationsService.createIntegration({
   *   type: "SALESFORCE",
   *   accessLevel: "user",
   *   config: {
   *     instance_url: "https://company.salesforce.com",
   *     environment_type: "production",
   *     api_version: "v62.0"
   *   },
   *   name: "Production Salesforce"
   * });
   * ```
   */
  async createIntegration(data: {
    type: IntegrationType;
    accessLevel: "tenant" | "user";
    config: Record<string, unknown>;
    name?: string;
    accessKey?: string;
    accessSecret?: string;
    // Semantic credential fields
    username?: string;
    password?: string;
    apiKey?: string;
    // BigQuery service account JSON
    serviceAccountJson?: string;
  }): Promise<Integration> {
    const response = await apiClient.post<IntegrationBackendResponse>(
      "/api/v1/integrations",
      {
        type: data.type,
        access_level: data.accessLevel,
        config: data.config,
        name: data.name,
        access_key: data.accessKey,
        access_secret: data.accessSecret,
        username: data.username,
        password: data.password,
        api_key: data.apiKey,
        service_account_json: data.serviceAccountJson,
      },
    );
    return transformIntegration(response);
  }

  /**
   * Update an existing integration
   *
   * @param integrationId - MongoDB integration ID
   * @param data - Integration update data
   * @returns Updated integration
   *
   * @example
   * ```ts
   * const integration = await integrationsService.updateIntegration(
   *   "68e6f5da473f2e641e30622d",
   *   {
   *     config: {
   *       instance_url: "https://newcompany.salesforce.com",
   *       environment_type: "production",
   *       api_version: "v63.0"
   *     }
   *   }
   * );
   * ```
   */
  async updateIntegration(
    integrationId: string,
    data: {
      accessLevel?: "tenant" | "user";
      config?: Record<string, unknown>;
      name?: string;
      accessKey?: string;
      accessSecret?: string;
      // Semantic credential fields
      username?: string;
      password?: string;
      apiKey?: string;
      // BigQuery service account JSON
      serviceAccountJson?: string;
    },
  ): Promise<Integration> {
    const response = await apiClient.patch<IntegrationBackendResponse>(
      `/api/v1/integrations/${integrationId}`,
      {
        access_level: data.accessLevel,
        config: data.config,
        name: data.name,
        access_key: data.accessKey,
        access_secret: data.accessSecret,
        username: data.username,
        password: data.password,
        api_key: data.apiKey,
        service_account_json: data.serviceAccountJson,
      },
    );
    return transformIntegration(response);
  }

  /**
   * Delete an integration (soft delete)
   *
   * @param integrationId - MongoDB integration ID
   *
   * @example
   * ```ts
   * await integrationsService.deleteIntegration("68e6f5da473f2e641e30622d");
   * console.log("Integration deleted");
   * ```
   */
  async deleteIntegration(integrationId: string): Promise<void> {
    await apiClient.delete(`/api/v1/integrations/${integrationId}`);
  }

  /**
   * Discover tools from a custom MCP server
   * Connects to the MCP server URL and caches the tool manifest
   */
  async discoverMCPTools(integrationId: string): Promise<{
    tools: { name: string; description: string }[];
    manifestRefreshedAt: string;
  }> {
    const response = await apiClient.post<{
      tools: { name: string; description: string }[];
      manifest_refreshed_at: string;
    }>(`/api/v1/integrations/${integrationId}/discover`);

    return {
      tools: response.tools,
      manifestRefreshedAt: response.manifest_refreshed_at,
    };
  }

  /**
   * Refresh the tool manifest for a custom MCP server
   */
  async refreshMCPTools(integrationId: string): Promise<{
    tools: { name: string; description: string }[];
    manifestRefreshedAt: string;
  }> {
    const response = await apiClient.post<{
      tools: { name: string; description: string }[];
      manifest_refreshed_at: string;
    }>(`/api/v1/integrations/${integrationId}/refresh-tools`);

    return {
      tools: response.tools,
      manifestRefreshedAt: response.manifest_refreshed_at,
    };
  }

  /**
   * Set the org-level Salesforce write scope
   */
  async setSalesforceScope(
    scope: SalesforceWriteScope,
  ): Promise<SalesforceScopeResponse> {
    return apiClient.patch<SalesforceScopeResponse>(
      "/api/v1/integrations/salesforce/scope",
      { scope },
    );
  }

  /**
   * Set the org-level HubSpot write scope
   */
  async setHubspotScope(
    scope: HubspotWriteScope,
  ): Promise<HubspotScopeResponse> {
    return apiClient.patch<HubspotScopeResponse>(
      "/api/v1/integrations/hubspot/scope",
      { scope },
    );
  }
}

/**
 * Salesforce write scope values
 */
export type SalesforceWriteScope =
  | "full_access"
  | "user_level_write"
  | "read_only";

export interface SalesforceScopeResponse {
  integration_id: string;
  scope: SalesforceWriteScope;
  message: string;
}

/**
 * HubSpot write scope values — same shape as Salesforce; the BE endpoint
 * is generic over integration_type.
 */
export type HubspotWriteScope = SalesforceWriteScope;

export interface HubspotScopeResponse {
  integration_id: string;
  scope: HubspotWriteScope;
  message: string;
}

// Export a default instance
export const integrationsService = new IntegrationsService();
