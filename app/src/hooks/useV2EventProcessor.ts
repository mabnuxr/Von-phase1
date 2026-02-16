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
  // Exposed refs for reconciliation hook
  eventsRef: React.MutableRefObject<Map<string, AguiEventWrapper[]>>;
  finishedRunsRef: React.MutableRefObject<Set<string>>;
  lastEventTimeRef: React.MutableRefObject<number>;
  stoppedRef: React.MutableRefObject<boolean>;
  // Allow reconciliation to update state
  applyTransformResult: (
    result: ReturnType<typeof transformAguiToTimelineSteps>,
    runId: string,
  ) => void;
  // Allow reconciliation to stop timer on run completion
  stopElapsedTimer: () => void;
  setElapsedTime: React.Dispatch<React.SetStateAction<number>>;
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
  const stoppedRef = useRef<boolean>(false);
  const lastEventTimeRef = useRef<number>(0);
  const gapFillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Mark streaming as stopped — flush current state and stop animations
  const markStopped = useCallback(() => {
    stoppedRef.current = true;

    if (import.meta.env.DEV) {
      console.log(
        "[useV2EventProcessor] Streaming marked as stopped - flushing immediately",
      );
    }

    // Find the active (non-finished) run's events
    let activeRunEvents: AguiEventWrapper[] | undefined;
    for (const [runId, events] of eventsRef.current) {
      if (!finishedRunsRef.current.has(runId)) {
        activeRunEvents = events;
        break;
      }
    }

    if (activeRunEvents && activeRunEvents.length > 0) {
      const {
        steps,
        finalResponse: response,
        researchResults: research,
        isDeepResearchRunning: deepResearchRunning,
        runErrorMessage: errorMsg,
      } = transformAguiToTimelineSteps(activeRunEvents);

      const actualElapsed = getElapsedTimeFromEvents(activeRunEvents);

      flushSync(() => {
        setTimelineSteps(steps);
        setIsThinking(false);
        setIsFinalResponseStreaming(false);
        setStoppedByUser(true);
        setFinalResponse(response);
        setResearchResults(research);
        setIsDeepResearchRunning(deepResearchRunning);
        setRunErrorMessage(errorMsg);
        if (actualElapsed > 0) {
          setElapsedTime(actualElapsed);
        }
      });
    } else {
      flushSync(() => {
        setIsThinking(false);
        setIsFinalResponseStreaming(false);
        setStoppedByUser(true);
        setRunErrorMessage("");
      });
    }

    stopElapsedTimer();
    onRunComplete?.();
  }, [stopElapsedTimer, onRunComplete]);

  // AGUI event handler
  const handleAguiEvent = useCallback(
    () => (data: string | AguiEventWrapper) => {
      try {
        const wrapper: AguiEventWrapper =
          typeof data === "string" ? JSON.parse(data) : data;
        const { run_id, sequence } = wrapper;
        const eventType = wrapper.event?.type;

        if (!conversationId || !run_id) return;

        const isTerminalEvent =
          eventType === "RUN_FINISHED" || eventType === "RUN_ERROR";

        // Ignore events for finished runs
        if (finishedRunsRef.current.has(run_id)) {
          if (import.meta.env.DEV) {
            console.log(
              "[useV2EventProcessor] Ignoring late event for finished run:",
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
            stoppedRef.current = false;
            flushSync(() => {
              setTimelineSteps([]);
              setFinalResponse("");
              setIsFinalResponseStreaming(false);
              setIsAwaitingApproval(false);
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

        // If stopped and not a terminal event, just accumulate without UI update
        if (stoppedRef.current && !isTerminalEvent) {
          if (import.meta.env.DEV) {
            console.log(
              "[useV2EventProcessor] Batching event (stopped):",
              eventType,
            );
          }
          return;
        }

        // Reset stopped state on terminal event
        if (isTerminalEvent && stoppedRef.current) {
          stoppedRef.current = false;
        }

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
          stoppedRef.current = false;

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
    [conversationId, startElapsedTimer, stopElapsedTimer, onRunComplete],
  );

  // Seed from initialRunEvents on mount (page refresh during active run).
  // If Pusher events already arrived before the backend fetch completed,
  // merge backend events into the existing set so no content is lost.
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

    const backendEvents = [...initialRunEvents].sort(
      (a, b) => a.sequence - b.sequence,
    );

    // Merge: backend events fill gaps, Pusher events win on same sequence
    const existingPusherEvents = eventsRef.current.get(runId);
    let mergedEvents: AguiEventWrapper[];

    if (existingPusherEvents && existingPusherEvents.length > 0) {
      const mergedMap = new Map<number, AguiEventWrapper>();
      for (const evt of backendEvents) {
        mergedMap.set(evt.sequence, evt);
      }
      // Pusher events overwrite backend for same sequence (fresher)
      for (const evt of existingPusherEvents) {
        mergedMap.set(evt.sequence, evt);
      }
      mergedEvents = Array.from(mergedMap.values()).sort(
        (a, b) => a.sequence - b.sequence,
      );
    } else {
      mergedEvents = backendEvents;
    }

    const result = transformAguiToTimelineSteps(mergedEvents);

    // Only seed for active runs (streaming or awaiting approval)
    if (!result.isThinking && !result.isAwaitingApproval) return;

    eventsRef.current.set(runId, mergedEvents);

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

    const elapsed = getElapsedTimeFromEvents(mergedEvents);
    if (elapsed > 0) {
      setElapsedTime(elapsed);
    }

    // Start timer if run is still active
    if (result.isThinking) {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
      elapsedTimerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    if (import.meta.env.DEV) {
      console.log(
        "[useV2EventProcessor] Seeded events for run:",
        runId,
        "count:",
        mergedEvents.length,
        existingPusherEvents
          ? `(merged ${backendEvents.length} backend + ${existingPusherEvents.length} Pusher)`
          : "(backend only)",
        "isThinking:",
        result.isThinking,
      );
    }

    // Detect sequence gaps between backend and Pusher events.
    // On page refresh, there's a window of events the backend hadn't persisted
    // when queried but Pusher also missed (client was disconnected).
    // Schedule a delayed re-fetch so the backend has time to persist them.
    if (existingPusherEvents && existingPusherEvents.length > 0) {
      const lastBackendSeq =
        backendEvents.length > 0
          ? backendEvents[backendEvents.length - 1].sequence
          : -1;
      const firstPusherSeq = Math.min(
        ...existingPusherEvents.map((e) => e.sequence),
      );

      if (firstPusherSeq > lastBackendSeq + 1) {
        if (import.meta.env.DEV) {
          console.log(
            "[useV2EventProcessor] Sequence gap detected:",
            `backend max=${lastBackendSeq}, pusher min=${firstPusherSeq},`,
            `gap=${firstPusherSeq - lastBackendSeq - 1} events — scheduling gap-fill`,
          );
        }

        const capturedRunId = runId;
        const capturedConversationId = conversationId;

        gapFillTimerRef.current = setTimeout(async () => {
          gapFillTimerRef.current = null;
          if (!capturedConversationId) return;
          if (finishedRunsRef.current.has(capturedRunId)) return;

          try {
            const response = await conversationsService.getConversationMessages(
              capturedConversationId,
              1,
              5,
            );

            // Find the most recent assistant message with events
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
            if (apiRunId !== capturedRunId) return;

            // Merge API events into current accumulated events
            // Existing events win on conflict (fresher from Pusher)
            const currentEvents = eventsRef.current.get(capturedRunId) || [];
            const mergeMap = new Map<number, AguiEventWrapper>();
            for (const evt of apiEvents) {
              mergeMap.set(evt.sequence, evt);
            }
            for (const evt of currentEvents) {
              mergeMap.set(evt.sequence, evt);
            }

            const filledEvents = Array.from(mergeMap.values()).sort(
              (a, b) => a.sequence - b.sequence,
            );

            // Only update if we actually added new events
            if (filledEvents.length <= currentEvents.length) return;

            eventsRef.current.set(capturedRunId, filledEvents);

            const gapResult = transformAguiToTimelineSteps(filledEvents);

            flushSync(() => {
              setTimelineSteps(gapResult.steps);
              setIsThinking(gapResult.isThinking);
              setFinalResponse(gapResult.finalResponse);
              setIsFinalResponseStreaming(gapResult.isFinalResponseStreaming);
              setIsAwaitingApproval(gapResult.isAwaitingApproval);
              setResearchResults(gapResult.researchResults);
              setIsDeepResearchRunning(gapResult.isDeepResearchRunning);
              setStoppedByUser(gapResult.stoppedByUser);
              setRunErrorMessage(gapResult.runErrorMessage);
            });

            if (import.meta.env.DEV) {
              console.log(
                "[useV2EventProcessor] Gap-fill complete:",
                `before=${currentEvents.length}, after=${filledEvents.length}`,
                `(+${filledEvents.length - currentEvents.length} events)`,
              );
            }
          } catch (err) {
            console.error(
              "[useV2EventProcessor] Gap-fill re-fetch failed:",
              err,
            );
          }
        }, 1500);
      }
    }
  }, [initialRunEvents]);

  // Bind/unbind AGUI events when channel changes
  useEffect(() => {
    if (!channel) return;

    const handler = handleAguiEvent();
    const handlers = AGUI_EVENTS.map((eventName) => ({
      eventName,
      handler,
    }));

    for (const { eventName, handler } of handlers) {
      channel.bind(eventName, handler);
    }

    return () => {
      for (const { eventName, handler } of handlers) {
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
    eventsRef,
    finishedRunsRef,
    lastEventTimeRef,
    stoppedRef,
    applyTransformResult,
    stopElapsedTimer,
    setElapsedTime,
  };
}
