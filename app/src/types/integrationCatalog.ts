export type AvailabilityType = "workspace" | "personal";
export type AvailabilityStatus = "draft" | "published" | "archived";
export type AuthStatus =
  | "NOT_AUTHENTICATED"
  | "AUTHENTICATING"
  | "AUTHENTICATED"
  | "AUTHENTICATION_FAILED";

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

export interface TenantIntegrationPolicy {
  id: string;
  availability_type: AvailabilityType;
  availability_status: AvailabilityStatus;
  published_at: string | null;
  published_by: string | null;
  archived_at: string | null;
  archived_by: string | null;
}

export interface CatalogEntry {
  catalog_id: string;
  name: string;
  description: string;
  personal_description: string | null;
  logo_url: string | null;
  category: string;
  auth_type: "oauth2" | "api_key" | "token" | "none";
  allowed_access_levels: Array<"tenant" | "user">;
  integration_type: string;
  is_builtin: boolean;
  docs_url: string | null;
  tenant_policy: TenantIntegrationPolicy | null;
  connections: CatalogConnections;
}

export interface PublishIntegrationPayload {
  availability_type: AvailabilityType;
  status?: "draft" | "published";
}

export interface UpdatePolicyPayload {
  availability_type?: AvailabilityType;
  availability_status?: AvailabilityStatus;
}
