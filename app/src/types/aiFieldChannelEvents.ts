/**
 * Event types for the AI Field Pusher channel.
 *
 * Channel: private-vonlabs-aifield-{tenantId}-{userId}-{fieldId}
 */

export const AiFieldChannelEvents = {
  // Activate events
  ACTIVATE_STARTED: "ACTIVATE_STARTED",
  ACTIVATE_PROGRESS: "ACTIVATE_PROGRESS",
  ACTIVATE_COMPLETED: "ACTIVATE_COMPLETED",
  ACTIVATE_FAILED: "ACTIVATE_FAILED",
  // Playground events
  PLAYGROUND_RESULT: "PLAYGROUND_RESULT",
  PLAYGROUND_COMPLETE: "PLAYGROUND_COMPLETE",
  PLAYGROUND_ERROR: "PLAYGROUND_ERROR",
} as const;

export type AiFieldChannelEventName =
  (typeof AiFieldChannelEvents)[keyof typeof AiFieldChannelEvents];
