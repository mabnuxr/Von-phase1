import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useLaunchDarklyIdentify } from "../hooks/useLaunchDarklyIdentify";
import { getUserContextFromToken } from "../lib/auth";
import { identifyDatadogUser } from "../lib/datadog";
import { LaunchDarklyIdentityContext } from "./LaunchDarkly";

/**
 * Layout wrapper for authenticated routes.
 * Resolves LaunchDarkly identity and exposes it via context so child routes
 * can gate their content with `<LaunchDarklyGate fallback={…}>`.
 */
export function AuthenticatedLayout() {
  const { identifyUser, isIdentified } = useLaunchDarklyIdentify();

  useEffect(() => {
    identifyUser();

    // Identify user in Datadog RUM from JWT claims (synchronous, no API call)
    const userContext = getUserContextFromToken();
    if (userContext) {
      identifyDatadogUser(
        userContext.userId,
        userContext.email,
        userContext.tenantId,
      );
    }
  }, [identifyUser]);

  return (
    <LaunchDarklyIdentityContext.Provider value={isIdentified}>
      <Outlet />
    </LaunchDarklyIdentityContext.Provider>
  );
}
