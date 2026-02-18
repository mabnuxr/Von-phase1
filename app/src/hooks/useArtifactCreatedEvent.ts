/**
 * useArtifactCreatedEvent - Pusher event handler for artifact_created
 *
 * Listens for the artifact_created event on the conversation Pusher channel.
 * When received, invalidates the specific run's React Query cache to trigger
 * a refetch, which causes ArtifactCards to appear in the chat UI.
 *
 * The event is emitted by UploadArtifactsFromSandboxUnit after the agent run
 * completes and artifacts are uploaded to S3.
 */

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Channel } from "pusher-js";

import { ConversationChannelEvents } from "../types/conversationChannelEvents";
import type { ArtifactCreatedEventPayload } from "../types/conversationChannelEvents";
import { agentArtifactKeys } from "./useAgentArtifacts";

export function useArtifactCreatedEvent(
  channel: Channel | null,
  conversationId: string | null,
): void {
  const queryClient = useQueryClient();
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const handleArtifactCreated = useCallback(
    (data: string | ArtifactCreatedEventPayload) => {
      const parsed: ArtifactCreatedEventPayload =
        typeof data === "string" ? JSON.parse(data) : data;

      const convId = conversationIdRef.current;
      if (!convId || parsed.conversationId !== convId) return;

      // Invalidate the specific run's cache to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: agentArtifactKeys.run(convId, parsed.runId),
      });
    },
    [queryClient],
  );

  useEffect(() => {
    if (!channel) return;

    const eventName = ConversationChannelEvents.ARTIFACT_CREATED;
    channel.bind(eventName, handleArtifactCreated);

    return () => {
      channel.unbind(eventName, handleArtifactCreated);
    };
  }, [channel, handleArtifactCreated]);
}
