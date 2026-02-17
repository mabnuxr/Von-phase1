import { useEffect, useRef, useState } from "react";
import Pusher, { type Channel } from "pusher-js";
import { getAccessToken } from "../lib/auth";
import { config as appConfig } from "../config";

interface UseUserPusherChannelConfig {
  tenantId?: string;
  userId?: string;
}

interface UseUserPusherChannelReturn {
  channel: Channel | null;
  isConnected: boolean;
  error: Error | null;
}

/**
 * Hook for managing user-level Pusher channel subscription
 *
 * Similar to usePusherAuth but for user-level events (not conversation-specific).
 * Channel format: private-vonlabs-user-{tenantId}-{userId}
 *
 * @param config - Configuration with tenantId and userId (MongoDB ObjectIds)
 * @returns Channel instance, connection status, and any errors
 */
export function useUserPusherChannel(
  config: UseUserPusherChannelConfig,
): UseUserPusherChannelReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    // Require tenantId and userId
    if (!config.tenantId || !config.userId) {
      if (import.meta.env.DEV) {
        console.log("[useUserPusherChannel] Missing tenantId or userId");
      }
      return;
    }

    const pusherKey = import.meta.env.VITE_PUSHER_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      if (import.meta.env.DEV) {
        console.warn("[useUserPusherChannel] Missing Pusher configuration");
      }
      return;
    }

    // Build user channel name
    const channelName = `private-vonlabs-user-${config.tenantId}-${config.userId}`;

    try {
      // Initialize Pusher with dynamic authorizer (reads fresh token on each
      // auth request, fixing stale-token issues after token refresh)
      const pusher = new Pusher(pusherKey, {
        cluster: pusherCluster,
        forceTLS: true,
        authorizer: (channel) => ({
          authorize: (socketId, callback) => {
            const token = getAccessToken();
            if (!token || token.trim() === "") {
              callback(new Error("No access token available"), null);
              return;
            }

            fetch(`${appConfig.apiBaseUrl}/api/v1/pusher/auth`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Bearer ${token.trim()}`,
              },
              body: new URLSearchParams({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            })
              .then((res) => {
                if (!res.ok) {
                  throw new Error(
                    `Pusher auth failed: ${res.status} ${res.statusText}`,
                  );
                }
                return res.json();
              })
              .then((data) => {
                callback(null, data);
              })
              .catch((err) => {
                callback(err, null);
              });
          },
        }),
      });

      pusherRef.current = pusher;

      // Handle connection events
      pusher.connection.bind("connected", () => {
        if (import.meta.env.DEV) {
          console.log("[useUserPusherChannel] Connected to Pusher");
        }
        setIsConnected(true);
        setError(null);
      });

      pusher.connection.bind("disconnected", () => {
        if (import.meta.env.DEV) {
          console.log("[useUserPusherChannel] Disconnected from Pusher");
        }
        setIsConnected(false);
      });

      pusher.connection.bind(
        "error",
        (err: { error?: { message?: string } }) => {
          if (import.meta.env.DEV) {
            console.error("[useUserPusherChannel] Connection error:", err);
          }
          setError(new Error(err.error?.message || "Pusher connection error"));
        },
      );

      // Subscribe to user channel
      if (import.meta.env.DEV) {
        console.log(
          "[useUserPusherChannel] Subscribing to channel:",
          channelName,
        );
      }

      const subscribedChannel = pusher.subscribe(channelName);
      setChannel(subscribedChannel);

      // Handle subscription error
      subscribedChannel.bind("pusher:subscription_error", (status: unknown) => {
        console.error("[useUserPusherChannel] Subscription failed:", status);
        setError(new Error(`Subscription failed: ${JSON.stringify(status)}`));
      });
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to initialize Pusher"),
      );
    }

    // Cleanup
    return () => {
      setChannel(null);
      if (pusherRef.current) {
        pusherRef.current.unsubscribe(channelName);
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [config.tenantId, config.userId]);

  return {
    channel,
    isConnected,
    error,
  };
}
