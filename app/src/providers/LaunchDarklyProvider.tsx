import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  asyncWithLDProvider,
  useLDClient,
} from "launchdarkly-react-client-sdk";
import Observability from "@launchdarkly/observability";
import SessionReplay from "@launchdarkly/session-replay";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { authService } from "../services";

interface LaunchDarklyProviderProps {
  children: ReactNode;
}

/**
 * LaunchDarkly Provider Component
 * Wraps the app with LaunchDarkly context for feature flags
 */
export function LaunchDarklyProvider({ children }: LaunchDarklyProviderProps) {
  const [LDProvider, setLDProvider] = useState<React.ComponentType<{
    children: ReactNode;
  }> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeLaunchDarkly = async () => {
      const clientSideID = import.meta.env.VITE_LAUNCHDARKLY_CLIENT_ID;

      // If no client ID is provided, render children without LaunchDarkly
      if (!clientSideID) {
        console.warn(
          "LaunchDarkly client ID not found. Feature flags will default to false. Set VITE_LAUNCHDARKLY_CLIENT_ID in your .env file.",
        );
        setLDProvider(() => ({ children }: { children: ReactNode }) => (
          <>{children}</>
        ));
        return;
      }

      try {
        // Initialize with anonymous user - will be updated via identify() after login
        const context = {
          kind: "user",
          key: "anonymous",
        };

        const Provider = await asyncWithLDProvider({
          clientSideID,
          context,
          options: {
            streaming: true,
            plugins: [
              new Observability({
                tracingOrigins: true,
                networkRecording: {
                  enabled: true,
                  recordHeadersAndBody: true,
                },
              }),
              new SessionReplay({
                privacySetting: "default",
              }),
            ],
          },
        });

        setLDProvider(() => Provider);
      } catch (err) {
        console.error("Failed to initialize LaunchDarkly:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        // Fallback to rendering children without LaunchDarkly
        setLDProvider(() => ({ children }: { children: ReactNode }) => (
          <>{children}</>
        ));
      }
    };

    initializeLaunchDarkly();
  }, []);

  // Show loading state while initializing
  if (!LDProvider) {
    return <DashboardSkeleton />;
  }

  // Show error state if initialization failed
  if (error) {
    console.error("LaunchDarkly initialization error:", error);
  }

  return (
    <LDProvider>
      <LaunchDarklyIdentifier>{children}</LaunchDarklyIdentifier>
    </LDProvider>
  );
}

/**
 * Component to identify user in LaunchDarkly after provider is initialized
 * This runs at the root level so user context is available on all pages
 */
function LaunchDarklyIdentifier({ children }: { children: ReactNode }) {
  const ldClient = useLDClient();

  useEffect(() => {
    const identifyUser = async () => {
      if (!ldClient) return;

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
                email: userEmail,
              },
            }
          : {
              kind: "user" as const,
              key: userId,
              email: userEmail,
            };

        await ldClient.identify(context);
        console.log("[LaunchDarkly] User identified:", {
          tenantId,
          userId,
          email: userEmail,
        });
      } catch {
        // User not authenticated or error fetching - stay anonymous
        console.log("[LaunchDarkly] User not authenticated, staying anonymous");
      }
    };

    identifyUser();
  }, [ldClient]);

  return <>{children}</>;
}
