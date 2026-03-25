/**
 * useV2EventProcessor - Processes AGUI events for V2 conversations
 *
 * Single-responsibility: Binds to a Pusher channel and transforms AGUI events
 * into TimelineStep[] format for the TimelineThinkingProcess visualization.
 *
 * Key features:
 * - Accumulates events in eventsRef per run_id
 * - Transforms via transformAguiToTimelineSteps()
 * - Manages elapsed time timer via useRunTimerController
 * - Handles stopped streaming with batching
 * - Seeds from initialRunEvents on mount (page refresh recovery)
 * - Exposes refs for reconciliation hook to use
 *
 * Does NOT manage Pusher connection (receives channel) or reconciliation (separate hook).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRunTimerController } from "./useRunTimerController";
import { useLatestRef } from "./useLatestRef";
import { flushSync } from "react-dom";
import type { Channel } from "pusher-js";
import type {
  AguiEventWrapper,
  TimelineStep,
  RunFinishedEvent,
} from "@vonlabs/design-components";

/** RUN_FINISHED result extended with optional fields the backend emits. */
type RunFinishedEventWithDashboard = Omit<RunFinishedEvent, "result"> & {
  result: RunFinishedEvent["result"] & {
    dashboard?: DashboardMetadata | null;
    execution_id?: string | null;
    approval_type?: string | null;
  };
};
import type { DashboardMetadata } from "../types/conversation";

import {
  transformAguiToTimelineSteps,
  getElapsedTimeFromEvents,
  type ResearchResultsState,
} from "../utils/transformAguiToTimelineSteps";
import { conversationsService } from "../services/conversationsService";
import useChatStore from "../store/chatStore";

/** Check if a sorted event array has missing sequences (gaps or doesn't start at 0/1). */
function hasSequenceGaps(events: AguiEventWrapper[]): boolean {
  if (events.length === 0) return false;
  if (events[0].sequence > 1) return true;
  for (let i = 1; i < events.length; i++) {
    if (events[i].sequence !== events[i - 1].sequence + 1) return true;
  }
  return false;
}

/** Merge multiple event arrays, dedup by sequence number, return sorted.
 *  Later arrays overwrite earlier ones for the same sequence, so pass
 *  backend (stale) arrays first and Pusher (live) arrays last. */
function mergeAndDedup(
  ...eventArrays: (AguiEventWrapper[] | undefined)[]
): AguiEventWrapper[] {
  const mergedMap = new Map<number, AguiEventWrapper>();

  for (const arr of eventArrays) {
    if (!arr) continue;
    for (const evt of arr) {
      mergedMap.set(evt.sequence, evt);
    }
  }

  return Array.from(mergedMap.values()).sort((a, b) => a.sequence - b.sequence);
}

const AGUI_EVENTS = [
  "agent.run_started",
  "agent.step_started",
  "agent.text_message_start",
  "agent.text_message_content",
  "agent.text_message_end",
  "agent.tool_call_start",
  "agent.tool_call_args",
  "agent.tool_call_end",
  "agent.tool_call_result",
  "agent.step_finished",
  "agent.run_finished",
  "agent.run_error",
  "agent.research_results_start",
  "agent.research_results_content",
  "agent.research_results_end",
] as const;

export interface UseV2EventProcessorReturn {
  timelineSteps: TimelineStep[];
  isThinking: boolean;
  elapsedTime: number;
  currentRunId: string | null;
  finalResponse: string;
  isFinalResponseStreaming: boolean;
  isAwaitingApproval: boolean;
  researchResults: ResearchResultsState;
  isDeepResearchRunning: boolean;
  stoppedByUser: boolean;
  runErrorMessage: string;
  phase: "plan-proposed" | "ask" | null;
  dashboard: DashboardMetadata | null;
  /** execution_id from RUN_FINISHED for workflow execution approval (dry_run completed) */
  executionId: string | null;
  markStopped: () => void;
  markTimedOut: () => void;
  clearPendingStop: () => void;
  /** Optimistically resume the timer when approval is granted (before Pusher events arrive). */
  resumeTimer: () => void;
  /** Undo the optimistic timer resume when the approval API fails. */
  pauseTimerOnApprovalFailure: () => void;
  invalidateApproval: () => void;
  // Exposed refs for reconciliation hook
  eventsRef: React.MutableRefObject<Map<string, AguiEventWrapper[]>>;
  finishedRunsRef: React.MutableRefObject<Set<string>>;
  lastEventTimeRef: React.MutableRefObject<number>;
  // Allow reconciliation to update state
  applyTransformResult: (
    result: ReturnType<typeof transformAguiToTimelineSteps>,
    runId: string,
  ) => void;
  handleRunFinished: (runId: string, elapsedTime: number) => void;
}

