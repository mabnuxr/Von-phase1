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

          // New run started — reset stopped state and clear old state
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

  // Seed from initialRunEvents on mount (page refresh during active run)
  useEffect(() => {
    if (!initialRunEvents || initialRunEvents.length === 0) return;

    const runId = initialRunEvents[0]?.run_id;
    if (!runId) return;

    // Don't overwrite if Pusher events already populated this run
    if (eventsRef.current.has(runId)) return;

    const seededEvents = [...initialRunEvents].sort(
      (a, b) => a.sequence - b.sequence,
    );
    const result = transformAguiToTimelineSteps(seededEvents);

    // Only seed for active runs (streaming or awaiting approval)
    if (!result.isThinking && !result.isAwaitingApproval) return;

    eventsRef.current.set(runId, seededEvents);

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

    const elapsed = getElapsedTimeFromEvents(seededEvents);
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
        seededEvents.length,
        "isThinking:",
        result.isThinking,
      );
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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopElapsedTimer();
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
  };
}
