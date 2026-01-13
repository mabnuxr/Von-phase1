import { useCallback } from "react";
import { useLDClient } from "launchdarkly-react-client-sdk";
import { authService } from "../services";

/**
 * Hook to identify user in LaunchDarkly after login
 * Call this after successful authentication to update the LaunchDarkly context
 */
export function useLaunchDarklyIdentify() {
  const ldClient = useLDClient();

  const identifyUser = useCallback(async () => {
    if (!ldClient) {
      console.warn("[LaunchDarkly] Client not available for identify");
      return;
    }

    try {
      const user = await authService.getMe();
      const tenantId = user.tenantId || null;
      const userId = user.id || "anonymous";

      const context = tenantId
        ? {
            kind: "multi" as const,
            Tenant: {
              key: tenantId,
            },
            User: {
              key: userId,
            },
          }
        : {
            kind: "user" as const,
            key: userId,
          };

      await ldClient.identify(context);
      console.log("[LaunchDarkly] User identified:", { tenantId, userId });
    } catch (error) {
      console.error("[LaunchDarkly] Failed to identify user:", error);
    }
  }, [ldClient]);

  return { identifyUser };
}
