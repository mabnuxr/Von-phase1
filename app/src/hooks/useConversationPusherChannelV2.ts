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
} from "../utils/transformAguiToTimelineSteps";

// ============================================================================
// DEBUG: Event logging for verification (REMOVE BEFORE PUSHING TO PRODUCTION)
// ============================================================================
interface V2PusherEventLog {
  timestamp: string;
  eventName: string;
  data: AguiEventWrapper;
}

// Extend window type for debug logs
declare global {
  interface Window {
    __v2PusherEventLogs?: V2PusherEventLog[];
    __v2PusherDownloadLogs?: () => void;
  }
}

// Initialize debug log storage and download helper
if (typeof window !== "undefined") {
  window.__v2PusherEventLogs = window.__v2PusherEventLogs || [];
  window.__v2PusherDownloadLogs = () => {
    const logs = window.__v2PusherEventLogs || [];
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `v2-pusher-events-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log(`[V2 Pusher Debug] Downloaded ${logs.length} events`);
  };
}

function logV2Event(eventName: string, data: AguiEventWrapper) {
  const logEntry: V2PusherEventLog = {
    timestamp: new Date().toISOString(),
    eventName,
    data,
  };
  console.log("[V2 Pusher Event]", eventName, logEntry);
  if (typeof window !== "undefined" && window.__v2PusherEventLogs) {
    window.__v2PusherEventLogs.push(logEntry);
  }
}
// ============================================================================
// END DEBUG SECTION
// ============================================================================

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

  // Process AGUI event and transform to timeline steps
  const handleAguiEvent = useCallback(
    (eventName: string) => (data: string | AguiEventWrapper) => {
      try {
        const wrapper: AguiEventWrapper =
          typeof data === "string" ? JSON.parse(data) : data;
        const { run_id, sequence, event } = wrapper;

        // DEBUG: Log every event
        logV2Event(eventName, wrapper);

        if (!config.conversationId || !run_id) return;

        // Ignore events for runs that have already finished
        if (finishedRunsRef.current.has(run_id)) {
          console.log(
            "[V2 Pusher] Ignoring event for finished run:",
            run_id,
            event.type,
          );
          return;
        }

        // Get or create events array for this run
        let runEvents = eventsRef.current.get(run_id);
        if (!runEvents) {
          runEvents = [];
          eventsRef.current.set(run_id, runEvents);

          // New run started
          setCurrentRunId(run_id);
          startElapsedTimer();
          console.log("[V2 Pusher] New run started:", run_id);
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
        const { steps, isThinking: thinking } =
          transformAguiToTimelineSteps(runEvents);

        // Update state with flushSync for smooth streaming
        flushSync(() => {
          setTimelineSteps(steps);
          setIsThinking(thinking);
        });

        // Mark run as finished and stop timer
        if (!thinking) {
          finishedRunsRef.current.add(run_id);
          stopElapsedTimer();
          // Update elapsed time from actual events
          const actualElapsed = getElapsedTimeFromEvents(runEvents);
          if (actualElapsed > 0) {
            setElapsedTime(actualElapsed);
          }
          console.log(
            "[V2 Pusher] Run finished, total events:",
            runEvents.length,
          );
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
      eventsRef.current.clear();
      finishedRunsRef.current.clear();
      stopElapsedTimer();
      console.log("[V2 Pusher] Conversation changed, state reset");
    }
  }, [config.conversationId, stopElapsedTimer]);

  // Pusher connection management
  useEffect(() => {
    if (!config.conversationId || !config.tenantId || !config.userId) {
      console.log("[V2 Pusher] Missing required config:", {
        conversationId: !!config.conversationId,
        tenantId: !!config.tenantId,
        userId: !!config.userId,
      });

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

        console.log("[V2 Pusher] Creating new Pusher instance");
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
            console.log("[V2 Pusher] Connected to Pusher");
            setIsConnected(true);
            setError(null);
          });

          pusher.connection.bind("disconnected", () => {
            console.log("[V2 Pusher] Disconnected from Pusher");
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
        console.log("[V2 Pusher] Unsubscribing from old channel:", channelRef.current.name);
        pusher.unsubscribe(channelRef.current.name);
        channelRef.current = null;
      }

      // Subscribe to channel
      if (!channelRef.current) {
        console.log("[V2 Pusher] Subscribing to channel:", channelName);
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
  };
}
