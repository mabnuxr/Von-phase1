import { useQuery } from "@tanstack/react-query";
import { permissionsService, Resource } from "../services";
import type {
  ResourceType,
  ResourcePermissions,
  ResourceAttributes,
} from "../services";
import {
  PERMISSIONS_STALE_TIME,
  PERMISSIONS_GC_TIME,
  PERMISSIONS_RETRY_COUNT,
} from "../config/constants";

/**
 * Query keys for permissions
 */
export const permissionsKeys = {
  all: ["permissions"] as const,
  resource: (resource: ResourceType) =>
    [...permissionsKeys.all, resource] as const,
  resourceWithAttrs: (resource: ResourceType, attrs?: ResourceAttributes) =>
    [...permissionsKeys.all, resource, attrs] as const,
};

/**
 * Hook to fetch permissions for a specific resource instance
 *
 * Permissions are cached for 5 minutes since they rarely change during a session.
 * Permissions are evaluated based on the specific resource attributes provided.
 *
 * @param resource - Resource type to get permissions for (e.g., "team", "integration")
 * @param resourceAttributes - Optional resource attributes (access_level, owner_id, etc.)
 * @returns Query result with permissions object
 *
 * @example
 * ```tsx
 * function IntegrationCard({ integration }) {
 *   const { data: perms, isLoading } = usePermissions("integration", {
 *     access_level: integration.accessLevel,
 *     owner_id: integration.userId,
 *     tenant_id: integration.tenantId
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       {perms?.update && <Button>Edit</Button>}
 *       {perms?.delete && <Button>Delete</Button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions(
  resource: ResourceType,
  resourceAttributes?: ResourceAttributes,
) {
  return useQuery({
    queryKey: permissionsKeys.resourceWithAttrs(resource, resourceAttributes),
    queryFn: () =>
      permissionsService.getPermissions(resource, resourceAttributes),
    staleTime: PERMISSIONS_STALE_TIME,
    gcTime: PERMISSIONS_GC_TIME,
    retry: PERMISSIONS_RETRY_COUNT,
  });
}

/**
 * Type helper for permission check results
 */
export { Resource };
export type { ResourcePermissions, ResourceType };
