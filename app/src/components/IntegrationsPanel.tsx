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
import { PersonalIntegrationPane } from "./PersonalIntegrationPane";
import { IntegrationsList } from "./IntegrationsList";
import { ConnectorLibraryModal } from "./mcp/ConnectorLibraryModal";
import { MCPConnectDrawer } from "./mcp/MCPConnectDrawer";
import { useMCPCatalog, useMCPServers } from "../hooks/useMCPServers";
import { useTenantIntegrations } from "../hooks/useAppCatalog";
import type { CatalogEntry, MCPAuthType, MCPAuthenticationStatus } from "../types/mcp";
import type { TenantIntegrationEnriched } from "../types/appCatalog";
import {
  getIntegrationLogoPath,
  getIntegrationDisplayName,
} from "../constants/integrationMetadata";
import { useFeatureFlag } from "../hooks/useFeatureFlag";

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
    loadingIntegrationId,
    setLoadingIntegrationId,
  } = usePreferencesStore();

  // Auto-open integration config pane when linked from chat via ?configure=<id>
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const configureId = searchParams.get("configure");
    if (configureId) {
      setConfiguringPersonalIntegration(configureId);
      searchParams.delete("configure");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, setConfiguringPersonalIntegration]);

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
  const { isMcpServersEnabled } = useFeatureFlag();
  const { data: tenantIntegrations } = useTenantIntegrations();

  // MCP servers — authoritative source; catalog used only for metadata enrichment
  const { data: mcpServers } = useMCPServers();
  const { data: mcpCatalog } = useMCPCatalog();
  const connectedMCPEntries = useMemo<CatalogEntry[]>(() => {
    if (!isMcpServersEnabled || !mcpServers) return [];
    const catalogMap = new Map(
      (mcpCatalog ?? []).map((e) => [e.catalog_id, e]),
    );

    const entries: CatalogEntry[] = [];

    for (const server of mcpServers) {
      if (server.connection_mode === "workspace") {
        // Include if AUTHENTICATED (visible to all)
        // OR if admin AND published AND not yet authenticated (admin-pending)
        const isAuthenticated =
          server.authentication_status === "AUTHENTICATED";
        const isAdminPending =
          isAdmin &&
          server.availability_status === "published" &&
          !isAuthenticated;

        if (!isAuthenticated && !isAdminPending) continue;

        const cat = server.catalog_id
          ? catalogMap.get(server.catalog_id)
          : undefined;

        entries.push({
          catalog_id: cat?.catalog_id ?? server.id,
          name: server.name,
          description: cat?.description ?? server.description ?? "",
          server_url: server.server_url,
          auth_type: server.auth_type,
          credential_label: cat?.credential_label ?? "API Key",
          credential_hint_url: cat?.credential_hint_url ?? null,
          default_access_level: ["workspace"],
          logo_url: cat?.logo_url ?? null,
          tool_manifest: server.tool_manifest,
          is_connected: isAuthenticated,
          connected_server_id: server.id,
          authentication_status: server.authentication_status,
          category_code: cat?.category_code ?? "",
          category_name: cat?.category_name ?? "Other",
          author: cat?.author ?? "",
          docs_url: cat?.docs_url ?? null,
          support_url: cat?.support_url ?? null,
          privacy_policy_url: cat?.privacy_policy_url ?? null,
          is_active: server.is_active,
          connection_mode: server.connection_mode,
        });
      } else {
        // personal mode — include if published (all members see it to connect)
        if (server.availability_status !== "published") continue;

        const cat = server.catalog_id
          ? catalogMap.get(server.catalog_id)
          : undefined;

        const userAuthStatus =
          server.user_connection?.authentication_status ?? "NOT_AUTHENTICATED";
        const isConnected = userAuthStatus === "AUTHENTICATED";

        entries.push({
          catalog_id: cat?.catalog_id ?? server.id,
          name: server.name,
          description: cat?.description ?? server.description ?? "",
          server_url: server.server_url,
          auth_type: server.auth_type,
          credential_label: cat?.credential_label ?? "API Key",
          credential_hint_url: cat?.credential_hint_url ?? null,
          default_access_level: ["user"],
          logo_url: cat?.logo_url ?? null,
          tool_manifest: server.tool_manifest,
          is_connected: isConnected,
          connected_server_id: server.id,
          is_personal_connected: server.user_connection !== null,
          personal_server_id: server.id,
          authentication_status: userAuthStatus as MCPAuthenticationStatus,
          category_code: cat?.category_code ?? "",
          category_name: cat?.category_name ?? "Other",
          author: cat?.author ?? "",
          docs_url: cat?.docs_url ?? null,
          support_url: cat?.support_url ?? null,
          privacy_policy_url: cat?.privacy_policy_url ?? null,
          is_active: server.is_active,
          connection_mode: server.connection_mode,
        });
      }
    }

    return entries;
  }, [isMcpServersEnabled, mcpServers, mcpCatalog, isAdmin]);

  // Merge connected MCP entries with published ones from tenant-integrations.
  // connectedMCPEntries covers MCPServer-backed entries; TI entries cover catalog-connected ones.
  const allMCPEntries = useMemo<CatalogEntry[]>(() => {
    if (!isMcpServersEnabled) return [];
    const connectedIds = new Set(connectedMCPEntries.map((e) => e.catalog_id));

    // Group TI rows by catalog_id so workspace + personal become one card.
    const tiByApp = new Map<string, { workspace: TenantIntegrationEnriched | null; personal: TenantIntegrationEnriched | null }>();
    for (const ti of (tenantIntegrations ?? [])) {
      if (ti.catalog_type !== "mcp" || connectedIds.has(ti.catalog_id)) continue;
      if (!tiByApp.has(ti.catalog_id)) tiByApp.set(ti.catalog_id, { workspace: null, personal: null });
      const slot = tiByApp.get(ti.catalog_id)!;
      if (ti.connection_mode === "workspace") slot.workspace = ti;
      else slot.personal = ti;
    }

    const resolveAuth = (ti: TenantIntegrationEnriched | null, accessLevel: "tenant" | "user") => {
      if (!ti) return { auth: null as string | null, id: null as string | null, active: false };
      if (ti.connection?.authentication_status) {
        return { auth: ti.connection.authentication_status as string, id: ti.connection.id, active: ti.connection.is_active };
      }
      const match = integrationsData?.integrations.find(
        (i) => i.name.toLowerCase() === ti.name.toLowerCase() && i.accessLevel === accessLevel,
      );
      return { auth: match?.authenticationStatus ?? null, id: match?.id ?? null, active: match?.isActive ?? false };
    };

    const tiMcpEntries: CatalogEntry[] = Array.from(tiByApp.entries()).flatMap(([catalogId, { workspace: wsTi, personal: personalTi }]) => {
      const primaryTi = (wsTi ?? personalTi)!;
      const ws = resolveAuth(wsTi, "tenant");
      const personal = resolveAuth(personalTi, "user");
      const wsConnected = ws.auth === "AUTHENTICATED";
      const personalConnected = personal.auth === "AUTHENTICATED";

      // Non-admins: hide workspace-only entries until workspace is connected.
      // Show if workspace is connected OR personal TI is published (member can connect personal).
      if (!isAdmin && !wsConnected && personalTi?.availability_status !== "published") return [];
      const authStatus = ((wsConnected ? "AUTHENTICATED" : personalConnected ? "AUTHENTICATED" : ws.auth ?? personal.auth ?? "NOT_AUTHENTICATED")) as MCPAuthenticationStatus;
      return {
        catalog_id: catalogId,
        name: primaryTi.name,
        description: primaryTi.description,
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
      };
    });

    return [...connectedMCPEntries, ...tiMcpEntries];
  }, [connectedMCPEntries, tenantIntegrations, integrationsData, isAdmin]);

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
    connectionType?: "workspace" | "personal" | "both";
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
    setModalState({ isOpen: false, integrationName: "", action: "delete" });
  };

  const handleModalCancel = () => {
    modalState.resolver?.(false);
    pendingResolverRef.current = null;
    setModalState({ isOpen: false, integrationName: "", action: "delete" });
  };

  const handleDelete = async (
    id: string,
    connectionType: "workspace" | "personal" | "both" = "personal",
  ) => {
    const integration = integrations.find((i) => i.id === id);

    const confirmed = await new Promise<boolean>((resolve) => {
      pendingResolverRef.current = resolve;
      setModalState({
        isOpen: true,
        integrationName: integration?.name || "this integration",
        action: "delete",
        connectionType,
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
              {isAdmin && isMcpServersEnabled && (
                <button
                  onClick={() => setShowLibrary(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
                >
                  <MagnifyingGlass size={14} />
                  Explore apps
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
      {isMcpServersEnabled && showLibrary && (
        <ConnectorLibraryModal onClose={() => setShowLibrary(false)} />
      )}
      {isMcpServersEnabled && mcpConnectEntry && (
        <MCPConnectDrawer
          entry={mcpConnectEntry}
          onClose={() => setMcpConnectEntry(null)}
        />
      )}
    </div>
  );
}
