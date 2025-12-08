import { useQuery } from "@tanstack/react-query";
import { permissionsService, Resource } from "../services";
import type { ResourceType, ResourcePermissions } from "../services";
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
};

/**
 * Hook to fetch permissions for a specific resource type
 *
 * Permissions are cached for 5 minutes since they rarely change during a session.
 * If the backend cache is unavailable, permissions are computed on-the-fly.
 *
 * @param resource - Resource type to get permissions for (e.g., "team", "integration")
 * @returns Query result with permissions object
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: perms, isLoading } = usePermissions("team");
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       {perms?.create && <Button>Add Member</Button>}
 *       {perms?.delete && <Button>Remove Member</Button>}
 *     </div>
 *   );3
 * }
 * ```
 */
export function usePermissions(resource: ResourceType) {
  return useQuery({
    queryKey: permissionsKeys.resource(resource),
    queryFn: () => permissionsService.getPermissions(resource),
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
