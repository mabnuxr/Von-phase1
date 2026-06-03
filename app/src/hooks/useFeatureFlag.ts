import { useFlags } from "launchdarkly-react-client-sdk";

/**
 * Feature flag keys still evaluated dynamically via LaunchDarkly.
 *
 * All previously "permanently enabled" flags have been removed — their
 * features are now unconditional in code. Only the flags below are still
 * read from LaunchDarkly.
 */
export const FEATURE_FLAGS = {
  ACTIONS: "enableDashboards",
  DISABLED_TENANTS: "disabledTenants",
  USAGE_METRICS: "enableUsageMetrics",
  CUSTOM_MCP: "enableCustomMcp",
  WORKSPACE_SEARCH: "enableVonWorkspaceSearch",
} as const;

/**
 * Custom hook to access feature flags
 */
export function useFeatureFlag() {
  const flags = useFlags();

  return {
    /**
     * Controls whether additional actions menu is enabled (convert to dashboard, etc.)
     */
    isActionsEnabled: flags[FEATURE_FLAGS.ACTIONS] === true,

    /**
     * Controls whether the current tenant's subscription is inactive
     */
    isTenantDisabled: flags[FEATURE_FLAGS.DISABLED_TENANTS] === true,

    /**
     * Controls whether Usage tab is visible in Settings
     */
    isUsageMetricsEnabled: flags[FEATURE_FLAGS.USAGE_METRICS] === true,

    /**
     * Controls whether custom MCP server connections are available
     */
    isCustomMcpEnabled: flags[FEATURE_FLAGS.CUSTOM_MCP] === true,

    /**
     * Gates the ⌘K global search modal, the sidebar Search button, and
     * the keyboard shortcut. When off, the modal does not mount.
     */
    isWorkspaceSearchEnabled: flags[FEATURE_FLAGS.WORKSPACE_SEARCH] === true,
  };
}
