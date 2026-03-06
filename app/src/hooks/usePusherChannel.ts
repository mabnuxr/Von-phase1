/**
 * usePusherChannel - Shared Pusher connection and channel subscription
 *
 * Single-responsibility: manages ONE Pusher instance and ONE channel.
 * Both V1 and V2 containers use this hook (but only one is mounted at a time).
 *
 * Key design decisions:
 * - Uses Pusher `authorizer` function for dynamic auth tokens (reads fresh
 *   token on each channel auth request, fixing stale-token "session timed out").
 * - Returns channel ref so callers can bind/unbind their own events.
 * - Exposes pusherRef for reconciliation reconnect.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";
import type { Channel } from "pusher-js";

import { config as appConfig } from "../config";
import {
  PUSHER_ACTIVITY_TIMEOUT_S,
  PUSHER_PONG_TIMEOUT_S,
} from "../config/constants";
import { apiClient } from "../services/apiClient";

export interface UsePusherChannelConfig {
  conversationId: string | null;
  tenantId: string | undefined;
  userId: string | undefined;
}

export interface UsePusherChannelReturn {
  channel: Channel | null;
  isConnected: boolean;
  error: Error | null;
  pusherRef: React.MutableRefObject<Pusher | null>;
}

export function usePusherChannel(
  config: UsePusherChannelConfig,
): UsePusherChannelReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const connectionEventsBound = useRef(false);

  /** Unsubscribe from the current channel (if any). */
  const cleanupChannel = useCallback(() => {
    if (channelRef.current && pusherRef.current) {
      channelRef.current.unbind_all();
      pusherRef.current.unsubscribe(channelRef.current.name);
      channelRef.current = null;
    }
  }, []);

  /** Disconnect Pusher entirely (also cleans up channel first). */
  const cleanupPusher = useCallback(() => {
    cleanupChannel();
    if (pusherRef.current) {
      pusherRef.current.disconnect();
      pusherRef.current = null;
      connectionEventsBound.current = false;
    }
  }, [cleanupChannel]);

  useEffect(() => {
    if (!config.conversationId || !config.tenantId || !config.userId) {
      cleanupPusher();
      setIsConnected(false);
      return;
    }

    const channelName = `private-vonlabs-chat-${config.tenantId}-${config.userId}-${config.conversationId}`;

    try {
      // Create Pusher instance if needed
      if (!pusherRef.current) {
        const pusher = new Pusher(appConfig.pusherKey, {
          cluster: appConfig.pusherCluster,
          forceTLS: true,
          activityTimeout: PUSHER_ACTIVITY_TIMEOUT_S * 1000,
          pongTimeout: PUSHER_PONG_TIMEOUT_S * 1000,
          // Dynamic authorizer: uses HttpOnly cookies for auth.
          // Backend middleware reads access_token from cookie automatically.
          authorizer: (channel) => ({
            authorize: (socketId, callback) => {
              apiClient
                .postForm<{ auth: string; channel_data?: string }>(
                  "/api/v1/pusher/auth",
                  new URLSearchParams({
                    socket_id: socketId,
                    channel_name: channel.name,
                  }),
                )
                .then((data) => callback(null, data))
                .catch((err) => callback(err, null));
            },
          }),
        });

        pusherRef.current = pusher;
      }

      const pusher = pusherRef.current;

      // Bind connection events once per instance
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
            if (import.meta.env.DEV) {
              console.error("[usePusherChannel] Connection error:", err);
            }
            setError(
              new Error(err.error?.message || "Pusher connection error"),
            );
          },
        );

        if (import.meta.env.DEV) {
          pusher.connection.bind(
            "state_change",
            (states: { previous: string; current: string }) => {
              console.log(
                `[usePusherChannel] ${states.previous} -> ${states.current}`,
              );
            },
          );
        }

        connectionEventsBound.current = true;
      }

      // Unsubscribe from old channel if switching conversations
      if (channelRef.current && channelRef.current.name !== channelName) {
        cleanupChannel();
      }

      // Subscribe to new channel
      if (!channelRef.current) {
        const channel = pusher.subscribe(channelName);
        channelRef.current = channel;

        if (import.meta.env.DEV) {
          channel.bind("pusher:subscription_succeeded", () => {
            console.log(
              "[usePusherChannel] Subscription succeeded:",
              channelName,
            );
          });
        }

        channel.bind("pusher:subscription_error", (status: unknown) => {
          console.error("[usePusherChannel] Subscription failed:", status);
          setError(new Error(`Subscription failed: ${JSON.stringify(status)}`));
        });
      }
    } catch (err) {
      console.error("[usePusherChannel] Error initializing:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to initialize Pusher"),
      );
      setIsConnected(false);
    }

    return () => {
      cleanupChannel();
    };
  }, [
    config.conversationId,
    config.tenantId,
    config.userId,
    cleanupChannel,
    cleanupPusher,
  ]);

  // Full cleanup on unmount (container unmounts on conversation switch)
  useEffect(() => {
    return () => {
      cleanupPusher();
    };
  }, [cleanupPusher]);

  return {
    channel: channelRef.current,
    isConnected,
    error,
    pusherRef,
  };
}
