import { ConfirmationModal, Banner, Text } from "@vonlabs/design-components";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import {
  useIntegrations,
  useCheckAllAuthStatuses,
  useDeleteIntegration,
} from "../hooks/useIntegrations";
import {
  IntegrationType,
  AuthenticationStatus,
  type SalesforceWriteScope,
} from "../services";
import usePreferencesStore from "../store/preferencesStore";
import { WorkspaceIntegrationPane } from "./WorkspaceIntegrationPane";
import { SlackChannelConfigPane } from "./SlackChannelConfigPane";
import { PersonalIntegrationPane } from "./PersonalIntegrationPane";
import { IntegrationsList } from "./IntegrationsList";
import { ConnectorLibraryModal } from "./mcp/ConnectorLibraryModal";
import { MCPConnectDrawer } from "./mcp/MCPConnectDrawer";
import { useTenantIntegrations } from "../hooks/useAppCatalog";
import type {
  CatalogEntry,
  MCPAuthType,
  MCPAuthenticationStatus,
} from "../types/mcp";
import type { TenantIntegrationEnriched } from "../types/appCatalog";
import {
  getIntegrationLogoPath,
  getIntegrationDisplayName,
  canBeOrgLevel,
  INTEGRATION_METADATA,
} from "../constants/integrationMetadata";
import { report } from "../lib/analytics/tracker";

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
  scope?: SalesforceWriteScope;
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
    setConfiguringSlackChannels,
    loadingIntegrationId,
    setLoadingIntegrationId,
    deletingIntegrationId,
    setDeletingIntegrationId,
  } = usePreferencesStore();

  // Auto-open integration config pane when linked from chat via ?configure=<id>.
  // For integrations that support org-level connections (HubSpot, Salesforce,
  // etc.) the chat-card click should default to the workspace pane — picking
  // personal here would create the wrong record type when no workspace exists
  // yet. Personal-only integrations (Gmail, Calendar) go to personal as before.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const configureId = searchParams.get("configure");
    if (configureId) {
      if (canBeOrgLevel(configureId)) {
        setConfiguringWorkspaceIntegration(configureId);
      } else {
        setConfiguringPersonalIntegration(configureId);
      }
      searchParams.delete("configure");
      setSearchParams(searchParams, { replace: true });
    }
  }, [
    searchParams,
    setSearchParams,
    setConfiguringWorkspaceIntegration,
    setConfiguringPersonalIntegration,
  ]);

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

  // MCP modal/pane state
  const [showLibrary, setShowLibrary] = useState(false);
  const [mcpConnectEntry, setMcpConnectEntry] = useState<CatalogEntry | null>(
    null,
  );

  const { user } = useUser();
  const isAdmin =
    user?.roles?.some((r) => r.toLowerCase() === "admin") ?? false;

  // Derive auth_method from integration id — OAuth integrations use redirect flow
  const OAUTH_INTEGRATION_IDS = new Set([
    "salesforce",
    "hubspot",
    "googlecalendar",
    "googledrive",
    "box",
    "gmail",
    "granola",
    "notion",
    "outreachengage",
  ]);
  const getAuthMethod = (id: string) =>
    OAUTH_INTEGRATION_IDS.has(id) ? "OAuth" : "API Key";

  const pageViewCaptured = useRef(false);
  useEffect(() => {
    if (!user || pageViewCaptured.current) return;
    report.integrationsPageViewed();
    pageViewCaptured.current = true;
  }, [user]);

  const { data: tenantIntegrations } = useTenantIntegrations();

  // All MCP entries driven entirely by tenant-integrations (app-catalog API).
  const allMCPEntries = useMemo<CatalogEntry[]>(() => {
    // Group TI rows by catalog_id so workspace + personal become one card.
    const tiByApp = new Map<
      string,
      {
        workspace: TenantIntegrationEnriched | null;
        personal: TenantIntegrationEnriched | null;
      }
    >();
    for (const ti of tenantIntegrations ?? []) {
      if (ti.catalog_type !== "mcp") continue;
      if (!tiByApp.has(ti.catalog_id))
        tiByApp.set(ti.catalog_id, { workspace: null, personal: null });
      const slot = tiByApp.get(ti.catalog_id)!;
      if (ti.connection_mode === "workspace") slot.workspace = ti;
      else slot.personal = ti;
    }

    const resolveAuth = (
      ti: TenantIntegrationEnriched | null,
      accessLevel: "tenant" | "user",
    ) => {
      if (!ti)
        return {
          auth: null as string | null,
          id: null as string | null,
          active: false,
          userId: null as string | null,
        };
      const match = integrationsData?.integrations.find(
        (i) =>
          i.name.toLowerCase() === ti.name.toLowerCase() &&
          i.accessLevel === accessLevel,
      );
      if (ti.connection?.authentication_status) {
        return {
          auth: ti.connection.authentication_status as string,
          id: ti.connection.id,
          active: ti.connection.is_active,
          userId: match?.userId ?? null,
        };
      }
      return {
        auth: match?.authenticationStatus ?? null,
        id: match?.id ?? null,
        active: match?.isActive ?? false,
        userId: match?.userId ?? null,
      };
    };

    return Array.from(tiByApp.entries()).flatMap(
      ([catalogId, { workspace: wsTi, personal: personalTi }]) => {
        const primaryTi = (wsTi ?? personalTi)!;
        const ws = resolveAuth(wsTi, "tenant");
        const personal = resolveAuth(personalTi, "user");
        const wsConnected = ws.auth === "AUTHENTICATED";
        const personalConnected = personal.auth === "AUTHENTICATED";

        // Non-admins: hide workspace-only entries until workspace is connected.
        // Show if workspace is connected OR personal TI is published (member can connect personal).
        if (
          !isAdmin &&
          !wsConnected &&
          personalTi?.availability_status !== "published"
        )
          return [];
        const authStatus = (
          wsConnected
            ? "AUTHENTICATED"
            : personalConnected
              ? "AUTHENTICATED"
              : (ws.auth ?? personal.auth ?? "NOT_AUTHENTICATED")
        ) as MCPAuthenticationStatus;
        return {
          catalog_id: catalogId,
          name: primaryTi.name,
          description: primaryTi.description,
          short_description: primaryTi.short_description ?? null,
          server_url: primaryTi.server_url ?? "",
          auth_type: primaryTi.auth_type as MCPAuthType,
          credential_label: primaryTi.credential_label ?? "API Key",
          credential_hint_url: primaryTi.credential_hint_url,
          default_access_level: [
            ...(wsTi ? (["workspace"] as const) : []),
            ...(personalTi ? (["personal"] as const) : []),
          ],
          logo_url: primaryTi.logo_url,
          tool_manifest: [],
          is_connected: wsConnected,
          connected_server_id: ws.id,
          is_personal_connected: personalConnected,
          personal_server_id: personal.id,
          authentication_status: authStatus,
          category_code: primaryTi.category_code,
          category_name: primaryTi.category_name,
          author: "",
          docs_url: primaryTi.docs_url,
          support_url: null,
          privacy_policy_url: null,
          is_active: ws.active || personal.active,
          connection_mode: wsTi ? "workspace" : "personal",
          is_ti_based: true,
          workspace_published_by: ws.userId ?? null,
        };
      },
    );
  }, [tenantIntegrations, integrationsData, isAdmin]);

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
    integrationCategory: string;
    action: "delete" | "disable";
    connectionType?: "workspace" | "personal" | "both";
    resolver?: (value: boolean) => void;
  }>({
    isOpen: false,
    integrationName: "",
    integrationCategory: "",
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
          name: string;
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
          name:
            integration.type === IntegrationType.MCP_SERVER
              ? integration.name
              : getIntegrationDisplayName(integration.type),
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
    setModalState({
      isOpen: false,
      integrationName: "",
      integrationCategory: "",
      action: "delete",
    });
  };

  const handleModalCancel = () => {
    if (modalState.action === "delete") {
      report.integrationsDisconnectCancelled(
        modalState.integrationName,
        modalState.integrationCategory,
        modalState.connectionType === "both"
          ? "Both"
          : modalState.connectionType === "workspace"
            ? "Workspace"
            : "Personal",
      );
    }
    modalState.resolver?.(false);
    pendingResolverRef.current = null;
    setModalState({
      isOpen: false,
      integrationName: "",
      integrationCategory: "",
      action: "delete",
    });
  };

  const handleDelete = async (
    id: string,
    connectionType: "workspace" | "personal" | "both" = "personal",
  ) => {
    const integration = integrations.find((i) => i.id === id);
    const meta = INTEGRATION_METADATA[integration?.type ?? ""];
    report.integrationsDisconnectClicked(
      integration?.name ?? id,
      meta?.category ?? "",
      connectionType === "both"
        ? "Both"
        : connectionType === "workspace"
          ? "Workspace"
          : "Personal",
    );

    const confirmed = await new Promise<boolean>((resolve) => {
      pendingResolverRef.current = resolve;
      setModalState({
        isOpen: true,
        integrationName: integration?.name || "this integration",
        integrationCategory: meta?.category ?? "",
        action: "delete",
        connectionType,
        resolver: resolve,
      });
    });

    pendingResolverRef.current = null;

    if (confirmed) {
      setLoadingIntegrationId(id);
      setDeletingIntegrationId(id);
      deleteIntegration.mutate(id, {
        onSuccess: () => {
          setLoadingIntegrationId(null);
          // deletingIntegrationId is cleared by the effect below once the
          // integration is gone from the refetched list, keeping the delete
          // button disabled through the stale-cache window.
          report.integrationsIntegrationDeleted({
            integrationName: integration?.name ?? id,
            integrationCategory:
              INTEGRATION_METADATA[integration?.type ?? ""]?.category ?? "",
            connectionType:
              connectionType === "both"
                ? "Both"
                : connectionType === "workspace"
                  ? "Workspace"
                  : "Personal",
            success: true,
            error: null,
          });
        },
        onError: (error: Error) => {
          setLoadingIntegrationId(null);
          setDeletingIntegrationId(null);
          setOauthError(`Failed to delete integration: ${error.message}`);
          report.integrationsIntegrationDeleted({
            integrationName: integration?.name ?? id,
            integrationCategory:
              INTEGRATION_METADATA[integration?.type ?? ""]?.category ?? "",
            connectionType:
              connectionType === "both"
                ? "Both"
                : connectionType === "workspace"
                  ? "Workspace"
                  : "Personal",
            success: false,
            error: error.message,
          });
        },
      });
    }
  };

  const handleConnect = (appId: string, accessLevel: "tenant" | "user") => {
    const meta = INTEGRATION_METADATA[appId];
    report.integrationsConnectClicked({
      integrationName: meta?.name ?? appId,
      integrationCategory: meta?.category ?? "",
      connectionType: accessLevel === "tenant" ? "Workspace" : "Personal",
      authMethod: getAuthMethod(appId),
    });
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

  // Clear loadingIntegrationId when integration is successfully authenticated.
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

  // Clear deletingIntegrationId once the integration is gone from the refetched
  // list. This keeps the delete button disabled through the stale React Query
  // cache window and across remounts (Zustand persists it), preventing a second
  // delete from firing before the UI catches up.
  useEffect(() => {
    if (deletingIntegrationId) {
      const integration = integrationsData?.integrations.find(
        (i: { id: string }) => i.id === deletingIntegrationId,
      );
      if (integrationsData && !integration) {
        setDeletingIntegrationId(null);
      }
    }
  }, [integrationsData, deletingIntegrationId, setDeletingIntegrationId]);

  // Auto-open the Slack channel-config pane on first-time Slack workspace
  // authentication. Why: users complete OAuth and the card flips to
  // "Connected" but the channel-pattern step is invisible until they spot
  // the cog icon. Chaining the pane onto the connect flow makes the
  // configure-channels step part of the same gesture.
  //
  // Detection: compare the set of authenticated SLACK_WORKSPACE integration
  // IDs across renders. Anything newly present is a fresh connection.
  // First render seeds the ref so pre-existing connections don't pop the
  // pane on page load.
  const seenAuthedSlackRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    const all = integrationsData?.integrations;
    if (!all) return;
    const authedIds = new Set(
      all
        .filter(
          (i: { type: string; authenticationStatus: string }) =>
            i.type === IntegrationType.SLACK_WORKSPACE &&
            i.authenticationStatus === AuthenticationStatus.AUTHENTICATED,
        )
        .map((i: { id: string }) => i.id),
    );
    if (seenAuthedSlackRef.current === null) {
      seenAuthedSlackRef.current = authedIds;
      return;
    }
    for (const id of authedIds) {
      if (!seenAuthedSlackRef.current.has(id)) {
        setConfiguringSlackChannels(id);
        break;
      }
    }
    seenAuthedSlackRef.current = authedIds;
  }, [integrationsData, setConfiguringSlackChannels]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100 p-6">
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
          className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
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
        <div className="px-6 pt-4 pb-6 border-b border-gray-200">
          <div className="w-full max-w-4xl mx-auto flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Integrations
              </h2>
              <p className="text-sm text-gray-600">
                Connect and manage your external services
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowLibrary(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                >
                  <MagnifyingGlass size={14} />
                  Manage Integrations
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 justify-center overflow-y-auto settings-scrollbar px-6">
        <div className="pt-6 pb-12 space-y-6 w-full max-w-4xl mx-auto">
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
            deletingIntegrationId={deletingIntegrationId}
            timedOutIntegrations={timedOutIntegrations}
            onConnect={handleConnect}
            onDelete={handleDelete}
            mcpEntries={allMCPEntries}
            onMCPConnect={(entry) => setMcpConnectEntry(entry)}
            tenantIntegrations={tenantIntegrations}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* Integration Config Panes - Separate for workspace and personal */}
      <WorkspaceIntegrationPane />
      <PersonalIntegrationPane />
      <SlackChannelConfigPane />

      {/* Confirmation Modal - Delete or Disable */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={
          modalState.action === "delete"
            ? "Delete Integration"
            : "Disable Integration"
        }
        message={
          modalState.action === "delete" ? (
            <>
              Are you sure you want to delete {modalState.integrationName}? This
              removes{" "}
              {modalState.connectionType === "both" ? (
                <>
                  both <strong>workspace</strong> and <strong>personal</strong>{" "}
                  connections
                </>
              ) : modalState.connectionType === "workspace" ? (
                <>
                  the <strong>workspace</strong> connection
                </>
              ) : (
                <>
                  your <strong>personal</strong> connection
                </>
              )}{" "}
              and you'll need to set it up again.
            </>
          ) : (
            `Are you sure you want to disable ${modalState.integrationName}? This will revoke access and you'll need to re-authenticate to enable it again.`
          )
        }
        confirmText={modalState.action === "delete" ? "Delete" : "Disable"}
        cancelText="Cancel"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />

      {/* MCP modals/panes */}
      {showLibrary && (
        <ConnectorLibraryModal onClose={() => setShowLibrary(false)} />
      )}
      {mcpConnectEntry && (
        <MCPConnectDrawer
          entry={mcpConnectEntry}
          onClose={() => setMcpConnectEntry(null)}
        />
      )}
    </div>
  );
}
