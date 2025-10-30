import {
  IntegrationCard,
  ConfirmationModal,
  Banner,
  Text,
  TabSwitcher,
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
        | "development"
        | "production"
        | undefined,
      instanceUrl: config.instance_url as string | undefined,
      apiVersion: config.api_version as string | undefined,
      // Gong fields
      gongInstanceUrl:
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

  // Define tabs
  const tabs = [
    { id: "apps", label: "Add a new integration" },
    { id: "active-integrations", label: "Saved Integrations" },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Tab Switcher */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <TabSwitcher
          tabs={tabs}
          activeTabId={integrationsActiveTab}
          onTabClick={(id) =>
            setIntegrationsActiveTab(id as "apps" | "active-integrations")
          }
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {integrationsActiveTab === "apps" ? (
          // Apps Tab - Configuration View (always visible)
          <AppsConfigPanel />
        ) : (
          // Active Integrations Tab - Existing Grid View
          <div className="px-6 py-6">
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
                  No active integrations. Configure an integration from the Apps
                  tab to get started.
                </Text>
              </div>
            ) : (
              // Integrations Grid
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
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

                  return (
                    <IntegrationCard
                      key={integration.id}
                      name={integration.name}
                      integrationLogoPath={integration.integrationLogoPath}
                      enabled={integration.enabled}
                      disabled={isLoading || isReadonly}
                      loadingText={isLoading ? "Authenticating" : undefined}
                      userOrTenant={accessLevel}
                      environment={
                        environmentType === "development"
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
