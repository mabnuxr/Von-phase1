/**
 * Centralized integration metadata
 * Single source of truth for all integration configurations
 */

export interface IntegrationMetadata {
  id: string;
  name: string;
  description: string;
  /** Optional personal description for user-level integrations */
  personalDescription?: string;
  logoPath: string;
  disabled?: boolean;
  /** Optional note shown below the description */
  note?: string;
  category:
    | "CRM"
    | "Call Recorder"
    | "Internal Documents"
    | "Sales Engagement"
    | "Data Warehouse"
    | "Customer Support"
    | "Calendar"
    | "Note Takers"
    | "Other";
}

/**
 * All available integrations
 * Add new integrations here to make them available throughout the app
 */
export const INTEGRATION_METADATA: Record<string, IntegrationMetadata> = {
  salesforce: {
    id: "salesforce",
    name: "Salesforce",
    description:
      "Ask anything about your CRM data. Connect your account to make updates",
    personalDescription: "Connect your Salesforce account",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/salesforce.svg",
    category: "CRM",
  },
  hubspot: {
    id: "hubspot",
    name: "HubSpot",
    description: "Sync deals, contacts, and company data",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/hubspot.svg",
    category: "CRM",
    disabled: true,
  },
  gong: {
    id: "gong",
    name: "Gong",
    description: "Ask about Gong calls and get Von's conversation insights",
    note: "If you have a Gong Engage license, it will be automatically enabled with this connection",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/gong.svg",
    category: "Call Recorder",
  },
  gongengage: {
    id: "gongengage",
    name: "Gong Engage",
    description: "Analyse flows and manage engagement actions from Gong Engage",
    note: "Set up your Gong call recorder to start using Gong Engage",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/gong.svg",
    category: "Sales Engagement",
  },
  fathom: {
    id: "fathom",
    name: "Fathom",
    description: "Ask about Fathom calls and get Von's conversation insights",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/fathom.svg",
    category: "Call Recorder",
  },
  zoom: {
    id: "zoom",
    name: "Zoom",
    description: "Connect Zoom to import meeting recordings and transcripts",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/zoom.svg",
    category: "Call Recorder",
    disabled: true,
  },
  googlecalendar: {
    id: "googlecalendar",
    name: "Google Calendar",
    description:
      "Ask about past meetings, prep for upcoming ones, and create invites",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/googleCalender.svg",
    category: "Calendar",
  },
  outlookcalendar: {
    id: "outlookcalendar",
    name: "Outlook Calendar",
    description: "Sync your Outlook calendar events and meetings",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Outlook.svg",
    category: "Calendar",
    disabled: true,
  },
  // Call Recorder integrations
  chorus: {
    id: "chorus",
    name: "Chorus",
    description: "Ask about Chorus calls and get Von's conversation insights",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Chorus.svg",
    category: "Call Recorder",
  },
  claricopilot: {
    id: "claricopilot",
    name: "Clari Co-pilot",
    description: "Ask about Clari calls and get Von's conversation insights",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/ClariCopilot.svg",
    category: "Call Recorder",
  },
  attention: {
    id: "attention",
    name: "Attention",
    description:
      "Ask about Attention calls and get Von's conversation insights",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Attention.jpeg",
    category: "Call Recorder",
  },
  // Internal Documents integrations
  googledrive: {
    id: "googledrive",
    name: "Google Drive",
    description: "Search and reference documents from your Google Drive",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/GDrive.svg",
    category: "Internal Documents",
  },
  gmail: {
    id: "gmail",
    name: "Gmail",
    description: "Draft and send emails directly from your Gmail account",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Gmail.svg",
    category: "Other",
  },
  highspot: {
    id: "highspot",
    name: "Highspot",
    description: "Access sales enablement content and analytics from Highspot",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Highspot.svg",
    category: "Internal Documents",
    disabled: true,
  },
  seismic: {
    id: "seismic",
    name: "Seismic",
    description: "Sync sales content and enablement materials from Seismic",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Seismic.svg",
    category: "Internal Documents",
    disabled: true,
  },
  confluence: {
    id: "confluence",
    name: "Confluence",
    description: "Connect Confluence to access team documentation and wikis",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Confluence.svg",
    category: "Internal Documents",
    disabled: true,
  },
  guru: {
    id: "guru",
    name: "Guru",
    description: "Access knowledge base and team wiki from Guru",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Guru.svg",
    category: "Internal Documents",
    disabled: true,
  },
  intercom: {
    id: "intercom",
    name: "Intercom",
    description: "Import customer conversations and support data from Intercom",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Intercom.svg",
    category: "Internal Documents",
    disabled: true,
  },
  // Sales Engagement integrations
  outreach: {
    id: "outreach",
    name: "Outreach",
    description: "Sync sales sequences and engagement data from Outreach",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Outreach.svg",
    category: "Sales Engagement",
    disabled: true,
  },
  salesloft: {
    id: "salesloft",
    name: "Salesloft",
    description: "Import cadences and sales engagement metrics from Salesloft",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Salesloft.jpeg",
    category: "Sales Engagement",
    disabled: true,
  },
  // Data Warehouse integrations
  snowflake: {
    id: "snowflake",
    name: "Snowflake",
    description: "Connect to Snowflake data warehouse for advanced analytics",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Snowflake.svg",
    category: "Data Warehouse",
  },
  databricks: {
    id: "databricks",
    name: "Databricks",
    description: "Integrate with Databricks for data lakehouse analytics",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Databricks.svg",
    category: "Data Warehouse",
    disabled: true,
  },
  // Customer Support integrations
  zendesk: {
    id: "zendesk",
    name: "Zendesk",
    description: "Sync support tickets and customer interactions from Zendesk",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Zendesk.svg",
    category: "Customer Support",
  },
  pylon: {
    id: "pylon",
    name: "Pylon",
    description: "Import customer support data and insights from Pylon",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Pylon.png",
    category: "Customer Support",
    disabled: true,
  },
  granola: {
    id: "granola",
    name: "Granola",
    description:
      "Search meeting notes, transcripts, and AI-generated summaries",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/granola.svg",
    category: "Note Takers",
  },
  notion: {
    id: "notion",
    name: "Notion",
    description:
      "Search, read, and update Notion pages, databases, and comments",
    logoPath:
      "https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/notion.svg",
    category: "Internal Documents",
  },
} as const;

