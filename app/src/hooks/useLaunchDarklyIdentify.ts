import { useCallback, useState } from "react";
import { useLDClient } from "launchdarkly-react-client-sdk";
import { authService } from "../services";

/**
 * Hook to identify user in LaunchDarkly after login
 * Call this after successful authentication to update the LaunchDarkly context
 *
 * Returns `isIdentified` so callers can gate rendering until flags are evaluated
 * against the real user context.
 */
export function useLaunchDarklyIdentify() {
  const ldClient = useLDClient();
  const [isIdentified, setIsIdentified] = useState(false);

  const identifyUser = useCallback(async () => {
    if (!ldClient) {
      console.warn("[LaunchDarkly] Client not available for identify");
      setIsIdentified(true);
      return;
    }

    try {
      const user = await authService.getMe();
      const tenantId = user.tenantId || null;
      const userId = user.id || "anonymous";

      const userEmail = user.email || "";
      const context = tenantId
        ? {
            kind: "multi" as const,
            Tenant: {
              key: tenantId,
            },
            User: {
              key: userId,
            },
            Email: {
              key: userEmail,
            },
          }
        : {
            kind: "user" as const,
            key: userId,
          };

      await ldClient.identify(context);
      console.log("[LaunchDarkly] User identified:", {
        tenantId,
        userId,
        email: userEmail,
      });
    } catch (error) {
      console.error("[LaunchDarkly] Failed to identify user:", error);
    } finally {
      setIsIdentified(true);
    }
  }, [ldClient]);

  return { identifyUser, isIdentified };
}
