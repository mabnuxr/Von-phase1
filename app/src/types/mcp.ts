export type MCPAuthType = "api_key" | "oauth2" | "none";
export type MCPSource = "catalog" | "custom";
export type MCPAccessLevel = "tenant" | "user";
export type MCPAvailabilityType =
  | "always_on"
  | "admin_published"
  | "role_restricted"
  | "user_allowlist";
export type MCPAvailabilityStatus = "draft" | "published" | "archived";
export type MCPAuthenticationStatus =
  | "NOT_AUTHENTICATED"
  | "AUTHENTICATING"
  | "AUTHENTICATED"
  | "AUTHENTICATION_FAILED";

export interface MCPToolInfo {
  name: string;
  description: string;
  is_write: boolean;
}

export interface MCPServer {
  id: string;
  name: string;
  description: string | null;
  server_url: string;
  auth_type: MCPAuthType;
  source: MCPSource;
  catalog_id: string | null;
  access_level: MCPAccessLevel;
  tool_manifest: MCPToolInfo[];
  manifest_refreshed_at: string | null;
  availability_type: MCPAvailabilityType;
  availability_status: MCPAvailabilityStatus;
  availability_allowed_roles: string[];
  authentication_status: MCPAuthenticationStatus;
  last_authenticated_at: string | null;
  promotion_requested: boolean;
  is_active: boolean;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  connection_mode: "workspace" | "personal";
  user_connection: {
    mapping_id: string;
    authentication_status: MCPAuthenticationStatus;
    last_authenticated_at: string | null;
  } | null;
}

export interface CatalogEntry {
  catalog_id: string;
  name: string;
  description: string;
  server_url: string;
  auth_type: MCPAuthType;
  credential_label: string;
  credential_hint_url: string | null;
  default_access_level: string[];
  logo_url: string | null;
  tool_manifest: MCPToolInfo[];
  is_connected: boolean;
  connected_server_id: string | null;
  is_personal_connected?: boolean;
  personal_server_id?: string | null;
  authentication_status?: MCPAuthenticationStatus;
  category_code: string;
  category_name: string;
  author: string;
  docs_url: string | null;
  support_url: string | null;
  privacy_policy_url: string | null;
  is_active: boolean;
  connection_mode?: "workspace" | "personal";
  is_ti_based?: boolean;
}

export interface MCPSettings {
  custom_mcp_registration:
    | "admin_only"
    | "all_members"
    | "role_allowlist"
    | "user_allowlist";
  custom_mcp_allowed_roles: string[];
}

export interface RegistrationGrant {
  user_id: string;
  granted_by: string;
  granted_at: string;
}

export interface ServerGrant {
  user_id: string;
  mcp_server_id: string;
  granted_by: string;
  granted_at: string;
}
