import { useMemo } from "react";
import { IntegrationCard } from "@vonlabs/design-components";
import { usePermissions } from "../hooks/usePermissions";
import { Resource, AuthenticationStatus } from "../services";
import {
  getAllIntegrations,
  canBeOrgLevel,
  canBeUserLevel,
  getFrontendIntegrationId,
  type IntegrationMetadata,
} from "../constants/integrationMetadata";
import type { Integration } from "./IntegrationsPanel";
import { getUserContext } from "../lib/auth";

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
  | "Call Recorder"
  | "Internal Documents"
  | "Sales Engagement"
  | "Data Warehouse"
  | "Customer Support"
  | "Other"
> = [
  "CRM",
  "Calendar",
  "Call Recorder",
  "Internal Documents",
  "Sales Engagement",
  "Data Warehouse",
  "Customer Support",
  "Other",
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

    return (
      <IntegrationCard
        name={workspace.name}
        description={item.description}
        integrationLogoPath={workspace.integrationLogoPath}
        chips={chips}
        modifiedBy={modifiedBy}
        instanceUrl={instanceUrl}
        onDelete={
          personalPerms?.delete
            ? () => onDelete(personal.id, connectionType)
            : undefined
        }
        canDelete={personalPerms?.delete ?? false}
        disabled={!!isLoading}
        loadingText={isLoading ? "Authenticating" : undefined}
        deleteTooltip={deleteTooltip}
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

    return (
      <div>
        <IntegrationCard
          name={workspace.name}
          description={item.description}
          integrationLogoPath={workspace.integrationLogoPath}
          chips={chips}
          modifiedBy={modifiedBy}
          instanceUrl={instanceUrl}
          onDelete={
            workspacePerms?.delete
              ? () =>
                  onDelete(
                    workspace.id,
                    isOwner && canConnectPersonal ? "both" : "workspace",
                  )
              : undefined
          }
          canDelete={workspacePerms?.delete ?? false}
          disabled={!!workspaceIsLoading}
          loadingText={workspaceIsLoading ? "Authenticating" : undefined}
          deleteTooltip={
            isOwner && canConnectPersonal
              ? "Removes both workspace and personal connections"
              : "Removes workspace connection"
          }
        />
        {canConnectPersonal && !isOwner && (
          <div className="pl-[72px] pr-4 py-[5px] bg-white border-t border-gray-100 flex items-center">
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
}: IntegrationsListProps) {
  const allApps = getAllIntegrations();

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
        connectedInstances,
        isConnected: connectedInstances.length > 0,
      };
    });
  }, [allApps, integrations]);

  // Group by category
  const byCategory = useMemo(() => {
    return mergedData.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, typeof mergedData>,
    );
  }, [mergedData]);

  return (
    <div className="space-y-2">
      {CATEGORY_ORDER.map((category) => {
        const items = byCategory[category];
        if (!items?.length) return null;

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
              {items.map((item) => (
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
