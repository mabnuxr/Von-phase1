/**
 * useReconciliation - Chat-type-aware stall detection and backend reconciliation
 *
 * Single-responsibility: Monitors for stalled streaming connections and
 * reconciles state from the backend API when a stall is detected.
 *
 * Chat-type-aware thresholds:
 * - "auto" (regular agent): 10s stall threshold
 * - "deep_research": 30s stall threshold
 * - default fallback: 45s (original behavior)
 *
 * On stall detection:
 * 1. Fetches latest events from MongoDB (authoritative source)
 * 2. Merges local + API events (deduped, API wins on conflict)
 * 3. Re-transforms and updates state via onStateUpdate callback
 * 4. Notifies caller via onReconcile (triggers refetchMessages)
 */

import { useCallback, useEffect, useRef } from "react";
import type Pusher from "pusher-js";
import type { AguiEventWrapper } from "@vonlabs/design-components";

import { conversationsService } from "../services/conversationsService";
import {
  transformAguiToTimelineSteps,
  getElapsedTimeFromEvents,
} from "../utils/transformAguiToTimelineSteps";
import {
  RECONCILIATION_STALL_THRESHOLD_AUTO_MS,
  RECONCILIATION_STALL_THRESHOLD_RESEARCH_MS,
  RECONCILIATION_STALL_THRESHOLD_MS,
  RECONCILIATION_CHECK_INTERVAL_MS,
} from "../config/constants";
import type { ConversationMode } from "../types/conversation";

export interface UseReconciliationConfig {
  conversationId: string | null;
  chatType: ConversationMode;
  isThinking: boolean;
  pusherRef: React.MutableRefObject<Pusher | null>;
  eventsRef: React.MutableRefObject<Map<string, AguiEventWrapper[]>>;
  finishedRunsRef: React.MutableRefObject<Set<string>>;
  lastEventTimeRef: React.MutableRefObject<number>;
  stoppedRef: React.MutableRefObject<boolean>;
  onStateUpdate: (
    result: ReturnType<typeof transformAguiToTimelineSteps>,
    runId: string,
  ) => void;
  onRunFinished?: (runId: string, elapsedTime: number) => void;
  onReconcile?: () => void;
}

function getStallThreshold(chatType: ConversationMode): number {
  switch (chatType) {
    case "auto":
      return RECONCILIATION_STALL_THRESHOLD_AUTO_MS;
    case "deep_research":
      return RECONCILIATION_STALL_THRESHOLD_RESEARCH_MS;
    default:
      return RECONCILIATION_STALL_THRESHOLD_MS;
  }
}

export function useReconciliation(config: UseReconciliationConfig): void {
  const isReconcilingRef = useRef<boolean>(false);

  // Stable refs for callbacks
  const onStateUpdateRef = useRef(config.onStateUpdate);
  onStateUpdateRef.current = config.onStateUpdate;
  const onReconcileRef = useRef(config.onReconcile);
  onReconcileRef.current = config.onReconcile;
  const onRunFinishedRef = useRef(config.onRunFinished);
  onRunFinishedRef.current = config.onRunFinished;

  const reconcile = useCallback(async () => {
    if (!config.conversationId || isReconcilingRef.current) return;
    if (config.stoppedRef.current) return;

    isReconcilingRef.current = true;

    console.log(
      "[useReconciliation] Stall detected — reconciling from backend API",
    );

    try {
      // Step 1: Fetch latest messages from backend
      const response = await conversationsService.getConversationMessages(
        config.conversationId,
        1,
        5,
      );

      // Step 3: Find latest assistant message with events
      const latestAssistantMsg = response.data.find(
        (m) => m.role === "assistant" && m.events && m.events.length > 0,
      );

      if (
        !latestAssistantMsg?.events ||
        latestAssistantMsg.events.length === 0
      ) {
        console.log("[useReconciliation] No events found in backend response");
        return;
      }

      const apiEvents = latestAssistantMsg.events;
      const runId = apiEvents[0]?.run_id;
      if (!runId) return;

      // Don't reconcile for runs that are already finished
      if (config.finishedRunsRef.current.has(runId)) return;

      // Step 4: Merge local + API events (deduped, API wins on conflict)
      const localEvents = config.eventsRef.current.get(runId) || [];
      const mergedMap = new Map<string, AguiEventWrapper>();

      for (const evt of localEvents) {
        mergedMap.set(`${evt.run_id}:${evt.sequence}`, evt);
      }
      for (const evt of apiEvents) {
        mergedMap.set(`${evt.run_id}:${evt.sequence}`, evt);
      }

      const mergedEvents = Array.from(mergedMap.values()).sort(
        (a, b) => a.sequence - b.sequence,
      );

      // Update eventsRef
      config.eventsRef.current.set(runId, mergedEvents);

      // Step 5: Re-transform
      const result = transformAguiToTimelineSteps(mergedEvents);

      // Step 6: Update state
      onStateUpdateRef.current(result, runId);

      // Step 7: Handle run completion
      const isTransitionalFinish =
        result.hadApprovalPause &&
        !result.finalResponse &&
        !result.stoppedByUser;
      if (
        !result.isThinking &&
        !isTransitionalFinish &&
        !config.finishedRunsRef.current.has(runId)
      ) {
        config.finishedRunsRef.current.add(runId);
        config.stoppedRef.current = false;

        const actualElapsed = getElapsedTimeFromEvents(mergedEvents);
        onRunFinishedRef.current?.(runId, actualElapsed);
      }

      // Reset stall timer
      config.lastEventTimeRef.current = Date.now();

      console.log(
        "[useReconciliation] Reconciliation complete — local:",
        localEvents.length,
        "API:",
        apiEvents.length,
        "merged:",
        mergedEvents.length,
        "isThinking:",
        result.isThinking,
      );

      // Only trigger refetchMessages if the run is still in progress.
      // When complete, applyTransformResult already updated state — refetching
      // causes v2InitialRunEvents to recompute, bouncing isThinking and looping.
      if (result.isThinking) {
        onReconcileRef.current?.();
      }
    } catch (err) {
      console.error("[useReconciliation] Reconciliation failed:", err);
      config.lastEventTimeRef.current = Date.now();
    } finally {
      isReconcilingRef.current = false;
    }
  }, [
    config.conversationId,
    config.pusherRef,
    config.eventsRef,
    config.finishedRunsRef,
    config.lastEventTimeRef,
    config.stoppedRef,
  ]);

  // Health check interval
  useEffect(() => {
    if (!config.isThinking || !config.conversationId) return;

    const stallThreshold = getStallThreshold(config.chatType);

    if (import.meta.env.DEV) {
      console.log(
        `[useReconciliation] Health check active — chatType: ${config.chatType}, threshold: ${stallThreshold}ms`,
      );
    }

    const intervalId = setInterval(() => {
      if (config.stoppedRef.current || isReconcilingRef.current) return;

      // Skip if no events received yet
      if (config.lastEventTimeRef.current === 0) return;

      const timeSinceLastEvent = Date.now() - config.lastEventTimeRef.current;
      if (timeSinceLastEvent >= stallThreshold) {
        console.log(
          "[useReconciliation] No events for",
          Math.round(timeSinceLastEvent / 1000),
          "seconds — triggering reconciliation",
        );
        reconcile();
      }
    }, RECONCILIATION_CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [
    config.isThinking,
    config.conversationId,
    config.chatType,
    config.stoppedRef,
    config.lastEventTimeRef,
    reconcile,
  ]);
}
