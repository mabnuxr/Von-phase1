import { createContext, useContext } from "react";

export interface Permissions {
  roles: string[];
  isAdmin: boolean;
  isMember: boolean;
  isViewOnly: boolean;
}

export const PermissionsContext = createContext<Permissions | null>(null);

export function usePermissions(): Permissions {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions must be used inside <PermissionsProvider>");
  }
  return ctx;
}
