import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./useToast";
import { teamService } from "../services";
import type {
  TeamMember,
  AddTeamMemberRequest,
  UpdateMemberRequest,
  UpdateMemberPermissionsRequest,
} from "../services/teamService";
import type { BulkImportResponse } from "../services/teamService";

/**
 * Query keys for team - scoped by tenant
 *
 * Team members and roles are tenant-specific, so we scope by tenantId
 */
export const teamKeys = {
  all: ["team"] as const,
  members: (tenantId: string) =>
    [...teamKeys.all, "members", tenantId] as const,
  roles: (tenantId: string) => [...teamKeys.all, "roles", tenantId] as const,
  user: (userId: string) => [...teamKeys.all, "user", userId] as const,
};

export function useTeamUser(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? teamKeys.user(userId) : ["team", "user", "none"],
    queryFn: () => teamService.getTeamUser(userId!),
    enabled: !!userId,
    staleTime: 300000,
    retry: false,
  });
}

/**
 * Fetch team members for the current tenant
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useTeamMembers(tenantId: string | undefined) {
  return useQuery({
    queryKey: tenantId
      ? teamKeys.members(tenantId)
      : ["team", "members", "loading"],
    queryFn: () => teamService.getTeamMembers(),
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
      ? teamKeys.roles(tenantId)
      : ["team", "roles", "loading"],
    queryFn: () => teamService.getRoles(),
    enabled: !!tenantId,
    staleTime: 300000, // 5 minutes (roles change rarely)
  });
}

/**
 * Add a new team member with optimistic updates
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useAddTeamMember(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: AddTeamMemberRequest) => teamService.addTeamMember(data),

    // Optimistic update: Add member to cache immediately
    onMutate: async (newMember) => {
      if (!tenantId) return;

      await queryClient.cancelQueries({
        queryKey: teamKeys.members(tenantId),
      });

      const previousMembers = queryClient.getQueryData<TeamMember[]>(
        teamKeys.members(tenantId),
      );

      // Optimistically add the new member (with temporary ID)
      if (previousMembers) {
        const optimisticMember: TeamMember = {
          id: `temp-${Date.now()}`,
          email: newMember.email,
          firstName: newMember.firstName,
          lastName: newMember.lastName,
          role: newMember.role,
          joinedDate: new Date().toISOString(),
          isActive: true,
          usage: { total: 0, last_week: 0, last_month: 0 },
        };

        queryClient.setQueryData<TeamMember[]>(teamKeys.members(tenantId), [
          ...previousMembers,
          optimisticMember,
        ]);
      }

      return { previousMembers };
    },

    // Rollback on error
    onError: (err, _newMember, context) => {
      if (!tenantId) return;

      if (context?.previousMembers) {
        queryClient.setQueryData(
          teamKeys.members(tenantId),
          context.previousMembers,
        );
      }
      console.error("[useAddTeamMember] Failed to add team member:", err);
    },

    // Update cache with server response
    onSuccess: (serverData) => {
      if (!tenantId) return;

      // Update members list with actual data from server
      const previousMembers = queryClient.getQueryData<TeamMember[]>(
        teamKeys.members(tenantId),
      );

      if (previousMembers) {
        // Replace optimistic member with real data
        const updatedMembers = [
          ...previousMembers.filter((m) => !m.id.startsWith("temp-")),
          serverData,
        ];
        queryClient.setQueryData(teamKeys.members(tenantId), updatedMembers);
      } else {
        // Invalidate to refetch if cache is stale
        queryClient.invalidateQueries({ queryKey: teamKeys.members(tenantId) });
      }

      showToast({ message: "Team member added", variant: "success" });
    },
  });
}

/**
 * Bulk-import team members from a CSV file.
 *
 * The mutation kicks off the upload + server-side processing. Live per-row
 * progress flows in via Pusher (handled by useBulkImportProgress, not this
 * hook), and the resolved BulkImportResponse is the source of truth for the
 * final results table. We invalidate the members list on success so the
 * existing tab re-fetches with the newly created users.
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useBulkImportTeamMembers(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<BulkImportResponse, Error, { file: File; jobId: string }>({
    mutationFn: ({ file, jobId }) =>
      teamService.bulkImportTeamMembers(file, jobId),

    onSuccess: (response) => {
      if (!tenantId) return;
      // Refetch the members list whenever any rows were created — skipped /
      // error rows leave the table unchanged.
      if (response.summary.created > 0) {
        queryClient.invalidateQueries({ queryKey: teamKeys.members(tenantId) });
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
      console.error("[useBulkImportTeamMembers] Bulk import failed:", err);
    },
  });
}

/**
 * Remove a team member with optimistic updates
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useRemoveTeamMember(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => teamService.removeTeamMember(userId),

    // Optimistic update: Remove member from cache immediately
    onMutate: async (userId) => {
      if (!tenantId) return;

      await queryClient.cancelQueries({
        queryKey: teamKeys.members(tenantId),
      });

      const previousMembers = queryClient.getQueryData<TeamMember[]>(
        teamKeys.members(tenantId),
      );

      // Optimistically remove the member
      if (previousMembers) {
        queryClient.setQueryData<TeamMember[]>(
          teamKeys.members(tenantId),
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
          teamKeys.members(tenantId),
          context.previousMembers,
        );
      }
      console.error("[useRemoveTeamMember] Failed to remove team member:", err);
    },

    // Invalidate on success to ensure consistency
    onSuccess: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({ queryKey: teamKeys.members(tenantId) });
    },
  });
}

/**
 * Update a team member's details (name, role) - admin only
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useUpdateMember(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateMemberRequest;
    }) => teamService.updateMember(userId, data),

    onSuccess: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({ queryKey: teamKeys.members(tenantId) });
      showToast({
        message: "Team member updated successfully",
        variant: "success",
      });
    },

    onError: (err) => {
      console.error("[useUpdateMember] Failed to update member:", err);
    },
  });
}

/**
 * Update per-user permissions (admin only)
 *
 * @param tenantId - Current tenant ID from user context
 */
export function useUpdateMemberPermissions(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: UpdateMemberPermissionsRequest;
    }) => teamService.updateMemberPermissions(userId, permissions),

    onSuccess: (_data, { permissions }) => {
      if (!tenantId) return;
      queryClient.invalidateQueries({ queryKey: teamKeys.members(tenantId) });
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
        "[useUpdateMemberPermissions] Failed to update permissions:",
        err,
      );
      showToast({
        message: "Failed to update permissions",
        variant: "error",
      });
    },
  });
}
