/**
 * useAiFieldCreatedEvent — Seeds the React Query cache when the backend
 * emits an AI field creation event via Pusher. Does NOT open the side panel;
 * panel auto-open is handled by the AGUI stream (useV2EventProcessor).
 *
 * Listens to TWO event sources on the conversation Pusher channel:
 * 1. "ai_field" — standalone event emitted by the backend
 * 2. "agent.tool_call_result" — AGUI event whose content may contain AI field data
 *
 * Uses ref-based handlers to avoid rebind gaps.
 */

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Channel } from "pusher-js";

import { ConversationChannelEvents } from "../types/conversationChannelEvents";
import type { AiFieldEventPayload } from "../types/conversationChannelEvents";
import { aiFieldKeys } from "./useVonAiFields";
import type { AiField } from "../types/vonAiFields";

function seedCache(
  parsed: AiFieldEventPayload,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  const cacheEntry: AiField = {
    id: parsed.fieldId,
    fieldId: parsed.fieldId,
    name: parsed.name,
    description: parsed.description ?? "",
    objectType: "opportunity",
    columnsToGenerate: parsed.columnsToGenerate ?? [],
    sources: parsed.sources ?? [],
    opportunityFilter: parsed.opportunityFilter ?? null,
    status: parsed.status,
    workflowId: null,
    conversationId: parsed.conversationId ?? null,
    createdBy: "",
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
  queryClient.setQueryData(aiFieldKeys.detail(parsed.fieldId), cacheEntry);
}

export function useAiFieldCreatedEvent(channel: Channel | null): void {
  const queryClient = useQueryClient();

  // Track which fieldIds we've already cached to avoid duplicates
  const cachedFieldIds = useRef(new Set<string>());

  // Handler for standalone "ai_field" event
  const handleAiFieldEvent = useCallback(
    (data: string | AiFieldEventPayload) => {
      if (import.meta.env.DEV) {
        console.log("[useAiFieldCreatedEvent] Received ai_field event:", data);
      }
      const parsed: AiFieldEventPayload =
        typeof data === "string" ? JSON.parse(data) : data;
      if (!parsed.fieldId || cachedFieldIds.current.has(parsed.fieldId)) return;
      cachedFieldIds.current.add(parsed.fieldId);
      seedCache(parsed, queryClient);
    },
    [queryClient],
  );

  // Handler for AGUI "agent.tool_call_result" event — check if it contains AI field data
  const handleToolCallResult = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any) => {
      try {
        const wrapper = typeof data === "string" ? JSON.parse(data) : data;
        const event = wrapper?.event;
        if (!event) return;

        // Try to parse the content or delta as JSON and look for type: "ai_field"
        const rawContent = event.content || event.delta;
        if (!rawContent || typeof rawContent !== "string") return;

        let parsed: AiFieldEventPayload;
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          return; // Not valid JSON or incomplete chunk
        }

        if (parsed?.type !== "ai_field" || !parsed.fieldId) return;
        if (cachedFieldIds.current.has(parsed.fieldId)) return;

        if (import.meta.env.DEV) {
          console.log(
            "[useAiFieldCreatedEvent] Detected ai_field in tool_call_result:",
            parsed,
          );
        }
        cachedFieldIds.current.add(parsed.fieldId);
        seedCache(parsed, queryClient);
      } catch {
        // Ignore parse errors
      }
    },
    [queryClient],
  );

  // Ref-based handlers: only rebind when channel changes
  const aiFieldHandlerRef = useRef(handleAiFieldEvent);
  aiFieldHandlerRef.current = handleAiFieldEvent;
  const toolCallHandlerRef = useRef(handleToolCallResult);
  toolCallHandlerRef.current = handleToolCallResult;

  useEffect(() => {
    if (!channel) return;

    if (import.meta.env.DEV) {
      console.log("[useAiFieldCreatedEvent] Binding on channel:", channel.name);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stableAiFieldHandler = (data: any) => aiFieldHandlerRef.current(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stableToolCallHandler = (data: any) =>
      toolCallHandlerRef.current(data);

    channel.bind(
      ConversationChannelEvents.AI_FIELD_CREATED,
      stableAiFieldHandler,
    );
    channel.bind("agent.tool_call_result", stableToolCallHandler);

    return () => {
      channel.unbind(
        ConversationChannelEvents.AI_FIELD_CREATED,
        stableAiFieldHandler,
      );
      channel.unbind("agent.tool_call_result", stableToolCallHandler);
    };
  }, [channel]);
}
