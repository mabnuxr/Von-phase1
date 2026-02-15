import { createContext, useContext } from "react";
import type { ReactNode } from "react";

/**
 * Context that indicates whether the LaunchDarkly user identity has been resolved.
 * Set by AuthenticatedLayout after `ldClient.identify()` completes.
 */
export const LaunchDarklyIdentityContext = createContext(false);

interface LaunchDarklyGateProps {
  fallback: ReactNode;
  children: ReactNode;
}

/**
 * Renders `children` once LaunchDarkly identity is resolved,
 * otherwise renders `fallback`.
 *
 * Use this inside authenticated routes to gate content behind
 * the correct feature-flag context.
 *
 * @example
 * ```tsx
 * <LaunchDarklyGate fallback={<DashboardSkeleton />}>
 *   <DashboardContent />
 * </LaunchDarklyGate>
 * ```
 */
export function LaunchDarklyGate({ fallback, children }: LaunchDarklyGateProps) {
  const isIdentified = useContext(LaunchDarklyIdentityContext);

  if (!isIdentified) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
