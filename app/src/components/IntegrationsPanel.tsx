import {
  IntegrationCard,
  ConfirmationModal,
  Banner,
  Text,
} from "@vonlabs/design-components";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  useIntegrations,
  useAuthorizeIntegration,
  useCheckAllAuthStatuses,
  useRevokeIntegration,
  useCancelAuthorization,
} from "../hooks/useIntegrations";
import { IntegrationType, AuthenticationStatus } from "../services";

export interface Integration {
  id: string;
  name: string;
  integrationLogoPath: string;
  enabled: boolean;
}

export interface IntegrationsPanelProps {
  onIntegrationToggle?: (id: string, enabled: boolean) => void;
}

/**
 * Map integration type to logo path
 */
function getIntegrationLogoPath(type: IntegrationType): string {
  const logoMap: Record<IntegrationType, string> = {
    [IntegrationType.SALESFORCE]: "/Images/salesforce.svg",
    [IntegrationType.GONG]: "/Images/gong.svg",
    [IntegrationType.HUBSPOT]: "/Images/hubspot.svg",
  };
  return logoMap[type] || "/Images/default-integration.svg";
}

/**
 * IntegrationsPanel - Displays and manages integrations with React Query
 */
export function IntegrationsPanel({
  onIntegrationToggle,
}: IntegrationsPanelProps) {
  // Fetch integrations with React Query
  const {
    data: integrationsData,
    isLoading,
    error,
    refetch,
  } = useIntegrations();

  // OAuth authorization mutation
  const authorizeIntegration = useAuthorizeIntegration();

  // OAuth revocation mutation
  const revokeIntegration = useRevokeIntegration();

  // OAuth cancellation mutation
  const cancelAuthorization = useCancelAuthorization();

  // Track authenticating integrations for polling
  const authenticatingIds =
    integrationsData?.integrations
      .filter(
        (i: { authenticationStatus: string }) =>
          i.authenticationStatus === AuthenticationStatus.AUTHENTICATING,
      )
      .map((i: { id: string }) => i.id) || [];

  // Poll all authenticating integrations concurrently
  const { timedOutIntegrations } = useCheckAllAuthStatuses(authenticatingIds);

  // Error state for OAuth operations
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Track timeout warnings that have been shown
  const [shownTimeoutWarnings, setShownTimeoutWarnings] = useState<Set<string>>(
    new Set(),
  );

  // Disable confirmation modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    integrationName: string;
    resolver?: (value: boolean) => void;
  }>({
    isOpen: false,
    integrationName: "",
  });

  // Ref to track pending resolver for cleanup
  const pendingResolverRef = useRef<((value: boolean) => void) | null>(null);

  // Track which integration is currently loading
  const [loadingIntegrationId, setLoadingIntegrationId] = useState<
    string | null
  >(null);

  // Cleanup pending resolver on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pendingResolverRef.current) {
        pendingResolverRef.current(false);
        pendingResolverRef.current = null;
      }
    };
  }, []);

  // Transform backend integrations to display format
  const integrations: Integration[] = useMemo(
    () =>
      integrationsData?.integrations.map(
        (backendIntegration: {
          id: string;
          provider: string;
          type: IntegrationType;
          authenticationStatus: string;
        }) => ({
          id: backendIntegration.id,
          name: backendIntegration.provider,
          integrationLogoPath: getIntegrationLogoPath(backendIntegration.type),
          enabled:
            backendIntegration.authenticationStatus ===
            AuthenticationStatus.AUTHENTICATED,
        }),
      ) || [],
    [integrationsData],
  );

  const handleToggle = async (id: string, enabled: boolean) => {
    // Clear any previous errors
    setOauthError(null);

    if (enabled) {
      setShownTimeoutWarnings((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      setLoadingIntegrationId(id);
      authorizeIntegration.mutate(id, {
        onSuccess: () => setLoadingIntegrationId(null),
        onError: (error: Error) => {
          setLoadingIntegrationId(null);
          setOauthError(error.message);
        },
      });
    } else {
      const confirmed = await new Promise<boolean>((resolve) => {
        const integration = integrations.find((i) => i.id === id);
        pendingResolverRef.current = resolve;
        setModalState({
          isOpen: true,
          integrationName: integration?.name || "this integration",
          resolver: resolve,
        });
      });

      // Clear resolver after promise completes
      pendingResolverRef.current = null;

      if (confirmed) {
        setLoadingIntegrationId(id);
        revokeIntegration.mutate(id, {
          onSuccess: () => {
            setLoadingIntegrationId(null);
            onIntegrationToggle?.(id, false);
          },
          onError: (error: Error) => {
            setLoadingIntegrationId(null);
            setOauthError(`Failed to revoke integration: ${error.message}`);
          },
        });
      }
    }
  };

  const handleModalConfirm = () => {
    modalState.resolver?.(true);
    pendingResolverRef.current = null;
    setModalState({ isOpen: false, integrationName: "" });
  };

  const handleModalCancel = () => {
    modalState.resolver?.(false);
    pendingResolverRef.current = null;
    setModalState({ isOpen: false, integrationName: "" });
  };

  useEffect(() => {
    timedOutIntegrations.forEach((id) => {
      if (!shownTimeoutWarnings.has(id)) {
        const integration = integrations.find((i) => i.id === id);
        if (integration) {
          setOauthError(
            `Authentication for ${integration.name} timed out. The popup may have been closed or authentication was not completed. Please try enabling it again.`,
          );
          setShownTimeoutWarnings((prev) => new Set(prev).add(id));
          cancelAuthorization.mutate(id);
        }
      }
    });
  }, [
    timedOutIntegrations,
    shownTimeoutWarnings,
    integrations,
    cancelAuthorization,
  ]);


  const emptyStateContainerStyle: React.CSSProperties = {
    padding: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={emptyStateContainerStyle}>
        <Text variant="body" color="secondary">
          Loading integrations...
        </Text>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500">
          Failed to load integrations:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state - only show if data is loaded and truly empty
  if (!isLoading && (!integrationsData || integrations.length === 0)) {
    return (
      <div style={emptyStateContainerStyle}>
        <Text variant="body" color="secondary">
          No integrations available
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", width: "100%" }}>
      {oauthError && (
        <div style={{ marginBottom: "16px" }}>
          <Banner
            variant="warning"
            message={oauthError}
            onClose={() => setOauthError(null)}
            dismissible={true}
          />
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        {integrations.map((integration) => {
          const backendIntegration = integrationsData?.integrations.find(
            (i: { id: string }) => i.id === integration.id,
          );
          const isAuthenticating =
            backendIntegration?.authenticationStatus ===
            AuthenticationStatus.AUTHENTICATING;
          const isTimedOut = timedOutIntegrations.includes(integration.id);
          const isLoading =
            loadingIntegrationId === integration.id ||
            (isAuthenticating && !isTimedOut);

          return (
            <IntegrationCard
              key={integration.id}
              name={integration.name}
              integrationLogoPath={integration.integrationLogoPath}
              enabled={integration.enabled}
              disabled={isLoading}
              loadingText={isLoading ? "Authenticating" : undefined}
              onToggle={(enabled) => handleToggle(integration.id, enabled)}
            />
          );
        })}
      </div>

      <ConfirmationModal
        isOpen={modalState.isOpen}
        title="Disable Integration"
        message={`Are you sure you want to disable ${modalState.integrationName}? This will revoke access and you'll need to re-authenticate to enable it again.`}
        confirmText="Disable"
        cancelText="Cancel"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
}
