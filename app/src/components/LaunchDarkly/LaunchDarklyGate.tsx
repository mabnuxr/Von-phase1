import { useContext } from "react";
import type { ReactNode } from "react";
import { LaunchDarklyIdentityContext } from "./LaunchDarklyIdentityContext";

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
