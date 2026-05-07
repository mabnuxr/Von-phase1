import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useLaunchDarklyIdentify } from "../hooks/useLaunchDarklyIdentify";
import { getUserContextFromToken } from "../lib/auth";
import { identifyDatadogUser } from "../lib/datadog";
import { identifyPosthogUser } from "../lib/posthog";
import { LaunchDarklyIdentityContext } from "./LaunchDarkly";
import { GlobalChatProvider } from "../providers/GlobalChat";

/**
 * Layout wrapper for authenticated routes.
 * Resolves LaunchDarkly identity and exposes it via context so child routes
 * can gate their content with `<LaunchDarklyGate fallback={…}>`.
 */
export function AuthenticatedLayout() {
  const { identifyUser, isIdentified } = useLaunchDarklyIdentify();

  useEffect(() => {
    identifyUser();

    // Identify user in observability tools from JWT claims (synchronous, no API call)
    const userContext = getUserContextFromToken();
    if (userContext) {
      identifyDatadogUser(
        userContext.userId,
        userContext.email,
        userContext.tenantId,
      );
      identifyPosthogUser(userContext.userId, {
        email: userContext.email,
        tenantId: userContext.tenantId,
      });
    }
  }, [identifyUser]);

  return (
    <GlobalChatProvider>
      <LaunchDarklyIdentityContext.Provider value={isIdentified}>
        <Outlet />
      </LaunchDarklyIdentityContext.Provider>
    </GlobalChatProvider>
  );
}
