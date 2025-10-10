import { IntegrationCard, ConfirmationModal, Banner } from "@vonlabs/design-components";
import { useState, useRef, useEffect } from "react";
import {
  useIntegrations,
  useAuthorizeIntegration,
  useCheckAllAuthStatuses,
  useRevokeIntegration,
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
export function IntegrationsPanel({ onIntegrationToggle }: IntegrationsPanelProps) {
  // Fetch integrations with React Query
  const { data: integrationsData, isLoading, error, refetch } = useIntegrations();

  // OAuth authorization mutation
  const authorizeIntegration = useAuthorizeIntegration();

  // OAuth revocation mutation
  const revokeIntegration = useRevokeIntegration();

  // Track authenticating integrations for polling
  const authenticatingIds = integrationsData?.integrations
    .filter((i) => i.authenticationStatus === AuthenticationStatus.AUTHENTICATING)
    .map((i) => i.id) || [];

  // Poll all authenticating integrations concurrently
  useCheckAllAuthStatuses(authenticatingIds);

  // Error state for popup blocker
  const [popupError, setPopupError] = useState<string | null>(null);

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
  const [loadingIntegrationId, setLoadingIntegrationId] = useState<string | null>(null);

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
  const integrations: Integration[] = integrationsData?.integrations.map((backendIntegration) => ({
    id: backendIntegration.id,
    name: backendIntegration.provider,
    integrationLogoPath: getIntegrationLogoPath(backendIntegration.type),
    enabled: backendIntegration.authenticationStatus === AuthenticationStatus.AUTHENTICATED,
  })) || [];

  const handleToggle = async (id: string, enabled: boolean) => {
    // Clear any previous popup errors
    setPopupError(null);

    if (enabled) {
      // Set loading state
      setLoadingIntegrationId(id);

      // Enable: Initiate OAuth
      authorizeIntegration.mutate(id, {
        onSuccess: () => {
          // Keep loading state until status changes to AUTHENTICATING
          setTimeout(() => setLoadingIntegrationId(null), 1000);
        },
        onError: (error) => {
          setLoadingIntegrationId(null);
          if (error instanceof Error && error.message.includes("popup")) {
            setPopupError(error.message);
          }
        },
      });
    } else {
      // Disable: Show confirmation
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
        // Set loading state
        setLoadingIntegrationId(id);

        // Revoke OAuth authorization
        revokeIntegration.mutate(id, {
          onSuccess: () => {
            setLoadingIntegrationId(null);
            onIntegrationToggle?.(id, false);
          },
          onError: () => {
            setLoadingIntegrationId(null);
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading integrations...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500">
          Failed to load integrations: {error instanceof Error ? error.message : "Unknown error"}
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

  // Empty state
  if (integrations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No integrations available</div>
      </div>
    );
  }

  return (
    <>
      {popupError && (
        <Banner
          variant="warning"
          message={popupError}
          onClose={() => setPopupError(null)}
          dismissible={true}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => {
          const backendIntegration = integrationsData?.integrations.find(i => i.id === integration.id);
          const isAuthenticating = backendIntegration?.authenticationStatus === AuthenticationStatus.AUTHENTICATING;
          const isLoading = loadingIntegrationId === integration.id || isAuthenticating;

          return (
            <IntegrationCard
              key={integration.id}
              name={integration.name}
              integrationLogoPath={integration.integrationLogoPath}
              enabled={integration.enabled}
              disabled={isLoading}
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
    </>
  );
}
