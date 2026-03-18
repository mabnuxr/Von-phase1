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
  SIDE_BAR_V2: "sidebarV2",
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
  ZENDESK_INTEGRATION: "enableZendesk",
  SNOWFLAKE: "enableSnowflake",
  GMAIL: "enableGmail",
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
     * Controls if we need to show new sidebar UI experience
     */
    isSidebarV2: flags[FEATURE_FLAGS.SIDE_BAR_V2] === true,

    /**
     * Controls whether the new TimelineThinkingProcess v2 component is used
     * instead of the legacy ThinkingBlock component
     */
    isAgentV2: flags[FEATURE_FLAGS.AGENT_V2] === true,

    /**
     * User memory — permanently enabled, no longer behind a feature flag
     */
    isUserMemoryEnabled: true,

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
    isScheduledCommandsEnabled:
      flags[FEATURE_FLAGS.SCHEDULED_COMMANDS] === true,

    /**
     * Controls whether Zendesk integration is visible
     */
    isZendeskEnabled: flags[FEATURE_FLAGS.ZENDESK_INTEGRATION] === true,

    /**
     * Controls whether Snowflake integration is visible
     */
    isSnowflakeEnabled: flags[FEATURE_FLAGS.SNOWFLAKE] === true,

    /**
     * Controls whether Gmail integration is visible
     */
    isGmailEnabled: flags[FEATURE_FLAGS.GMAIL] === true,

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
