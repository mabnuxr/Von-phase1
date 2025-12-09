import {
  ConfirmationModal,
  Banner,
  Text,
  TabSwitcher,
  IntegrationCard,
} from "@vonlabs/design-components";
import { useState, useRef, useEffect, useMemo } from "react";
import { SegmentedControl } from "./SegmentedControl";
import {
  useIntegrations,
  useAuthorizeIntegration,
  useCheckAllAuthStatuses,
  useRevokeIntegration,
  useCancelAuthorization,
  useDeleteIntegration,
} from "../hooks/useIntegrations";
import { usePermissions } from "../hooks/usePermissions";
import { IntegrationType, AuthenticationStatus, Resource } from "../services";
import usePreferencesStore from "../store/preferencesStore";
import { AppsConfigPanel } from "./AppsConfigPanel";
import { WorkspaceIntegrationPane } from "./WorkspaceIntegrationPane";
import { PersonalIntegrationPane } from "./PersonalIntegrationPane";
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
  accessLevel: string;
}

export interface IntegrationsPanelProps {
  onIntegrationToggle?: (id: string, enabled: boolean) => void;
}

/**
 * Renders a list of integration cards
 */
function IntegrationCardList({
  integrations,
  integrationsData,
  loadingIntegrationId,
  timedOutIntegrations,
  onToggle,
  onDelete,
  canUpdate,
  canDelete,
  isPersonal,
}: {
  integrations: Integration[];
  integrationsData:
    | {
        integrations: {
          id: string;
          type: string;
          authenticationStatus: string;
          config: Record<string, unknown>;
          accessLevel: string;
          readonly: boolean;
        }[];
      }
    | undefined;
  loadingIntegrationId: string | null;
  timedOutIntegrations: string[];
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
  isPersonal: boolean;
}) {
  if (integrations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No integrations configured
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden rounded-lg border border-gray-200 divide-y divide-gray-200">
      {integrations.map((integration) => {
        const backendIntegration = integrationsData?.integrations.find(
          (i: { id: string }) => i.id === integration.id
        );
        const isAuthenticating =
          backendIntegration?.authenticationStatus ===
          AuthenticationStatus.AUTHENTICATING;
        const isTimedOut = timedOutIntegrations.includes(integration.id);
        const isLoading =
          loadingIntegrationId === integration.id ||
          (isAuthenticating && !isTimedOut);

        // Extract config data
        const config = backendIntegration?.config || {};
        const instanceUrl = config.instance_url as string | undefined;

        // Get description from metadata
        const integrationKey = backendIntegration?.type?.toLowerCase();
        const metadata = integrationKey
          ? getIntegrationById(integrationKey)
          : undefined;

        // Permission-based access control
        // Personal integrations: user always has full control
        // Workspace integrations: use permissions from API
        const hasUpdatePermission = isPersonal || canUpdate;
        const hasDeletePermission = isPersonal || canDelete;

        return (
          <IntegrationCard
            key={integration.id}
            name={integration.name}
            description={metadata?.description}
            integrationLogoPath={integration.integrationLogoPath}
            enabled={integration.enabled}
            disabled={isLoading || !hasUpdatePermission}
            loadingText={isLoading ? "Authenticating" : undefined}
            instanceUrl={instanceUrl}
            onToggle={
              hasUpdatePermission
                ? (enabled: boolean) => onToggle(integration.id, enabled)
                : undefined
            }
            onDelete={
              hasDeletePermission ? () => onDelete(integration.id) : undefined
            }
          />
        );
      })}
    </div>
  );
}

/**
 * IntegrationsPanel - Displays and manages integrations with React Query
 */
