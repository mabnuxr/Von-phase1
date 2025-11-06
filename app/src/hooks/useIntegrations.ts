import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Query } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { integrationsService } from "../services";
import type { IntegrationType } from "../services";
import {
  OAUTH_POLLING_TIMEOUT_MS,
  OAUTH_POLLING_INTERVAL_MS,
  OAUTH_POPUP_CHECK_DELAY_MS,
} from "../config/constants";

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

      // Check if popup was blocked - multiple detection methods
      if (!oauthWindow) {
        throw new Error("POPUP_BLOCKED");
      }

      // Check if window is actually open after a brief delay
      // Some browsers allow the window.open() call but close it immediately
      await new Promise<void>((resolve) =>
        setTimeout(resolve, OAUTH_POPUP_CHECK_DELAY_MS),
      );

      if (oauthWindow.closed) {
        throw new Error("POPUP_BLOCKED");
      }

      // Additional check: try to access window properties
      // If blocked, this will either throw or return null/undefined
      try {
        // This will throw if popup was blocked by stricter blockers
        if (!oauthWindow.location) {
          throw new Error("POPUP_BLOCKED");
        }
      } catch (e) {
        // Some browsers throw when accessing .location on blocked popups
        // Check if it's a security error (indicates blocked popup)
        if (
          e instanceof Error &&
          (e.name === "SecurityError" || e.message.includes("cross-origin"))
        ) {
          // This is actually okay - cross-origin restriction means popup opened successfully
          // The popup is on a different domain (OAuth provider)
        } else {
          throw new Error("POPUP_BLOCKED");
        }
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate integrations to refetch and pick up AUTHENTICATING status
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) {
        console.error("[useAuthorizeIntegration] Error:", error);
      }

      // Don't use alert - let the UI component handle the error display
      if (error.message === "POPUP_BLOCKED") {
        throw new Error(
          "Please allow popups for this site to complete OAuth authorization",
        );
      }
    },
  });
}

/**
 * Check auth status with polling for a single integration
 */
export function useCheckAuthStatus(
  integrationId: string | null,
  isAuthenticating: boolean,
) {
  const queryClient = useQueryClient();
  const pollingStartTimeRef = useRef<number | null>(null);

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

      if (pollingStartTimeRef.current) {
        const elapsed = Date.now() - pollingStartTimeRef.current;
        if (elapsed > OAUTH_POLLING_TIMEOUT_MS) {
          pollingStartTimeRef.current = null;
          return false;
        }
      }

      return OAUTH_POLLING_INTERVAL_MS;
    },
    refetchIntervalInBackground: true,
  });

  // Initialize polling start time when authentication begins
  useEffect(() => {
    if (integrationId && isAuthenticating && !pollingStartTimeRef.current) {
      pollingStartTimeRef.current = Date.now();
    }
  }, [integrationId, isAuthenticating]);

  // Handle completion and cleanup
  useEffect(() => {
    const data = query.data;
    if (!data) return;

    if (
      data.status === "AUTHENTICATED" ||
      data.status === "AUTHENTICATION_FAILED"
    ) {
      pollingStartTimeRef.current = null;
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    }
  }, [query.data, queryClient, integrationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pollingStartTimeRef.current = null;
    };
  }, []);

  return query;
}

/**
 * Poll all authenticating integrations with timeout support
 * Uses per-instance refs to avoid memory leaks from shared state
 */
export function useCheckAllAuthStatuses(authenticatingIds: string[]) {
  const queryClient = useQueryClient();
  const processedStatusesRef = useRef<Set<string>>(new Set());
  const [, setTimedOutSet] = useState<Set<string>>(new Set());
  const timedOutIntegrationsRef = useRef<Set<string>>(new Set());

  // Per-instance polling start times (no shared module state)
  const pollingStartTimesRef = useRef<Map<string, number>>(new Map());

  // Initialize polling timers for new authenticating integrations
  useEffect(() => {
    authenticatingIds.forEach((id) => {
      if (
        !pollingStartTimesRef.current.has(id) &&
        !timedOutIntegrationsRef.current.has(id)
      ) {
        pollingStartTimesRef.current.set(id, Date.now());
      }
    });
  }, [authenticatingIds]);

  // Cleanup polling state for integrations no longer authenticating
  useEffect(() => {
    const startTimes = pollingStartTimesRef.current;

    // Remove stale polling timers
    Array.from(startTimes.keys()).forEach((id) => {
      if (!authenticatingIds.includes(id)) {
        startTimes.delete(id);
      }
    });

    // Remove stale timeout states
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
    const startTimesRef = pollingStartTimesRef.current;
    const timedOutRef = timedOutIntegrationsRef.current;

    return () => {
      // Clean up all polling state
      startTimesRef.clear();
      timedOutRef.clear();
    };
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
        pollingStartTimesRef.current.delete(id);
        timedOutIntegrationsRef.current.delete(id);
        return false;
      }

      const startTime = pollingStartTimesRef.current.get(id);
      const elapsed = startTime ? Date.now() - startTime : 0;

      if (startTime && elapsed > OAUTH_POLLING_TIMEOUT_MS) {
        timedOutIntegrationsRef.current.add(id);
        pollingStartTimesRef.current.delete(id);
        setTimedOutSet(new Set(timedOutIntegrationsRef.current));
        return false;
      }

      return OAUTH_POLLING_INTERVAL_MS;
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

      const integrationId = activeAuthenticatingIds[index];
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
      // Cancel on backend - polling state will be cleaned up by component unmount
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

/**
 * Create a new integration
 */
export function useCreateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      type: IntegrationType;
      accessLevel: "tenant" | "user";
      config: Record<string, unknown>;
      name?: string;
      accessKey?: string;
      accessSecret?: string;
    }) => integrationsService.createIntegration(data),
    onSuccess: () => {
      // Invalidate integrations to refetch and show the new integration
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) {
        console.error("[useCreateIntegration] Error:", error);
      }
    },
  });
}

/**
 * Update an existing integration
 */
export function useUpdateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      integrationId,
      data,
    }: {
      integrationId: string;
      data: {
        accessLevel?: "tenant" | "user";
        config?: Record<string, unknown>;
        name?: string;
        accessKey?: string;
        accessSecret?: string;
      };
    }) => integrationsService.updateIntegration(integrationId, data),
    onSuccess: () => {
      // Invalidate integrations to refetch and show the updated integration
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) {
        console.error("[useUpdateIntegration] Error:", error);
      }
    },
  });
}
