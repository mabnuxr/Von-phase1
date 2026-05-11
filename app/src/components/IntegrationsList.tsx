import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  useDeleteMCPServer,
  useCreateMCPServer,
  useMCPAuthorize,
  useMCPCheckAuthStatus,
  useDiscoverTools,
} from "../hooks/useMCPServers";
import { useToast } from "../hooks/useToast";
import { IntegrationCard, ConfirmationModal } from "@vonlabs/design-components";
import { usePermissions } from "../hooks/usePermissions";
import { useFeatureFlag } from "../hooks/useFeatureFlag";
import { useSetSalesforceScope } from "../hooks/useIntegrations";
import { Resource, AuthenticationStatus } from "../services";
import type { SalesforceWriteScope } from "../services";
import type { CatalogEntry } from "../types/mcp";
import {
  getAllIntegrations,
  canBeOrgLevel,
  canBeUserLevel,
  getFrontendIntegrationId,
  type IntegrationMetadata,
} from "../constants/integrationMetadata";
import type { Integration } from "./IntegrationsPanel";
import { getUserContext } from "../lib/auth";
import {
  DotsThreeVerticalIcon,
  CaretRightIcon,
  TrashSimpleIcon,
  ShieldCheckIcon,
  CheckIcon,
} from "@phosphor-icons/react";

/**
 * Get backend user ID from stored user context (set during token exchange)
 */
function getBackendUserId(): string | null {
  const userContext = getUserContext();
  return userContext?.user_id ?? null;
}

// Define category order for display
const CATEGORY_ORDER: Array<
  | "CRM"
  | "Calendar"
  | "Calls & Engagement"
  | "Note Takers"
  | "Knowledge base"
  | "Data Warehouse"
  | "Customer Support"
  | "Communication"
> = [
  "CRM",
  "Calendar",
  "Calls & Engagement",
  "Note Takers",
  "Knowledge base",
  "Data Warehouse",
  "Customer Support",
  "Communication",
];

interface IntegrationsListProps {
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
          scope?: SalesforceWriteScope;
        }[];
      }
    | undefined;
  loadingIntegrationId: string | null;
  timedOutIntegrations: string[];
  onConnect: (appId: string, accessLevel: "tenant" | "user") => void;
  onDelete: (
    id: string,
    connectionType: "workspace" | "personal" | "both",
  ) => void;
  mcpEntries?: CatalogEntry[];
  onMCPConnect?: (entry: CatalogEntry) => void;
}

// Map catalog category_name → CATEGORY_ORDER key (best-effort)
const CATALOG_CATEGORY_MAP: Record<string, string> = {
  CRM: "CRM",
  Calendar: "Calendar",
  "Note Takers": "Note Takers",
  "Knowledge Base": "Knowledge base",
  "Knowledge base": "Knowledge base",
  "Sales Engagement": "Sales Engagement",
  "Data Warehouse": "Data Warehouse",
  "Customer Support": "Customer Support",
  Communication: "Communication",
  "Call Recorder": "Call Recorder",
  "Calls & Engagement": "Call Recorder",
};

