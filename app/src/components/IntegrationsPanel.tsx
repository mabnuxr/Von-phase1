import React, { useState } from "react";
import { IntegrationCard, ConfirmationModal } from "@vonlabs/design-components";

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
 * IntegrationsPanel - Panel for managing integrations
 *
 * Displays a list of available integrations with toggle controls.
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
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "salesforce",
      name: "Salesforce",
      integrationLogoPath: "/Images/salesforce.svg",
      enabled: false,
    },
    {
      id: "gong",
      name: "Gong",
      integrationLogoPath: "/Images/gong.svg",
      enabled: false,
    },
  ]);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    integrationName: string;
    resolver?: (value: boolean) => void;
  }>({
    isOpen: false,
    integrationName: "",
  });

  const handleToggle = (id: string, enabled: boolean) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id ? { ...integration, enabled } : integration
      )
    );
    onIntegrationToggle?.(id, enabled);
  };

  const handleRequestDisableConfirmation = (
    integrationName: string
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

  return (
    <>
      <div style={containerStyles}>
        <div style={headerStyles}>
          <h1 style={titleStyles}>Integrations</h1>
          <p style={subtitleStyles}>Available Integrations</p>
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
