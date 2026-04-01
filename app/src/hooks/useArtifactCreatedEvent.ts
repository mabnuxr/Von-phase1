/**
 * useArtifactCreatedEvent - Pusher event handler for artifact_created
 *
 * Handles two phases:
 * 1. status="processing" — seeds React Query cache with placeholder records
 *    (isPending: true) so skeleton ArtifactCards render immediately when
 *    isStreaming flips false.
 * 2. status="completed" — invalidates cache to trigger a refetch that replaces
 *    skeletons with real artifact data.
 */

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Channel } from "pusher-js";

import { ConversationChannelEvents } from "../types/conversationChannelEvents";
import type { ArtifactCreatedEventPayload } from "../types/conversationChannelEvents";
import { agentArtifactKeys } from "./useAgentArtifacts";
import type { FileMetadataResponse } from "../services/fileUploadService";

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

      const queryKey = agentArtifactKeys.run(convId, parsed.runId);

      if (parsed.status === "processing") {
        // Seed cache with placeholders so skeletons render immediately
        const placeholders: FileMetadataResponse[] = parsed.artifacts.map(
          (a) => ({
            id: a.file_name,
            fileName: a.file_name,
            mimeType: "",
            sizeBytes: 0,
            status: "processing",
            source: "agent_generated",
            createdAt: parsed.updatedAt,
            artifactType:
              a.artifact_type ??
              (a.file_name?.endsWith(".eml") ? "email_draft" : undefined),
            runId: parsed.runId,
            isPending: true,
          }),
        );
        queryClient.setQueryData(queryKey, placeholders);
        // Mark stale so remount refetches if completed event is missed,
        // but don't trigger an immediate refetch while upload is still running
        queryClient.invalidateQueries({ queryKey, refetchType: "inactive" });
      } else {
        // Immediately replace placeholders with event data (removes isPending)
        const freshData: FileMetadataResponse[] = parsed.artifacts.map((a) => ({
          id: a.id ?? a.file_name,
          fileName: a.file_name,
          mimeType: "",
          sizeBytes: 0,
          status: "completed",
          source: "agent_generated",
          createdAt: parsed.updatedAt,
          artifactType:
            a.artifact_type ??
            (a.file_name?.endsWith(".eml") ? "email_draft" : "document"),
          runId: parsed.runId,
        }));
        queryClient.setQueryData(queryKey, freshData);
        // Background refetch fills in full metadata (mimeType, sizeBytes, etc.)
        queryClient.invalidateQueries({ queryKey });
      }
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
