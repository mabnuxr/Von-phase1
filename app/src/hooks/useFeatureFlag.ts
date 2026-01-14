import { useFlags } from "launchdarkly-react-client-sdk";

/**
 * Feature flag keys used in the application
 */
export const FEATURE_FLAGS = {
  GOOGLE_CALENDAR_INTEGRATION: "enableGoogleCalender",
  EMAIL_CATEGORIZATION: "enableEmailConfiguration",
  SLASH_COMMANDS: "enableSlashCommands",
  ACTIONS: "enableDashboards",
  DEEP_LINKS: "enableDeepLinks",
  SIDE_BAR_V2: "sidebarV2",
  USER_MEMORY: "enableUserMemory",
  CHAT_INPUT_V2: "chatInputV2",
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
     * Controls whether Google Calendar integration is visible
     */
    isGoogleCalendarEnabled:
      flags[FEATURE_FLAGS.GOOGLE_CALENDAR_INTEGRATION] === true,

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
     * Controls whether Salesforce deep links are enabled
     * (clickable record names in approval cards and query results)
     */
    isDeepLinksEnabled: flags[FEATURE_FLAGS.DEEP_LINKS] === true,

    /**
     * Controls if we need to show new chat UI experience
     */
    isChatV2: flags[FEATURE_FLAGS.SIDE_BAR_V2],

    /**
     * Controls if we need to show new chat input UI experience
     */
    isChatInputV2: flags[FEATURE_FLAGS.CHAT_INPUT_V2],

    /**
     * Controls whether user memory feature is enabled
     * (personal memory segment for each user)
     */
    isUserMemoryEnabled: flags[FEATURE_FLAGS.USER_MEMORY] === true,

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
  defaultValue: boolean = false
): boolean {
  const flags = useFlags();
  return flags[flagKey] ?? defaultValue;
}
