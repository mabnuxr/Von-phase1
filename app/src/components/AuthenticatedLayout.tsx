import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useLaunchDarklyIdentify } from "../hooks/useLaunchDarklyIdentify";
import { getUserContextFromToken } from "../lib/auth";
import { identifyDatadogUser } from "../lib/datadog";

/**
 * Layout wrapper for authenticated routes
 * Handles LaunchDarkly and Datadog user identification on mount
 */
export function AuthenticatedLayout() {
  const { identifyUser } = useLaunchDarklyIdentify();

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

  return <Outlet />;
}
