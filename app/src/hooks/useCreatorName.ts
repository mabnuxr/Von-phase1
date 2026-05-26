import { useMemo } from "react";
import { useUser } from "./useUser";
import { useTenantMembers } from "./useTenantMembers";

/**
 * Resolves the display name of a dashboard's creator by looking up
 * the creator ID in the organisation's tenant members.
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
  const needsLookup = !isOwner && !createdByName;
  const { user, loading: userLoading } = useUser();
  const {
    data: tenantMembers,
    isLoading: membersLoading,
    isError,
  } = useTenantMembers(needsLookup ? user?.tenantId : undefined);

  const isLoading = needsLookup && (userLoading || membersLoading);

  const memberNameById = useMemo(
    () =>
      new Map(
        tenantMembers?.map((m) => [
          m.id,
          `${m.firstName || ""} ${m.lastName || ""}`.trim(),
        ]),
      ),
    [tenantMembers],
  );

  const name = useMemo(() => {
    if (isOwner) return "me";
    return memberNameById.get(createdBy) || createdByName || "someone";
  }, [isOwner, createdBy, createdByName, memberNameById]);

  return { name, isLoading, isError };
}
