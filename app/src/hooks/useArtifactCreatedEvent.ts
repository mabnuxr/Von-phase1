/**
 * useArtifactCreatedEvent - Pusher event handler for artifact_created
 *
 * Backend now emits a single `completed` event per fulfilled artifact.
 * Skeletons are rendered from FileMetadata rows that the workflow registers
 * in `processing` state before RUN_FINISHED — no `processing` Pusher event
 * is needed.
 *
 * The handler merges incoming completed artifacts into the existing cache
 * by id (a single fulfill emits ≥1 artifact: the file plus optional
 * slide_preview_pdf sibling). Merging is required because parallel fulfills
 * for the same run land as separate events — a naive replace would clobber
 * earlier completions.
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

      // Backend only emits `completed` events now. Anything else is stale
      // and should be ignored.
      if (parsed.status !== "completed") return;

      // Filter out command artifacts — they aren't file artifacts.
      const fileArtifacts = parsed.artifacts.filter(
        (a) => !a.artifact_type?.startsWith("command_"),
      );
      if (fileArtifacts.length === 0) return;

      const queryKey = agentArtifactKeys.run(convId, parsed.runId);
      const incoming: FileMetadataResponse[] = fileArtifacts.map((a) => ({
        id: a.id,
        fileName: a.file_name,
        mimeType: a.mime_type ?? "",
        sizeBytes: 0,
        status: "completed",
        source: "agent_generated",
        createdAt: parsed.updatedAt,
        artifactType: a.artifact_type ?? "document",
        runId: parsed.runId,
      }));

      // Merge by id so parallel fulfills don't clobber each other's rows.
      // Incoming rows override existing rows with the same id (this is how
      // a `processing` row gets upgraded to `completed`).
      queryClient.setQueryData<FileMetadataResponse[]>(queryKey, (prev) => {
        const existing = prev ?? [];
        const incomingIds = new Set(incoming.map((r) => r.id));
        return [...existing.filter((r) => !incomingIds.has(r.id)), ...incoming];
      });
      // Future mounts should refetch (cheap; gives definitive Mongo state)
      // but skip immediate refetch to avoid racing the same event's payload.
      queryClient.invalidateQueries({ queryKey, refetchType: "none" });
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
