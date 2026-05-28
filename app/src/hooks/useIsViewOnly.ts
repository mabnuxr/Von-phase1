import { useUser } from "./useUser";

export function useIsViewOnly(): boolean {
  const { user } = useUser();
  const roles = user?.roles;
  if (!roles || roles.length === 0) return false;
  return roles.includes("View Only") && !roles.includes("Admin") && !roles.includes("Member");
}
