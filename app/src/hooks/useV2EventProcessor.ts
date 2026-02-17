/**
 * useV2EventProcessor - Processes AGUI events for V2 conversations
 *
 * Single-responsibility: Binds to a Pusher channel and transforms AGUI events
 * into TimelineStep[] format for the TimelineThinkingProcess visualization.
 *
 * Key features:
 * - Accumulates events in eventsRef per run_id
 * - Transforms via transformAguiToTimelineSteps()
 * - Manages elapsed time timer
 * - Handles stopped streaming with batching
 * - Seeds from initialRunEvents on mount (page refresh recovery)
 * - Exposes refs for reconciliation hook to use
 *
 * Does NOT manage Pusher connection (receives channel) or reconciliation (separate hook).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Channel } from "pusher-js";
import type {
  AguiEventWrapper,
  TimelineStep,
} from "@vonlabs/design-components";

import {
  transformAguiToTimelineSteps,
  getElapsedTimeFromEvents,
  type ResearchResultsState,
} from "../utils/transformAguiToTimelineSteps";
import { conversationsService } from "../services/conversationsService";

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
  markStopped: () => void;
  markTimedOut: () => void;
  clearPendingStop: () => void;
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
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
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

  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventsRef = useRef<Map<string, AguiEventWrapper[]>>(new Map());
  const finishedRunsRef = useRef<Set<string>>(new Set());
  const lastEventTimeRef = useRef<number>(0);
  const gapFillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against events arriving after Stop is clicked but before any run_id
  // was known. When true, the first event's run_id is added to finishedRunsRef
  // and the event is swallowed.
  const pendingStopRef = useRef(false);

  const startElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
    }
    setElapsedTime(0);
    elapsedTimerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  // Apply a transform result to state (used by both event handler and reconciliation)
  const applyTransformResult = useCallback(
    (
      result: ReturnType<typeof transformAguiToTimelineSteps>,
      runId: string,
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

        // Mark any in-progress/pending steps as complete (run is terminated)
        for (const step of steps) {
          if (step.status === "in-progress" || step.status === "pending") {
            step.status = "complete";
          }
        }

        const actualElapsed = getElapsedTimeFromEvents(activeRunEvents);

        flushSync(() => {
          setTimelineSteps(steps);
          setIsThinking(false);
          setIsFinalResponseStreaming(false);
          setStoppedByUser(options.stoppedByUser);
          setFinalResponse(response);
          setResearchResults(research);
          setIsDeepResearchRunning(deepResearchRunning);
          setRunErrorMessage(options.errorMessage ?? errorMsg);
          if (actualElapsed > 0) {
            setElapsedTime(actualElapsed);
          }
        });
      } else {
        flushSync(() => {
          setIsThinking(false);
          setIsFinalResponseStreaming(false);
          setStoppedByUser(options.stoppedByUser);
          setRunErrorMessage(options.errorMessage ?? "");
          setElapsedTime(0);
          setTimelineSteps([]);
        });
      }

      stopElapsedTimer();
      lastEventTimeRef.current = 0;
      onRunComplete?.();
    },
    [stopElapsedTimer, onRunComplete],
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

  const markTimedOut = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log(
        "[useV2EventProcessor] Run timed out — no new events received",
      );
    }
    terminateRun({ stoppedByUser: false, errorMessage: "Request timed out" });
  }, [terminateRun]);

  const handleRunFinished = useCallback(
    (_runId: string, elapsedTime: number) => {
      stopElapsedTimer();
      setElapsedTime(elapsedTime);
    },
    [stopElapsedTimer],
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

          // Only reset state for genuinely new runs (sequence 0).
          // If the first Pusher event has sequence > 0, this is a page-refresh
          // mid-stream — backend seeding will merge the earlier events shortly.
          if (sequence === 0) {
            flushSync(() => {
              setTimelineSteps([]);
              setFinalResponse("");
              setIsFinalResponseStreaming(false);
              setIsAwaitingApproval(false);
              setStoppedByUser(false);
              setCurrentRunId(run_id);
              setElapsedTime(0);
              setRunErrorMessage("");
            });
            startElapsedTimer();
          } else {
            // Mid-stream reconnect: set run ID but preserve existing state,
            // seeding will fill in the gaps and re-transform
            setCurrentRunId(run_id);
            if (!elapsedTimerRef.current) {
              startElapsedTimer();
            }
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

        // Update state
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
        });

        // Stop timer when final response starts streaming
        if (result.isFinalResponseStreaming && elapsedTimerRef.current) {
          stopElapsedTimer();
        }

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
          stopElapsedTimer();

          const actualElapsed = getElapsedTimeFromEvents(runEvents);
          if (actualElapsed > 0) {
            setElapsedTime(actualElapsed);
          }

          onRunComplete?.();
        }
      } catch (error) {
        console.error("[useV2EventProcessor] Error handling event:", error);
      }
    },
    [
      conversationId,
      startElapsedTimer,
      stopElapsedTimer,
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

    eventsRef.current.set(runId, mergedEvents);
    applyTransformResult(result, runId);

    const elapsed = getElapsedTimeFromEvents(mergedEvents);
    if (elapsed > 0) {
      setElapsedTime(elapsed);
    }

    // Start or stop timer based on run state
    if (result.isThinking) {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
      elapsedTimerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      stopElapsedTimer();
      // Mark completed/stopped runs as finished so subsequent events don't re-process
      finishedRunsRef.current.add(runId);
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
  }, [initialRunEvents]);

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
      stopElapsedTimer();
      if (gapFillTimerRef.current) {
        clearTimeout(gapFillTimerRef.current);
      }
    };
  }, [stopElapsedTimer]);

  return {
    timelineSteps,
    isThinking,
    elapsedTime,
    currentRunId,
    finalResponse,
    isFinalResponseStreaming,
    isAwaitingApproval,
    researchResults,
    isDeepResearchRunning,
    stoppedByUser,
    runErrorMessage,
    markStopped,
    markTimedOut,
    clearPendingStop,
    eventsRef,
    finishedRunsRef,
    lastEventTimeRef,
    applyTransformResult,
    handleRunFinished,
  };
}
