/**
 * Detects integration write-blocked messages from assistant message content.
 *
 * The agent is instructed to include the block reason verbatim in its response.
 * This utility scans the message content for known block reason patterns and
 * returns the integration type + block code so the UI can render a card.
 *
 * This approach avoids storing extra metadata on the Message document — the
 * block reason text in the message IS the source of truth.
 */

export interface DetectedIntegrationBlock {
  /** e.g. "salesforce", "google_calendar" */
  integrationType: string;
  /** The matched block reason text */
  message: string;
  /** Block code if determinable (Salesforce-specific) */
  blockCode?: string;
}

/**
 * Salesforce block reasons (from crm_permissions.py).
 * These have specific block codes that determine whether the user can self-remediate.
 */
const SALESFORCE_BLOCK_PATTERNS: Array<{
  pattern: string;
  blockCode: string;
  message: string;
}> = [
  {
    pattern: "salesforce org is in read-only mode",
    blockCode: "org_read_only",
    message:
      "Your Salesforce org is in read-only mode. Contact your admin to enable write access.",
  },
  {
    pattern: "salesforce write access is disabled for your account",
    blockCode: "admin_disabled",
    message:
      "Salesforce write access is disabled for your account. Contact your admin to enable it.",
  },
  {
    pattern: "salesforce writes require a personal connection",
    blockCode: "personal_oauth_not_connected",
    message:
      "Salesforce writes require a personal connection. Connect your account to continue.",
  },
  {
    pattern: "salesforce connection has expired",
    blockCode: "personal_oauth_expired",
    message:
      "Your Salesforce connection has expired or been revoked. Reconnect your account to continue.",
  },
];

/**
 * Generic block pattern for non-Salesforce integrations.
 * Format: "{Display} writes require a personal connection. Please connect your {Display} account."
 *
 * Map of display name → backend integration_type key.
 */
const GENERIC_INTEGRATION_PATTERNS: Record<string, string> = {
  "Google Calendar": "google_calendar",
};

/**
 * Scan assistant message content for known integration block reason patterns.
 * Returns the first match, or null if no block reason is detected.
 */
export function detectIntegrationBlock(
  messageContent: string,
): DetectedIntegrationBlock | null {
  if (!messageContent) return null;

  const contentLower = messageContent.toLowerCase();

  // Check Salesforce-specific patterns first (they have block codes)
  for (const { pattern, blockCode, message } of SALESFORCE_BLOCK_PATTERNS) {
    if (contentLower.includes(pattern)) {
      return {
        integrationType: "salesforce",
        message,
        blockCode,
      };
    }
  }

  // Check generic integration patterns
  for (const [displayName, integrationType] of Object.entries(
    GENERIC_INTEGRATION_PATTERNS,
  )) {
    const pattern =
      `${displayName} writes require a personal connection`.toLowerCase();
    if (contentLower.includes(pattern)) {
      return {
        integrationType,
        message: `${displayName} writes require a personal connection. Please connect your ${displayName} account.`,
      };
    }
  }

  return null;
}
