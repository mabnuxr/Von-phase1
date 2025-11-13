/**
 * Centralized integration metadata
 * Single source of truth for all integration configurations
 */

export interface IntegrationMetadata {
  id: string;
  name: string;
  logoPath: string;
  disabled?: boolean;
}

/**
 * All available integrations
 * Add new integrations here to make them available throughout the app
 */
export const INTEGRATION_METADATA: Record<string, IntegrationMetadata> = {
  salesforce: {
    id: "salesforce",
    name: "Salesforce",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/salesforce.svg",
  },
  gong: {
    id: "gong",
    name: "Gong",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/gong.svg",
  },
  fathom: {
    id: "fathom",
    name: "Fathom",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/fathom.svg",
  },
  hubspot: {
    id: "hubspot",
    name: "HubSpot",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/hubspot.svg",
    disabled: true,
  },
} as const;

/**
 * Get all integrations as an array
 */
export function getAllIntegrations(): IntegrationMetadata[] {
  return Object.values(INTEGRATION_METADATA);
}

/**
 * Get integration metadata by ID
 */
export function getIntegrationById(
  id: string,
): IntegrationMetadata | undefined {
  return INTEGRATION_METADATA[id];
}

/**
 * Get logo path for an integration type
 */
export function getIntegrationLogoPath(type: string): string {
  const integration = INTEGRATION_METADATA[type.toLowerCase()];
  return (
    integration?.logoPath ||
    "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/connection.svg"
  );
}
