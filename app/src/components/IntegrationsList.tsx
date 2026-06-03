import { useMemo, useState, useRef, useEffect } from "react";
import {
  useDeleteMCPServer,
  useDisconnectMCPServer,
} from "../hooks/useMCPServers";
import { IntegrationCard, ConfirmationModal } from "@vonlabs/design-components";
import { usePermissions } from "../hooks/usePermissions";
import { useDeleteConnections } from "../hooks/useAppCatalog";
import {
  useSetHubspotScope,
  useDeleteIntegration,
  useSetSalesforceScope,
} from "../hooks/useIntegrations";
import { Resource, AuthenticationStatus } from "../services";
import type { SalesforceWriteScope } from "../services";
import type { CatalogEntry } from "../types/mcp";
import {
  getAllIntegrations,
  canBeOrgLevel,
  canBeUserLevel,
  getFrontendIntegrationId,
  getBackendIntegrationType,
  type IntegrationMetadata,
} from "../constants/integrationMetadata";
import type { Integration } from "./IntegrationsPanel";
import type { TenantIntegrationEnriched } from "../types/appCatalog";
import { getUserContext } from "../lib/auth";
import { useUser } from "../hooks/useUser";
import { useTenantMember } from "../hooks/useTenantMembers";
import {
  DotsThreeVerticalIcon,
  CaretRightIcon,
  TrashSimpleIcon,
  ShieldCheckIcon,
  CheckIcon,
  GearIcon,
} from "@phosphor-icons/react";
import usePreferencesStore from "../store/preferencesStore";

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
  | "Customer Success"
  | "Communication"
