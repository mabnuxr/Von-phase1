/**
 * useConversationPusherChannelV2 - V2 Pusher hook for TimelineThinkingProcess
 *
 * This is a separate v2 implementation that transforms AGUI events into
 * TimelineStep[] format for the new thinking process visualization.
 *
 * Key differences from v1:
 * - Outputs TimelineStep[] instead of stepMessages/toolCalls
 * - Manages elapsed time with interval timer
 * - Completely separate for easy retirement of v1 later
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Pusher from "pusher-js";
import type { Channel } from "pusher-js";
import type {
  AguiEventWrapper,
  TimelineStep,
} from "@vonlabs/design-components";

import { config as appConfig } from "../config";
import {
  transformAguiToTimelineSteps,
  getElapsedTimeFromEvents,
  type ResearchResultsState,
} from "../utils/transformAguiToTimelineSteps";

export interface UseConversationPusherChannelV2Config {
  conversationId: string | null;
  tenantId: string | undefined;
  userId: string | undefined;
}

export interface UseConversationPusherChannelV2Return {
  isConnected: boolean;
  error: Error | null;
  channel: Channel | null;
  timelineSteps: TimelineStep[];
  isThinking: boolean;
  elapsedTime: number;
  currentRunId: string | null;
  /** Final response content (separated from reasoning) */
  finalResponse: string;
  /** Whether final response is still streaming */
  isFinalResponseStreaming: boolean;
  /** Whether we're waiting for user approval (intermediate state between runs) */
  isAwaitingApproval: boolean;
  /** Research results state for Deep Research workflow */
  researchResults: ResearchResultsState;
  /** Whether a long-running deep research is in progress (user can leave) */
  isDeepResearchRunning: boolean;
  /** Whether the response was stopped by the user */
  stoppedByUser: boolean;
  /** Mark streaming as stopped - events will be batched and flushed on completion */
  markStopped: () => void;
}

/**
 * V2 Pusher hook that transforms AGUI events to TimelineStep[] format
 *
 * @param config - Channel configuration (conversationId, tenantId, userId)
 * @param initialRunEvents - Events from the latest streaming message (seeds eventsRef after page refresh
 *   so that post-approval Pusher events append to existing state instead of starting a new run)
 */
