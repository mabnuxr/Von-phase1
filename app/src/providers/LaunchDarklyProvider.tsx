import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { asyncWithLDProvider } from "launchdarkly-react-client-sdk";
// import Observability from "@launchdarkly/observability";
// import SessionReplay from "@launchdarkly/session-replay";
import { getUserContextFromToken } from "../lib/auth";
import { DashboardSkeleton } from "../components/DashboardSkeleton";

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
        // Get user and tenant context by decoding JWT token
        const userContext = getUserContextFromToken();
        const userId = userContext?.userId || "anonymous";
        const tenantId = userContext?.tenantId || null;

        // Build multi-context for LaunchDarkly
        // Note: Using capital Tenant and User to match LaunchDarkly segment configuration
        const context = tenantId
          ? {
              kind: "multi",
              Tenant: {
                key: tenantId,
              },
              User: {
                key: userId,
              },
            }
          : {
              kind: "user",
              key: userId,
            };

        const Provider = await asyncWithLDProvider({
          clientSideID,
          context,
          options: {
            bootstrap: "localStorage",
            streaming: true,
            plugins: [
              // new Observability({
              //   tracingOrigins: true,
              //   networkRecording: {
              //     enabled: true,
              //     recordHeadersAndBody: true,
              //   },
              // }),
              // new SessionReplay({
              //   privacySetting: "default",
              // }),
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

  return <LDProvider>{children}</LDProvider>;
}