/**
 * Get all integrations as an array
 */
export function getAllIntegrations(): IntegrationMetadata[] {
  return Object.values(INTEGRATION_METADATA);
}

/**
 * Get logo path for an integration type
 * Handles mapping backend types like GOOGLE_CALENDAR to frontend IDs like googlecalendar
 */
export function getIntegrationLogoPath(type: string): string {
  // Map backend type to frontend ID
  const typeMap: Record<string, string> = {
    GOOGLE_CALENDAR: "googlecalendar",
    GOOGLE_DRIVE: "googledrive",
    OUTLOOK_CALENDAR: "outlookcalendar",
    SALESFORCE: "salesforce",
    HUBSPOT: "hubspot",
    GONG: "gong",
    GONG_ENGAGE: "gongengage",
    FATHOM: "fathom",
    ZOOM: "zoom",
    CHORUS: "chorus",
    CLARI_COPILOT: "claricopilot",
    ATTENTION: "attention",
    HIGHSPOT: "highspot",
    SEISMIC: "seismic",
    CONFLUENCE: "confluence",
    GURU: "guru",
    INTERCOM: "intercom",
    OUTREACH: "outreach",
    SALESLOFT: "salesloft",
    SNOWFLAKE: "snowflake",
    DATABRICKS: "databricks",
    ZENDESK: "zendesk",
    PYLON: "pylon",
    GMAIL: "gmail",
    GRANOLA: "granola",
    NOTION: "notion",
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
    gongengage: "GONG_ENGAGE",
    fathom: "FATHOM",
    zoom: "ZOOM",
    googlecalendar: "GOOGLE_CALENDAR",
    googledrive: "GOOGLE_DRIVE",
    outlookcalendar: "OUTLOOK_CALENDAR",
    chorus: "CHORUS",
    claricopilot: "CLARI_COPILOT",
    attention: "ATTENTION",
    highspot: "HIGHSPOT",
    seismic: "SEISMIC",
    confluence: "CONFLUENCE",
    guru: "GURU",
    intercom: "INTERCOM",
    outreach: "OUTREACH",
    salesloft: "SALESLOFT",
    snowflake: "SNOWFLAKE",
    databricks: "DATABRICKS",
    zendesk: "ZENDESK",
    pylon: "PYLON",
    gmail: "GMAIL",
    granola: "GRANOLA",
    notion: "NOTION",
  };

  return idMap[integrationId.toLowerCase()] || integrationId.toUpperCase();
}

/**
 * Map backend integration type to frontend integration ID
 * Handles special cases like GOOGLE_CALENDAR -> googlecalendar
 */
