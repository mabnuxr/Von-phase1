import { useFlags } from "launchdarkly-react-client-sdk";

/**
 * Feature flag keys used in the application
 */
export const FEATURE_FLAGS = {
  /** @deprecated permanently enabled — kept for reference only */
  GOOGLE_CALENDAR_INTEGRATION: "enableGoogleCalender",
  /** @deprecated permanently enabled — kept for reference only */
  GOOGLE_DRIVE_INTEGRATION: "enableGoogleDrive",
  EMAIL_CATEGORIZATION: "enableEmailConfiguration",
  SLASH_COMMANDS: "enableSlashCommands",
  ACTIONS: "enableDashboards",
  /** @deprecated permanently enabled — kept for reference only */
  DEEP_LINKS: "enableDeepLinks",
  AGENT_V2: "agentsV2",
  /** @deprecated permanently enabled — kept for reference only */
  USER_MEMORY: "enableUserMemory",
  DEEP_RESEARCH: "deepResearch",
  AGENT_V2_SOURCES: "agentSources",
  DISABLED_TENANTS: "disabledTenants",
  /** @deprecated permanently enabled — kept for reference only */
  FILE_UPLOAD: "enableFileUpload",
  /** @deprecated permanently enabled — kept for reference only */
  ARTIFACTS: "enableArtifacts",
  SCHEDULED_COMMANDS: "enableScheduledCommands",
  /** @deprecated permanently enabled — kept for reference only */
  ZENDESK_INTEGRATION: "enableZendesk",
  SNOWFLAKE: "enableSnowflake",
  /** @deprecated permanently enabled — kept for reference only */
  GMAIL: "enableGmail",
  GONG_ENGAGE: "enableGongEngage",
  GRANOLA: "enableGranola",
  NOTION: "enableNotion",
  HUBSPOT: "enableHubspot",
  BOX: "enableBox",
  OUTREACH_ENGAGE: "enableOutreachEngage",
  SALESLOFT_ENGAGEMENT: "enableSalesloftEngagement",
  JIMINNY: "enableJiminny",
  DATABRICKS: "enableDatabricks",
  BIGQUERY: "enableGoogleBigquery",
  // LaunchDarkly key: `enable-dashboard-filters-v2` (auto-camelCased by the
  // React SDK for `useFlags()` access). Shared with the backend gate
  // (`FeatureFlagClient().is_enabled("enable-dashboard-filters-v2", …)`),
  // so a single toggle in LaunchDarkly flips both sides in sync.
  DASHBOARD_FILTERS_V2: "enableDashboardFiltersV2",
  // LaunchDarkly key: `enable-dashboard-drag-drop` (auto-camelCased to
  // `enableDashboardDragDrop` for `useFlags()` access). Gates the manual
  // drag-and-drop / resize affordance in dashboard edit mode. When off,
  // edit mode still works for filters / rename / save, but widgets stay
  // pinned to their configured layout.
  DASHBOARD_DRAG_DROP: "enableDashboardDragDrop",
  // Gates the "Share chat" entry points (header button + sidebar
  // context-menu item). The recipient `/shared/:token` route stays
  // reachable so already-generated links continue to work.
  CHAT_SHARING: "enableChatSharing",
  USAGE_METRICS: "enableUsageMetrics",
  VON_AI_FIELDS: "enableVonAiFields",
  CUSTOM_MCP: "enableCustomMcp",
  MCP_SERVERS: "enableMcpServers",
  // Gates the redesigned memory pages (org/user split tabs, inline editor,
  // pick-time S3 uploads, attachment chips, bulk-import side pane). Off
  // returns the legacy single-pane memory tab.
  MEMORY_V2: "enableMemoryV2",
  // Gates the dashboard collaboration v2 surface (VON-1147): new share
  // modal with scope + per-user grants, edit-lock + Save Draft / Discard
  // / Restore lifecycle, and version-history panel. Off keeps the legacy
  // Private / Org-wide share dialog and the owner-only edit toggle.
  DASHBOARD_COLLAB: "dashboardCollab",
} as const;