export function useConversationPusherChannelV2(
  config: UseConversationPusherChannelV2Config,
  initialRunEvents?: AguiEventWrapper[],
): UseConversationPusherChannelV2Return {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [finalResponse, setFinalResponse] = useState("");
  const [isFinalResponseStreaming, setIsFinalResponseStreaming] =
    useState(false);
  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);

  // Research results state for Deep Research workflow
  const [researchResults, setResearchResults] = useState<ResearchResultsState>({
    isStreaming: false,
    isCompleted: false,
    content: "",
    metadata: null,
    messageId: null,
  });
  const [isDeepResearchRunning, setIsDeepResearchRunning] = useState(false);
  const [stoppedByUser, setStoppedByUser] = useState(false);

  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const prevConfigRef = useRef<UseConversationPusherChannelV2Config | null>(
    null,
  );
  const connectionEventsBound = useRef(false);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Event accumulator for the current run
  const eventsRef = useRef<Map<string, AguiEventWrapper[]>>(new Map());

  // Track finished runs to ignore late-arriving events
  const finishedRunsRef = useRef<Set<string>>(new Set());

  // Track if user has stopped streaming - events will be batched until terminal event
  const stoppedRef = useRef<boolean>(false);

  // Mark streaming as stopped - events will accumulate without UI updates until completion
  const markStopped = useCallback(() => {
    stoppedRef.current = true;
    if (import.meta.env.DEV) {
      console.log(
        "[useConversationPusherChannelV2] Streaming marked as stopped - batching remaining events",
      );
    }
  }, []);

  // Start elapsed time timer
  const startElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
    }

    setElapsedTime(0);

    elapsedTimerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }, []);

  // Stop elapsed time timer
  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  // Process AGUI event and transform to timeline steps
  const handleAguiEvent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_eventName: string) => (data: string | AguiEventWrapper) => {
      try {
        const wrapper: AguiEventWrapper =
          typeof data === "string" ? JSON.parse(data) : data;
        const { run_id, sequence } = wrapper;
        const eventType = wrapper.event?.type;

        if (!config.conversationId || !run_id) return;

        // Check if this is a terminal event (run finished or error)
        const isTerminalEvent =
          eventType === "RUN_FINISHED" || eventType === "RUN_ERROR";

        // Ignore events for runs that have already finished
        // This handles out-of-order events from the backend
        if (finishedRunsRef.current.has(run_id)) {
          if (import.meta.env.DEV) {
            console.log(
              "[useConversationPusherChannelV2] Ignoring late event for finished run:",
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

          // New run started - reset stopped state and clear old state
          stoppedRef.current = false;
          flushSync(() => {
            setTimelineSteps([]);
            setFinalResponse("");
            setIsFinalResponseStreaming(false);
            setIsAwaitingApproval(false);
            setCurrentRunId(run_id);
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

        // If stopped and not a terminal event, just accumulate without UI update
        // This batches all remaining events until the run completes
        if (stoppedRef.current && !isTerminalEvent) {
          if (import.meta.env.DEV) {
            console.log(
              "[useConversationPusherChannelV2] Batching event (stopped):",
              eventType,
            );
          }
          return;
        }

        // Reset stopped state on terminal event (regardless of thinking state)
        // This ensures stopped state doesn't leak into approval flow or new runs
        if (isTerminalEvent && stoppedRef.current) {
          stoppedRef.current = false;
          if (import.meta.env.DEV) {
            console.log(
              "[useConversationPusherChannelV2] Reset stopped state on terminal event",
            );
          }
        }

        // Transform to timeline steps
        const {
          steps,
          isThinking: thinking,
          finalResponse: response,
          isFinalResponseStreaming: responseStreaming,
          isAwaitingApproval: awaitingApproval,
          researchResults: research,
          isDeepResearchRunning: deepResearchRunning,
          stoppedByUser: stopped,
        } = transformAguiToTimelineSteps(runEvents);

        // Update state with flushSync for smooth streaming
        // When stopped + terminal event, this flushes all batched events at once
        flushSync(() => {
          setTimelineSteps(steps);
          setIsThinking(thinking);
          setFinalResponse(response);
          setIsFinalResponseStreaming(responseStreaming);
          setIsAwaitingApproval(awaitingApproval);
          setResearchResults(research);
          setIsDeepResearchRunning(deepResearchRunning);
          setStoppedByUser(stopped);
        });

        // Stop timer and update elapsed time when run finishes
        // We only do this once per run to avoid resetting the elapsed time
        if (!thinking && !finishedRunsRef.current.has(run_id)) {
          // Mark the run as finished so late events for this run_id are ignored.
          // Approval pauses are handled by transformAguiToTimelineSteps (hasPendingApproval
          // keeps isThinking=true), so it's safe to always record completion here.
          finishedRunsRef.current.add(run_id);

          stopElapsedTimer();

          // Reset stopped state on completion
          stoppedRef.current = false;

          // Update elapsed time from actual events
          const actualElapsed = getElapsedTimeFromEvents(runEvents);
          if (actualElapsed > 0) {
            setElapsedTime(actualElapsed);
          }
        }
      } catch (error) {
        console.error(
          "[useConversationPusherChannelV2] Error handling event:",
          error,
        );
      }
    },
    [config.conversationId, startElapsedTimer, stopElapsedTimer],
  );

  // Reset state when conversation changes
  useEffect(() => {
    if (config.conversationId) {
      setTimelineSteps([]);
      setIsThinking(false);
      setElapsedTime(0);
      setCurrentRunId(null);
      setFinalResponse("");
      setIsFinalResponseStreaming(false);
      setIsAwaitingApproval(false);
      setResearchResults({
        isStreaming: false,
        isCompleted: false,
        content: "",
        metadata: null,
        messageId: null,
      });
      setIsDeepResearchRunning(false);
      setStoppedByUser(false);
      eventsRef.current.clear();
      finishedRunsRef.current.clear();
      stoppedRef.current = false;
      stopElapsedTimer();
    }
  }, [config.conversationId, stopElapsedTimer]);

  // Seed eventsRef with backend events after page refresh during an active run.
  // Without this, post-approval Pusher events for the same run_id would be treated
  // as a new run (clearing all timeline steps) because eventsRef is empty after mount.
  useEffect(() => {
    if (!initialRunEvents || initialRunEvents.length === 0) return;

    const runId = initialRunEvents[0]?.run_id;
    if (!runId) return;

    // Don't overwrite if Pusher events already populated this run
    if (eventsRef.current.has(runId)) return;

    // Compute state from the events BEFORE seeding to check if the run is still active.
    // We only seed for active runs (streaming or awaiting approval). Completed runs don't
    // need seeding — their data is already rendered via the persisted-events path in
    // transformMessagesForV2. Seeding completed runs would pollute V2 state with stale
    // data that incorrectly overrides the next run's messages.
    const seededEvents = [...initialRunEvents].sort(
      (a, b) => a.sequence - b.sequence,
    );
    const {
      steps,
      isThinking: thinking,
      finalResponse: response,
      isFinalResponseStreaming: responseStreaming,
      isAwaitingApproval: awaitingApproval,
      researchResults: research,
      isDeepResearchRunning: deepResearchRunning,
      stoppedByUser: stopped,
    } = transformAguiToTimelineSteps(seededEvents);

    // Skip seeding for fully completed runs
    if (!thinking && !awaitingApproval) return;

    eventsRef.current.set(runId, seededEvents);

    setTimelineSteps(steps);
    setIsThinking(thinking);
    setCurrentRunId(runId);
    setFinalResponse(response);
    setIsFinalResponseStreaming(responseStreaming);
    setIsAwaitingApproval(awaitingApproval);
    setResearchResults(research);
    setIsDeepResearchRunning(deepResearchRunning);
    setStoppedByUser(stopped);

    // Set elapsed time from actual event timestamps
    const elapsed = getElapsedTimeFromEvents(seededEvents);
    if (elapsed > 0) {
      setElapsedTime(elapsed);
    }

    // If the run is still active (e.g. awaiting approval), start the timer
    // so it continues ticking from the computed elapsed value
    if (thinking) {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
      elapsedTimerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    if (import.meta.env.DEV) {
      console.log(
        "[useConversationPusherChannelV2] Seeded events for run:",
        runId,
        "count:",
        seededEvents.length,
        "isThinking:",
        thinking,
        "isAwaitingApproval:",
        awaitingApproval,
      );
    }
  }, [initialRunEvents]);

  // Pusher connection management
  useEffect(() => {
    if (!config.conversationId || !config.tenantId || !config.userId) {
      // Clean up
      if (channelRef.current && pusherRef.current) {
        pusherRef.current.unsubscribe(channelRef.current.name);
        channelRef.current = null;
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      setIsConnected(false);
      stopElapsedTimer();
      return;
    }

    // Check if config changed
    const configChanged =
      !prevConfigRef.current ||
      prevConfigRef.current.tenantId !== config.tenantId ||
      prevConfigRef.current.userId !== config.userId;

    prevConfigRef.current = config;

    // Build channel name (same as v1)
    const channelName = `private-vonlabs-chat-${config.tenantId}-${config.userId}-${config.conversationId}`;

    try {
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken || accessToken.trim() === "") {
        console.warn(
          "[useConversationPusherChannelV2] No access token available",
        );
        setError(new Error("No access token available"));
        return;
      }

      // Reuse or create Pusher instance
      let pusher = pusherRef.current;

      if (!pusher || configChanged) {
        if (pusher) {
          pusher.disconnect();
          connectionEventsBound.current = false;
        }

        pusher = new Pusher(appConfig.pusherKey, {
          cluster: appConfig.pusherCluster,
          authEndpoint: appConfig.pusherAuthEndpoint,
          forceTLS: true,
          auth: {
            headers: {
              Authorization: `Bearer ${accessToken.trim()}`,
            },
          },
        });

        // Bind connection events
        if (!connectionEventsBound.current) {
          pusher.connection.bind("connected", () => {
            setIsConnected(true);
            setError(null);
          });

          pusher.connection.bind("disconnected", () => {
            setIsConnected(false);
          });

          pusher.connection.bind(
            "error",
            (err: { error?: { message?: string } }) => {
              console.error("[V2 Pusher] Connection error:", err);
              setError(
                new Error(err.error?.message || "Pusher connection error"),
              );
            },
          );

          connectionEventsBound.current = true;
        }

        pusherRef.current = pusher;
      }

      // Unsubscribe from old channel if switching
      if (channelRef.current && channelRef.current.name !== channelName) {
        pusher.unsubscribe(channelRef.current.name);
        channelRef.current = null;
      }

      // Subscribe to channel
      if (!channelRef.current) {
        const channel = pusher.subscribe(channelName);
        channelRef.current = channel;

        // DEBUG: Log subscription success
        channel.bind("pusher:subscription_succeeded", () => {
          console.log("[V2 Pusher] ✅ Subscription succeeded:", channelName);
        });

        // Bind to AGUI events (with event name passed for logging)
        const events = [
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
          // Research results events (Deep Research workflow)
          "agent.research_results_start",
          "agent.research_results_content",
          "agent.research_results_end",
        ];

        events.forEach((eventName) => {
          channel.bind(eventName, handleAguiEvent(eventName));
        });

        // Handle subscription error
        channel.bind("pusher:subscription_error", (status: unknown) => {
          console.error("[V2 Pusher] ❌ Subscription failed:", status);
          setError(new Error(`Subscription failed: ${JSON.stringify(status)}`));
        });
      }
    } catch (err) {
      console.error("[V2 Pusher] Error initializing:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to initialize Pusher"),
      );
    }

    // Cleanup
    return () => {
      if (channelRef.current && pusherRef.current) {
        channelRef.current.unbind_all();
        pusherRef.current.unsubscribe(channelRef.current.name);
        channelRef.current = null;
      }
      stopElapsedTimer();
    };
  }, [config, handleAguiEvent, stopElapsedTimer]);

  return {
    isConnected,
    error,
    channel: channelRef.current,
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
    markStopped,
  };
}
