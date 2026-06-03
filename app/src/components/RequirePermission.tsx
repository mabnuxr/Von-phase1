import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import {
  usePermissions,
  type Permissions,
} from "../contexts/permissionsContextValue";

interface RequirePermissionProps {
  /** Render-time check against the user's current permissions. */
  allow: (permissions: Permissions) => boolean;
  /** Where to send the user if the check fails. */
  redirectTo: string;
  /** Wrap a single route's element, or omit to use as a layout route around <Outlet />. */
  children?: ReactNode;
}

/** Route guard. Redirects on the first render so unauthorized content
 *  never flashes — unlike a useEffect-then-navigate pattern. */
export function RequirePermission({
  allow,
  redirectTo,
  children,
}: RequirePermissionProps) {
  const permissions = usePermissions();
  if (!allow(permissions)) return <Navigate to={redirectTo} replace />;
  return <>{children ?? <Outlet />}</>;
}
