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
 * Sent when the backend finishes uploading agent-generated artifacts to S3.
 * Emitted by UploadArtifactsFromSandboxUnit after FileMetadata records are created.
 */
export interface ArtifactCreatedEventPayload {
  type: "artifact_created";
  runId: string;
  conversationId: string;
  artifacts: Array<{
    id: string;
    file_name: string;
    artifact_type: string;
  }>;
  updatedAt: string;
}
