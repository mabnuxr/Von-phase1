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
import { QUICK_COMMANDS_QUERY_KEY } from "./useQuickCommands";
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

      // Commands cache is global (not conversation-scoped), so invalidate
      // before the conversation guard to ensure it fires for every event.
      const isCommandEvent = parsed.artifacts.some((a) =>
        a.artifact_type?.startsWith("command_"),
      );
      if (isCommandEvent) {
        queryClient.invalidateQueries({ queryKey: QUICK_COMMANDS_QUERY_KEY });
      }

      const convId = conversationIdRef.current;
      if (!convId || parsed.conversationId !== convId) return;

      // Filter out command artifacts — they aren't file artifacts
      const fileArtifacts = parsed.artifacts.filter(
        (a) => !a.artifact_type?.startsWith("command_"),
      );
      if (fileArtifacts.length === 0) return;

      const queryKey = agentArtifactKeys.run(convId, parsed.runId);

      if (parsed.status === "processing") {
        // Seed skeletons, but never downgrade an already-populated cache
        // (Pusher reorders can deliver `processing` after `completed`).
        const existing =
          queryClient.getQueryData<FileMetadataResponse[]>(queryKey);
        if (!existing || existing.length === 0) {
          const placeholders: FileMetadataResponse[] = fileArtifacts.map(
            (a) => ({
              id: a.file_name,
              fileName: a.file_name,
              mimeType: "",
              sizeBytes: 0,
              status: "processing",
              source: "agent_generated",
              createdAt: parsed.updatedAt,
              artifactType: a.artifact_type,
              runId: parsed.runId,
              isPending: true,
            }),
          );
          queryClient.setQueryData(queryKey, placeholders);
        }
        // Mark stale so remount refetches if completed event is missed,
        // but don't trigger an immediate refetch while upload is still running
        queryClient.invalidateQueries({ queryKey, refetchType: "inactive" });
      } else {
        // Immediately replace placeholders with event data (removes isPending)
        const freshData: FileMetadataResponse[] = fileArtifacts.map((a) => ({
          id: a.id ?? a.file_name,
          fileName: a.file_name,
          mimeType: a.mime_type ?? "",
          sizeBytes: 0,
          status: "completed",
          source: "agent_generated",
          createdAt: parsed.updatedAt,
          artifactType: a.artifact_type ?? "document",
          runId: parsed.runId,
        }));
        queryClient.setQueryData(queryKey, freshData);
        // Mark stale for future mounts but skip the immediate refetch. The
        // event payload already carries every record the card needs (pptx +
        // its slide_preview_pdf sibling), and an immediate refetch can race
        // MongoDB read-after-write and clobber the cache with [].
        queryClient.invalidateQueries({ queryKey, refetchType: "none" });
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
