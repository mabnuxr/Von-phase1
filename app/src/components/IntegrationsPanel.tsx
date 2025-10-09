import React, { useState, useEffect } from "react";
import { IntegrationCard, ConfirmationModal } from "@vonlabs/design-components";
import {
  integrationsService,
  IntegrationType,
  type Integration as BackendIntegration,
} from "../services";
import { useUser } from "../hooks/useUser";

export interface Integration {
  id: string;
  name: string;
  integrationLogoPath: string;
  enabled: boolean;
}

export interface IntegrationsPanelProps {
  /**
   * Callback when integration is toggled
   */
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
 * Transform backend integration to display format
 */
function transformBackendIntegration(
  backendIntegration: BackendIntegration,
): Integration {
  return {
    id: backendIntegration.id,
    name: backendIntegration.provider,
    integrationLogoPath: getIntegrationLogoPath(backendIntegration.type),
    enabled: backendIntegration.isActive,
  };
}

/**
 * IntegrationsPanel - Panel for managing integrations
 *
 * Displays a list of available integrations with toggle controls.
 * Fetches integrations from the backend based on the current user's tenant.
 *
 * @example
 * ```tsx
 * <IntegrationsPanel
 *   onIntegrationToggle={(id, enabled) => console.log(id, enabled)}
 * />
 * ```
 */
export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({
  onIntegrationToggle,
}) => {
  const { user, loading: userLoading } = useUser();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    integrationName: string;
    resolver?: (value: boolean) => void;
  }>({
    isOpen: false,
    integrationName: "",
  });

  // Fetch integrations when user is authenticated
  // JWT token automatically provides tenant and user context
  useEffect(() => {
    let cancelled = false; // Flag to prevent state updates after unmount

    const fetchIntegrations = async () => {
      // Wait for user to be loaded (we need the token)
      if (userLoading) {
        return;
      }

      // If no user, stop loading
      if (!user) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) {
          setLoading(true);
          setError(null);
        }

        // New API: No need to pass tenant_id or user_id
        // They're automatically extracted from JWT token
        const result = await integrationsService.getIntegrations();

        // Only update state if this request hasn't been cancelled
        if (!cancelled) {
          const transformedIntegrations = result.integrations.map(
            transformBackendIntegration,
          );
          setIntegrations(transformedIntegrations);

          if (import.meta.env.DEV) {
            console.log(
              `[IntegrationsPanel] Loaded ${result.total} integrations for ${result.tenantName}`,
            );
          }
        }
      } catch (err) {
        // Only update error state if not cancelled
        if (!cancelled) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to fetch integrations";
          setError(errorMessage);
          console.error(
            "[IntegrationsPanel] Error fetching integrations:",
            err,
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchIntegrations();

    // Cleanup function to cancel pending updates
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, retryCount]); // Intentionally omit 'user' to prevent infinite loop - JWT token in apiClient is what matters

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const handleToggle = (id: string, enabled: boolean) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id ? { ...integration, enabled } : integration,
      ),
    );
    onIntegrationToggle?.(id, enabled);
  };

  const handleRequestDisableConfirmation = (
    integrationName: string,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        integrationName,
        resolver: resolve,
      });
    });
  };

  const handleConfirm = () => {
    modalState.resolver?.(true);
    setModalState({ isOpen: false, integrationName: "" });
  };

  const handleCancel = () => {
    modalState.resolver?.(false);
    setModalState({ isOpen: false, integrationName: "" });
  };

  const containerStyles: React.CSSProperties = {
    padding: "24px",
    height: "100%",
    overflow: "auto",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  };

  const headerStyles: React.CSSProperties = {
    marginBottom: "24px",
  };

  const titleStyles: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 600,
    color: "#1d1d1f",
    margin: "0 0 8px 0",
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: "14px",
    color: "#6e6e73",
    margin: 0,
  };

  const gridStyles: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "16px",
  };

  // Show loading state while user or integrations are loading
  if (userLoading || loading) {
    const skeletonCardStyles: React.CSSProperties = {
      height: "200px",
      borderRadius: "12px",
      background:
        "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s ease-in-out infinite",
    };

    return (
      <div style={containerStyles}>
        <style>
          {`
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}
        </style>
        <div style={headerStyles}>
          <h1 style={titleStyles}>Integrations</h1>
          <p style={subtitleStyles}>Loading integrations...</p>
        </div>
        <div style={gridStyles}>
          {[1, 2].map((i) => (
            <div key={i} style={skeletonCardStyles} />
          ))}
        </div>
      </div>
    );
  }

  // Show error state if there was an error fetching integrations
  if (error) {
    const retryButtonStyles: React.CSSProperties = {
      marginTop: "16px",
      padding: "10px 20px",
      backgroundColor: "#0071e3",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: 500,
      cursor: "pointer",
      transition: "background-color 0.2s",
    };

    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <h1 style={titleStyles}>Integrations</h1>
          <p
            style={{ ...subtitleStyles, color: "#d1293d", marginBottom: "8px" }}
          >
            Error: {error}
          </p>
          <button
            style={retryButtonStyles}
            onClick={handleRetry}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#0077ed";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#0071e3";
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show message if user is not authenticated
  if (!user) {
    return (
      <div style={containerStyles}>
        <div style={headerStyles}>
          <h1 style={titleStyles}>Integrations</h1>
          <p style={subtitleStyles}>Please log in to view integrations</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={containerStyles}>
        <div style={headerStyles}>
          <h1 style={titleStyles}>Integrations</h1>
          <p style={subtitleStyles}>
            {integrations.length > 0
              ? `${integrations.length} integration${integrations.length === 1 ? "" : "s"} available`
              : "No integrations available"}
          </p>
        </div>
        <div style={gridStyles}>
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              name={integration.name}
              integrationLogoPath={integration.integrationLogoPath}
              enabled={integration.enabled}
              onToggle={(enabled) => handleToggle(integration.id, enabled)}
              onRequestDisableConfirmation={() =>
                handleRequestDisableConfirmation(integration.name)
              }
            />
          ))}
        </div>
      </div>

      <ConfirmationModal
        isOpen={modalState.isOpen}
        title="Disable Integration"
        message={`Are you sure you want to disable the ${modalState.integrationName} integration? This will stop syncing data from ${modalState.integrationName}.`}
        confirmText="Disable"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmVariant="danger"
      />
    </>
  );
};

export default IntegrationsPanel;
