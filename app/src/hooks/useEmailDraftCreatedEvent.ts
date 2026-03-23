/**
 * useEmailDraftCreatedEvent
 *
 * Listens to `artifact_created` Pusher events and collects refs for
 * email_draft artifacts. These refs are then passed to useEmailDraftArtifact
 * to fetch and render GmailDraftCard.
 *
 * Kept separate from useArtifactCreatedEvent (which handles file artifacts —
 * documents, slides, spreadsheets) so the two paths stay independent.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Channel } from "pusher-js";
import { ConversationChannelEvents } from "../types/conversationChannelEvents";
import type { ArtifactCreatedEventPayload } from "../types/conversationChannelEvents";

export function useEmailDraftCreatedEvent(
  channel: Channel | null,
  conversationId: string | null,
): { artifactId: string; runId: string }[] {
  const [refs, setRefs] = useState<{ artifactId: string; runId: string }[]>([]);
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const handleArtifactCreated = useCallback(
    (data: string | ArtifactCreatedEventPayload) => {
      const parsed: ArtifactCreatedEventPayload =
        typeof data === "string" ? JSON.parse(data) : data;

      const convId = conversationIdRef.current;
      if (!convId || parsed.conversationId !== convId) return;

      // Only act on completed events — processing has no artifact id yet
      if (parsed.status === "processing") return;

      const emailArtifacts = parsed.artifacts.filter(
        (a) => a.artifact_type === "email_draft" && a.id,
      );
      if (emailArtifacts.length === 0) return;

      setRefs((prev) => {
        const existingIds = new Set(prev.map((r) => r.artifactId));
        const toAdd = emailArtifacts
          .filter((a) => !existingIds.has(a.id!))
          .map((a) => ({ artifactId: a.id!, runId: parsed.runId }));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
    },
    [],
  );

  useEffect(() => {
    if (!channel) return;
    channel.bind(ConversationChannelEvents.ARTIFACT_CREATED, handleArtifactCreated);
    return () => {
      channel.unbind(ConversationChannelEvents.ARTIFACT_CREATED, handleArtifactCreated);
    };
  }, [channel, handleArtifactCreated]);

  return refs;
}
