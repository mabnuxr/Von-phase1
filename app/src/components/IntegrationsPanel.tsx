import {
  ConfirmationModal,
  Banner,
  Text,
  TabSwitcher,
  IntegrationCard,
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
import usePreferencesStore from "../store/preferencesStore";
import { AppsConfigPanel } from "./AppsConfigPanel";
import { IntegrationConfigPane } from "./IntegrationConfigPane";
import {
  getIntegrationLogoPath,
  getIntegrationDisplayName,
  getIntegrationById,
} from "../constants/integrationMetadata";

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
 * IntegrationsPanel - Displays and manages integrations with React Query
 */
export function IntegrationsPanel() {
  // Tab state from preferences store
  const {
    integrationsActiveTab,
    setIntegrationsActiveTab,
    setConfiguringIntegration,
    updateIntegrationConfig,
  } = usePreferencesStore();

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
          name: getIntegrationDisplayName(backendIntegration.type),
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
          // Refetch integrations to get updated status from backend
          refetch();
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

  const handleEdit = (integrationId: string) => {
    const backendIntegration = integrationsData?.integrations.find(
      (i: { id: string }) => i.id === integrationId,
    );

    if (!backendIntegration) return;

    // Map backend type to integration key (lowercase)
    const integrationKey = backendIntegration.type.toLowerCase();

    // Build IntegrationConfig from backend data
    const config = backendIntegration.config || {};
    const accessLevel = backendIntegration.accessLevel || "user";

    const integrationConfig = {
      id: backendIntegration.id,
      accessLevel: (accessLevel === "tenant" || accessLevel === "user"
        ? accessLevel
        : "user") as "tenant" | "user",
      // Salesforce fields
      environmentType: config.environment_type as
        | "sandbox"
        | "production"
        | undefined,
      instanceUrl: config.instance_url as string | undefined,
      apiVersion: config.api_version as string | undefined,
      // Gong fields
      gongApiBaseUrl:
        backendIntegration.type === "GONG"
          ? (config.instance_url as string | undefined)
          : undefined,
    };

    // Update preferences store with current config
    updateIntegrationConfig(integrationKey, integrationConfig);

    // Open sidebar
    setConfiguringIntegration(integrationKey);
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

  // Define tabs
  const tabs = [
    { id: "apps", label: "Configure new" },
    { id: "active-integrations", label: "Connected" },
  ];

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
          <h2 className="text-xl font-semibold text-gray-900">
            Integrations
          </h2>
          <p className="text-sm text-gray-600">
            Connect and manage your external services
          </p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 justify-center overflow-y-auto settings-scrollbar px-6">
        <div className="pt-6 pb-12 space-y-6 w-2xl mx-auto">
          {/* Tab Switcher */}
          <TabSwitcher
            tabs={tabs}
            activeTabId={integrationsActiveTab}
            onTabClick={(id) =>
              setIntegrationsActiveTab(id as "apps" | "active-integrations")
            }
          />

          {/* Tab Content */}
          {integrationsActiveTab === "apps" ? (
            // Apps Tab - Configuration View (always visible)
            <AppsConfigPanel />
          ) : (
            // Active Integrations Tab - Existing Grid View
            <div className="">
              {/* OAuth Error Banner */}
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

              {/* Empty state - only for Active Integrations tab */}
              {!isLoading && (!integrationsData || integrations.length === 0) ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <Text variant="body" color="secondary">
                    No active integrations.
                  </Text>
                </div>
              ) : (
                // Integrations List
                <div className="bg-white overflow-hidden rounded-lg border border-gray-200 divide-y divide-gray-200">
                  {integrations.map((integration) => {
                    const backendIntegration =
                      integrationsData?.integrations.find(
                        (i: { id: string }) => i.id === integration.id,
                      );
                    const isAuthenticating =
                      backendIntegration?.authenticationStatus ===
                      AuthenticationStatus.AUTHENTICATING;
                    const isTimedOut = timedOutIntegrations.includes(
                      integration.id,
                    );
                    const isLoading =
                      loadingIntegrationId === integration.id ||
                      (isAuthenticating && !isTimedOut);

                    // Extract config data
                    const config = backendIntegration?.config || {};
                    const accessLevel = backendIntegration?.accessLevel as
                      | string
                      | undefined;
                    const environmentType = config.environment_type as
                      | string
                      | undefined;
                    const instanceUrl = config.instance_url as string | undefined;

                    // Check if this integration is readonly (tenant-level owned by someone else)
                    const isReadonly = backendIntegration?.readonly === true;

                    // Get description from metadata
                    const integrationKey = backendIntegration?.type?.toLowerCase();
                    const metadata = integrationKey ? getIntegrationById(integrationKey) : undefined;

                    return (
                      <IntegrationCard
                        key={integration.id}
                        name={integration.name}
                        description={metadata?.description}
                        integrationLogoPath={integration.integrationLogoPath}
                        enabled={integration.enabled}
                        disabled={isLoading || isReadonly}
                        loadingText={isLoading ? "Authenticating" : undefined}
                        userOrTenant={accessLevel}
                        environment={
                          environmentType === "sandbox"
                            ? "dev"
                            : environmentType === "production"
                              ? "prod"
                              : undefined
                        }
                        instanceUrl={instanceUrl}
                        onToggle={
                          isReadonly
                            ? undefined
                            : (enabled: boolean) =>
                                handleToggle(integration.id, enabled)
                        }
                        onEdit={
                          isReadonly
                            ? undefined
                            : () => handleEdit(integration.id)
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Integration Config Pane - Globally available */}
      <IntegrationConfigPane />

      {/* Confirmation Modal */}
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
