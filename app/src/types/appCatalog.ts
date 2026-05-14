export type CatalogType = "native_integration" | "mcp";
export type ConnectionMode = "workspace" | "personal";
export type AvailabilityStatus = "draft" | "published" | "archived";
export type AuthStatus =
  | "NOT_AUTHENTICATED"
  | "AUTHENTICATING"
  | "AUTHENTICATED"
  | "AUTHENTICATION_FAILED";

export interface AppTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  is_write: boolean;
  refreshed_at: string | null;
}

export interface IntegrationConnectionSummary {
  id: string;
  authentication_status: AuthStatus;
  is_active: boolean;
  last_authenticated_at: string | null;
}

export interface CatalogConnections {
  workspace: IntegrationConnectionSummary | null;
  personal: IntegrationConnectionSummary | null;
}

export interface TenantIntegrationSummary {
  id: string;
  connection_mode: ConnectionMode;
  availability_status: AvailabilityStatus;
  availability_type: string;
  authentication_status: AuthStatus;
  last_authenticated_at: string | null;
  published_at: string | null;
  published_by: string | null;
  archived_at: string | null;
  archived_by: string | null;
}

export interface TenantIntegrations {
  workspace: TenantIntegrationSummary | null;
  personal: TenantIntegrationSummary | null;
}

export interface AppCatalogEntry {
  catalog_id: string;
  catalog_type: CatalogType;
  name: string;
  description: string;
  personal_description: string | null;
  logo_url: string | null;
  category_code: string;
  category_name: string;
  short_description: string | null;
  auth_type: "oauth2" | "api_key" | "token" | "none";
  allowed_access_levels: ConnectionMode[];
  credential_label: string | null;
  credential_hint_url: string | null;
  scalekit_connection_name: string | null;
  // MCP-only
  server_url: string | null;
  // Native-only
  integration_type: string | null;
  is_builtin: boolean;
  docs_url: string | null;
  // Workspace and personal TIs are independent — both can exist simultaneously
  tenant_integrations: TenantIntegrations;
  connections: CatalogConnections;
}

export interface PublishAppPayload {
  catalog_type: CatalogType;
  connection_mode: ConnectionMode;
  availability_status?: "draft" | "published";
  availability_type?: string;
}

export interface UpdateTenantIntegrationPayload {
  catalog_type: CatalogType;
  connection_mode: ConnectionMode;
  availability_status?: AvailabilityStatus;
  availability_type?: string;
}

export interface TenantIntegrationEnriched {
  id: string;
  catalog_id: string;
  catalog_type: CatalogType;
  name: string;
  description: string;
  short_description: string | null;
  connection_mode: ConnectionMode;
  availability_status: AvailabilityStatus;
  availability_type: string;
  published_at: string | null;
  published_by: string | null;
  archived_at: string | null;
  archived_by: string | null;
  logo_url: string | null;
  category_code: string;
  category_name: string;
  auth_type: "oauth2" | "api_key" | "token" | "none";
  allowed_access_levels: ConnectionMode[];
  server_url: string | null;
  integration_type: string | null;
  docs_url: string | null;
  credential_label: string | null;
  credential_hint_url: string | null;
  scalekit_connection_name: string | null;
  connection: IntegrationConnectionSummary | null;
}

export interface PaginatedCatalogResponse {
  items: AppCatalogEntry[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface AppCatalogSeedResult {
  created: number;
  updated: number;
  skipped: number;
  dry_run: boolean;
  entries: {
    catalog_id: string;
    catalog_type: string;
    auth_type: string;
    tool_count: number;
  }[];
}