/**
 * Type for all available feature flags
 */
export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

/**
 * Custom hook to access feature flags
 *
 * @example
 * ```tsx
 * const { isGoogleCalendarEnabled, isEmailCategorizationEnabled } = useFeatureFlag();
 *
 * if (isGoogleCalendarEnabled) {
 *   // Show Google Calendar integration
 * }
 * ```
 */
export function useFeatureFlag() {
  const flags = useFlags();

  return {
    /**
     * Google Calendar integration — permanently enabled, no longer behind a feature flag
     */
    isGoogleCalendarEnabled: true,

    /**
     * Google Drive integration — permanently enabled, no longer behind a feature flag
     */
    isGoogleDriveEnabled: true,

    /**
     * Controls whether Email Categorization tab is visible
     */
    isEmailCategorizationEnabled:
      flags[FEATURE_FLAGS.EMAIL_CATEGORIZATION] === true,

    /**
     * Controls whether Slash Commands feature is enabled in chat
     */
    isSlashCommandsEnabled: flags[FEATURE_FLAGS.SLASH_COMMANDS] === true,

    /**
     * Controls whether additional actions menu is enabled (convert to dashboard, etc.)
     */
    isActionsEnabled: flags[FEATURE_FLAGS.ACTIONS] === true,

    /**
     * Salesforce deep links — permanently enabled, no longer behind a feature flag
     */
    isDeepLinksEnabled: true,

    /**
     * Controls whether the new TimelineThinkingProcess v2 component is used
     * instead of the legacy ThinkingBlock component. Permanently enabled.
     */
    isAgentV2: flags[FEATURE_FLAGS.AGENT_V2] === true,

    /**
     * User memory — permanently enabled, no longer behind a feature flag
     */
    isUserMemoryEnabled: true,

    /**
     * Memory V2 — gates the redesigned memory pages (split Org/User tabs,
     * inline editor, pick-time S3 uploads, bulk-import side pane). Off
     * shows the legacy single-pane memory tab.
     */
    isMemoryV2Enabled: flags[FEATURE_FLAGS.MEMORY_V2] === true,

    /**
     * Controls whether deep research feature (plus menu with agents) is enabled
     */
    isDeepResearchEnabled: flags[FEATURE_FLAGS.DEEP_RESEARCH] === true,

    /**
     * Controls whether the Sources button is shown on assistant messages
     */
    isSourcesEnabled: flags[FEATURE_FLAGS.AGENT_V2_SOURCES] === true,

    /**
     * Controls whether the current tenant's subscription is inactive
     */
    isTenantDisabled: flags[FEATURE_FLAGS.DISABLED_TENANTS] === true,

    /**
     * File upload — permanently enabled, no longer behind a feature flag
     */
    isFileUploadEnabled: true,

    /**
     * Artifacts — permanently enabled, no longer behind a feature flag
     */
    isArtifactsEnabled: true,

    /**
     * Controls whether scheduled commands (schedule section, recipients, send test) are enabled
     */
    isScheduledCommandsEnabled: true,

    /**
     * Zendesk integration — permanently enabled, no longer behind a feature flag
     */
    isZendeskEnabled: true,

    /**
     * Controls whether Snowflake integration is visible
     */
    isSnowflakeEnabled: flags[FEATURE_FLAGS.SNOWFLAKE] === true,

    /**
     * Gmail integration — permanently enabled, no longer behind a feature flag
     */
    isGmailEnabled: true,

    /**
     * Controls whether Gong Engage integration is visible
     */
    isGongEngageEnabled: flags[FEATURE_FLAGS.GONG_ENGAGE] === true,

    /**
     * Controls whether Granola integration is visible
     */
    isGranolaEnabled: flags[FEATURE_FLAGS.GRANOLA] === true,

    /**
     * Controls whether Notion integration is visible
     */
    isNotionEnabled: flags[FEATURE_FLAGS.NOTION] === true,

    /**
     * Controls whether Box integration is visible
     */
    isBoxEnabled: flags[FEATURE_FLAGS.BOX] === true,

    /**
     * Controls whether Outreach engagement integration is visible
     */
    isOutreachEngageEnabled: flags[FEATURE_FLAGS.OUTREACH_ENGAGE] === true,

    /**
     * Controls whether Salesloft engagement integration is visible
     */
    isSalesloftEngagementEnabled:
      flags[FEATURE_FLAGS.SALESLOFT_ENGAGEMENT] === true,

    /**
     * Controls whether Jiminny integration is visible
     */
    isJiminnyEnabled: flags[FEATURE_FLAGS.JIMINNY] === true,

    /**

     * Controls whether Databricks integration is visible
     */
    isDatabricksEnabled: flags[FEATURE_FLAGS.DATABRICKS] === true,

    /**
     * Controls whether BigQuery integration is visible
     */
    isBigQueryEnabled: flags[FEATURE_FLAGS.BIGQUERY] === true,
    /**
     * Controls whether the v2 dashboard filter bar UI is enabled
     * (ScrollableFilterBar, SplitFilterDropdown, DataSourcesDrawer, panel overrides).
     */
    isDashboardFiltersV2Enabled:
      flags[FEATURE_FLAGS.DASHBOARD_FILTERS_V2] === true,

    /**
     * Controls whether dashboard widgets can be rearranged via drag-and-drop
     * and resized in edit mode. When false, widgets stay pinned to their
     * configured layout — edit mode still works for filters / rename / save.
     */
    isDashboardDragDropEnabled:
      flags[FEATURE_FLAGS.DASHBOARD_DRAG_DROP] === true,

    /**
     * Controls whether the chat sharing feature is enabled
     */
    isChatSharingEnabled: flags[FEATURE_FLAGS.CHAT_SHARING] === true,

    /**
     * Controls whether Usage tab is visible in Settings
     */
    isUsageMetricsEnabled: flags[FEATURE_FLAGS.USAGE_METRICS] === true,

    /**
     * Controls whether Von AI Fields tab is visible in Settings
     */
    isVonAiFieldsEnabled: flags[FEATURE_FLAGS.VON_AI_FIELDS] === true,

    /**
     * Controls whether custom MCP server connections are available
     */
    isCustomMcpEnabled: flags[FEATURE_FLAGS.CUSTOM_MCP] === true,

    /**
     * Controls whether catalog MCP servers are shown on the integrations page
     */
    isMcpServersEnabled: flags[FEATURE_FLAGS.MCP_SERVERS] === true,

    /**
     * Controls whether Hubspot integration is visible
     */
    isHubspotEnabled: flags[FEATURE_FLAGS.HUBSPOT] === true,

    /**
     * Controls whether the dashboard collaboration v2 surface is enabled —
     * new share modal (scope + per-user grants), edit-lock + Save Draft /
     * Discard / Restore lifecycle, and version-history panel. Off keeps
     * the legacy share dialog and owner-only edit toggle.
     */
    isDashboardCollabEnabled: flags[FEATURE_FLAGS.DASHBOARD_COLLAB] === true,

    /**
     * Raw flags object for advanced usage
     */
    flags,
  };
}

/**
 * Hook to check a specific feature flag by key
 *
 * @param flagKey - The feature flag key to check
 * @param defaultValue - Default value if flag is not set (defaults to false)
 *
 * @example
 * ```tsx
 * const isEnabled = useFeatureFlagValue('gmail-integration');
 * ```
 */
export function useFeatureFlagValue(
  flagKey: FeatureFlagKey | string,
  defaultValue: boolean = false,
): boolean {
  const flags = useFlags();
  return flags[flagKey] ?? defaultValue;
}
