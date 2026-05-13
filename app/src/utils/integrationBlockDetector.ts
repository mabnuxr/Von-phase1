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
 *   1. CRM write-restriction patterns (Salesforce, HubSpot) — generated
 *      dynamically per CRM. The 4 sentences come from
 *      `agents-v2/utils/crm_permissions._resolve_write_permission`; FE keeps
 *      a small per-CRM config (display name + org noun) so adding a new CRM
 *      is one entry.
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
  /** Backend integration type key, e.g. "salesforce", "hubspot", "google_calendar" */
  integrationType: string;
  /** The matched block reason text */
  message: string;
  /** Block code if determinable */
  blockCode?: string;
}

/**
 * CRMs with write-scope gating (org_read_only / admin_disabled /
 * user_level_write personal OAuth). Each entry generates the 4 block-reason
 * patterns from `_resolve_write_permission`. To add a new CRM, append one
 * entry — no other change needed.
 */
const CRM_WRITE_BLOCK_INTEGRATIONS: Array<{
  integrationType: string;
  display: string;
  orgTerm: string; // "org" for Salesforce, "portal" for HubSpot
}> = [
  { integrationType: "salesforce", display: "Salesforce", orgTerm: "org" },
  { integrationType: "hubspot", display: "HubSpot", orgTerm: "portal" },
];

/**
 * For a given CRM, return the {pattern, blockCode, message} triples that
 * mirror the strings emitted by `_resolve_write_permission`.
 */
function buildCrmWritePatterns(
  display: string,
  orgTerm: string,
): Array<{ pattern: string; blockCode: string; message: string }> {
  const readOnlyMsg = `Your ${display} ${orgTerm} is in read-only mode. Contact your admin to enable write access.`;
  const adminDisabledMsg = `${display} write access is disabled for your account. Contact your admin to enable it.`;
  const personalNotConnectedMsg = `${display} writes require a personal connection. Connect your account to continue.`;
  const personalExpiredMsg = `Your ${display} connection has expired or been revoked. Reconnect your account to continue.`;
  return [
    {
      pattern: `${display} ${orgTerm} is in read-only mode`.toLowerCase(),
      blockCode: "org_read_only",
      message: readOnlyMsg,
    },
    {
      pattern:
        `${display} write access is disabled for your account`.toLowerCase(),
      blockCode: "admin_disabled",
      message: adminDisabledMsg,
    },
    {
      pattern: `${display} writes require a personal connection`.toLowerCase(),
      blockCode: "personal_oauth_not_connected",
      message: personalNotConnectedMsg,
    },
    {
      pattern: `${display} connection has expired`.toLowerCase(),
      blockCode: "personal_oauth_expired",
      message: personalExpiredMsg,
    },
  ];
}

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

  // (1) CRM write-restriction patterns (checked first — specific block codes
  // take precedence over the generic "not connected" form).
  for (const {
    integrationType,
    display,
    orgTerm,
  } of CRM_WRITE_BLOCK_INTEGRATIONS) {
    if (seen.has(integrationType)) continue;
    for (const { pattern, blockCode, message } of buildCrmWritePatterns(
      display,
      orgTerm,
    )) {
      if (contentLower.includes(pattern)) {
        seen.add(integrationType);
        blocks.push({ integrationType, message, blockCode });
        break;
      }
    }
  }

  // (2) Generic "{Display} is not connected" — iterate every known
  // integration and look for its canonical sentence as a substring. This
  // naturally handles agents that prefix extra words before the sentence,
  // and self-updates as new integrations are added to INTEGRATION_METADATA
  // without any change here.
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
