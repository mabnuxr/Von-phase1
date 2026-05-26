import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./useToast";
import { tenantMembersService } from "../services";
import type {
  TenantMember,
  AddTenantMemberRequest,
  UpdateTenantMemberRequest,
  UpdateMemberPermissionsRequest,
} from "../services/tenantMembersService";
import type { BulkImportTenantMemberResponse } from "../services/tenantMembersService";

/**
 * Query keys for tenant members - scoped by tenant
 *
 * Tenant members and roles are tenant-specific, so we scope by tenantId
 */
export const tenantMembersKeys = {
  all: ["tenant-members"] as const,
  members: (tenantId: string) =>
    [...tenantMembersKeys.all, "members", tenantId] as const,
  roles: (tenantId: string) =>
    [...tenantMembersKeys.all, "roles", tenantId] as const,
  user: (userId: string) => [...tenantMembersKeys.all, "user", userId] as const,
};

export function useTenantMember(userId: string | undefined) {
  return useQuery({
    queryKey: userId
      ? tenantMembersKeys.user(userId)
      : ["tenant-members", "user", "none"],
    queryFn: () => tenantMembersService.getTenantMember(userId!),
    enabled: !!userId,
    staleTime: 300000,
    retry: false,
  });
}

/**
 * Fetch tenant members for the current tenant
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useTenantMembers(tenantId: string | undefined) {
  return useQuery({
    queryKey: tenantId
      ? tenantMembersKeys.members(tenantId)
      : ["tenant-members", "members", "loading"],
    queryFn: () => tenantMembersService.getTenantMembers(),
    enabled: !!tenantId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch available roles for the current tenant
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useRoles(tenantId: string | undefined) {
  return useQuery({
    queryKey: tenantId
      ? tenantMembersKeys.roles(tenantId)
      : ["tenant-members", "roles", "loading"],
    queryFn: () => tenantMembersService.getRoles(),
    enabled: !!tenantId,
    staleTime: 300000, // 5 minutes (roles change rarely)
  });
}

/**
 * Add a new tenant member with optimistic updates
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useAddTenantMember(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: AddTenantMemberRequest) =>
      tenantMembersService.addTenantMember(data),

    // Optimistic update: Add member to cache immediately
    onMutate: async (newMember) => {
      if (!tenantId) return;

      await queryClient.cancelQueries({
        queryKey: tenantMembersKeys.members(tenantId),
      });

      const previousMembers = queryClient.getQueryData<TenantMember[]>(
        tenantMembersKeys.members(tenantId),
      );

      // Optimistically add the new member (with temporary ID)
      if (previousMembers) {
        const optimisticMember: TenantMember = {
          id: `temp-${Date.now()}`,
          email: newMember.email,
          firstName: newMember.firstName,
          lastName: newMember.lastName,
          role: newMember.role,
          joinedDate: new Date().toISOString(),
          isActive: true,
          usage: { total: 0, last_week: 0, last_month: 0 },
        };

        queryClient.setQueryData<TenantMember[]>(
          tenantMembersKeys.members(tenantId),
          [...previousMembers, optimisticMember],
        );
      }

      return { previousMembers };
    },

    // Rollback on error
    onError: (err, _newMember, context) => {
      if (!tenantId) return;

      if (context?.previousMembers) {
        queryClient.setQueryData(
          tenantMembersKeys.members(tenantId),
          context.previousMembers,
        );
      }
      console.error("[useAddTenantMember] Failed to add tenant member:", err);
    },

    // Update cache with server response
    onSuccess: (serverData) => {
      if (!tenantId) return;

      // Update members list with actual data from server
      const previousMembers = queryClient.getQueryData<TenantMember[]>(
        tenantMembersKeys.members(tenantId),
      );

      if (previousMembers) {
        // Replace optimistic member with real data
        const updatedMembers = [
          ...previousMembers.filter((m) => !m.id.startsWith("temp-")),
          serverData,
        ];
        queryClient.setQueryData(
          tenantMembersKeys.members(tenantId),
          updatedMembers,
        );
      } else {
        // Invalidate to refetch if cache is stale
        queryClient.invalidateQueries({
          queryKey: tenantMembersKeys.members(tenantId),
        });
      }

      showToast({ message: "Team member added", variant: "success" });
    },
  });
}

/**
 * Bulk-import tenant members from a CSV file.
 *
 * The mutation kicks off the upload + server-side processing. Live per-row
 * progress flows in via Pusher (handled by useBulkImportProgress, not this
 * hook), and the resolved BulkImportTenantMemberResponse is the source of
 * truth for the final results table. We invalidate the members list on
 * success so the existing tab re-fetches with the newly created users.
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useBulkImportTenantMembers(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    BulkImportTenantMemberResponse,
    Error,
    { file: File; jobId: string }
  >({
    mutationFn: ({ file, jobId }) =>
      tenantMembersService.bulkImportTenantMembers(file, jobId),

    onSuccess: (response) => {
      if (!tenantId) return;
      // Refetch the members list whenever any rows were created — skipped /
      // error rows leave the table unchanged.
      if (response.summary.created > 0) {
        queryClient.invalidateQueries({
          queryKey: tenantMembersKeys.members(tenantId),
        });
      }

      const { created, skipped, errors } = response.summary;
      if (errors === 0) {
        showToast({
          message:
            created === 1
              ? "Imported 1 team member"
              : `Imported ${created} team members`,
          variant: "success",
        });
      } else {
        showToast({
          message: `Imported ${created}, ${skipped} skipped, ${errors} failed`,
          variant: created === 0 ? "error" : "warning",
        });
      }
    },

    onError: (err) => {
      console.error("[useBulkImportTenantMembers] Bulk import failed:", err);
    },
  });
}

/**
 * Remove a tenant member with optimistic updates
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useRemoveTenantMember(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      tenantMembersService.removeTenantMember(userId),

    // Optimistic update: Remove member from cache immediately
    onMutate: async (userId) => {
      if (!tenantId) return;

      await queryClient.cancelQueries({
        queryKey: tenantMembersKeys.members(tenantId),
      });

      const previousMembers = queryClient.getQueryData<TenantMember[]>(
        tenantMembersKeys.members(tenantId),
      );

      // Optimistically remove the member
      if (previousMembers) {
        queryClient.setQueryData<TenantMember[]>(
          tenantMembersKeys.members(tenantId),
          previousMembers.filter((m) => m.id !== userId),
        );
      }

      return { previousMembers };
    },

    // Rollback on error
    onError: (err, _userId, context) => {
      if (!tenantId) return;

      if (context?.previousMembers) {
        queryClient.setQueryData(
          tenantMembersKeys.members(tenantId),
          context.previousMembers,
        );
      }
      console.error(
        "[useRemoveTenantMember] Failed to remove tenant member:",
        err,
      );
    },

    // Invalidate on success to ensure consistency
    onSuccess: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({
        queryKey: tenantMembersKeys.members(tenantId),
      });
    },
  });
}

/**
 * Update a tenant member's details (name, role) - admin only
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useUpdateTenantMember(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateTenantMemberRequest;
    }) => tenantMembersService.updateTenantMember(userId, data),

    onSuccess: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({
        queryKey: tenantMembersKeys.members(tenantId),
      });
      showToast({
        message: "Team member updated successfully",
        variant: "success",
      });
    },

    onError: (err) => {
      console.error("[useUpdateTenantMember] Failed to update member:", err);
    },
  });
}

/**
 * Update per-user permissions (admin only)
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useUpdateTenantMemberPermissions(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: UpdateMemberPermissionsRequest;
    }) =>
      tenantMembersService.updateTenantMemberPermissions(userId, permissions),

    onSuccess: (_data, { permissions }) => {
      if (!tenantId) return;
      queryClient.invalidateQueries({
        queryKey: tenantMembersKeys.members(tenantId),
      });
      // Each mutation toggles exactly one key — pick whichever was set.
      let message = "Permissions updated";
      if (
        permissions.sfdc_write !== undefined &&
        permissions.sfdc_write !== null
      ) {
        message = permissions.sfdc_write
          ? "Salesforce updates enabled for this user"
          : "Salesforce updates disabled for this user";
      } else if (
        permissions.hubspot_write !== undefined &&
        permissions.hubspot_write !== null
      ) {
        message = permissions.hubspot_write
          ? "HubSpot updates enabled for this user"
          : "HubSpot updates disabled for this user";
      }
      showToast({ message, variant: "success" });
    },

    onError: (err) => {
      console.error(
        "[useUpdateTenantMemberPermissions] Failed to update permissions:",
        err,
      );
      showToast({
        message: "Failed to update permissions",
        variant: "error",
      });
    },
  });
}
