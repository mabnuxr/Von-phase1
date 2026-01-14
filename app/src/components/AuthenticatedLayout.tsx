import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useLaunchDarklyIdentify } from "../hooks/useLaunchDarklyIdentify";

/**
 * Layout wrapper for authenticated routes
 * Handles LaunchDarkly user identification on mount
 */
export function AuthenticatedLayout() {
  const { identifyUser } = useLaunchDarklyIdentify();

  useEffect(() => {
    identifyUser();
  }, [identifyUser]);

  return <Outlet />;
}
