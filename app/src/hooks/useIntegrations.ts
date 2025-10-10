import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Query } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { integrationsService } from "../services";

/**
 * Type for auth status response
 */
interface AuthStatusResponse {
  status: string;
  integrationId: string;
  message: string;
}

/**
 * Fetch integrations list with React Query
 */
export function useIntegrations() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: () => integrationsService.getIntegrations(),
  });
}

/**
 * Initiate OAuth authorization
 */
export function useAuthorizeIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const data =
        await integrationsService.authorizeIntegration(integrationId);

      // Open OAuth URL in new tab
      const oauthWindow = window.open(data.authorizationUrl, "_blank");

      // Give popup time to be blocked before checking (async popup blockers)
      await new Promise<void>((resolve) => setTimeout(resolve, 100));

      if (!oauthWindow || oauthWindow.closed) {
        throw new Error("POPUP_BLOCKED");
      }

      return data;
    },
    onSuccess: (data: {
      authorizationUrl: string;
      status: string;
      integrationId: string;
      message: string;
    }) => {
      // Invalidate integrations to refetch and pick up AUTHENTICATING status
      queryClient.invalidateQueries({ queryKey: ["integrations"] });

      if (import.meta.env.DEV) {
        console.log("[useAuthorizeIntegration] OAuth initiated:", data);
      }
    },
    onError: (error: Error) => {
      console.error("[useAuthorizeIntegration] Error:", error);

      // Don't use alert - let the UI component handle the error display
      if (error.message === "POPUP_BLOCKED") {
        // Re-throw with user-friendly message for UI to handle
        throw new Error(
          "Please allow popups for this site to complete OAuth authorization",
        );
      }
    },
  });
}

/**
 * Check auth status with polling for a single integration
 * Auto-enables when integration is in AUTHENTICATING state
 */
export function useCheckAuthStatus(
  integrationId: string | null,
  isAuthenticating: boolean,
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["auth-status", integrationId],
    queryFn: () => {
      if (!integrationId) {
        throw new Error("Integration ID is required");
      }
      if (import.meta.env.DEV) {
        console.log(
          "[useCheckAuthStatus] Polling auth status for integration:",
          integrationId,
        );
      }
      return integrationsService.checkAuthStatus(integrationId);
    },
    enabled: !!integrationId && isAuthenticating, // Only poll when AUTHENTICATING
    refetchInterval: (query: Query<AuthStatusResponse>) => {
      const data = query.state.data;

      if (import.meta.env.DEV) {
        console.log("[useCheckAuthStatus] refetchInterval check, data:", data);
      }

      // Stop polling if authenticated or failed
      if (
        data?.status === "AUTHENTICATED" ||
        data?.status === "AUTHENTICATION_FAILED"
      ) {
        if (import.meta.env.DEV) {
          console.log(
            "[useCheckAuthStatus] Stopping polling, final status:",
            data.status,
          );
        }
        return false;
      }

      // Poll every 3 seconds while AUTHENTICATING
      if (import.meta.env.DEV) {
        console.log("[useCheckAuthStatus] Continuing polling every 3 seconds");
      }
      return 3000;
    },
    refetchIntervalInBackground: true, // Continue polling even when tab is not focused
  });

  // React Query v5: Use useEffect instead of onSuccess callback
  useEffect(() => {
    const data = query.data;

    if (!data) return;

    if (import.meta.env.DEV) {
      console.log("[useCheckAuthStatus] Data changed:", data);
    }

    if (data.status === "AUTHENTICATED") {
      if (import.meta.env.DEV) {
        console.log("[useCheckAuthStatus] Authentication complete:", data);
      }

      // Refetch integrations to update UI
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    } else if (data.status === "AUTHENTICATION_FAILED") {
      console.error(
        "[useCheckAuthStatus] Authentication failed:",
        data.message,
      );

      // Refetch integrations to show failed state
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    }
  }, [query.data, queryClient]);

  return query;
}

/**
 * Poll all authenticating integrations
 * This hook dynamically creates polling queries for each integration in AUTHENTICATING state
 */
export function useCheckAllAuthStatuses(authenticatingIds: string[]) {
  const queryClient = useQueryClient();

  // Track which integrations have already been processed to avoid duplicate invalidations
  const processedStatusesRef = useRef<Set<string>>(new Set());

  // Create a query for each authenticating integration
  const queries = authenticatingIds.map((id) => ({
    queryKey: ["auth-status", id],
    queryFn: () => {
      if (import.meta.env.DEV) {
        console.log(
          "[useCheckAllAuthStatuses] Polling auth status for integration:",
          id,
        );
      }
      return integrationsService.checkAuthStatus(id);
    },
    enabled: true,
    refetchInterval: (query: Query<AuthStatusResponse>) => {
      const data = query.state.data;

      // Stop polling if authenticated or failed
      if (
        data?.status === "AUTHENTICATED" ||
        data?.status === "AUTHENTICATION_FAILED"
      ) {
        if (import.meta.env.DEV) {
          console.log(
            "[useCheckAllAuthStatuses] Stopping polling for",
            id,
            "- status:",
            data.status,
          );
        }
        return false;
      }

      // Poll every 3 seconds while AUTHENTICATING
      return 3000;
    },
    refetchIntervalInBackground: true,
  }));

  // Use useQueries to poll all at once
  const results = useQueries({
    queries,
  });

  // Watch for status changes and invalidate integrations list
  // Use a stable comparison to avoid infinite loops
  useEffect(() => {
    let hasChanges = false;

    results.forEach((result: { data?: AuthStatusResponse }, index: number) => {
      const data = result.data;
      if (!data) return;

      const integrationId = authenticatingIds[index];
      const statusKey = `${integrationId}-${data.status}`;

      if (
        data.status === "AUTHENTICATED" ||
        data.status === "AUTHENTICATION_FAILED"
      ) {
        // Only process if we haven't seen this status change before
        if (!processedStatusesRef.current.has(statusKey)) {
          if (import.meta.env.DEV) {
            console.log(
              "[useCheckAllAuthStatuses] Integration",
              integrationId,
              "status changed:",
              data.status,
            );
          }

          processedStatusesRef.current.add(statusKey);
          hasChanges = true;
        }
      }
    });

    // Only invalidate once if there were any changes
    if (hasChanges) {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    results.map((r: { data?: AuthStatusResponse }) => r.data?.status).join(","),
    queryClient,
  ]);

  // Clean up processed statuses when integrations change
  useEffect(() => {
    // Remove processed statuses for integrations no longer authenticating
    processedStatusesRef.current.forEach((key) => {
      const integrationId = key.split("-")[0];
      if (!authenticatingIds.includes(integrationId)) {
        processedStatusesRef.current.delete(key);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticatingIds.join(",")]);

  return results;
}

/**
 * Revoke OAuth authorization for an integration
 */
export function useRevokeIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (integrationId: string) =>
      integrationsService.revokeIntegration(integrationId),
    onSuccess: (data: {
      status: string;
      integrationId: string;
      message: string;
    }) => {
      if (import.meta.env.DEV) {
        console.log("[useRevokeIntegration] Revocation successful:", data);
      }

      // Invalidate integrations to refetch and update UI
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
    onError: (error: Error) => {
      console.error("[useRevokeIntegration] Error:", error);
      // Don't use alert - let the UI component handle error display
      // The component should check for mutation error state
    },
  });
}
