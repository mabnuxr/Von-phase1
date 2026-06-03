import { useMemo, type ReactNode } from "react";
import { ROLES } from "../constants/roles";
import { useUser } from "../hooks/useUser";
import {
  PermissionsContext,
  type Permissions,
} from "./permissionsContextValue";

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const userRoles = useUser().user?.roles;
  const value = useMemo<Permissions>(() => {
    const roles = userRoles ?? [];
    return {
      roles,
      isAdmin: roles.includes(ROLES.ADMIN),
      isMember: roles.includes(ROLES.MEMBER),
      isViewOnly: roles.includes(ROLES.VIEW_ONLY),
    };
  }, [userRoles]);
  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};
