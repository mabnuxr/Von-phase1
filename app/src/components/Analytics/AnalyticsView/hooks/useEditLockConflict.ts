import { useMemo } from "react";
import { useVisibilityToggle } from "@vonlabs/design-components";
import type { TenantMember } from "../../../../services/tenantMembersService";
import type { Dashboard } from "../../../../types/dashboard";

interface UseEditLockConflictArgs {
  editLock: Dashboard["editLock"];
  tenantMembers: TenantMember[] | undefined;
}

export function useEditLockConflict({
  editLock,
  tenantMembers,
}: UseEditLockConflictArgs) {
  // The embedded `dashboard.editLock` can be stale — another user may have
  // released their lock since the last refetch — so we never pre-branch off
  // it for *opening* the modal. The acquire-lock API is the source of truth
  // for that. We only use it to resolve the holder's display name once the
  // server has actually rejected the acquire with HELD_BY_OTHER.
  const lockHolderMember = useMemo(() => {
    if (!editLock) return null;
    return tenantMembers?.find((m) => m.id === editLock.userId) ?? null;
  }, [editLock, tenantMembers]);

  const lockHolderName = lockHolderMember
    ? `${lockHolderMember.firstName} ${lockHolderMember.lastName}`.trim() ||
      lockHolderMember.email
    : null;

  const {
    isVisible: isModalOpen,
    show: openModal,
    hide: closeModal,
  } = useVisibilityToggle();

  return {
    isModalOpen,
    openModal,
    closeModal,
    lockHolderName,
  };
}

export type EditLockConflict = ReturnType<typeof useEditLockConflict>;