function MCPCatalogItem({
  entry,
  onConnect,
}: {
  entry: CatalogEntry;
  onConnect: (entry: CatalogEntry) => void;
}) {
  const deleteMutation = useDeleteMCPServer();
  const createMutation = useCreateMCPServer();
  const authorizeMutation = useMCPAuthorize();
  const discoverMutation = useDiscoverTools();
  const { showToast } = useToast();

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [createdServerId, setCreatedServerId] = useState<string | null>(null);
  const [waitingForOAuth, setWaitingForOAuth] = useState(false);
  const [discoverTriggered, setDiscoverTriggered] = useState(false);
  const [oauthPopup, setOauthPopup] = useState<Window | null>(null);

  const authStatusQuery = useMCPCheckAuthStatus(
    createdServerId,
    waitingForOAuth,
  );

  const finishOAuth = useCallback(
    (serverId: string) => {
      if (discoverTriggered) return;
      setDiscoverTriggered(true);
      setWaitingForOAuth(false);
      oauthPopup?.close();
      showToast({
        message: `${entry.name} connected — discovering tools…`,
        variant: "success",
      });
      discoverMutation.mutate(serverId);
    },
    [discoverTriggered, oauthPopup, entry.name, showToast, discoverMutation],
  );

  useEffect(() => {
    if (!waitingForOAuth || !createdServerId) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "mcp_oauth_callback") return;
      if (event.data.success) {
        finishOAuth(createdServerId);
      } else {
        setWaitingForOAuth(false);
        oauthPopup?.close();
        if (createdServerId) deleteMutation.mutate(createdServerId);
        setCreatedServerId(null);
        showToast({
          message: event.data.error || "OAuth authorization failed. Please try again.",
          variant: "error",
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [waitingForOAuth, createdServerId, finishOAuth, oauthPopup, deleteMutation, showToast]);

  useEffect(() => {
    if (!waitingForOAuth || !createdServerId || discoverTriggered) return;
    const status = authStatusQuery.data?.authentication_status;
    if (status === "AUTHENTICATED") {
      finishOAuth(createdServerId);
    } else if (status === "AUTHENTICATION_FAILED") {
      setWaitingForOAuth(false);
      oauthPopup?.close();
      if (createdServerId) deleteMutation.mutate(createdServerId);
      setCreatedServerId(null);
      showToast({
        message: "OAuth authorization failed. Please try again.",
        variant: "error",
      });
    }
  }, [
    authStatusQuery.data?.authentication_status,
    waitingForOAuth,
    createdServerId,
    discoverTriggered,
    deleteMutation,
    showToast,
    oauthPopup,
    finishOAuth,
  ]);

  const handleDirectOAuth = async (accessLevel: "tenant" | "user" = "user") => {
    let newServerId: string | null = null;
    try {
      const server = await createMutation.mutateAsync({
        name: entry.name,
        server_url: entry.server_url,
        auth_type: entry.auth_type,
        source: "catalog",
        catalog_id: entry.catalog_id,
        access_level: accessLevel,
      });
      newServerId = server.id;
      setCreatedServerId(server.id);
      const authData = await authorizeMutation.mutateAsync(server.id);
      const popup = window.open(
        authData.authorization_url,
        "mcp_oauth",
        "popup,width=600,height=700",
      );
      setOauthPopup(popup);
      setWaitingForOAuth(true);
    } catch (err: unknown) {
      if (newServerId) {
        deleteMutation.mutate(newServerId);
        setCreatedServerId(null);
      }
      showToast({
        message:
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Failed to start authorization",
        variant: "error",
      });
    }
  };

  const handleConnectClick = () => {
    if (entry.auth_type === "oauth2") {
      handleDirectOAuth();
    } else {
      onConnect(entry);
    }
  };

  const isWorkspace = (entry.default_access_level ?? []).some(
    (l) => l === "tenant" || l === "workspace",
  );
  const isPersonal = (entry.default_access_level ?? []).some(
    (l) => l === "user" || l === "personal",
  );
  const isBoth = isWorkspace && isPersonal;

  const isAuthenticated =
    !entry.authentication_status ||
    entry.authentication_status === "AUTHENTICATED";

  // For both-levels apps, only show chips for levels that are actually connected
  const isWorkspaceActuallyConnected =
    isWorkspace &&
    entry.is_connected &&
    (!isBoth || entry.connected_server_id !== entry.personal_server_id);
  const isPersonalActuallyConnected = isPersonal && !!entry.is_personal_connected;
  const isOnlyPersonalConnected =
    isBoth && isPersonalActuallyConnected && !isWorkspaceActuallyConnected;

  const chips: Array<"workspace" | "personal" | "connected"> = [];
  if (isWorkspaceActuallyConnected) chips.push("workspace");
  if (isPersonalActuallyConnected) chips.push("personal");
  if (!isWorkspaceActuallyConnected && !isPersonalActuallyConnected && isWorkspace)
    chips.push("workspace"); // unconnected workspace-only app
  if (isAuthenticated) chips.push("connected");

  const canDisconnectPersonal =
    !!entry.is_personal_connected && !!entry.personal_server_id;

  const isConnecting =
    createMutation.isPending || authorizeMutation.isPending || waitingForOAuth;

  return (
    <div>
      <IntegrationCard
        name={entry.name}
        description={entry.description}
        integrationLogoPath={entry.logo_url ?? ""}
        chips={chips}
        isAvailable={!isAuthenticated}
        onToggle={!isAuthenticated ? handleConnectClick : undefined}
        onDelete={
          isAuthenticated && canDisconnectPersonal
            ? () => setShowDisconnectConfirm(true)
            : undefined
        }
        canDelete={
          isAuthenticated && canDisconnectPersonal && !deleteMutation.isPending
        }
        deleteTooltip="Remove personal connection"
        disabled={deleteMutation.isPending || isConnecting}
      />
      {/* Case: personal connected but workspace not yet */}
      {isAuthenticated && isOnlyPersonalConnected && (
        <div className="pl-18 pr-4 py-1.25 bg-white border-t border-gray-100 flex items-center">
          <button
            onClick={() =>
              entry.auth_type === "oauth2"
                ? handleDirectOAuth("tenant")
                : onConnect(entry)
            }
            className="text-sm text-von-purple hover:underline cursor-pointer m-0 p-0 border-none bg-transparent font-medium"
          >
            Set as workspace integration
          </button>
        </div>
      )}
      {/* Case 2: workspace connected + catalog supports personal, but user hasn't connected personal yet */}
      {isAuthenticated && isBoth && !entry.is_personal_connected && (
        <div className="pl-18 pr-4 py-1.25 bg-white border-t border-gray-100 flex items-center">
          <button
            onClick={handleConnectClick}
            className="text-sm text-von-purple hover:underline cursor-pointer m-0 p-0 border-none bg-transparent font-medium"
          >
            Connect your personal {entry.name}
          </button>
        </div>
      )}
      <ConfirmationModal
        isOpen={showDisconnectConfirm}
        title="Disconnect Integration"
        message={
          <>
            Are you sure you want to disconnect <strong>{entry.name}</strong>?{" "}
            This will remove your personal connection.
          </>
        }
        confirmText="Disconnect"
        cancelText="Cancel"
        onConfirm={() => {
          setShowDisconnectConfirm(false);
          deleteMutation.mutate(entry.personal_server_id!);
        }}
        onCancel={() => setShowDisconnectConfirm(false)}
      />
    </div>
  );
}

interface IntegrationItemProps {
  item: IntegrationMetadata & {
    connectedInstances: Integration[];
    isConnected: boolean;
  };
  allIntegrations: Integration[];
  integrationsData: IntegrationsListProps["integrationsData"];
  loadingIntegrationId: string | null;
  timedOutIntegrations: string[];
  onConnect: (appId: string, accessLevel: "tenant" | "user") => void;
  onDelete: (
    id: string,
    connectionType: "workspace" | "personal" | "both",
  ) => void;
}

const SCOPE_OPTIONS: {
  value: SalesforceWriteScope;
  label: string;
  description: string;
}[] = [
  {
    value: "full_access",
    label: "Read & Write",
    description: "Read and update Salesforce for all users",
  },
  {
    value: "user_level_write",
    label: "Write with Personal Login",
    description:
      "Read for all users, but updates require each user to connect their Salesforce",
  },
  {
    value: "read_only",
    label: "Read Only",
    description: "Only read from Salesforce — no updates will be made",
  },
];

function SalesforceScopeMenu({
  currentScope,
  onDelete,
}: {
  currentScope: SalesforceWriteScope;
  onDelete?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showScopeSubmenu, setShowScopeSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const setScopeMutation = useSetSalesforceScope();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowScopeSubmenu(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (scope: SalesforceWriteScope) => {
    if (scope === currentScope) return;
    setScopeMutation.mutate(scope, {
      onSuccess: () => {
        setIsOpen(false);
        setShowScopeSubmenu(false);
      },
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowScopeSubmenu(false);
        }}
        className={`p-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${
          isOpen
            ? "bg-gray-200 text-gray-900"
            : "hover:bg-gray-200 text-gray-600"
        }`}
        aria-label="Open settings"
      >
        <DotsThreeVerticalIcon size={18} weight="bold" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 p-1 z-50">
          {/* Vonage Permissions */}
          <div className="relative">
            <button
              onClick={() => setShowScopeSubmenu(!showScopeSubmenu)}
              className={`w-full rounded-xl flex items-center justify-between px-3 py-2 text-sm text-gray-900 transition-colors duration-150 cursor-pointer ${
                showScopeSubmenu ? "bg-gray-100/80" : "hover:bg-gray-100/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheckIcon size={14} className="text-gray-800" />
                <span>Access Permissions</span>
              </div>
              <CaretRightIcon size={14} className="text-gray-400" />
            </button>

            {/* Scope Submenu */}
            {showScopeSubmenu && (
              <div className="absolute right-full top-0 mr-1 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 p-1">
                {SCOPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    disabled={setScopeMutation.isPending}
                    className={`w-full text-left rounded-xl px-3 py-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                      option.value === currentScope
                        ? "bg-green-50"
                        : "hover:bg-gray-100/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          option.value === currentScope
                            ? "text-green-800"
                            : "text-gray-900"
                        }`}
                      >
                        {option.label}
                      </span>
                      {option.value === currentScope && (
                        <CheckIcon
                          size={14}
                          weight="bold"
                          className="text-green-600 shrink-0"
                        />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-0.5 ${
                        option.value === currentScope
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Remove Connection */}
          {onDelete && (
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="w-full rounded-xl flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 cursor-pointer"
            >
              <TrashSimpleIcon size={14} />
              <span>Remove Connection</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual integration item with all state handling
 */
function IntegrationItem({
  item,
  integrationsData,
  loadingIntegrationId,
  timedOutIntegrations,
  onConnect,
  onDelete,
}: IntegrationItemProps) {
  const { connectedInstances, isConnected } = item;

  // Determine workspace and personal instances
  const workspace = connectedInstances.find((i) => i.accessLevel === "tenant");
  const personal = connectedInstances.find((i) => i.accessLevel === "user");
  const hasBoth = workspace && personal;

  // Get backend data for workspace integration
  const workspaceBackendIntegration = workspace
    ? integrationsData?.integrations.find((i) => i.id === workspace.id)
    : undefined;

  // Get backend data for personal integration
  const personalBackendIntegration = personal
    ? integrationsData?.integrations.find((i) => i.id === personal.id)
    : undefined;

  // Check permissions for workspace instance
  const { data: workspacePerms } = usePermissions(
    Resource.INTEGRATION,
    workspace
      ? {
          access_level: workspace.accessLevel,
          owner_id: workspace.userId,
          tenant_id: workspace.tenantId,
        }
      : undefined,
  );

  // Check permissions for personal instance
  const { data: personalPerms } = usePermissions(
    Resource.INTEGRATION,
    personal
      ? {
          access_level: personal.accessLevel,
          owner_id: personal.userId,
          tenant_id: personal.tenantId,
        }
      : undefined,
  );

  // Loading and timeout states for workspace
  const workspaceIsAuthenticating =
    workspaceBackendIntegration?.authenticationStatus ===
    AuthenticationStatus.AUTHENTICATING;
  const workspaceIsTimedOut = workspace
    ? timedOutIntegrations.includes(workspace.id)
    : false;
  const workspaceIsLoading =
    workspace &&
    (loadingIntegrationId === workspace.id ||
      (workspaceIsAuthenticating && !workspaceIsTimedOut));

  // Loading and timeout states for personal
  const personalIsAuthenticating =
    personalBackendIntegration?.authenticationStatus ===
    AuthenticationStatus.AUTHENTICATING;
  const personalIsTimedOut = personal
    ? timedOutIntegrations.includes(personal.id)
    : false;
  const personalIsLoading =
    personal &&
    (loadingIntegrationId === personal.id ||
      (personalIsAuthenticating && !personalIsTimedOut));

  // Salesforce scope - read from workspace config if available
  const isSalesforce = item.id === "salesforce";
  const currentScope = (workspaceBackendIntegration?.scope ??
    "full_access") as SalesforceWriteScope;
  const canEditScope = isSalesforce && workspace && workspacePerms?.update;

  // Case 1: Not connected at all - show as available
  // Note: Timed-out integrations are automatically deleted, so we always open sidepanel for new integration
  if (!isConnected) {
    // Show access level chips for available integrations
    // Some integrations (like Salesforce) support both levels
    const availableChips: Array<"workspace" | "personal"> = [];
    if (canBeOrgLevel(item.id)) availableChips.push("workspace");
    if (canBeUserLevel(item.id)) availableChips.push("personal");

    return (
      <IntegrationCard
        name={item.name}
        description={item.description}
        integrationLogoPath={item.logoPath}
        isAvailable={true}
        disabled={item.disabled}
        chips={availableChips}
        note={item.note}
        onToggle={
          item.disabled
            ? undefined
            : () => {
                const accessLevel = canBeOrgLevel(item.id) ? "tenant" : "user";
                onConnect(item.id, accessLevel);
              }
        }
      />
    );
  }

  // Case 2: Both workspace and personal - show combined card
  // Delete the personal connection - backend will cascade to workspace if user is owner
  if (hasBoth && workspace && personal) {
    const modifiedBy =
      workspace.ownerFirstName && workspace.ownerLastName
        ? `${workspace.ownerFirstName} ${workspace.ownerLastName}`
        : undefined;

    const instanceUrl = workspaceBackendIntegration?.config
      ?.instance_url as string;

    // Check if current user is the owner of the workspace integration
    const backendUserId = getBackendUserId();
    const isOwner = backendUserId === workspace.userId;

    // Remove "connected" chip while authenticating
    const isLoading = workspaceIsLoading || personalIsLoading;
    const chips: Array<"workspace" | "personal" | "connected"> = isLoading
      ? ["workspace", "personal"]
      : ["workspace", "personal", "connected"];

    // Determine connection type and tooltip based on ownership
    // Owner: deleting personal cascades to workspace (removes both)
    // Non-owner: only removes their personal connection
    const connectionType = isOwner ? "both" : "personal";
    const deleteTooltip = isOwner
      ? "Removes both workspace and personal connections"
      : "Removes personal connection";

    // During auth, always allow cancellation regardless of scope permissions
    const deleteHandler = personalPerms?.delete
      ? () => onDelete(personal.id, connectionType)
      : undefined;

    return (
      <IntegrationCard
        name={workspace.name}
        description={item.description}
        integrationLogoPath={workspace.integrationLogoPath}
        chips={chips}
        modifiedBy={modifiedBy}
        instanceUrl={instanceUrl}
        note={item.note}
        onDelete={
          isLoading ? deleteHandler : canEditScope ? undefined : deleteHandler
        }
        canDelete={
          isLoading
            ? (personalPerms?.delete ?? false)
            : canEditScope
              ? false
              : (personalPerms?.delete ?? false)
        }
        disabled={!!isLoading}
        loadingText={isLoading ? "Authenticating" : undefined}
        deleteTooltip={deleteTooltip}
        actionSlot={
          canEditScope && !isLoading ? (
            <SalesforceScopeMenu
              currentScope={currentScope}
              onDelete={deleteHandler}
            />
          ) : undefined
        }
      />
    );
  }

  // Case 3: Workspace only
  if (workspace) {
    const modifiedBy =
      workspace.ownerFirstName && workspace.ownerLastName
        ? `${workspace.ownerFirstName} ${workspace.ownerLastName}`
        : undefined;

    const canConnectPersonal = canBeUserLevel(item.id);
    const instanceUrl = workspaceBackendIntegration?.config
      ?.instance_url as string;

    // Get backend user ID from JWT token and check ownership
    const backendUserId = getBackendUserId();
    const isOwner = backendUserId === workspace.userId;

    // Determine chips based on ownership AND if integration supports both levels
    // Only for integrations that can be both workspace AND personal (like Salesforce):
    //   - Owner sees both workspace and personal chips
    //   - Non-owner sees only workspace chip
    // For workspace-only integrations: Always show only workspace chip
    // Remove "connected" chip while authenticating
    const chips: Array<"workspace" | "personal" | "connected"> =
      workspaceIsLoading
        ? isOwner && canConnectPersonal
          ? ["workspace", "personal"]
          : ["workspace"]
        : isOwner && canConnectPersonal
          ? ["workspace", "personal", "connected"]
          : ["workspace", "connected"];

    const handleWorkspaceDelete = workspacePerms?.delete
      ? () =>
          onDelete(
            workspace.id,
            isOwner && canConnectPersonal ? "both" : "workspace",
          )
      : undefined;

    return (
      <div>
        <IntegrationCard
          name={workspace.name}
          description={item.description}
          integrationLogoPath={workspace.integrationLogoPath}
          chips={chips}
          modifiedBy={modifiedBy}
          instanceUrl={instanceUrl}
          note={item.note}
          onDelete={
            workspaceIsLoading
              ? handleWorkspaceDelete
              : canEditScope
                ? undefined
                : handleWorkspaceDelete
          }
          canDelete={
            workspaceIsLoading
              ? (workspacePerms?.delete ?? false)
              : canEditScope
                ? false
                : (workspacePerms?.delete ?? false)
          }
          disabled={!!workspaceIsLoading}
          loadingText={workspaceIsLoading ? "Authenticating" : undefined}
          deleteTooltip={
            isOwner && canConnectPersonal
              ? "Removes both workspace and personal connections"
              : "Removes workspace connection"
          }
          actionSlot={
            canEditScope && !workspaceIsLoading ? (
              <SalesforceScopeMenu
                currentScope={currentScope}
                onDelete={handleWorkspaceDelete}
              />
            ) : undefined
          }
        />
        {canConnectPersonal && !isOwner && (
          <div className="pl-18 pr-4 py-1.25 bg-white border-t border-gray-100 flex items-center">
            <button
              onClick={() => onConnect(item.id, "user")}
              className="text-sm text-von-purple hover:underline cursor-pointer m-0 p-0 border-none bg-transparent font-medium"
            >
              Connect your personal {item.name}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Case 4: Personal only
  if (personal) {
    const instanceUrl = personalBackendIntegration?.config
      ?.instance_url as string;

    // Remove "connected" chip while authenticating
    const chips: Array<"personal" | "connected"> = personalIsLoading
      ? ["personal"]
      : ["personal", "connected"];

    return (
      <IntegrationCard
        name={personal.name}
        description={item.personalDescription || item.description}
        integrationLogoPath={personal.integrationLogoPath}
        chips={chips}
        instanceUrl={instanceUrl}
        note={item.note}
        onDelete={
          personalPerms?.delete
            ? () => onDelete(personal.id, "personal")
            : undefined
        }
        canDelete={personalPerms?.delete ?? false}
        disabled={!!personalIsLoading}
        loadingText={personalIsLoading ? "Authenticating" : undefined}
        deleteTooltip="Removes personal connection"
      />
    );
  }

  return null;
}

/**
 * IntegrationsList - Unified view of all integrations (available and connected)
 * Replaces the old AppsConfigPanel and IntegrationCardList components
 */
export function IntegrationsList({
  integrations,
  integrationsData,
  loadingIntegrationId,
  timedOutIntegrations,
  onConnect,
  onDelete,
  mcpEntries = [],
  onMCPConnect,
}: IntegrationsListProps) {
  const {
    isGoogleDriveEnabled,
    isZendeskEnabled,
    isSnowflakeEnabled,
    isGmailEnabled,
    isGranolaEnabled,
    isNotionEnabled,
    isOutreachEngageEnabled,
    isSalesloftEngagementEnabled,
    isJiminnyEnabled,
    isDatabricksEnabled,
    isBoxEnabled,
    isBigQueryEnabled,
    isMcpServersEnabled,
  } = useFeatureFlag();

  const allApps = useMemo(() => {
    const apps = getAllIntegrations();
    return apps.filter((app) => {
      // Hide piggyback child entries — each shares creds with a parent
      // integration in the same category, so surfacing them as separate
      // "Available" cards just duplicates the parent. Their metadata
      // entries stay registered for BE↔FE id translation.
      //   gong            ← gongengage
      //   outreachengage  ← outreach_kaia
      //   salesloft_engagement ← salesloft_recorder
      if (
        app.id === "gongengage" ||
        app.id === "outreach_kaia" ||
        app.id === "salesloft_recorder"
      ) {
        return false;
      }
      if (app.id === "googledrive" && !isGoogleDriveEnabled) return false;
      if (app.id === "zendesk" && !isZendeskEnabled) return false;
      if (app.id === "snowflake" && !isSnowflakeEnabled) return false;
      if (app.id === "gmail" && !isGmailEnabled) return false;
      if (app.id === "granola" && !isGranolaEnabled) return false;
      if (app.id === "notion" && !isNotionEnabled) return false;
      if (app.id === "outreachengage" && !isOutreachEngageEnabled) return false;
      if (app.id === "salesloft_engagement" && !isSalesloftEngagementEnabled)
        return false;
      if (app.id === "jiminny" && !isJiminnyEnabled) return false;
      if (app.id === "databricks" && !isDatabricksEnabled) return false;
      if (app.id === "box" && !isBoxEnabled) return false;
      if (app.id === "bigquery" && !isBigQueryEnabled) return false;
      return true;
    });
  }, [
    isGoogleDriveEnabled,
    isZendeskEnabled,
    isSnowflakeEnabled,
    isGmailEnabled,
    isGranolaEnabled,
    isNotionEnabled,
    isOutreachEngageEnabled,
    isSalesloftEngagementEnabled,
    isJiminnyEnabled,
    isDatabricksEnabled,
    isBoxEnabled,
    isBigQueryEnabled,
  ]);

  // Merge available apps with connected integrations
  const mergedData = useMemo(() => {
    return allApps.map((app) => {
      // Only include integrations that are authenticated OR currently authenticating
      // This ensures failed/timed-out OAuth attempts show as "available" again
      const connectedInstances = integrations.filter((i) => {
        if (getFrontendIntegrationId(i.type) !== app.id) return false;
        // Include if authenticated OR currently authenticating
        return (
          i.enabled ||
          i.authenticationStatus === AuthenticationStatus.AUTHENTICATING
        );
      });
      return {
        ...app,
        disabled: app.disabled,
        connectedInstances,
        isConnected: connectedInstances.length > 0,
      };
    });
  }, [allApps, integrations]);

  // Group MCP catalog entries by mapped category
  const mcpByCategory = useMemo(() => {
    const grouped: Record<string, CatalogEntry[]> = {};
    for (const entry of mcpEntries) {
      const mapped =
        CATALOG_CATEGORY_MAP[entry.category_name] ?? entry.category_name;
      if (!grouped[mapped]) grouped[mapped] = [];
      grouped[mapped].push(entry);
    }
    return grouped;
  }, [mcpEntries]);

  // Extra MCP categories not in CATEGORY_ORDER
  const extraMCPCategories = useMemo(
    () =>
      Object.keys(mcpByCategory).filter(
        (c) => !CATEGORY_ORDER.includes(c as never),
      ),
    [mcpByCategory],
  );

  // Group by category, disabled (coming soon) items sorted to the bottom
  const byCategory = useMemo(() => {
    const grouped = mergedData.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, typeof mergedData>,
    );
    for (const category of Object.keys(grouped)) {
      grouped[category].sort((a, b) => {
        if (a.disabled === b.disabled) return 0;
        return a.disabled ? 1 : -1;
      });
    }
    return grouped;
  }, [mergedData]);

  return (
    <div className="space-y-2">
      {CATEGORY_ORDER.map((category) => {
        const items = byCategory[category];
        const mcpItems = mcpByCategory[category] ?? [];
        if (!items?.length && !mcpItems.length) return null;

        return (
          <div
            key={category}
            className="bg-white rounded-lg border border-gray-200 overflow-visible"
          >
            {/* Category Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {category}
              </h3>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-200">
              {items?.map((item) => (
                <IntegrationItem
                  key={item.id}
                  item={item}
                  allIntegrations={integrations}
                  integrationsData={integrationsData}
                  loadingIntegrationId={loadingIntegrationId}
                  timedOutIntegrations={timedOutIntegrations}
                  onConnect={onConnect}
                  onDelete={onDelete}
                />
              ))}
              {isMcpServersEnabled &&
                mcpItems.map((entry) => (
                  <MCPCatalogItem
                    key={entry.catalog_id}
                    entry={entry}
                    onConnect={onMCPConnect ?? (() => {})}
                  />
                ))}
            </div>
          </div>
        );
      })}

      {/* Extra MCP categories not in CATEGORY_ORDER */}
      {isMcpServersEnabled &&
        extraMCPCategories.map((category) => (
          <div
            key={category}
            className="bg-white rounded-lg border border-gray-200 overflow-visible"
          >
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {category}
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {mcpByCategory[category].map((entry) => (
                <MCPCatalogItem
                  key={entry.catalog_id}
                  entry={entry}
                  onConnect={onMCPConnect ?? (() => {})}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
