import { ConfirmationModal, Banner, Text } from "@vonlabs/design-components";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  useIntegrations,
  useCheckAllAuthStatuses,
  useDeleteIntegration,
} from "../hooks/useIntegrations";
import { IntegrationType, AuthenticationStatus } from "../services";
import usePreferencesStore from "../store/preferencesStore";
import { WorkspaceIntegrationPane } from "./WorkspaceIntegrationPane";
import { PersonalIntegrationPane } from "./PersonalIntegrationPane";
import { IntegrationsList } from "./IntegrationsList";
import {
  getIntegrationLogoPath,
  getIntegrationDisplayName,
} from "../constants/integrationMetadata";

export interface Integration {
  id: string;
  name: string;
  integrationLogoPath: string;
  enabled: boolean;
  accessLevel: string;
  userId?: string;
  tenantId?: string;
  type: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  authenticationStatus: string;
  isConfigured?: boolean;
}

export interface IntegrationsPanelProps {
  onIntegrationToggle?: (id: string, enabled: boolean) => void;
}

/**
 * IntegrationsPanel - Displays and manages integrations with React Query
 */
export function IntegrationsPanel() {
  // Get config pane setters and tab state from preferences store
  const {
    setConfiguringWorkspaceIntegration,
    setConfiguringPersonalIntegration,
    loadingIntegrationId,
    setLoadingIntegrationId,
  } = usePreferencesStore();

  // Fetch integrations with React Query
  const {
    data: integrationsData,
    isLoading,
    error,
    refetch,
  } = useIntegrations();

  // Delete integration mutation
  const deleteIntegration = useDeleteIntegration();

  // Track authenticating integrations for polling
  // Include loadingIntegrationId since backend may return AUTHENTICATED prematurely
  const authenticatingIdsFromBackend =
    integrationsData?.integrations
      .filter(
        (i: { authenticationStatus: string }) =>
          i.authenticationStatus === AuthenticationStatus.AUTHENTICATING,
      )
      .map((i: { id: string }) => i.id) || [];

  // Combine backend authenticating IDs with frontend loading ID
  const authenticatingIds = loadingIntegrationId
    ? [...new Set([...authenticatingIdsFromBackend, loadingIntegrationId])]
    : authenticatingIdsFromBackend;

  // Poll all authenticating integrations concurrently
  const { timedOutIntegrations } = useCheckAllAuthStatuses(authenticatingIds);

  // Error state for OAuth operations
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Track timeout warnings that have been shown
  const [shownTimeoutWarnings, setShownTimeoutWarnings] = useState<Set<string>>(
    new Set(),
  );

  // Confirmation modal state (for delete and disable)
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    integrationName: string;
    action: "delete" | "disable";
    resolver?: (value: boolean) => void;
  }>({
    isOpen: false,
    integrationName: "",
    action: "delete",
  });

  // Ref to track pending resolver for cleanup
  const pendingResolverRef = useRef<((value: boolean) => void) | null>(null);

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
        (integration: {
          id: string;
          provider: string;
          type: IntegrationType;
          authenticationStatus: string;
          accessLevel: string;
          userId?: string;
          tenantId?: string;
          ownerFirstName?: string;
          ownerLastName?: string;
          isConfigured?: boolean;
        }) => ({
          id: integration.id,
          name: getIntegrationDisplayName(integration.type),
          integrationLogoPath: getIntegrationLogoPath(integration.type),
          enabled:
            integration.authenticationStatus ===
            AuthenticationStatus.AUTHENTICATED,
          accessLevel: integration.accessLevel,
          userId: integration.userId,
          tenantId: integration.tenantId,
          type: integration.type,
          ownerFirstName: integration.ownerFirstName,
          ownerLastName: integration.ownerLastName,
          authenticationStatus: integration.authenticationStatus,
          isConfigured: integration.isConfigured,
        }),
      ) || [],
    [integrationsData],
  );

  const handleModalConfirm = () => {
    modalState.resolver?.(true);
    pendingResolverRef.current = null;
    setModalState({ isOpen: false, integrationName: "", action: "delete" });
  };

  const handleModalCancel = () => {
    modalState.resolver?.(false);
    pendingResolverRef.current = null;
    setModalState({ isOpen: false, integrationName: "", action: "delete" });
  };

  const handleDelete = async (id: string) => {
    const integration = integrations.find((i) => i.id === id);

    const confirmed = await new Promise<boolean>((resolve) => {
      pendingResolverRef.current = resolve;
      setModalState({
        isOpen: true,
        integrationName: integration?.name || "this integration",
        action: "delete",
        resolver: resolve,
      });
    });

    pendingResolverRef.current = null;

    if (confirmed) {
      setLoadingIntegrationId(id);
      deleteIntegration.mutate(id, {
        onSuccess: () => {
          setLoadingIntegrationId(null);
        },
        onError: (error: Error) => {
          setLoadingIntegrationId(null);
          setOauthError(`Failed to delete integration: ${error.message}`);
        },
      });
    }
  };

  const handleConnect = (appId: string, accessLevel: "tenant" | "user") => {
    if (accessLevel === "tenant") {
      setConfiguringWorkspaceIntegration(appId);
    } else {
      setConfiguringPersonalIntegration(appId);
    }
  };

  useEffect(() => {
    timedOutIntegrations.forEach((id) => {
      if (!shownTimeoutWarnings.has(id)) {
        const integration = integrations.find((i) => i.id === id);
        if (integration) {
          setOauthError(
            `Authentication for ${integration.name} timed out. Please try again.`,
          );
          setShownTimeoutWarnings((prev) => new Set(prev).add(id));
          // Delete the integration so user can start fresh (avoids "record already exists" error)
          deleteIntegration.mutate(id);
          setLoadingIntegrationId(null);
        }
      }
    });
  }, [
    timedOutIntegrations,
    shownTimeoutWarnings,
    integrations,
    deleteIntegration,
    setLoadingIntegrationId,
  ]);

  // Clear loadingIntegrationId when integration is successfully authenticated
  useEffect(() => {
    if (loadingIntegrationId) {
      const integration = integrationsData?.integrations.find(
        (i: { id: string }) => i.id === loadingIntegrationId,
      );
      if (
        integration?.authenticationStatus === AuthenticationStatus.AUTHENTICATED
      ) {
        setLoadingIntegrationId(null);
      }
    }
  }, [integrationsData, loadingIntegrationId, setLoadingIntegrationId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Text variant="body" color="secondary">
          Loading integrations...
        </Text>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 space-y-4 p-6">
        <div className="text-red-600 text-center">
          Failed to load integrations:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-2">
      {/* Heading - Fixed */}
      <div className="">
        <div className="px-4 pt-4 pb-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-600">
            Connect and manage your external services
          </p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 justify-center overflow-y-auto settings-scrollbar px-6">
        <div className="pt-6 pb-12 space-y-6 w-2xl mx-auto">
          {oauthError && (
            <div className="mb-4">
              <Banner
                variant="warning"
                message={oauthError}
                onClose={() => setOauthError(null)}
                dismissible={true}
              />
            </div>
          )}
          <IntegrationsList
            integrations={integrations}
            integrationsData={integrationsData}
            loadingIntegrationId={loadingIntegrationId}
            timedOutIntegrations={timedOutIntegrations}
            onConnect={handleConnect}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Integration Config Panes - Separate for workspace and personal */}
      <WorkspaceIntegrationPane />
      <PersonalIntegrationPane />

      {/* Confirmation Modal - Delete or Disable */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={
          modalState.action === "delete"
            ? "Delete Integration"
            : "Disable Integration"
        }
        message={
          modalState.action === "delete"
            ? `Are you sure you want to delete ${modalState.integrationName}? This will permanently remove the integration and you'll need to set it up again.`
            : `Are you sure you want to disable ${modalState.integrationName}? This will revoke access and you'll need to re-authenticate to enable it again.`
        }
        confirmText={modalState.action === "delete" ? "Delete" : "Disable"}
        cancelText="Cancel"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
}
