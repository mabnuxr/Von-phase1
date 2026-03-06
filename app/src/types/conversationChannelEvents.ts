/**
 * Event types for the conversation-level Pusher channel
 *
 * These events are sent to private-vonlabs-chat-{tenantId}-{userId}-{conversationId}
 * and are scoped to a single conversation.
 */

export const ConversationChannelEvents = {
  ARTIFACT_CREATED: "artifact_created",
  INTEGRATION_WRITE_BLOCKED: "integration.write_blocked",
} as const;

export type ConversationChannelEventName =
  (typeof ConversationChannelEvents)[keyof typeof ConversationChannelEvents];

/**
 * Sent in two phases:
 * 1. status="processing" — emitted before RUN_FINISHED with file names only (seeds skeletons)
 * 2. status="completed"  — emitted after S3 upload + FileMetadata insert (real metadata)
 */
export type WriteBlockCode =
  | "org_read_only"
  | "admin_disabled"
  | "personal_oauth_not_connected"
  | "personal_oauth_expired";

export interface AgentWriteBlockedPayload {
  block_code: WriteBlockCode;
  message: string;
  idempotency_key: string;
}

export interface ArtifactCreatedEventPayload {
  type: "artifact_created";
  status?: "processing" | "completed";
  runId: string;
  conversationId: string;
  artifacts: Array<{
    id?: string;
    file_name: string;
    artifact_type?: string;
  }>;
  updatedAt: string;
}
