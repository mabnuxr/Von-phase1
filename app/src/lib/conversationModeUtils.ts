/**
 * Utility functions for converting between frontend AgentMode and backend ConversationMode
 *
 * Unified naming (no conversion needed):
 * - 'auto' (both frontend and backend)
 * - 'dashboard-builder' (both frontend and backend - triggers research workflows)
 *
 * Note: If design-components AgentMode still uses 'build-dashboard',
 * conversion functions below handle the mapping for backward compatibility.
 */

import type { AgentMode } from "@vonlabs/design-components";
import type { ConversationMode } from "../types/conversation";

/**
 * Agent mode constants for type-safe usage across the app
 * Using unified naming that matches backend ConversationMode
 */
export const AGENT_MODES = {
  AUTO: "auto",
  DASHBOARD_BUILDER: "dashboard-builder",
} as const satisfies Record<string, AgentMode>;

/**
 * Default agent mode for new conversations
 */
export const DEFAULT_AGENT_MODE: AgentMode = AGENT_MODES.AUTO;

/**
 * Convert frontend AgentMode to backend ConversationMode
 * Handles backward compatibility if design-components still uses 'build-dashboard'
 */
export function agentModeToConversationMode(
  agentMode: AgentMode,
): ConversationMode {
  switch (agentMode) {
    case "auto":
      return "auto";
    case "build-dashboard":
      // Legacy value from design-components - map to new unified naming
      return "dashboard-builder";
    case "dashboard-builder":
      return "dashboard-builder";
    default:
      return "auto";
  }
}

/**
 * Convert backend ConversationMode to frontend AgentMode
 * Returns unified naming values
 */
export function conversationModeToAgentMode(
  conversationMode: ConversationMode | undefined,
): AgentMode {
  switch (conversationMode) {
    case "auto":
      return "auto";
    case "dashboard-builder":
      return "dashboard-builder";
    default:
      return "auto";
  }
}
