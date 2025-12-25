import { IntegrationCard } from "./IntegrationCard.legacy";
import { AuthenticationStatus } from "../services";
import { getIntegrationById } from "../constants/integrationMetadata";
import type { Integration } from "./IntegrationsPanel";

/**
 * Get access token from localStorage
 */
function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

/**
 * Decode JWT token
 */
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1]);
    return JSON.parse(payload) as Record<string, unknown>;
  } catch (error) {
    console.error("[IntegrationCardList] Failed to decode JWT:", error);
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

/**
 * Renders a list of integration cards
 * Legacy component from main branch (used when simplified integrations flag is OFF)
 */
export function IntegrationCardList({
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
          (i: { id: string }) => i.id === integration.id,
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

        // Check ownership for workspace integrations
        const backendUserId = getBackendUserId();
        const isOwner = backendUserId === integration.userId;

        // Permission-based access control
        // Personal integrations: user always has full control
        // Workspace integrations: user must be owner OR have admin permissions
        const hasUpdatePermission = isPersonal || isOwner || canUpdate;
        const hasDeletePermission = isPersonal || isOwner || canDelete;

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
