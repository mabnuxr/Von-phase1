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
  MEMORY_CONTEXT: "memory_context",
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
 * Attributes for resource permission evaluation
 */
export interface ResourceAttributes {
  access_level?: string;
  owner_id?: string;
  tenant_id?: string;
  is_protected?: boolean;
  [key: string]: string | boolean | undefined;
}

/**
 * Service for fetching user permissions from the backend
 */
class PermissionsService {
  /**
   * Get permissions for a specific resource instance
   *
   * @param resource - Resource type to get permissions for
   * @param resourceAttributes - Optional resource attributes (access_level, owner_id, etc.)
   * @returns Permissions object with CRUD actions
   */
  async getPermissions(
    resource: ResourceType,
    resourceAttributes?: ResourceAttributes,
  ): Promise<ResourcePermissions> {
    const response = await apiClient.post<ResourcePermissions>(
      `/api/v1/permissions/${resource}`,
      { resource_attributes: resourceAttributes },
    );
    return response;
  }
}

export const permissionsService = new PermissionsService();
