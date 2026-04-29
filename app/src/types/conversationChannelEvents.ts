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

/**
 * Emitted by `fulfill_artifact` after the S3 upload + FileMetadata atomic
 * `processing → completed` transition succeeds. Skeletons render off the
 * `processing` Mongo rows registered before RUN_FINISHED — there is no
 * separate processing-phase Pusher event.
 */
export interface ArtifactCreatedEventPayload {
  type: "artifact_created";
  status?: "completed";
  runId: string;
  conversationId: string;
  artifacts: Array<{
    id?: string;
    file_name: string;
    artifact_type?: string;
    mime_type?: string;
  }>;
  updatedAt: string;
}
