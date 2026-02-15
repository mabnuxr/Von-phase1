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
  PUSHER_ACTIVITY_TIMEOUT_S,
  PUSHER_PONG_TIMEOUT_S,
  RECONCILIATION_STALL_THRESHOLD_MS,
  RECONCILIATION_CHECK_INTERVAL_MS,
} from "../config/constants";
import { conversationsService } from "../services/conversationsService";
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
  /** Error message if the run failed */
  runErrorMessage: string;
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
  onReconcile?: () => void,
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
  const [runErrorMessage, setRunErrorMessage] = useState("");

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

  // Health monitoring: track when we last received an event (for stall detection)
  const lastEventTimeRef = useRef<number>(0);
  // Guard to prevent concurrent reconciliation calls
  const isReconcilingRef = useRef<boolean>(false);
  // Stable ref for the onReconcile callback (avoids effect dependency churn)
  const onReconcileRef = useRef(onReconcile);
  onReconcileRef.current = onReconcile;

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

  // Mark streaming as stopped - immediately flush accumulated events and stop animations.
  // Subsequent non-terminal events will be batched until the terminal event arrives.
  const markStopped = useCallback(() => {
    stoppedRef.current = true;

    if (import.meta.env.DEV) {
      console.log(
        "[useConversationPusherChannelV2] Streaming marked as stopped - flushing immediately",
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
      // Transform current accumulated events to get final state
      const {
        steps,
        finalResponse: response,
        researchResults: research,
        isDeepResearchRunning: deepResearchRunning,
        runErrorMessage: errorMsg,
      } = transformAguiToTimelineSteps(activeRunEvents);

      const actualElapsed = getElapsedTimeFromEvents(activeRunEvents);

      // Flush the complete state immediately — no more streaming animation
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
      // No active events yet — just stop the UI.
      // Clear runErrorMessage so a stale error from a prior failed run
      // doesn't propagate into this new run via transformConversationMessages.
      flushSync(() => {
        setIsThinking(false);
        setIsFinalResponseStreaming(false);
        setStoppedByUser(true);
        setRunErrorMessage("");
      });
    }

    stopElapsedTimer();
  }, [stopElapsedTimer]);

  // Reconcile state from the backend API when a stall is detected.
  // Fetches the latest events from MongoDB (authoritative source), merges with
  // local events, and re-transforms to recover from missed Pusher events.
  const reconcile = useCallback(async () => {
    if (!config.conversationId || isReconcilingRef.current) return;

    // Don't reconcile if user has stopped streaming
    if (stoppedRef.current) return;

    isReconcilingRef.current = true;

    console.log(
      "[useConversationPusherChannelV2] Stall detected — reconciling from backend API",
    );

    try {
      // Step 1: Force Pusher reconnect to recover from zombie connections.
      // Pusher auto-resubscribes to channels after reconnect.
      if (pusherRef.current) {
        console.log(
          "[useConversationPusherChannelV2] Forcing Pusher reconnect",
        );
        pusherRef.current.disconnect();
        pusherRef.current.connect();
      }

      // Step 2: Fetch latest messages from backend (authoritative source)
      const response = await conversationsService.getConversationMessages(
        config.conversationId,
        1,
        5,
      );

      // Step 3: Find the latest assistant message with events
      const latestAssistantMsg = response.data.find(
        (m) => m.role === "assistant" && m.events && m.events.length > 0,
      );

      if (
        !latestAssistantMsg?.events ||
        latestAssistantMsg.events.length === 0
      ) {
        console.log(
          "[useConversationPusherChannelV2] No events found in backend response",
        );
        return;
      }

      const apiEvents = latestAssistantMsg.events;
      const runId = apiEvents[0]?.run_id;
      if (!runId) return;

      // Don't reconcile for runs that are already finished
      if (finishedRunsRef.current.has(runId)) return;

      // Step 4: Merge local events with API events (union, deduplicated by run_id + sequence)
      const localEvents = eventsRef.current.get(runId) || [];
      const mergedMap = new Map<string, AguiEventWrapper>();

      // Add local events first
      for (const evt of localEvents) {
        mergedMap.set(`${evt.run_id}:${evt.sequence}`, evt);
      }
      // API events override (authoritative)
      for (const evt of apiEvents) {
        mergedMap.set(`${evt.run_id}:${evt.sequence}`, evt);
      }

      const mergedEvents = Array.from(mergedMap.values()).sort(
        (a, b) => a.sequence - b.sequence,
      );

      // Update eventsRef with merged events
      eventsRef.current.set(runId, mergedEvents);

      // Step 5: Re-transform to get current state
      const {
        steps,
        isThinking: thinking,
        finalResponse: response_,
        isFinalResponseStreaming: responseStreaming,
        isAwaitingApproval: awaitingApproval,
        researchResults: research,
        isDeepResearchRunning: deepResearchRunning,
        stoppedByUser: stopped,
        hadApprovalPause,
        runErrorMessage: errorMsg,
      } = transformAguiToTimelineSteps(mergedEvents);

      // Step 6: Update state
      flushSync(() => {
        setTimelineSteps(steps);
        setIsThinking(thinking);
        setCurrentRunId(runId);
        setFinalResponse(response_);
        setIsFinalResponseStreaming(responseStreaming);
        setIsAwaitingApproval(awaitingApproval);
        setResearchResults(research);
        setIsDeepResearchRunning(deepResearchRunning);
        setStoppedByUser(stopped);
        setRunErrorMessage(errorMsg);
      });

      // Step 7: Handle run completion from reconciled events
      const isTransitionalFinish = hadApprovalPause && !response_ && !stopped;
      if (
        !thinking &&
        !isTransitionalFinish &&
        !finishedRunsRef.current.has(runId)
      ) {
        finishedRunsRef.current.add(runId);
        stopElapsedTimer();
        stoppedRef.current = false;

        const actualElapsed = getElapsedTimeFromEvents(mergedEvents);
        if (actualElapsed > 0) {
          setElapsedTime(actualElapsed);
        }
      }

      // Reset stall timer so we don't immediately re-trigger
      lastEventTimeRef.current = Date.now();

      console.log(
        "[useConversationPusherChannelV2] Reconciliation complete — local:",
        localEvents.length,
        "API:",
        apiEvents.length,
        "merged:",
        mergedEvents.length,
        "isThinking:",
        thinking,
      );

      // Notify caller so chatStore can be synced with authoritative backend state
      onReconcileRef.current?.();
    } catch (err) {
      console.error(
        "[useConversationPusherChannelV2] Reconciliation failed:",
        err,
      );
      // Reset stall timer even on failure so next interval retries
      lastEventTimeRef.current = Date.now();
    } finally {
      isReconcilingRef.current = false;
    }
  }, [config.conversationId, stopElapsedTimer]);

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
          hadApprovalPause,
          runErrorMessage: errorMsg,
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
          setRunErrorMessage(errorMsg);
        });

        // Stop timer when final response starts streaming (before run fully completes)
        // This gives users immediate feedback that thinking is done
        if (responseStreaming && elapsedTimerRef.current) {
          stopElapsedTimer();
        }

        // Stop timer and update elapsed time when run finishes
        // We only do this once per run to avoid resetting the elapsed time
        // If the run went through an approval pause and hasn't produced a final
        // response yet, this is a transitional RUN_FINISHED after the approval
        // result — the agent will resume with new events on the same run_id.
        // Don't mark it as finished or subsequent events would be dropped.
        const isTransitionalFinish = hadApprovalPause && !response && !stopped;
        if (
          !thinking &&
          !isTransitionalFinish &&
          !finishedRunsRef.current.has(run_id)
        ) {
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
      setRunErrorMessage("");
      eventsRef.current.clear();
      finishedRunsRef.current.clear();
      stoppedRef.current = false;
      lastEventTimeRef.current = 0;
      isReconcilingRef.current = false;
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
      runErrorMessage: errorMsg,
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
    setRunErrorMessage(errorMsg);

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

  // Health check interval: detect stalled connections during active streaming.
  // Runs every RECONCILIATION_CHECK_INTERVAL_MS while isThinking is true.
  // If no events received for RECONCILIATION_STALL_THRESHOLD_MS, triggers reconciliation.
  useEffect(() => {
    if (!isThinking || !config.conversationId) return;

    const intervalId = setInterval(() => {
      // Skip if user has stopped streaming or we're already reconciling
      if (stoppedRef.current || isReconcilingRef.current) return;

      // Skip if we haven't received any events yet (lastEventTime = 0 means
      // the run just started via seeding and no Pusher events have arrived)
      if (lastEventTimeRef.current === 0) return;

      const timeSinceLastEvent = Date.now() - lastEventTimeRef.current;
      if (timeSinceLastEvent >= RECONCILIATION_STALL_THRESHOLD_MS) {
        console.log(
          "[useConversationPusherChannelV2] No events for",
          Math.round(timeSinceLastEvent / 1000),
          "seconds — triggering reconciliation",
        );
        reconcile();
      }
    }, RECONCILIATION_CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isThinking, config.conversationId, reconcile]);

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
          activityTimeout: PUSHER_ACTIVITY_TIMEOUT_S * 1000,
          pongTimeout: PUSHER_PONG_TIMEOUT_S * 1000,
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
    runErrorMessage,
    markStopped,
  };
}
