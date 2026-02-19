/**
 * Event types for the conversation-level Pusher channel
 *
 * These events are sent to private-vonlabs-chat-{tenantId}-{userId}-{conversationId}
 * and are scoped to a single conversation.
 */

export const ConversationChannelEvents = {
  ARTIFACT_CREATED: "artifact_created",
} as const;

export type ConversationChannelEventName =
  (typeof ConversationChannelEvents)[keyof typeof ConversationChannelEvents];

/**
 * Sent in two phases:
 * 1. status="processing" — emitted before RUN_FINISHED with file names only (seeds skeletons)
 * 2. status="completed"  — emitted after S3 upload + FileMetadata insert (real metadata)
 */
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
