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
import type {
  AguiEventWrapper,
  DashboardReadyEvent,
  RunFinishedEvent,
} from "@vonlabs/design-components";
import type { DashboardMetadata } from "../types/conversation";

import { conversationsService } from "../services/conversationsService";
import { findLast } from "../utils/findLast";
import {
  transformAguiToTimelineSteps,
  getElapsedTimeFromEvents,
} from "../utils/transformAguiToTimelineSteps";
import {
  RECONCILIATION_STALL_THRESHOLD_AUTO_MS,
  RECONCILIATION_STALL_THRESHOLD_DASHBOARD_BUILDER_MS,
  RECONCILIATION_STALL_THRESHOLD_MS,
  RECONCILIATION_CHECK_INTERVAL_MS,
} from "../config/constants";
import { ConversationMode } from "@vonlabs/design-components";

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
    options?: {
      dashboard?: DashboardMetadata | null;
      executionId?: string | null;
      isDashboardBuilderMode?: boolean;
    },
  ) => void;
  onRunFinished?: (runId: string, elapsedTime: number) => void;
  onReconcile?: () => void;
}

function getStallThreshold(chatType: ConversationMode): number {
  switch (chatType) {
    case ConversationMode.Auto:
      return RECONCILIATION_STALL_THRESHOLD_AUTO_MS;
    case ConversationMode.DashboardBuilder:
      return RECONCILIATION_STALL_THRESHOLD_DASHBOARD_BUILDER_MS;
    default:
      return RECONCILIATION_STALL_THRESHOLD_MS;
  }
}

export function useReconciliation({
  conversationId,
  chatType,
  isThinking,
  isFinalResponseStreaming,
  isConnected,
  eventsRef,
  finishedRunsRef,
  lastEventTimeRef,
  onStateUpdate,
  onRunFinished,
  onReconcile,
}: UseReconciliationConfig): void {
  const isReconcilingRef = useRef<boolean>(false);

  const reconcile = useCallback(async () => {
    if (!conversationId || isReconcilingRef.current) return;

    isReconcilingRef.current = true;

    console.log(
      "[useReconciliation] Stall detected — reconciling from backend API",
    );

    try {
      // Step 1: Fetch latest messages from backend
      const response = await conversationsService.getConversationMessages(
        conversationId,
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
      if (finishedRunsRef.current.has(runId)) return;

      // Step 4: Merge local + API events (deduped, API wins on conflict)
      const localEvents = eventsRef.current.get(runId) || [];
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
      eventsRef.current.set(runId, mergedEvents);

      // Step 5: Re-transform
      const result = transformAguiToTimelineSteps(mergedEvents);

      // Step 5b: Extract dashboard from DASHBOARD_READY event, execution metadata from RUN_FINISHED
      const dashboardReadyEvent = findLast(
        mergedEvents,
        (e) => e.event?.type === "DASHBOARD_READY",
      );
      const reconciledDashboard = dashboardReadyEvent
        ? (dashboardReadyEvent.event as DashboardReadyEvent).dashboard ?? undefined
        : undefined;

      type RunFinishedWithExtras = Omit<RunFinishedEvent, "result"> & {
        result: RunFinishedEvent["result"] & {
          execution_id?: string | null;
          is_dashboard_builder_mode?: boolean;
        };
      };
      const runFinishedEvent = mergedEvents.find(
        (e) => e.event?.type === "RUN_FINISHED",
      );
      const reconciledExecutionId = runFinishedEvent
        ? ((runFinishedEvent.event as RunFinishedWithExtras).result
            ?.execution_id ?? null)
        : undefined;
      const reconciledIsDashboardBuilderMode = runFinishedEvent
        ? ((runFinishedEvent.event as RunFinishedWithExtras).result
            ?.is_dashboard_builder_mode ?? false)
        : undefined;

      // Step 6: Update state (dashboard from DASHBOARD_READY, executionId/isDashboardBuilderMode from RUN_FINISHED)
      onStateUpdate(result, runId, {
        dashboard: reconciledDashboard,
        executionId: reconciledExecutionId,
        isDashboardBuilderMode: reconciledIsDashboardBuilderMode,
      });

      // Step 7: Handle run completion
      const isTransitionalFinish =
        result.hadApprovalPause &&
        !result.finalResponse &&
        !result.stoppedByUser;
      if (
        !result.isThinking &&
        !isTransitionalFinish &&
        !finishedRunsRef.current.has(runId)
      ) {
        finishedRunsRef.current.add(runId);

        const actualElapsed = getElapsedTimeFromEvents(mergedEvents);
        onRunFinished?.(runId, actualElapsed);
      }

      // Only reset stall timer if we got genuinely new events
      if (mergedEvents.length > localEvents.length) {
        lastEventTimeRef.current = Date.now();
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

      onReconcile?.();
    } catch (err) {
      console.error("[useReconciliation] Reconciliation failed:", err);
    } finally {
      isReconcilingRef.current = false;
    }
  }, [
    conversationId,
    eventsRef,
    finishedRunsRef,
    lastEventTimeRef,
    onStateUpdate,
    onRunFinished,
    onReconcile,
  ]);

  // Health check interval — active when thinking OR streaming final response
  const isActivelyStreaming = isThinking || isFinalResponseStreaming;

  useEffect(() => {
    if (!isActivelyStreaming || !conversationId) return;

    const stallThreshold = getStallThreshold(chatType);

    if (import.meta.env.DEV) {
      console.log(
        `[useReconciliation] Health check active — chatType: ${chatType}, threshold: ${stallThreshold}ms`,
      );
    }

    const intervalId = setInterval(() => {
      if (isReconcilingRef.current) return;

      // Skip if no events received yet
      if (lastEventTimeRef.current === 0) return;

      const timeSinceLastEvent = Date.now() - lastEventTimeRef.current;

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
    conversationId,
    chatType,
    lastEventTimeRef,
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
  const prevConnectedRef = useRef(isConnected);
  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    prevConnectedRef.current = isConnected;

    if (!isActivelyStreaming) return;

    if (wasConnected && !isConnected) {
      console.log(
        "[useReconciliation] Pusher disconnected during active streaming — scheduling reconciliation",
      );
      const timerId = setTimeout(() => {
        reconcile();
      }, 2000);
      return () => clearTimeout(timerId);
    }

    if (!wasConnected && isConnected) {
      console.log(
        "[useReconciliation] Pusher reconnected during active streaming — reconciling missed events",
      );
      // Small delay to let Pusher's resubscription settle before fetching
      const timerId = setTimeout(() => {
        reconcile();
      }, 500);
      return () => clearTimeout(timerId);
    }
  }, [isConnected, isActivelyStreaming, reconcile]);
}