export function getFrontendIntegrationId(backendType: string): string {
  const typeMap: Record<string, string> = {
    SALESFORCE: "salesforce",
    HUBSPOT: "hubspot",
    GONG: "gong",
    GONG_ENGAGE: "gongengage",
    FATHOM: "fathom",
    ZOOM: "zoom",
    GOOGLE_CALENDAR: "googlecalendar",
    GOOGLE_DRIVE: "googledrive",
    OUTLOOK_CALENDAR: "outlookcalendar",
    CHORUS: "chorus",
    CLARI_COPILOT: "claricopilot",
    ATTENTION: "attention",
    HIGHSPOT: "highspot",
    SEISMIC: "seismic",
    CONFLUENCE: "confluence",
    GURU: "guru",
    INTERCOM: "intercom",
    OUTREACH: "outreach",
    SALESLOFT: "salesloft",
    SNOWFLAKE: "snowflake",
    DATABRICKS: "databricks",
    ZENDESK: "zendesk",
    PYLON: "pylon",
    GMAIL: "gmail",
    GRANOLA: "granola",
    NOTION: "notion",
  };

  return typeMap[backendType.toUpperCase()] || backendType.toLowerCase();
}

/**
 * Get user-friendly display name for an integration
 * Maps backend types/provider names to readable labels
 */
export function getIntegrationDisplayName(typeOrProvider: string): string {
  // Map backend type to frontend ID first
  const typeMap: Record<string, string> = {
    GOOGLE_CALENDAR: "googlecalendar",
    GOOGLE_DRIVE: "googledrive",
    OUTLOOK_CALENDAR: "outlookcalendar",
    SALESFORCE: "salesforce",
    HUBSPOT: "hubspot",
    GONG: "gong",
    GONG_ENGAGE: "gongengage",
    FATHOM: "fathom",
    ZOOM: "zoom",
    CHORUS: "chorus",
    CLARI_COPILOT: "claricopilot",
    ATTENTION: "attention",
    HIGHSPOT: "highspot",
    SEISMIC: "seismic",
    CONFLUENCE: "confluence",
    GURU: "guru",
    INTERCOM: "intercom",
    OUTREACH: "outreach",
    SALESLOFT: "salesloft",
    SNOWFLAKE: "snowflake",
    DATABRICKS: "databricks",
    ZENDESK: "zendesk",
    PYLON: "pylon",
    GMAIL: "gmail",
    GRANOLA: "granola",
    NOTION: "notion",
  };

  const integrationId =
    typeMap[typeOrProvider.toUpperCase()] || typeOrProvider.toLowerCase();
  const integration = INTEGRATION_METADATA[integrationId];

  return integration?.name || typeOrProvider;
}

/**
 * Integration access modes - defines whether an integration can be org-level, user-level, or both
 * - tenant: Org-level integration, shared with all team members
 * - user: Personal integration, private to the user
 */
export type AccessLevel = "tenant" | "user";

export const INTEGRATION_ACCESS_MODES: Record<string, AccessLevel[]> = {
  // CRM - Salesforce can be both org and user level
  salesforce: ["tenant", "user"],

  // Call recorders - workspace only (shared recordings)
  gong: ["tenant"],
  gongengage: ["tenant"],
  fathom: ["tenant"],
  zoom: ["tenant"],
  chorus: ["tenant"],
  claricopilot: ["tenant"],
  attention: ["tenant"],
  zendesk: ["tenant"],

  // Personal integrations - user-level only
  hubspot: ["user"],
  googlecalendar: ["user"],
  googledrive: ["user"],
  outlookcalendar: ["user"],
  highspot: ["user"],
  seismic: ["user"],
  confluence: ["user"],
  guru: ["user"],
  intercom: ["user"],
  outreach: ["user"],
  salesloft: ["user"],
  snowflake: ["tenant"],
  databricks: ["user"],
  pylon: ["user"],
  granola: ["user"],
  notion: ["tenant"],
};

/**
 * Check if an integration can be configured at org level
 */
export function canBeOrgLevel(integrationId: string): boolean {
  return INTEGRATION_ACCESS_MODES[integrationId]?.includes("tenant") ?? false;
}

/**
 * Check if an integration can be configured at user level
 */
export function canBeUserLevel(integrationId: string): boolean {
  return INTEGRATION_ACCESS_MODES[integrationId]?.includes("user") ?? false;
}

/**
 * Get integrations that can be configured at org level
 */
export function getOrgLevelIntegrations(): IntegrationMetadata[] {
  return getAllIntegrations().filter((i) => canBeOrgLevel(i.id));
}

/**
 * Get integrations that can be configured at user level
 */
export function getUserLevelIntegrations(): IntegrationMetadata[] {
  return getAllIntegrations().filter((i) => canBeUserLevel(i.id));
}

/**
 * Get the appropriate description for an integration based on the section
 * @param integrationId - The integration ID
 * @param isPersonal - Whether this is for the personal section
 * @returns The appropriate description
 */
export function getIntegrationDescription(
  integrationId: string,
  isPersonal: boolean,
): string {
  const integration = INTEGRATION_METADATA[integrationId];
  if (!integration) return "";

  if (isPersonal && integration.personalDescription) {
    return integration.personalDescription;
  }
  return integration.description;
}
