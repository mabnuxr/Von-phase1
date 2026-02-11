import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamService } from "../services";
import type { TeamMember, AddTeamMemberRequest } from "../services/teamService";

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
};

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
