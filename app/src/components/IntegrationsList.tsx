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
import { getAccessToken } from "../lib/auth";

/**
 * Decode JWT token payload without verification
 * Note: This only decodes the payload, it does NOT verify the signature
 */
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1]);
    return JSON.parse(payload);
  } catch (error) {
    console.error("[IntegrationsList] Failed to decode JWT:", error);
    return null;
  }
}

/**
 * Get backend user ID from JWT token
 * Returns the xuid claim which matches the backend user ID
 */
function getBackendUserId(): string | null {
  const token = getAccessToken();
  if (!token) return null;

  const payload = decodeJWT(token);
  if (!payload) return null;

  return (payload.xuid as string) || null;
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
  onDelete: (id: string) => void;
}

interface IntegrationItemProps {
  item: IntegrationMetadata & {
    connectedInstances: Integration[];
    isConnected: boolean;
  };
  integrationsData: IntegrationsListProps["integrationsData"];
  loadingIntegrationId: string | null;
  timedOutIntegrations: string[];
  onConnect: (appId: string, accessLevel: "tenant" | "user") => void;
  onDelete: (id: string) => void;
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
  if (!isConnected) {
    return (
      <IntegrationCard
        name={item.name}
        description={item.description}
        integrationLogoPath={item.logoPath}
        isAvailable={true}
        disabled={item.disabled}
        chips={[]}
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

    return (
      <IntegrationCard
        name={workspace.name}
        description={item.description}
        integrationLogoPath={workspace.integrationLogoPath}
        chips={["workspace", "personal", "connected"]}
        modifiedBy={modifiedBy}
        instanceUrl={instanceUrl}
        onDelete={
          personalPerms?.delete ? () => onDelete(personal.id) : undefined
        }
        canDelete={personalPerms?.delete ?? false}
        disabled={!!workspaceIsLoading || !!personalIsLoading}
        loadingText={
          workspaceIsLoading || personalIsLoading ? "Authenticating" : undefined
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

    // Debug logging
    if (item.id === "salesforce") {
      console.log("[IntegrationsList] Salesforce ownership check:", {
        backendUserId,
        workspaceUserId: workspace.userId,
        isOwner,
        canConnectPersonal,
        workspaceData: workspace,
      });
    }

    // Determine chips based on ownership AND if integration supports both levels
    // Only for integrations that can be both workspace AND personal (like Salesforce):
    //   - Owner sees both workspace and personal chips
    //   - Non-owner sees only workspace chip
    // For workspace-only integrations: Always show only workspace chip
    const chips: Array<"workspace" | "personal" | "connected"> =
      isOwner && canConnectPersonal
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
            workspacePerms?.delete ? () => onDelete(workspace.id) : undefined
          }
          canDelete={workspacePerms?.delete ?? false}
          disabled={!!workspaceIsLoading}
          loadingText={workspaceIsLoading ? "Authenticating" : undefined}
        />
        {canConnectPersonal && !isOwner && (
          <div className="px-4 pb-3 bg-white border-t border-gray-100">
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

    return (
      <IntegrationCard
        name={personal.name}
        description={item.personalDescription || item.description}
        integrationLogoPath={personal.integrationLogoPath}
        chips={["personal", "connected"]}
        instanceUrl={instanceUrl}
        onDelete={
          personalPerms?.delete ? () => onDelete(personal.id) : undefined
        }
        canDelete={personalPerms?.delete ?? false}
        disabled={!!personalIsLoading}
        loadingText={personalIsLoading ? "Authenticating" : undefined}
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
      const connectedInstances = integrations.filter(
        (i) => getFrontendIntegrationId(i.type) === app.id,
      );
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
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
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
