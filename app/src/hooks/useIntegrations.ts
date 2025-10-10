import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Query } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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
 * OAuth polling timeout - 30 seconds for testing
 */
const OAUTH_POLLING_TIMEOUT_MS = 30 * 1000;

/**
 * Tracks polling start times per integration
 */
const pollingStartTimes = new Map<string, number>();

/**
 * Check auth status with polling for a single integration
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
      return integrationsService.checkAuthStatus(integrationId);
    },
    enabled: !!integrationId && isAuthenticating,
    refetchInterval: (query: Query<AuthStatusResponse>) => {
      const data = query.state.data;

      if (
        data?.status === "AUTHENTICATED" ||
        data?.status === "AUTHENTICATION_FAILED"
      ) {
        return false;
      }

      if (integrationId) {
        const startTime = pollingStartTimes.get(integrationId);
        if (startTime && Date.now() - startTime > OAUTH_POLLING_TIMEOUT_MS) {
          pollingStartTimes.delete(integrationId);
          return false;
        }
      }

      return 3000;
    },
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (
      integrationId &&
      isAuthenticating &&
      !pollingStartTimes.has(integrationId)
    ) {
      pollingStartTimes.set(integrationId, Date.now());
    }
  }, [integrationId, isAuthenticating]);

  useEffect(() => {
    const data = query.data;
    if (!data) return;

    if (
      data.status === "AUTHENTICATED" ||
      data.status === "AUTHENTICATION_FAILED"
    ) {
      if (integrationId) {
        pollingStartTimes.delete(integrationId);
      }
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    }
  }, [query.data, queryClient, integrationId]);

  return query;
}

/**
 * Poll all authenticating integrations with timeout support
 */
export function useCheckAllAuthStatuses(authenticatingIds: string[]) {
  const queryClient = useQueryClient();
  const processedStatusesRef = useRef<Set<string>>(new Set());
  const [, setTimedOutSet] = useState<Set<string>>(new Set());
  const timedOutIntegrationsRef = useRef<Set<string>>(new Set());

  // Initialize polling timers before creating queries
  authenticatingIds.forEach((id) => {
    if (
      !pollingStartTimes.has(id) &&
      !timedOutIntegrationsRef.current.has(id)
    ) {
      pollingStartTimes.set(id, Date.now());
    }
  });

  // Cleanup polling state for integrations no longer authenticating
  useEffect(() => {
    pollingStartTimes.forEach((_, id) => {
      if (!authenticatingIds.includes(id)) {
        pollingStartTimes.delete(id);
      }
    });

    let hasTimeoutChanges = false;
    timedOutIntegrationsRef.current.forEach((id) => {
      if (!authenticatingIds.includes(id)) {
        timedOutIntegrationsRef.current.delete(id);
        hasTimeoutChanges = true;
      }
    });

    if (hasTimeoutChanges) {
      setTimedOutSet(new Set(timedOutIntegrationsRef.current));
    }
  }, [authenticatingIds]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    const currentAuthenticatingIds = authenticatingIds;
    const currentTimedOutRef = timedOutIntegrationsRef;

    return () => {
      // Clean up all polling state for this component's integrations
      currentAuthenticatingIds.forEach((id) => {
        pollingStartTimes.delete(id);
        currentTimedOutRef.current.delete(id);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeAuthenticatingIds = authenticatingIds.filter(
    (id) => !timedOutIntegrationsRef.current.has(id),
  );

  const queries = activeAuthenticatingIds.map((id) => ({
    queryKey: ["auth-status", id],
    queryFn: () => integrationsService.checkAuthStatus(id),
    enabled: true,
    refetchInterval: (query: Query<AuthStatusResponse>) => {
      const data = query.state.data;

      if (
        data?.status === "AUTHENTICATED" ||
        data?.status === "AUTHENTICATION_FAILED"
      ) {
        pollingStartTimes.delete(id);
        timedOutIntegrationsRef.current.delete(id);
        return false;
      }

      const startTime = pollingStartTimes.get(id);
      const elapsed = startTime ? Date.now() - startTime : 0;

      if (startTime && elapsed > OAUTH_POLLING_TIMEOUT_MS) {
        timedOutIntegrationsRef.current.add(id);
        pollingStartTimes.delete(id);
        setTimedOutSet(new Set(timedOutIntegrationsRef.current));
        return false;
      }

      return 3000;
    },
    refetchIntervalInBackground: true,
  }));

  const results = useQueries({ queries });

  // Extract status string for stable dependency
  const resultsStatusKey = results
    .map((r: { data?: AuthStatusResponse }) => r.data?.status)
    .join(",");

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
        if (!processedStatusesRef.current.has(statusKey)) {
          processedStatusesRef.current.add(statusKey);
          hasChanges = true;
        }
      }
    });

    timedOutIntegrationsRef.current.forEach((id) => {
      if (authenticatingIds.includes(id)) {
        hasChanges = true;
      }
    });

    if (hasChanges) {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsStatusKey, queryClient]);

  useEffect(() => {
    processedStatusesRef.current.forEach((key) => {
      const integrationId = key.split("-")[0];
      if (!authenticatingIds.includes(integrationId)) {
        processedStatusesRef.current.delete(key);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticatingIds.join(",")]);

  return {
    results,
    timedOutIntegrations: Array.from(timedOutIntegrationsRef.current),
  };
}

export function hasIntegrationTimedOut(integrationId: string): boolean {
  const startTime = pollingStartTimes.get(integrationId);
  if (!startTime) return false;
  return Date.now() - startTime > OAUTH_POLLING_TIMEOUT_MS;
}

export function resetPollingTimeout(integrationId: string): void {
  pollingStartTimes.delete(integrationId);
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

/**
 * Cancel pending OAuth authorization
 * Useful for cleaning up stuck AUTHENTICATING states
 */
export function useCancelAuthorization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (integrationId: string) => {
      // Reset polling timeout first
      resetPollingTimeout(integrationId);
      // Then cancel on backend
      return integrationsService.cancelAuthorization(integrationId);
    },
    onSuccess: (data: {
      status: string;
      integrationId: string;
      message: string;
    }) => {
      if (import.meta.env.DEV) {
        console.log("[useCancelAuthorization] Cancellation successful:", data);
      }

      // Invalidate integrations to refetch and update UI
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      // Also clear the auth-status query cache
      queryClient.invalidateQueries({
        queryKey: ["auth-status", data.integrationId],
      });
    },
    onError: (error: Error) => {
      console.error("[useCancelAuthorization] Error:", error);
    },
  });
}
