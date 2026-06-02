import { ROLES } from "../constants/roles";
import { useUser } from "./useUser";

export function useIsViewOnly(): boolean {
  const { user } = useUser();
  const roles = user?.roles;
  if (!roles || roles.length === 0) return false;
  return (
    roles.includes(ROLES.VIEW_ONLY) &&
    !roles.includes(ROLES.ADMIN) &&
    !roles.includes(ROLES.MEMBER)
  );
}