> = [
  "CRM",
  "Communication",
  "Calendar",
  "Calls & Engagement",
  "Note Takers",
  "Knowledge base",
  "Data Warehouse",
  "Customer Support",
  "Customer Success",
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
  deletingIntegrationId: string | null;
  timedOutIntegrations: string[];
  onConnect: (appId: string, accessLevel: "tenant" | "user") => void;
  onDelete: (
    id: string,
    connectionType: "workspace" | "personal" | "both",
  ) => void;
  mcpEntries?: CatalogEntry[];
  onMCPConnect?: (entry: CatalogEntry) => void;
  tenantIntegrations?: TenantIntegrationEnriched[];
  isAdmin?: boolean;
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
  "Customer Success": "Customer Success",
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
  const deleteMCPServerMutation = useDeleteMCPServer();
  const disconnectMCPServerMutation = useDisconnectMCPServer();
  const deleteConnectionsMutation = useDeleteConnections();
  const deleteIntegrationMutation = useDeleteIntegration();
  const { user } = useUser();
  const isAdmin =
    user?.roles?.some((r) => r.toLowerCase() === "admin") ?? false;
  const { data: workspaceOwner } = useTenantMember(
    entry.workspace_published_by ?? undefined,
  );
  const modifiedBy =
    workspaceOwner?.firstName && workspaceOwner?.lastName
      ? `${workspaceOwner.firstName} ${workspaceOwner.lastName}`
      : undefined;

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [disconnectMode, setDisconnectMode] = useState<
    "workspace" | "personal"
  >("workspace");

  const handleConnectClick = () => {
    onConnect(entry);
  };

  const handleConnectPersonalClick = () => {
    onConnect({ ...entry, connection_mode: "personal" });
  };

  const handleConnectWorkspaceClick = () => {
    onConnect({ ...entry, connection_mode: "workspace" });
  };

  const isWorkspace = (entry.default_access_level ?? []).some(
    (l) => l === "tenant" || l === "workspace",
  );
  const isPersonal = (entry.default_access_level ?? []).some(
    (l) => l === "user" || l === "personal",
  );
  const isBoth = isWorkspace && isPersonal;

  const isAuthenticated = entry.authentication_status === "AUTHENTICATED";

  const isWorkspaceActuallyConnected =
    isWorkspace &&
    entry.is_connected &&
    (!isBoth || entry.connected_server_id !== entry.personal_server_id);
  const isPersonalActuallyConnected =
    isPersonal && !!entry.is_personal_connected;
  const isOnlyPersonalConnected =
    isBoth && isPersonalActuallyConnected && !isWorkspaceActuallyConnected;

  const chips: Array<"workspace" | "personal" | "connected"> = [];
  if (isWorkspaceActuallyConnected) chips.push("workspace");
  if (isPersonalActuallyConnected) chips.push("personal");
  if (!isWorkspaceActuallyConnected && !isPersonalActuallyConnected) {
    if (isWorkspace) chips.push("workspace");
    if (isPersonal) chips.push("personal");
  }
  if (isAuthenticated) chips.push("connected");

  const canDisconnectWorkspace = isWorkspaceActuallyConnected && isAdmin;
  const canDisconnectPersonal =
    !!entry.is_personal_connected && !!entry.personal_server_id;
  const canDisconnect = canDisconnectWorkspace || canDisconnectPersonal;

  const isBusy =
    deleteMCPServerMutation.isPending ||
    disconnectMCPServerMutation.isPending ||
    deleteConnectionsMutation.isPending ||
    deleteIntegrationMutation.isPending;

  const handleDisconnectConfirm = async () => {
    setShowDisconnectConfirm(false);
    if (disconnectMode === "workspace") {
      await deleteConnectionsMutation.mutateAsync(entry.catalog_id);
    } else if (entry.is_ti_based) {
      // TI-based personal disconnect — only remove the user's integration record
      if (entry.personal_server_id) {
        await deleteIntegrationMutation.mutateAsync(entry.personal_server_id);
      }
    } else {
      // Legacy MCPServer-based personal disconnect
      if (entry.connection_mode === "personal") {
        disconnectMCPServerMutation.mutate(entry.connected_server_id!);
      } else {
        deleteMCPServerMutation.mutate(entry.personal_server_id!);
      }
    }
  };

  const deleteTooltip =
    isBoth && canDisconnectWorkspace && canDisconnectPersonal
      ? "Remove connection"
      : canDisconnectWorkspace
        ? "Remove workspace connection"
        : "Remove personal connection";

  return (
    <div>
      <IntegrationCard
        name={entry.name}
        description={entry.short_description ?? entry.description}
        integrationLogoPath={entry.logo_url ?? ""}
        chips={chips}
        modifiedBy={isAuthenticated ? modifiedBy : undefined}
        isAvailable={!isAuthenticated}
        onToggle={!isAuthenticated ? handleConnectClick : undefined}
        onDelete={
          isAuthenticated && canDisconnect
            ? () => {
                // Personal takes priority — only target workspace when personal is not connected
                setDisconnectMode(
                  canDisconnectPersonal ? "personal" : "workspace",
                );
                setShowDisconnectConfirm(true);
              }
            : undefined
        }
        canDelete={isAuthenticated && canDisconnect && !isBusy}
        deleteTooltip={deleteTooltip}
        disabled={isBusy}
      />
      {/* Case: personal connected but workspace not yet */}
      {isAuthenticated && isOnlyPersonalConnected && (
        <div className="pl-18 pr-4 py-1.25 bg-white border-t border-gray-100 flex items-center">
          <button
            onClick={handleConnectWorkspaceClick}
            className="text-sm text-von-purple hover:underline cursor-pointer m-0 p-0 border-none bg-transparent font-medium"
          >
            Set as workspace integration
          </button>
        </div>
      )}
      {/* Case: workspace connected + catalog supports personal, but user hasn't connected personal yet */}
      {isAuthenticated && isBoth && !entry.is_personal_connected && (
        <div className="pl-18 pr-4 py-1.25 bg-white border-t border-gray-100 flex items-center">
          <button
            onClick={handleConnectPersonalClick}
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
            {disconnectMode === "workspace"
              ? "This will remove the workspace connection."
              : "This will remove your personal connection."}
          </>
        }
        confirmText="Disconnect"
        cancelText="Cancel"
        onConfirm={handleDisconnectConfirm}
        onCancel={() => setShowDisconnectConfirm(false)}
      />
    </div>
  );
}

interface IntegrationItemProps {
  item: IntegrationMetadata & {
    connectedInstances: Integration[];
    isConnected: boolean;
    catalogEntry?: {
      tenant_integrations: {
        workspace: { availability_status: string } | null;
        personal: { availability_status: string } | null;
      };
    };
  };
  allIntegrations: Integration[];
  integrationsData: IntegrationsListProps["integrationsData"];
  loadingIntegrationId: string | null;
  deletingIntegrationId: string | null;
  timedOutIntegrations: string[];
  onConnect: (appId: string, accessLevel: "tenant" | "user") => void;
  onDelete: (
    id: string,
    connectionType: "workspace" | "personal" | "both",
  ) => void;
}

// Salesforce + HubSpot share the same scope union, so one option-list shape works for both.
type ScopeOption = {
  value: SalesforceWriteScope;
  label: string;
  description: string;
};

type SetScopeMutation = {
  mutate: (
    scope: SalesforceWriteScope,
    options?: { onSuccess?: () => void },
  ) => void;
  isPending: boolean;
};

const SALESFORCE_SCOPE_OPTIONS: ScopeOption[] = [
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

const HUBSPOT_SCOPE_OPTIONS: ScopeOption[] = [
  {
    value: "full_access",
    label: "Read & Write",
    description: "Read and update HubSpot for all users",
  },
  {
    value: "user_level_write",
    label: "Write with Personal Login",
    description:
      "Read for all users, but updates require each user to connect their HubSpot",
  },
  {
    value: "read_only",
    label: "Read Only",
    description: "Only read from HubSpot — no updates will be made",
  },
];

// One menu rendering for any integration that uses the read_only / user_level_write
// / full_access scope model. Callers pass the integration-specific option list and
// the matching mutation hook (the hook is called inside so React can track it).
function IntegrationScopeMenu({
  currentScope,
  options,
  useSetScope,
  onDelete,
}: {
  currentScope: SalesforceWriteScope;
  options: ScopeOption[];
  useSetScope: () => SetScopeMutation;
  onDelete?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showScopeSubmenu, setShowScopeSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const setScopeMutation = useSetScope();

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

            {showScopeSubmenu && (
              <div className="absolute right-full top-0 mr-1 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 p-1">
                {options.map((option) => (
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
  deletingIntegrationId,
  timedOutIntegrations,
  onConnect,
  onDelete,
}: IntegrationItemProps) {
  const { connectedInstances, isConnected } = item;
  const setConfiguringSlackChannels = usePreferencesStore(
    (s) => s.setConfiguringSlackChannels,
  );

  // Determine workspace and personal instances
  const workspace = connectedInstances.find((i) => i.accessLevel === "tenant");
  const personal = connectedInstances.find((i) => i.accessLevel === "user");

  const { data: workspaceOwner } = useTenantMember(workspace?.userId);
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

  // Scope menu wiring — Salesforce + HubSpot share the same three modes;
  // we render an integration-specific menu so the labels reference the
  // right product name in toasts and submenu copy.
  const isSalesforce = item.id === "salesforce";
  const isHubspot = item.id === "hubspot";
  const currentScope = (workspaceBackendIntegration?.scope ??
    "full_access") as SalesforceWriteScope;
  const canEditScope =
    (isSalesforce || isHubspot) && workspace && workspacePerms?.update;

  // Case 1: Not connected at all - show as available
  // Note: Timed-out integrations are automatically deleted, so we always open sidepanel for new integration
  if (!isConnected) {
    // Derive access level from published catalog entry when available,
    // otherwise fall back to hardcoded metadata capabilities
    const wsPublished =
      item.catalogEntry?.tenant_integrations?.workspace?.availability_status ===
      "published";
    const personalPublished =
      item.catalogEntry?.tenant_integrations?.personal?.availability_status ===
      "published";
    const availableChips: Array<"workspace" | "personal"> = [];
    if (wsPublished) availableChips.push("workspace");
    if (personalPublished) availableChips.push("personal");
    if (availableChips.length === 0) {
      if (canBeOrgLevel(item.id)) availableChips.push("workspace");
      if (canBeUserLevel(item.id)) availableChips.push("personal");
    }

    const primaryAccessLevel: "tenant" | "user" = wsPublished
      ? "tenant"
      : personalPublished
        ? "user"
        : canBeOrgLevel(item.id)
          ? "tenant"
          : "user";

    return (
      <IntegrationCard
        name={item.name}
        description={item.description}
        integrationLogoPath={item.logoPath}
        chips={availableChips}
        isAvailable={true}
        disabled={item.disabled}
        note={item.note}
        onToggle={
          item.disabled
            ? undefined
            : () => onConnect(item.id, primaryAccessLevel)
        }
      />
    );
  }

  // Case 2: Both workspace and personal - show combined card
  // Delete the personal connection - backend will cascade to workspace if user is owner
  if (hasBoth && workspace && personal) {
    const modifiedBy =
      workspaceOwner?.firstName && workspaceOwner?.lastName
        ? `${workspaceOwner.firstName} ${workspaceOwner.lastName}`
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
        deleteDisabled={deletingIntegrationId === personal.id}
        deleteTooltip={deleteTooltip}
        actionSlot={
          canEditScope && !isLoading ? (
            <IntegrationScopeMenu
              currentScope={currentScope}
              options={
                isHubspot ? HUBSPOT_SCOPE_OPTIONS : SALESFORCE_SCOPE_OPTIONS
              }
              useSetScope={
                isHubspot ? useSetHubspotScope : useSetSalesforceScope
              }
              onDelete={deleteHandler}
            />
          ) : item.id === "slack_workspace" && workspace && !isLoading ? (
            <button
              onClick={() => setConfiguringSlackChannels(workspace.id)}
              className="p-1.5 text-gray-500 hover:text-von-purple hover:bg-von-purple-50 rounded-lg cursor-pointer border-none bg-transparent"
              aria-label="Configure channels"
              title="Configure channels"
            >
              <GearIcon size={18} />
            </button>
          ) : undefined
        }
      />
    );
  }

  // Case 3: Workspace only
  if (workspace) {
    const modifiedBy =
      workspaceOwner?.firstName && workspaceOwner?.lastName
        ? `${workspaceOwner.firstName} ${workspaceOwner.lastName}`
        : undefined;

    const canConnectPersonal = item.catalogEntry
      ? item.catalogEntry.tenant_integrations.personal?.availability_status ===
        "published"
      : canBeUserLevel(item.id);
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
          deleteDisabled={deletingIntegrationId === workspace.id}
          deleteTooltip={
            isOwner && canConnectPersonal
              ? "Removes both workspace and personal connections"
              : "Removes workspace connection"
          }
          actionSlot={
            item.id === "slack_workspace" && !workspaceIsLoading ? (
              <button
                onClick={() => setConfiguringSlackChannels(workspace.id)}
                className="p-1.5 text-gray-500 hover:text-von-purple hover:bg-von-purple-50 rounded-lg cursor-pointer border-none bg-transparent"
                aria-label="Configure channels"
                title="Configure channels"
              >
                <GearIcon size={18} />
              </button>
            ) : canEditScope && !workspaceIsLoading ? (
              <IntegrationScopeMenu
                currentScope={currentScope}
                options={
                  isHubspot ? HUBSPOT_SCOPE_OPTIONS : SALESFORCE_SCOPE_OPTIONS
                }
                useSetScope={
                  isHubspot ? useSetHubspotScope : useSetSalesforceScope
                }
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
        deleteDisabled={deletingIntegrationId === personal.id}
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
  deletingIntegrationId,
  timedOutIntegrations,
  onConnect,
  onDelete,
  mcpEntries = [],
  onMCPConnect,
  tenantIntegrations,
  isAdmin = false,
}: IntegrationsListProps) {
  // Build a fast lookup: BACKEND_TYPE → { tenant_integrations: { workspace, personal } }
  // Aggregates per-mode TI rows into a single entry per integration type.
  const catalogMap = useMemo(() => {
    const map = new Map<
      string,
      {
        tenant_integrations: {
          workspace: { availability_status: string } | null;
          personal: { availability_status: string } | null;
        };
      }
    >();
    for (const ti of tenantIntegrations ?? []) {
      if (ti.catalog_type !== "native_integration") continue;
      // Key by catalog_id — stable identifier unaffected by integration_type label changes
      const key = ti.catalog_id;
      if (!map.has(key)) {
        map.set(key, {
          tenant_integrations: { workspace: null, personal: null },
        });
      }
      const entry = map.get(key)!;
      if (ti.connection_mode === "workspace") {
        entry.tenant_integrations.workspace = {
          availability_status: ti.availability_status,
        };
      } else {
        entry.tenant_integrations.personal = {
          availability_status: ti.availability_status,
        };
      }
    }
    return map;
  }, [tenantIntegrations]);

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
      // Catalog-gating applies once tenant integrations have loaded
      if (tenantIntegrations !== undefined) {
        // HubSpot, Salesforce, and Slack Workspace are always visible regardless
        // of catalog state — they're hardcoded chips that bypass AppCatalogEntry.
        if (
          app.id === "hubspot" ||
          app.id === "salesforce" ||
          app.id === "slack_workspace"
        ) {
          return true;
        }

        // Try app.id directly (e.g. "gmail"), then backend-type lowercase (e.g. "google_calendar")
        const catalogEntry =
          catalogMap.get(app.id) ??
          catalogMap.get(getBackendIntegrationType(app.id).toLowerCase());
        const isInCatalog = !!catalogEntry;
        const isConnected = integrations.some(
          (i) =>
            getFrontendIntegrationId(i.type) === app.id &&
            (i.enabled ||
              i.authenticationStatus === AuthenticationStatus.AUTHENTICATING),
        );
        if (!isInCatalog && !isConnected) return false;

        // Members see: already connected, personal is published, or workspace is published
        if (!isAdmin && !isConnected) {
          const wsPublished =
            catalogEntry?.tenant_integrations.workspace?.availability_status ===
            "published";
          const personalPublished =
            catalogEntry?.tenant_integrations.personal?.availability_status ===
            "published";
          if (!wsPublished && !personalPublished) return false;
        }
      }

      return true;
    });
  }, [tenantIntegrations, catalogMap, integrations, isAdmin]);

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
      const catalogEntry =
        catalogMap.get(app.id) ??
        catalogMap.get(getBackendIntegrationType(app.id).toLowerCase());
      return {
        ...app,
        disabled: app.disabled,
        connectedInstances,
        isConnected: connectedInstances.length > 0,
        catalogEntry,
      };
    });
  }, [allApps, integrations, catalogMap]);

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

            {/* Items — slack_workspace pinned to the bottom of Communication. */}
            <div className="divide-y divide-gray-200">
              {items
                ?.filter((i) => i.id !== "slack_workspace")
                .map((item) => (
                  <IntegrationItem
                    key={item.id}
                    item={item}
                    allIntegrations={integrations}
                    integrationsData={integrationsData}
                    loadingIntegrationId={loadingIntegrationId}
                    deletingIntegrationId={deletingIntegrationId}
                    timedOutIntegrations={timedOutIntegrations}
                    onConnect={onConnect}
                    onDelete={onDelete}
                  />
                ))}
              {mcpItems.map((entry) => (
                <MCPCatalogItem
                  key={entry.catalog_id}
                  entry={entry}
                  onConnect={onMCPConnect ?? (() => {})}
                />
              ))}
              {items
                ?.filter((i) => i.id === "slack_workspace")
                .map((item) => (
                  <IntegrationItem
                    key={item.id}
                    item={item}
                    allIntegrations={integrations}
                    integrationsData={integrationsData}
                    loadingIntegrationId={loadingIntegrationId}
                    deletingIntegrationId={deletingIntegrationId}
                    timedOutIntegrations={timedOutIntegrations}
                    onConnect={onConnect}
                    onDelete={onDelete}
                  />
                ))}
            </div>
          </div>
        );
      })}

      {/* Extra MCP categories not in CATEGORY_ORDER */}
      {extraMCPCategories.map((category) => (
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
