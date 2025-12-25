import {
  ConfirmationModal,
  Banner,
  Text,
  TabSwitcher,
} from "@vonlabs/design-components";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  useIntegrations,
  useCheckAllAuthStatuses,
  useCancelAuthorization,
  useDeleteIntegration,
} from "../hooks/useIntegrations";
import { IntegrationType, AuthenticationStatus, Resource } from "../services";
import usePreferencesStore from "../store/preferencesStore";
import { WorkspaceIntegrationPane } from "./WorkspaceIntegrationPane";
import { PersonalIntegrationPane } from "./PersonalIntegrationPane";
import { IntegrationsList } from "./IntegrationsList";
import { IntegrationCardList } from "./IntegrationCardList.legacy";
import { AppsConfigPanel } from "./AppsConfigPanel.legacy";
import { SegmentedControl } from "./SegmentedControl.legacy";
import {
  getIntegrationLogoPath,
  getIntegrationDisplayName,
} from "../constants/integrationMetadata";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { usePermissions } from "../hooks/usePermissions";

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
}

export interface IntegrationsPanelProps {
  onIntegrationToggle?: (id: string, enabled: boolean) => void;
}

/**
 * IntegrationsPanel - Displays and manages integrations with React Query
 *
 * Supports two UI modes controlled by feature flag:
 * - Flag ON: New unified IntegrationsList with dual-level chips
 * - Flag OFF: Old tab-based UI with IntegrationCardList and pills
 */
export function IntegrationsPanel() {
  // Feature flag to toggle between old and new UI
  const { isSimplifiedIntegrationsEnabled } = useFeatureFlag();

  // Get config pane setters and tab state from preferences store
  const {
    integrationsActiveTab,
    setIntegrationsActiveTab,
    setConfiguringWorkspaceIntegration,
    setConfiguringPersonalIntegration,
  } = usePreferencesStore();

  // Permissions for workspace integrations (used in old flow)
  const { data: integrationPermissions } = usePermissions(Resource.INTEGRATION);

  // Local state for nested SegmentedControl in Connected tab (old flow)
  const [activeIntegrationsSection, setActiveIntegrationsSection] = useState<
    "workspace" | "personal"
  >("workspace");

  // Fetch integrations with React Query
  const {
    data: integrationsData,
    isLoading,
    error,
    refetch,
  } = useIntegrations();

  // OAuth cancellation mutation
  const cancelAuthorization = useCancelAuthorization();

  // Delete integration mutation
  const deleteIntegration = useDeleteIntegration();

  // Note: Permissions are now checked per-integration in the card component
  // The old workspace-wide permission check is removed in favor of instance-specific checks

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

  // Confirmation modal state (for delete only)
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
        }),
      ) || [],
    [integrationsData],
  );

  // Split integrations by access level for old flow
  const workspaceIntegrations = useMemo(
    () => integrations.filter((i) => i.accessLevel === "tenant"),
    [integrations],
  );

  const personalIntegrations = useMemo(
    () => integrations.filter((i) => i.accessLevel === "user"),
    [integrations],
  );

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

  const handleToggle = (id: string, enabled: boolean) => {
    // Old flow uses toggle for enable/disable
    // For now, this is a no-op since we removed the toggle functionality
    // Kept for compatibility with IntegrationCardList component
    console.log(`Toggle integration ${id} to ${enabled}`);
  };

  const handleDelete = async (id: string) => {
    const integration = integrations.find((i) => i.id === id);

    const confirmed = await new Promise<boolean>((resolve) => {
      pendingResolverRef.current = resolve;
      setModalState({
        isOpen: true,
        integrationName: integration?.name || "this integration",
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
          {/* Conditional Rendering Based on Feature Flag */}
          {isSimplifiedIntegrationsEnabled ? (
            /* NEW FLOW: Unified Integrations List */
            <>
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
              <IntegrationsList
                integrations={integrations}
                integrationsData={integrationsData}
                loadingIntegrationId={loadingIntegrationId}
                timedOutIntegrations={timedOutIntegrations}
                onConnect={handleConnect}
                onDelete={handleDelete}
              />
            </>
          ) : (
            /* OLD FLOW: Two-level tab structure */
            <div className="space-y-6">
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

              {/* Top-level TabSwitcher: Configure new / Connected */}
              <TabSwitcher
                tabs={[
                  { id: "apps", label: "Configure new" },
                  { id: "active-integrations", label: "Connected" },
                ]}
                activeTabId={integrationsActiveTab}
                onTabClick={(id) =>
                  setIntegrationsActiveTab(id as "apps" | "active-integrations")
                }
              />

              {/* Tab Content */}
              {integrationsActiveTab === "apps" ? (
                // Configure new tab - AppsConfigPanel only
                <AppsConfigPanel />
              ) : (
                // Connected tab - IntegrationCardList with SegmentedControl
                <div className="space-y-2">
                  {/* SegmentedControl for Workspace/Personal */}
                  <SegmentedControl
                    options={[
                      { value: "workspace", label: "Workspace" },
                      { value: "personal", label: "Personal" },
                    ]}
                    value={activeIntegrationsSection}
                    onChange={setActiveIntegrationsSection}
                  />

                  {/* Helper text */}
                  {activeIntegrationsSection === "workspace" ? (
                    <p className="text-xs text-gray-500 px-1">
                      Workspace integrations can only be managed by admins.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 px-1">
                      Personal integrations are private to your account.
                    </p>
                  )}

                  {/* Integration List */}
                  {activeIntegrationsSection === "workspace" ? (
                    <IntegrationCardList
                      integrations={workspaceIntegrations}
                      integrationsData={integrationsData}
                      loadingIntegrationId={loadingIntegrationId}
                      timedOutIntegrations={timedOutIntegrations}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      canUpdate={integrationPermissions?.update ?? false}
                      canDelete={integrationPermissions?.delete ?? false}
                      isPersonal={false}
                    />
                  ) : (
                    <IntegrationCardList
                      integrations={personalIntegrations}
                      integrationsData={integrationsData}
                      loadingIntegrationId={loadingIntegrationId}
                      timedOutIntegrations={timedOutIntegrations}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      canUpdate={true}
                      canDelete={true}
                      isPersonal={true}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Integration Config Panes - Separate for workspace and personal */}
      <WorkspaceIntegrationPane />
      <PersonalIntegrationPane />

      {/* Confirmation Modal - Delete only */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title="Delete Integration"
        message={`Are you sure you want to delete ${modalState.integrationName}? This will permanently remove the integration and you'll need to set it up again.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </div>
  );
}
