// API Client
export { ApiClient, apiClient, ApiError } from "./apiClient";
export type { ApiRequestOptions } from "./apiClient";

// Auth Service
export { AuthService, authService } from "./authService";
export type { User, LogoutResponse } from "./authService";

// Integrations Service
export {
  IntegrationsService,
  integrationsService,
} from "./integrationsService";
export type {
  Integration,
  IntegrationListResponse,
  SalesforceWriteScope,
  SalesforceScopeResponse,
} from "./integrationsService";
export {
  IntegrationType,
  IntegrationStatus,
  AuthenticationStatus,
} from "./integrationsService";

// Conversations Service
export { conversationsService } from "./conversationsService";

// Preferences Service
export { preferencesService } from "./preferencesService";
export type { PreferencesData } from "./preferencesService";

// Team Service
export { teamService } from "./teamService";
export type {
  TeamMember,
  Role,
  AddTeamMemberRequest,
  UpdateMemberPermissionsRequest,
  UpdateMemberPermissionsResponse,
} from "./teamService";

// Permissions Service
export { permissionsService, Resource } from "./permissionsService";
export type {
  ResourceType,
  ResourcePermissions,
  ResourceAttributes,
} from "./permissionsService";

// Memory Contexts Service
export { memoryContextsService } from "./memoryContextsService";

// Quick Commands Service
export { quickCommandsService } from "./quickCommandsService";
export type {
  QuickCommand,
  QuickCommandListResponse,
  CreateQuickCommandInput,
  UpdateQuickCommandInput,
  CommandDataSource as QuickCommandDataSource,
  PresignRequest,
  PresignResponse,
} from "./quickCommandsService";

// GSuite Services
export { exportToDrive } from "./gsuite";
export type { ExportToDriveResponse } from "./gsuite";

// Box Services
export { exportToBox } from "./box";
export type { ExportToBoxResponse } from "./box";
