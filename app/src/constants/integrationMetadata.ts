/**
 * Centralized integration metadata
 * Single source of truth for all integration configurations
 */

export interface IntegrationMetadata {
  id: string;
  name: string;
  logoPath: string;
  disabled?: boolean;
  category: "CRM" | "Call Recorder" | "Other";
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
    category: "CRM",
  },
  hubspot: {
    id: "hubspot",
    name: "HubSpot",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/hubspot.svg",
    category: "CRM",
    disabled: true,
  },
  gong: {
    id: "gong",
    name: "Gong",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/gong.svg",
    category: "Call Recorder",
  },
  fathom: {
    id: "fathom",
    name: "Fathom",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/fathom.svg",
    category: "Call Recorder",
  },
  zoom: {
    id: "zoom",
    name: "Zoom",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/zoom.svg",
    category: "Call Recorder",
    disabled: true,
  },
  googlecalendar: {
    id: "googlecalendar",
    name: "Google Calendar",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/googleCalender.svg",
    category: "Other",
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
 * Handles mapping backend types like GOOGLE_CALENDAR to frontend IDs like googlecalendar
 */
export function getIntegrationLogoPath(type: string): string {
  // Map backend type to frontend ID
  const typeMap: Record<string, string> = {
    GOOGLE_CALENDAR: "googlecalendar",
    SALESFORCE: "salesforce",
    HUBSPOT: "hubspot",
    GONG: "gong",
    FATHOM: "fathom",
    ZOOM: "zoom",
  };

  const integrationId = typeMap[type.toUpperCase()] || type.toLowerCase();
  const integration = INTEGRATION_METADATA[integrationId];

  return (
    integration?.logoPath ||
    "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/connection.svg"
  );
}

/**
 * Map frontend integration ID to backend IntegrationType
 * Handles special cases like googlecalendar -> GOOGLE_CALENDAR
 */
export function getBackendIntegrationType(integrationId: string): string {
  const idMap: Record<string, string> = {
    salesforce: "SALESFORCE",
    hubspot: "HUBSPOT",
    gong: "GONG",
    fathom: "FATHOM",
    zoom: "ZOOM",
    googlecalendar: "GOOGLE_CALENDAR",
  };

  return idMap[integrationId.toLowerCase()] || integrationId.toUpperCase();
}

/**
 * Get user-friendly display name for an integration
 * Maps backend types/provider names to readable labels
 */
export function getIntegrationDisplayName(typeOrProvider: string): string {
  // Map backend type to frontend ID first
  const typeMap: Record<string, string> = {
    GOOGLE_CALENDAR: "googlecalendar",
    SALESFORCE: "salesforce",
    HUBSPOT: "hubspot",
    GONG: "gong",
    FATHOM: "fathom",
    ZOOM: "zoom",
  };

  const integrationId =
    typeMap[typeOrProvider.toUpperCase()] || typeOrProvider.toLowerCase();
  const integration = INTEGRATION_METADATA[integrationId];

  return integration?.name || typeOrProvider;
}
