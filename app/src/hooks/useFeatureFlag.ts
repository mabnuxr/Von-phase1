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
  SLACK_PERSONAL: "enableSlackPersonal",
  // Gates the redesigned memory pages (org/user split tabs, inline editor,
  // pick-time S3 uploads, attachment chips, bulk-import side pane). Off
  // returns the legacy single-pane memory tab.
  MEMORY_V2: "enableMemoryV2",
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
    isSlashCommandsEnabled: true,

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
    isAgentV2: true,

    /**
     * User memory — permanently enabled, no longer behind a feature flag
     */
    isUserMemoryEnabled: true,

    /**
     * Memory V2 — gates the redesigned memory pages (split Org/User tabs,
     * inline editor, pick-time S3 uploads, bulk-import side pane). Off
     * shows the legacy single-pane memory tab.
     */
    isMemoryV2Enabled: true,

    /**
     * Controls whether deep research feature (plus menu with agents) is enabled
     */
    isDeepResearchEnabled: true,

    /**
     * Controls whether the Sources button is shown on assistant messages
     */
    isSourcesEnabled: true,

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
    isSnowflakeEnabled: true,

    /**
     * Gmail integration — permanently enabled, no longer behind a feature flag
     */
    isGmailEnabled: true,

    /**
     * Controls whether Gong Engage integration is visible
     */
    isGongEngageEnabled: true,

    /**
     * Controls whether Granola integration is visible
     */
    isGranolaEnabled: true,

    /**
     * Controls whether Notion integration is visible
     */
    isNotionEnabled: true,

    /**
     * Controls whether Box integration is visible
     */
    isBoxEnabled: true,

    /**
     * Controls whether Outreach engagement integration is visible
     */
    isOutreachEngageEnabled: true,

    /**
     * Controls whether Salesloft engagement integration is visible
     */
    isSalesloftEngagementEnabled: true,

    /**
     * Controls whether Jiminny integration is visible
     */
    isJiminnyEnabled: true,

    /**

     * Controls whether Databricks integration is visible
     */
    isDatabricksEnabled: true,

    /**
     * Controls whether BigQuery integration is visible
     */
    isBigQueryEnabled: true,
    /**
     * Controls whether the v2 dashboard filter bar UI is enabled
     * (ScrollableFilterBar, SplitFilterDropdown, DataSourcesDrawer, panel overrides).
     */
    isDashboardFiltersV2Enabled: true,

    /**
     * Controls whether dashboard widgets can be rearranged via drag-and-drop
     * and resized in edit mode. When false, widgets stay pinned to their
     * configured layout — edit mode still works for filters / rename / save.
     */
    isDashboardDragDropEnabled: true,

    /**
     * Controls whether the chat sharing feature is enabled
     */
    isChatSharingEnabled: true,

    /**
     * Controls whether Usage tab is visible in Settings
     */
    isUsageMetricsEnabled: flags[FEATURE_FLAGS.USAGE_METRICS] === true,

    /**
     * Controls whether Von AI Fields tab is visible in Settings
     */
    isVonAiFieldsEnabled: true,

    /**
     * Controls whether custom MCP server connections are available
     */
    isCustomMcpEnabled: flags[FEATURE_FLAGS.CUSTOM_MCP] === true,

    /**
     * Controls whether catalog MCP servers are shown on the integrations page
     */
    isMcpServersEnabled: true,

    /**
     * Gates the Slack personal MCP integration. When off, Slack is filtered
     * from the App Library so it cannot be published; the message-draft
     * artifact card and send endpoint stay dormant.
     */
    isSlackPersonalEnabled: true,

    /**
     * Controls whether Hubspot integration is visible
     */
    isHubspotEnabled: true,

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
