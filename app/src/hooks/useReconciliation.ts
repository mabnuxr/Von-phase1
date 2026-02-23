/**
 * useReconciliation - Chat-type-aware stall detection and backend reconciliation
 *
 * Single-responsibility: Monitors for stalled streaming connections and
 * reconciles state from the backend API when a stall is detected.
 *
 * Chat-type-aware thresholds:
 * - "auto" (regular agent): 10s stall threshold
 * - "dashboard-builder": 30s stall threshold
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
  RECONCILIATION_STALL_THRESHOLD_DASHBOARD_BUILDER_MS,
  RECONCILIATION_STALL_THRESHOLD_MS,
  RECONCILIATION_CHECK_INTERVAL_MS,
  STREAM_TIMEOUT_MS,
} from "../config/constants";
import type { ConversationMode } from "../types/conversation";

export interface UseReconciliationConfig {
  conversationId: string | null;
  chatType: ConversationMode;
  isThinking: boolean;
  isFinalResponseStreaming: boolean;
  isConnected: boolean;
  pusherRef: React.MutableRefObject<Pusher | null>;
  eventsRef: React.MutableRefObject<Map<string, AguiEventWrapper[]>>;
  finishedRunsRef: React.MutableRefObject<Set<string>>;
  lastEventTimeRef: React.MutableRefObject<number>;
  onStateUpdate: (
    result: ReturnType<typeof transformAguiToTimelineSteps>,
    runId: string,
  ) => void;
  onRunFinished?: (runId: string, elapsedTime: number) => void;
  onReconcile?: () => void;
  onTimeout?: () => void;
}

function getStallThreshold(chatType: ConversationMode): number {
  switch (chatType) {
    case "auto":
      return RECONCILIATION_STALL_THRESHOLD_AUTO_MS;
    case "dashboard-builder":
      return RECONCILIATION_STALL_THRESHOLD_DASHBOARD_BUILDER_MS;
    default:
      return RECONCILIATION_STALL_THRESHOLD_MS;
  }
}

export function useReconciliation(config: UseReconciliationConfig): void {
  const isReconcilingRef = useRef<boolean>(false);

  const reconcile = useCallback(async () => {
    if (!config.conversationId || isReconcilingRef.current) return;

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

      // Step 3: Find latest assistant message with events (search from end)
      let latestAssistantMsg;
      for (let i = response.data.length - 1; i >= 0; i--) {
        const m = response.data[i];
        if (m.role === "assistant" && m.events && m.events.length > 0) {
          latestAssistantMsg = m;
          break;
        }
      }

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
      config.onStateUpdate(result, runId);

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

        const actualElapsed = getElapsedTimeFromEvents(mergedEvents);
        config.onRunFinished?.(runId, actualElapsed);
      }

      // Only reset stall timer if we got genuinely new events
      if (mergedEvents.length > localEvents.length) {
        config.lastEventTimeRef.current = Date.now();
      }

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

      config.onReconcile?.();
    } catch (err) {
      console.error("[useReconciliation] Reconciliation failed:", err);
    } finally {
      isReconcilingRef.current = false;
    }
  }, [
    config.conversationId,
    config.pusherRef,
    config.eventsRef,
    config.finishedRunsRef,
    config.lastEventTimeRef,
    config.onStateUpdate,
    config.onRunFinished,
    config.onReconcile,
  ]);

  // Health check interval — active when thinking OR streaming final response
  const isActivelyStreaming =
    config.isThinking || config.isFinalResponseStreaming;

  useEffect(() => {
    if (!isActivelyStreaming || !config.conversationId) return;

    const stallThreshold = getStallThreshold(config.chatType);

    if (import.meta.env.DEV) {
      console.log(
        `[useReconciliation] Health check active — chatType: ${config.chatType}, threshold: ${stallThreshold}ms`,
      );
    }

    const intervalId = setInterval(() => {
      if (isReconcilingRef.current) return;

      // Skip if no events received yet
      if (config.lastEventTimeRef.current === 0) return;

      const timeSinceLastEvent = Date.now() - config.lastEventTimeRef.current;

      // Hard timeout — no genuinely new events for too long, give up
      if (timeSinceLastEvent >= STREAM_TIMEOUT_MS) {
        console.log(
          "[useReconciliation] Hard timeout — no new events for",
          Math.round(timeSinceLastEvent / 1000),
          "seconds",
        );
        clearInterval(intervalId);
        config.onTimeout?.();
        return;
      }

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
    isActivelyStreaming,
    config.conversationId,
    config.chatType,
    config.lastEventTimeRef,
    reconcile,
  ]);

  // Connection recovery: trigger reconciliation on both disconnect and reconnect
  // during active streaming (thinking or final response streaming).
  //
  // Disconnect (true→false): attempt reconciliation after 2s delay. This may
  // fail if the network is still down, which is fine — the reconnect handler
  // will cover that case.
  //
  // Reconnect (false→true): reconcile immediately to catch up on any events
  // missed during the outage. Pusher does NOT replay missed events after
  // reconnecting, so a backend fetch is the only recovery path.
  const prevConnectedRef = useRef(config.isConnected);
  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    prevConnectedRef.current = config.isConnected;

    if (!isActivelyStreaming) return;

    if (wasConnected && !config.isConnected) {
      console.log(
        "[useReconciliation] Pusher disconnected during active streaming — scheduling reconciliation",
      );
      const timerId = setTimeout(() => {
        reconcile();
      }, 2000);
      return () => clearTimeout(timerId);
    }

    if (!wasConnected && config.isConnected) {
      console.log(
        "[useReconciliation] Pusher reconnected during active streaming — reconciling missed events",
      );
      // Small delay to let Pusher's resubscription settle before fetching
      const timerId = setTimeout(() => {
        reconcile();
      }, 500);
      return () => clearTimeout(timerId);
    }
  }, [config.isConnected, isActivelyStreaming, reconcile]);
}
