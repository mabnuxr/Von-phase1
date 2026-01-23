/**
 * Utility functions for converting between frontend AgentMode and backend ConversationMode
 *
 * Frontend AgentMode: 'auto' | 'build-dashboard' | 'deep-research'
 * Backend ConversationMode: 'auto' | 'dashboard_builder' | 'deep_research'
 */

import type { AgentMode } from "@vonlabs/design-components";
import type { ConversationMode } from "../types/conversation";

/**
 * Agent mode constants for type-safe usage across the app
 */
export const AGENT_MODES = {
  AUTO: "auto",
  BUILD_DASHBOARD: "build-dashboard",
  DEEP_RESEARCH: "deep-research",
} as const satisfies Record<string, AgentMode>;

/**
 * Default agent mode for new conversations
 */
export const DEFAULT_AGENT_MODE: AgentMode = AGENT_MODES.AUTO;

/**
 * Convert frontend AgentMode to backend ConversationMode
 */
export function agentModeToConversationMode(
  agentMode: AgentMode,
): ConversationMode {
  switch (agentMode) {
    case "auto":
      return "auto";
    case "build-dashboard":
      return "dashboard_builder";
    case "deep-research":
      return "deep_research";
    default:
      return "auto";
  }
}

/**
 * Convert backend ConversationMode to frontend AgentMode
 */
export function conversationModeToAgentMode(
  conversationMode: ConversationMode | undefined,
): AgentMode {
  switch (conversationMode) {
    case "auto":
      return "auto";
    case "dashboard_builder":
      return "build-dashboard";
    case "deep_research":
      return "deep-research";
    default:
      return "auto";
  }
}