export function IntegrationsPanel() {
  // Tab state from preferences store
  const { integrationsActiveTab, setIntegrationsActiveTab } =
    usePreferencesStore();

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

  // Delete integration mutation
  const deleteIntegration = useDeleteIntegration();

  // Permissions for workspace integrations
  const { data: integrationPermissions } = usePermissions(Resource.INTEGRATION);

  const canUpdateWorkspaceIntegration = integrationPermissions?.update ?? false;
  const canDeleteWorkspaceIntegration = integrationPermissions?.delete ?? false;

  // Track authenticating integrations for polling
  const authenticatingIds =
    integrationsData?.integrations
      .filter(
        (i: { authenticationStatus: string }) =>
          i.authenticationStatus === AuthenticationStatus.AUTHENTICATING
      )
      .map((i: { id: string }) => i.id) || [];

  // Poll all authenticating integrations concurrently
  const { timedOutIntegrations } = useCheckAllAuthStatuses(authenticatingIds);

  // Error state for OAuth operations
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Track timeout warnings that have been shown
  const [shownTimeoutWarnings, setShownTimeoutWarnings] = useState<Set<string>>(
    new Set()
  );

  // Confirmation modal state (for disable and delete)
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    integrationName: string;
    action: "disable" | "delete";
    resolver?: (value: boolean) => void;
  }>({
    isOpen: false,
    integrationName: "",
    action: "disable",
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
          accessLevel: string;
        }) => ({
          id: backendIntegration.id,
          name: getIntegrationDisplayName(backendIntegration.type),
          integrationLogoPath: getIntegrationLogoPath(backendIntegration.type),
          enabled:
            backendIntegration.authenticationStatus ===
            AuthenticationStatus.AUTHENTICATED,
          accessLevel: backendIntegration.accessLevel,
        })
      ) || [],
    [integrationsData]
  );

  // Split integrations by access level
  const orgIntegrations = useMemo(
    () => integrations.filter((i) => i.accessLevel === "tenant"),
    [integrations]
  );
  const userIntegrations = useMemo(
    () => integrations.filter((i) => i.accessLevel === "user"),
    [integrations]
  );

  // Segmented control state for Connected tab
  const [activeIntegrationsSection, setActiveIntegrationsSection] = useState<
    "workspace" | "personal"
  >("workspace");

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
          action: "disable",
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
    setModalState({ isOpen: false, integrationName: "", action: "disable" });
  };

  const handleModalCancel = () => {
    modalState.resolver?.(false);
    pendingResolverRef.current = null;
    setModalState({ isOpen: false, integrationName: "", action: "disable" });
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

  useEffect(() => {
    timedOutIntegrations.forEach((id) => {
      if (!shownTimeoutWarnings.has(id)) {
        const integration = integrations.find((i) => i.id === id);
        if (integration) {
          setOauthError(
            `Authentication for ${integration.name} timed out. The popup may have been closed or authentication was not completed. Please try enabling it again.`
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
          <h2 className="text-xl font-semibold text-gray-900">Integrations</h2>
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
            // Active Integrations Tab - Two Sections View
            <div className="space-y-8">
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

              {/* Empty state - only show if no integrations at all */}
              {!isLoading &&
              (!integrationsData || integrations.length === 0) ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <Text variant="body" color="secondary">
                    No active integrations.
                  </Text>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Segmented Control */}
                  <SegmentedControl
                    options={[
                      { value: "workspace", label: "Workspace" },
                      { value: "personal", label: "Personal" },
                    ]}
                    value={activeIntegrationsSection}
                    onChange={setActiveIntegrationsSection}
                  />

                  {/* Helper text for sections */}
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
                      integrations={orgIntegrations}
                      integrationsData={integrationsData}
                      loadingIntegrationId={loadingIntegrationId}
                      timedOutIntegrations={timedOutIntegrations}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      canUpdate={canUpdateWorkspaceIntegration}
                      canDelete={canDeleteWorkspaceIntegration}
                      isPersonal={false}
                    />
                  ) : (
                    <IntegrationCardList
                      integrations={userIntegrations}
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

      {/* Confirmation Modal */}
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