const INITIAL_RESEARCH_RESULTS: ResearchResultsState = {
  isStreaming: false,
  isCompleted: false,
  content: "",
  metadata: null,
  messageId: null,
};

export function useV2EventProcessor(
  channel: Channel | null,
  conversationId: string | null,
  initialRunEvents?: AguiEventWrapper[],
  onRunComplete?: () => void,
): UseV2EventProcessorReturn {
  const {
    elapsedTime: timerElapsedTime,
    onRunStarted: timerOnRunStarted,
    onReconnected: timerOnReconnected,
    onEventProcessed: timerOnEventProcessed,
    onRunCompleted: timerOnRunCompleted,
    onRunTerminated: timerOnRunTerminated,
    onApprovalResumed: timerOnApprovalResumed,
    onApprovalFailed: timerOnApprovalFailed,
    onReconciliationFinished: timerOnReconciliationFinished,
    isTrackingRun: timerIsTrackingRun,
    seedFromServer: timerSeedFromServer,
    onSeedingDetectedCompletion: timerOnSeedingDetectedCompletion,
    correctElapsed: timerCorrectElapsed,
  } = useRunTimerController();

  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [finalResponse, setFinalResponse] = useState("");
  const [isFinalResponseStreaming, setIsFinalResponseStreaming] =
    useState(false);
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
  const [researchResults, setResearchResults] = useState<ResearchResultsState>(
    INITIAL_RESEARCH_RESULTS,
  );
  const [isDeepResearchRunning, setIsDeepResearchRunning] = useState(false);
  const [stoppedByUser, setStoppedByUser] = useState(false);
  const [runErrorMessage, setRunErrorMessage] = useState("");
  const [phase, setPhase] = useState<"plan-proposed" | "ask" | null>(null);
  const [dashboard, setDashboard] = useState<DashboardMetadata | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const eventsRef = useRef<Map<string, AguiEventWrapper[]>>(new Map());
  const finishedRunsRef = useRef<Set<string>>(new Set());
  const lastEventTimeRef = useRef<number>(0);
  const gapFillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks currentRunId for the event handler closure without causing
  // callback recreation (and Pusher handler rebinding) on every state change.
  const currentRunIdForHandlerRef = useRef<string | null>(null);
  // Ref snapshot of timerElapsedTime so the seeding effect can read it without
  // depending on a value that changes every second.
  const timerElapsedTimeRef = useLatestRef(timerElapsedTime);
  // Guards against events arriving after Stop is clicked but before any run_id
  // was known. When true, the first event's run_id is added to finishedRunsRef
  // and the event is swallowed.
  const pendingStopRef = useRef(false);
  // Ref mirror of timelineSteps for immediate reads after flushSync (where the
  // closure-captured state variable would still be stale).
  const timelineStepsRef = useRef(timelineSteps);
  timelineStepsRef.current = timelineSteps;

  // Apply a transform result to state (used by both event handler and reconciliation)
  const applyTransformResult = useCallback(
    (
      result: ReturnType<typeof transformAguiToTimelineSteps>,
      runId: string,
      options?: {
        phase?: "plan-proposed" | "ask" | null;
        dashboard?: DashboardMetadata | null;
        executionId?: string | null;
      },
    ) => {
      flushSync(() => {
        setTimelineSteps(result.steps);
        setIsThinking(result.isThinking);
        setCurrentRunId(runId);
        setFinalResponse(result.finalResponse);
        setIsFinalResponseStreaming(result.isFinalResponseStreaming);
        setIsAwaitingApproval(result.isAwaitingApproval);
        setResearchResults(result.researchResults);
        setIsDeepResearchRunning(result.isDeepResearchRunning);
        setStoppedByUser(result.stoppedByUser);
        setRunErrorMessage(result.runErrorMessage);
        if (options?.phase !== undefined) {
          setPhase(options.phase);
        }
        if (options?.dashboard !== undefined) {
          setDashboard(options.dashboard);
        }
        if (options?.executionId !== undefined) {
          setExecutionId(options.executionId);
        }
      });
    },
    [],
  );

  // Shared logic for terminating the active run (stopped by user, timed out, etc.)
  const terminateRun = useCallback(
    (options: { stoppedByUser: boolean; errorMessage?: string }) => {
      // Find the active (non-finished) run, mark it finished, and flush its events
      let activeRunEvents: AguiEventWrapper[] | undefined;
      for (const [runId, events] of eventsRef.current) {
        if (!finishedRunsRef.current.has(runId)) {
          finishedRunsRef.current.add(runId);
          activeRunEvents = events;
          break;
        }
      }

      if (activeRunEvents && activeRunEvents.length > 0) {
        // Run was found and terminated — clear the flag so the next run isn't swallowed
        pendingStopRef.current = false;
        const {
          steps,
          finalResponse: response,
          researchResults: research,
          isDeepResearchRunning: deepResearchRunning,
          runErrorMessage: errorMsg,
        } = transformAguiToTimelineSteps(activeRunEvents);

        // Mark any in-progress/pending steps as complete (run is terminated).
        // Steps still awaiting approval were never resolved — mark as expired
        // so the card shows "Invalid" instead of "Approved".
        for (const step of steps) {
          if (step.status === "in-progress" || step.status === "pending") {
            step.status = "complete";
          } else if (step.status === "awaiting-approval") {
            step.status = "expired";
          }
        }

        flushSync(() => {
          setTimelineSteps(steps);
          setIsThinking(false);
          setIsFinalResponseStreaming(false);
          setIsAwaitingApproval(false);
          setStoppedByUser(options.stoppedByUser);
          setFinalResponse(response);
          setResearchResults(research);
          setIsDeepResearchRunning(deepResearchRunning);
          setRunErrorMessage(options.errorMessage ?? errorMsg);
          setExecutionId(null);
        });
      } else {
        flushSync(() => {
          setIsThinking(false);
          setIsFinalResponseStreaming(false);
          setStoppedByUser(options.stoppedByUser);
          setRunErrorMessage(options.errorMessage ?? "");
          setTimelineSteps([]);
          setExecutionId(null);
        });
      }

      // Reset elapsed to 0 when no events were found (user stopped before any arrived)
      timerOnRunTerminated(!activeRunEvents || activeRunEvents.length === 0);
      lastEventTimeRef.current = 0;
      onRunComplete?.();
    },
    [timerOnRunTerminated, onRunComplete],
  );

  const markStopped = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log("[useV2EventProcessor] Streaming marked as stopped");
    }
    pendingStopRef.current = true;
    terminateRun({ stoppedByUser: true });
  }, [terminateRun]);

  const clearPendingStop = useCallback(() => {
    pendingStopRef.current = false;
  }, []);

  const invalidateApproval = useCallback(() => {
    // Mark all active runs as finished so their events are no longer processed
    for (const [runId] of eventsRef.current) {
      if (!finishedRunsRef.current.has(runId)) {
        finishedRunsRef.current.add(runId);
      }
    }

    // Reset live state synchronously so React commits the update before this
    // function returns.  The functional updater reads React's latest committed
    // state (avoiding races with queued updates).  Note: `flushSync` guarantees
    // the DOM is updated, but the `timelineSteps` state variable captured by
    // the enclosing closure is NOT updated until the next render — any code that
    // needs the new steps immediately after this call must read via the ref.
    flushSync(() => {
      setTimelineSteps((prev) => {
        const next = prev.map((step) => {
          if (step.status === "awaiting-approval") {
            return { ...step, status: "expired" as const };
          }
          if (step.status === "in-progress" || step.status === "pending") {
            return { ...step, status: "complete" as const };
          }
          return step;
        });
        timelineStepsRef.current = next;
        return next;
      });
      setIsAwaitingApproval(false);
      setIsThinking(false);
      setIsFinalResponseStreaming(false);
      setExecutionId(null);
    });
    timerOnRunTerminated(true);
    lastEventTimeRef.current = 0;

    // Trigger event persistence: onRunComplete calls forceCompleteMessage which
    // persists events from eventsRef into the chatStore message, then
    // refetchMessages() replaces the optimistic message with the server's
    // version.  dashboardUtils post-processing unconditionally marks any
    // remaining awaiting-approval steps as expired for non-streaming messages,
    // and propagates the expired status to the message level — so no
    // separate markMessageExpired call is needed here.
    try {
      onRunComplete?.();
    } catch (err) {
      console.error("[invalidateApproval] onRunComplete failed:", err);
    }
  }, [timerOnRunTerminated, onRunComplete]);

  const markTimedOut = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log(
        "[useV2EventProcessor] Run timed out — no new events received",
      );
    }

    // Persist timeout status in chatStore so the message shows the error banner
    // and doesn't resurrect as "streaming" after a page refresh
    const messages =
      useChatStore.getState().messages[conversationId ?? ""] || [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && m.isStreaming) {
        useChatStore.getState().markMessageTimeout(conversationId ?? "", m.id);
        break;
      }
    }

    terminateRun({ stoppedByUser: false, errorMessage: "Request timed out" });
  }, [conversationId, terminateRun]);

  const handleRunFinished = useCallback(
    (runId: string, elapsed: number) => {
      timerOnReconciliationFinished(runId, elapsed);
    },
    [timerOnReconciliationFinished],
  );

  // Shared gap-fill: fetch events from the backend API and merge into the
  // current event stream, filling any sequence gaps.
  const scheduleGapFill = useCallback(
    (runId: string, delayMs: number, label: string) => {
      if (gapFillTimerRef.current) return;

      const capturedConversationId = conversationId;

      gapFillTimerRef.current = setTimeout(async () => {
        gapFillTimerRef.current = null;
        if (!capturedConversationId) return;
        if (finishedRunsRef.current.has(runId)) return;

        // Re-check if gaps still exist (may have been filled by later events)
        const currentEvents = eventsRef.current.get(runId) || [];
        if (!hasSequenceGaps(currentEvents)) return;

        try {
          const response = await conversationsService.getConversationMessages(
            capturedConversationId,
            1,
            5,
          );

          let latestMsg;
          for (let i = response.data.length - 1; i >= 0; i--) {
            const m = response.data[i];
            if (m.role === "assistant" && m.events && m.events.length > 0) {
              latestMsg = m;
              break;
            }
          }

          if (!latestMsg?.events?.length) return;

          const apiEvents = latestMsg.events;
          const apiRunId = apiEvents[0]?.run_id;
          if (apiRunId !== runId) return;

          const filledEvents = mergeAndDedup(apiEvents, currentEvents);
          if (filledEvents.length <= currentEvents.length) return;

          eventsRef.current.set(runId, filledEvents);
          const gapResult = transformAguiToTimelineSteps(filledEvents);
          applyTransformResult(gapResult, runId);

          if (import.meta.env.DEV) {
            console.log(
              `[useV2EventProcessor] ${label} complete:`,
              `before=${currentEvents.length}, after=${filledEvents.length}`,
            );
          }
        } catch (err) {
          console.error(`[useV2EventProcessor] ${label} failed:`, err);
        }
      }, delayMs);
    },
    [conversationId, applyTransformResult],
  );

  // AGUI event handler
  const handleAguiEvent = useCallback(
    () => (data: string | AguiEventWrapper) => {
      try {
        const wrapper: AguiEventWrapper =
          typeof data === "string" ? JSON.parse(data) : data;
        const { run_id, sequence } = wrapper;
        const eventType = wrapper.event?.type;

        if (!conversationId || !run_id) return;

        // Stop was requested before any events arrived — swallow this run's events
        if (pendingStopRef.current && !finishedRunsRef.current.has(run_id)) {
          pendingStopRef.current = false;
          finishedRunsRef.current.add(run_id);
          if (import.meta.env.DEV) {
            console.log(
              "[useV2EventProcessor] Swallowed late event for pre-emptively stopped run:",
              run_id,
            );
          }
          return;
        }

        // For finished runs: still accumulate events (for persistence) but don't re-transform
        if (finishedRunsRef.current.has(run_id)) {
          const finishedRunEvents = eventsRef.current.get(run_id);
          if (finishedRunEvents) {
            const exists = finishedRunEvents.some(
              (e) => e.run_id === run_id && e.sequence === sequence,
            );
            if (!exists) {
              finishedRunEvents.push(wrapper);
              finishedRunEvents.sort((a, b) => a.sequence - b.sequence);
            }
          }
          if (import.meta.env.DEV) {
            console.log(
              "[useV2EventProcessor] Accumulated late event for finished run:",
              eventType,
            );
          }
          return;
        }

        // Get or create events array for this run
        let runEvents = eventsRef.current.get(run_id);
        if (!runEvents) {
          runEvents = [];
          eventsRef.current.set(run_id, runEvents);

          // Determine if this is a genuinely new run (follow-up) or a
          // mid-stream reconnect (page refresh). We can't rely on sequence === 0
          // because backends may start sequences at 1 or higher.
          // Instead, check if the previous run finished — if so, this must be new.
          // If no run is being tracked yet, or the previously tracked run
          // already finished, this is a brand-new run (not a reconnect).
          const previousRunId = currentRunIdForHandlerRef.current;
          const isNewRun =
            !previousRunId || finishedRunsRef.current.has(previousRunId);
          if (isNewRun) {
            currentRunIdForHandlerRef.current = run_id;
            flushSync(() => {
              setTimelineSteps([]);
              setFinalResponse("");
              setIsFinalResponseStreaming(false);
              setIsAwaitingApproval(false);
              setStoppedByUser(false);
              setCurrentRunId(run_id);
              setRunErrorMessage("");
              setDashboard(null);
              setPhase(null);
              setExecutionId(null);
            });
            timerOnRunStarted(run_id);
          } else {
            // Mid-stream reconnect: set run ID but preserve existing state,
            // seeding will fill in the gaps and re-transform
            currentRunIdForHandlerRef.current = run_id;
            setCurrentRunId(run_id);
            timerOnReconnected(run_id);
          }
        }

        // Deduplicate by sequence
        const exists = runEvents.some(
          (e) => e.run_id === run_id && e.sequence === sequence,
        );
        if (exists) return;

        // Append and sort
        runEvents.push(wrapper);
        runEvents.sort((a, b) => a.sequence - b.sequence);

        // Track last event time for stall detection
        lastEventTimeRef.current = Date.now();

        // Transform to timeline steps
        const result = transformAguiToTimelineSteps(runEvents);

        // Extract phase, dashboard, and executionId from RUN_FINISHED event
        const runFinishedPhase =
          eventType === "RUN_FINISHED"
            ? ((wrapper.event as RunFinishedEventWithDashboard).result?.phase ??
              null)
            : undefined;
        const runFinishedDashboard =
          eventType === "RUN_FINISHED"
            ? ((wrapper.event as RunFinishedEventWithDashboard).result
                ?.dashboard ?? null)
            : undefined;
        const runFinishedExecutionId =
          eventType === "RUN_FINISHED"
            ? ((wrapper.event as RunFinishedEventWithDashboard).result
                ?.execution_id ?? null)
            : undefined;

        // Update state synchronously
        flushSync(() => {
          setTimelineSteps(result.steps);
          setIsThinking(result.isThinking);
          setFinalResponse(result.finalResponse);
          setIsFinalResponseStreaming(result.isFinalResponseStreaming);
          setIsAwaitingApproval(result.isAwaitingApproval);
          setResearchResults(result.researchResults);
          setIsDeepResearchRunning(result.isDeepResearchRunning);
          setStoppedByUser(result.stoppedByUser);
          setRunErrorMessage(result.runErrorMessage);

          // Update phase when RUN_FINISHED arrives
          if (runFinishedPhase !== undefined) {
            setPhase(runFinishedPhase);
          }
          // Update dashboard when RUN_FINISHED arrives with dashboard metadata
          if (runFinishedDashboard !== undefined) {
            if (import.meta.env.DEV) {
              console.log(
                "[useV2EventProcessor] Dashboard metadata received:",
                runFinishedDashboard,
              );
            }
            setDashboard(runFinishedDashboard);
          }
          // Update executionId when RUN_FINISHED arrives with workflow execution approval
          if (runFinishedExecutionId !== undefined) {
            setExecutionId(runFinishedExecutionId);
          }
        });

        // Mark message as expired in chatStore when approval expires
        if (result.isExpiredApproval) {
          // Extract the expired message from the step that has expired status
          const expiredStep = result.steps.find((s) => s.status === "expired");
          const expiredMessage = expiredStep?.errorMessage;

          const messages =
            useChatStore.getState().messages[conversationId ?? ""] || [];
          // Match by run_id to find the correct message when multiple runs are active
          const targetMsg = messages
            .slice()
            .reverse()
            .find((m) => m.role === "assistant" && m.runId === run_id);
          if (targetMsg) {
            useChatStore
              .getState()
              .markMessageExpired(
                conversationId ?? "",
                targetMsg.id,
                expiredMessage,
              );
          }
        }

        // Delegate timer pause/play/stop to the controller based on event state
        timerOnEventProcessed(run_id, {
          isAwaitingApproval: result.isAwaitingApproval,
          isThinking: result.isThinking,
          isFinalResponseStreaming: result.isFinalResponseStreaming,
        });

        // Mid-stream gap detection: if the range of sequences exceeds the event
        // count, some events were lost. Schedule a delayed backend fetch to fill gaps.
        // O(1) check — avoids iterating the full array on every event.
        if (
          runEvents.length > 1 &&
          runEvents[runEvents.length - 1].sequence - runEvents[0].sequence + 1 >
            runEvents.length
        ) {
          if (import.meta.env.DEV) {
            console.log(
              "[useV2EventProcessor] Mid-stream gap detected, scheduling gap-fill",
            );
          }
          scheduleGapFill(run_id, 2000, "Mid-stream gap-fill");
        }

        // Handle run completion
        const isTransitionalFinish =
          result.hadApprovalPause &&
          !result.finalResponse &&
          !result.stoppedByUser;
        if (
          !result.isThinking &&
          !isTransitionalFinish &&
          !finishedRunsRef.current.has(run_id)
        ) {
          finishedRunsRef.current.add(run_id);
          timerOnRunCompleted(run_id);
          onRunComplete?.();
        }
      } catch (error) {
        console.error("[useV2EventProcessor] Error handling event:", error);
      }
    },
    [
      conversationId,
      timerOnRunStarted,
      timerOnReconnected,
      timerOnEventProcessed,
      timerOnRunCompleted,
      onRunComplete,
      scheduleGapFill,
    ],
  );

  // Seed/reconcile from initialRunEvents on mount or when backend events arrive.
  // Merges backend events with any Pusher events already received, deduplicating
  // by sequence number so no content is lost regardless of run state.
  useEffect(() => {
    // Clear any pending gap-fill timer from a previous effect run
    if (gapFillTimerRef.current) {
      clearTimeout(gapFillTimerRef.current);
      gapFillTimerRef.current = null;
    }

    if (!initialRunEvents || initialRunEvents.length === 0) return;

    const runId = initialRunEvents[0]?.run_id;
    if (!runId) return;

    // Don't re-seed for finished runs
    if (finishedRunsRef.current.has(runId)) return;

    // Merge backend + Pusher events, dedup by sequence number
    const existingPusherEvents = eventsRef.current.get(runId);
    const mergedEvents = mergeAndDedup(initialRunEvents, existingPusherEvents);

    const result = transformAguiToTimelineSteps(mergedEvents);

    // Extract phase and dashboard from seeded events (for page refresh)
    const runFinishedEvent = mergedEvents.find(
      (e) => e.event?.type === "RUN_FINISHED",
    );
    const seededPhase = runFinishedEvent
      ? ((runFinishedEvent.event as RunFinishedEventWithDashboard).result
          ?.phase ?? null)
      : null;
    const seededDashboard = runFinishedEvent
      ? ((runFinishedEvent.event as RunFinishedEventWithDashboard).result
          ?.dashboard ?? null)
      : null;
    const seededExecutionId = runFinishedEvent
      ? ((runFinishedEvent.event as RunFinishedEventWithDashboard).result
          ?.execution_id ?? null)
      : null;

    eventsRef.current.set(runId, mergedEvents);

    const isPusherAlreadyTracking = timerIsTrackingRun(runId);

    if (isPusherAlreadyTracking) {
      // Pusher is already tracking — update state and correct timer if needed.
      // On fresh mount, Pusher may misclassify a reconnect as a new run (because
      // currentRunIdForHandlerRef is null), resetting the timer to 0. The event-
      // derived elapsed covers first→last event; add the current timer value to
      // account for the gap between the last event and now.
      const eventElapsed = getElapsedTimeFromEvents(mergedEvents);
      const correctedElapsed = eventElapsed + timerElapsedTimeRef.current;
      if (correctedElapsed > timerElapsedTimeRef.current) {
        timerCorrectElapsed(runId, correctedElapsed);
      }

      currentRunIdForHandlerRef.current = runId;
      applyTransformResult(result, runId, {
        phase: seededPhase,
        dashboard: seededDashboard,
        executionId: seededExecutionId,
      });

      if (!result.isThinking && !finishedRunsRef.current.has(runId)) {
        // Edge case: Pusher is tracking but run completed (Pusher missed RUN_FINISHED).
        finishedRunsRef.current.add(runId);
        timerOnSeedingDetectedCompletion(runId);
      }
    } else if (!result.isThinking) {
      // Completed run, no live tracking — just bookkeep.
      // The persisted message path (dashboardUtils) renders the correct elapsed
      // and timeline from msg.events. Setting currentRunId here would force the
      // V2 live path, which shows elapsedTime=0 before the timer is seeded.
      // However, we still need to set phase and dashboard for UI components that
      // depend on them (e.g., DashboardPanel, approval buttons).
      // Mark as finished FIRST (synchronously via ref) to prevent race conditions
      // with late Pusher events before state updates complete.
      finishedRunsRef.current.add(runId);
      flushSync(() => {
        setPhase(seededPhase);
        setDashboard(seededDashboard);
        setExecutionId(seededExecutionId);
      });
    } else {
      // Active run, not yet tracked by Pusher (page refresh recovery).
      // Seed the timer FIRST so that the flushSync render in applyTransformResult
      // sees the correct elapsed value via the V2 live path.
      const elapsed = getElapsedTimeFromEvents(mergedEvents);
      timerSeedFromServer(runId, elapsed, {
        isThinking: result.isThinking,
        isAwaitingApproval: result.isAwaitingApproval,
      });
      currentRunIdForHandlerRef.current = runId;
      applyTransformResult(result, runId, {
        phase: seededPhase,
        dashboard: seededDashboard,
        executionId: seededExecutionId,
      });
    }

    if (import.meta.env.DEV) {
      console.log(
        "[useV2EventProcessor] Seeded events for run:",
        runId,
        "count:",
        mergedEvents.length,
        existingPusherEvents
          ? `(merged ${initialRunEvents.length} backend + ${existingPusherEvents.length} Pusher)`
          : "(backend only)",
        "isThinking:",
        result.isThinking,
      );
    }

    // Check if mergedEvents has any sequence gaps or doesn't start at 0/1.
    // If so, schedule a delayed re-fetch to fill missing events.
    if (hasSequenceGaps(mergedEvents)) {
      if (import.meta.env.DEV) {
        const sequences = mergedEvents.map((e) => e.sequence);
        console.log(
          "[useV2EventProcessor] Sequence gaps detected in merged events:",
          `sequences=[${sequences[0]}..${sequences[sequences.length - 1]}],`,
          `count=${mergedEvents.length} — scheduling reconciliation`,
        );
      }
      scheduleGapFill(runId, 1500, "Reconciliation");
    }
  }, [
    initialRunEvents,
    applyTransformResult,
    scheduleGapFill,
    timerIsTrackingRun,
    timerCorrectElapsed,
    timerElapsedTimeRef,
    timerOnSeedingDetectedCompletion,
    timerSeedFromServer,
  ]);

  // Bind/unbind AGUI events when channel changes
  useEffect(() => {
    if (!channel) return;

    const handler = handleAguiEvent();

    for (const eventName of AGUI_EVENTS) {
      channel.bind(eventName, handler);
    }

    return () => {
      for (const eventName of AGUI_EVENTS) {
        channel.unbind(eventName, handler);
      }
    };
  }, [channel, handleAguiEvent]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (gapFillTimerRef.current) {
        clearTimeout(gapFillTimerRef.current);
      }
    };
  }, []);

  return {
    timelineSteps,
    isThinking,
    elapsedTime: timerElapsedTime,
    currentRunId,
    finalResponse,
    isFinalResponseStreaming,
    isAwaitingApproval,
    researchResults,
    isDeepResearchRunning,
    stoppedByUser,
    runErrorMessage,
    phase,
    dashboard,
    executionId,
    markStopped,
    markTimedOut,
    clearPendingStop,
    resumeTimer: timerOnApprovalResumed,
    pauseTimerOnApprovalFailure: timerOnApprovalFailed,
    invalidateApproval,
    eventsRef,
    finishedRunsRef,
    lastEventTimeRef,
    applyTransformResult,
    handleRunFinished,
  };
}
