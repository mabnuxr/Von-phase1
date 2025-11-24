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
export type { TeamMember, Role, AddTeamMemberRequest } from "./teamService";
