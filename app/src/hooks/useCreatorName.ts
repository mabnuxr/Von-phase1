import { useMemo } from "react";
import { useUser } from "./useUser";
import { useTeamMembers } from "./useTeam";

/**
 * Resolves the display name of a dashboard's creator by looking up
 * the creator ID in the organisation's team members.
 */
export function useCreatorName({
  isOwner,
  createdBy,
  createdByName,
}: {
  isOwner: boolean;
  createdBy: string;
  createdByName?: string;
}): { name: string; isLoading: boolean; isError: boolean } {
  const { user, loading: userLoading } = useUser();
  const {
    data: teamMembers,
    isLoading: membersLoading,
    isError,
  } = useTeamMembers(user?.tenantId);

  const needsLookup = !isOwner && !createdByName;
  const isLoading = needsLookup && (userLoading || membersLoading);

  const memberNameById = useMemo(
    () =>
      new Map(
        teamMembers?.map((m) => [m.id, `${m.firstName} ${m.lastName}`.trim()]),
      ),
    [teamMembers],
  );

  const name = useMemo(() => {
    if (isOwner) return "me";
    return memberNameById.get(createdBy) || createdByName || "someone";
  }, [isOwner, createdBy, createdByName, memberNameById]);

  return { name, isLoading, isError };
}
