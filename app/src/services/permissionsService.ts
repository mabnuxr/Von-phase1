import { apiClient } from "./apiClient";

/**
 * Resource types that can have permissions checked.
 * Must match backend von_rule_engine.enums.Resource values.
 */
export const Resource = {
  TEAM: "team",
  INTEGRATION: "integration",
  CONVERSATION: "conversation",
  MESSAGE: "message",
  USER: "user",
  REPORT: "report",
} as const;

export type ResourceType = (typeof Resource)[keyof typeof Resource];

/**
 * Permissions for a resource - maps action to allowed boolean
 */
export interface ResourcePermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

/**
 * Service for fetching user permissions from the backend
 */
class PermissionsService {
  /**
   * Get permissions for a specific resource type
   *
   * @param resource - Resource type to get permissions for
   * @returns Permissions object with CRUD actions
   */
  async getPermissions(resource: ResourceType): Promise<ResourcePermissions> {
    const response = await apiClient.get<ResourcePermissions>(
      `/api/v1/permissions/${resource}`,
    );
    return response;
  }
}

export const permissionsService = new PermissionsService();
