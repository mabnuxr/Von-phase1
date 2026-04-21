/**
 * Detects integration block messages from assistant message content.
 *
 * The agent is instructed to include the block reason verbatim in its response.
 * This utility scans the message content for known block reason patterns and
 * returns the integration type + block code so the UI can render a card.
 *
 * This approach avoids storing extra metadata on the Message document — the
 * block reason text in the message IS the source of truth.
 *
 * Two pattern categories:
 *   1. Salesforce-specific write restrictions — these have dedicated block
 *      codes (org_read_only / admin_disabled / personal_oauth_expired) that
 *      determine whether the user can self-remediate. Salesforce reads still
 *      work in these cases, so the user may still get data back.
 *   2. Generic "not connected" — derived from the agent's phrasing
 *      "{Display} is not connected. Please connect…". Matches any integration
 *      that has an entry in INTEGRATION_METADATA. Adding a new integration
 *      requires no change here as long as INTEGRATION_METADATA and the
 *      backend's IntegrationType enum stay in sync.
 */

import {
  INTEGRATION_METADATA,
  getBackendIntegrationType,
} from "../constants/integrationMetadata";

export interface DetectedIntegrationBlock {
  /** Backend integration type key, e.g. "salesforce", "google_calendar" */
  integrationType: string;
  /** The matched block reason text */
  message: string;
  /** Block code if determinable */
  blockCode?: string;
}

/**
 * Salesforce write-restriction patterns. These fire when Salesforce IS connected
 * but the user can't write (org read-only, admin-disabled, expired personal OAuth,
 * or user_level_write scope without personal OAuth). Reads still work in all
 * these cases.
 */
const SALESFORCE_WRITE_PATTERNS: Array<{
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
 * Scan assistant message content for known integration block reason patterns.
 * Returns the first match, or null if no block reason is detected.
 */
export function detectIntegrationBlock(
  messageContent: string,
): DetectedIntegrationBlock | null {
  const blocks = detectIntegrationBlocks(messageContent);
  return blocks.length > 0 ? blocks[0] : null;
}

/**
 * Scan assistant message content for ALL known integration block reason patterns.
 * Returns every match so the UI can render a card for each blocked integration.
 */
export function detectIntegrationBlocks(
  messageContent: string,
): DetectedIntegrationBlock[] {
  if (!messageContent) return [];

  const contentLower = messageContent.toLowerCase();
  const blocks: DetectedIntegrationBlock[] = [];
  const seen = new Set<string>();

  // (1) Salesforce write-restriction patterns (checked first — specific
  // block codes take precedence over the generic "not connected" form).
  for (const { pattern, blockCode, message } of SALESFORCE_WRITE_PATTERNS) {
    if (contentLower.includes(pattern) && !seen.has("salesforce")) {
      seen.add("salesforce");
      blocks.push({
        integrationType: "salesforce",
        message,
        blockCode,
      });
    }
  }

  // (2) Generic "{Display} is not connected" — iterate every known
  // integration and look for its canonical sentence as a substring.
  // This naturally handles agents that prefix extra words before the
  // sentence, and self-updates as new integrations are added to
  // INTEGRATION_METADATA without any change here.
  for (const entry of Object.values(INTEGRATION_METADATA)) {
    const integrationType = getBackendIntegrationType(entry.id).toLowerCase();
    if (seen.has(integrationType)) continue;

    const expected = `${entry.name} is not connected. Please connect your ${entry.name} account to continue.`;
    if (messageContent.includes(expected)) {
      seen.add(integrationType);
      blocks.push({
        integrationType,
        blockCode: "personal_oauth_not_connected",
        message: expected,
      });
    }
  }

  return blocks;
}
