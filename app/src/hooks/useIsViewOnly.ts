import { ROLES } from "../constants/roles";
import { useUser } from "./useUser";

// True only when View Only is the user's sole role; Admin/Member dominates.
export function useIsViewOnly(): boolean {
  const roles = useUser().user?.roles ?? [];
  return (
    roles.includes(ROLES.VIEW_ONLY) &&
    !roles.includes(ROLES.ADMIN) &&
    !roles.includes(ROLES.MEMBER)
  );
}
