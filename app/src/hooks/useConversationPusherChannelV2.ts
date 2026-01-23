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
  ResearchResultsMetadata,
} from "@vonlabs/design-components";

import { config as appConfig } from "../config";
import {
  transformAguiToTimelineSteps,
  getElapsedTimeFromEvents,
} from "../utils/transformAguiToTimelineSteps";

export interface UseConversationPusherChannelV2Config {
  conversationId: string | null;
  tenantId: string | undefined;
  userId: string | undefined;
}

/**
 * Research results state for Deep Research workflow
 */
export interface ResearchResultsState {
  /** Whether research results are currently streaming */
  isStreaming: boolean;
  /** Whether research results have completed */
  isCompleted: boolean;
  /** Accumulated research results content (markdown) */
  content: string;
  /** Metadata from RESEARCH_RESULTS_START event */
  metadata: ResearchResultsMetadata | null;
  /** Message ID for the research results */
  messageId: string | null;
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
}

/**
 * V2 Pusher hook that transforms AGUI events to TimelineStep[] format
 */
export function useConversationPusherChannelV2(
  config: UseConversationPusherChannelV2Config,
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

  // Handle research results events separately (they use different event structure)
  const handleResearchResultsEvent = useCallback(
    (eventName: string) => (data: string | Record<string, unknown>) => {
      try {
        const wrapper = typeof data === "string" ? JSON.parse(data) : data;
        const event = wrapper.event || wrapper;

        switch (event.type) {
          case "RESEARCH_RESULTS_START": {
            console.log(
              "[V2 Pusher] Research results started:",
              event.message_id,
            );
            flushSync(() => {
              setResearchResults({
                isStreaming: true,
                isCompleted: false,
                content: "",
                metadata: event.metadata || null,
                messageId: event.message_id,
              });
            });
            break;
          }
          case "RESEARCH_RESULTS_CONTENT": {
            flushSync(() => {
              setResearchResults((prev) => ({
                ...prev,
                content: event.snapshot || prev.content + (event.delta || ""),
              }));
            });
            break;
          }
          case "RESEARCH_RESULTS_END": {
            console.log(
              "[V2 Pusher] Research results completed:",
              event.message_id,
              "length:",
              event.total_length,
            );
            flushSync(() => {
              setResearchResults((prev) => ({
                ...prev,
                isStreaming: false,
                isCompleted: true,
              }));
              // If this was a long-running research, mark it as complete
              setIsDeepResearchRunning(false);
            });
            break;
          }
        }
      } catch (error) {
        console.error(
          "[V2 Pusher] Error handling research results event:",
          eventName,
          error,
        );
      }
    },
    [],
  );

  // Process AGUI event and transform to timeline steps
  const handleAguiEvent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_eventName: string) => (data: string | AguiEventWrapper) => {
      try {
        const wrapper: AguiEventWrapper =
          typeof data === "string" ? JSON.parse(data) : data;
        const { run_id, sequence } = wrapper;

        if (!config.conversationId || !run_id) return;

        // Get or create events array for this run
        let runEvents = eventsRef.current.get(run_id);
        if (!runEvents) {
          runEvents = [];
          eventsRef.current.set(run_id, runEvents);

          // New run started
          setCurrentRunId(run_id);
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

        // Transform to timeline steps
        const {
          steps,
          isThinking: thinking,
          finalResponse: response,
          isFinalResponseStreaming: responseStreaming,
          isAwaitingApproval: awaitingApproval,
        } = transformAguiToTimelineSteps(runEvents);

        // Update state with flushSync for smooth streaming
        flushSync(() => {
          setTimelineSteps(steps);
          setIsThinking(thinking);
          setFinalResponse(response);
          setIsFinalResponseStreaming(responseStreaming);
          setIsAwaitingApproval(awaitingApproval);
        });

        // Stop timer and update elapsed time when run finishes
        // We only do this once per run to avoid resetting the elapsed time
        if (!thinking && !finishedRunsRef.current.has(run_id)) {
          finishedRunsRef.current.add(run_id);
          stopElapsedTimer();

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
      eventsRef.current.clear();
      finishedRunsRef.current.clear();
      stopElapsedTimer();
    }
  }, [config.conversationId, stopElapsedTimer]);

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
        ];

        events.forEach((eventName) => {
          channel.bind(eventName, handleAguiEvent(eventName));
        });

        // Bind to research results events (Deep Research workflow)
        const researchResultsEvents = [
          "agent.research_results_start",
          "agent.research_results_content",
          "agent.research_results_end",
        ];

        researchResultsEvents.forEach((eventName) => {
          channel.bind(eventName, handleResearchResultsEvent(eventName));
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
  }, [config, handleAguiEvent, handleResearchResultsEvent, stopElapsedTimer]);

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
  };
}
