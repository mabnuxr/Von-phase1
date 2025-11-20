import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { asyncWithLDProvider } from "launchdarkly-react-client-sdk";

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
        // Get user and tenant context from localStorage
        const userId = localStorage.getItem("user_id") || "anonymous";
        const tenantId = localStorage.getItem("tenant_id");

        // Build multi-context for LaunchDarkly
        const context = tenantId
          ? {
              kind: "multi",
              user: {
                key: userId,
              },
              tenant: {
                key: tenantId,
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
            bootstrap: "localStorage", // Cache flags in localStorage
            streaming: true, // Enable streaming
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (error) {
    console.error("LaunchDarkly initialization error:", error);
  }

  return <LDProvider>{children}</LDProvider>;
}
