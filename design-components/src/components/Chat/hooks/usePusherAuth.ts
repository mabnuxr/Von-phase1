import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import type { Channel } from 'pusher-js';

export interface PusherConfig {
  key: string;
  cluster: string;
  authEndpoint?: string;
  forceTLS?: boolean;
}

export interface UsePusherAuthReturn {
  pusher: Pusher | null;
  channel: Channel | null;
  isConnected: boolean;
  error: Error | null;
}

/**
 * Hook for managing Pusher connection, authentication, and channel subscription
 *
 * @param conversationId - Unique conversation ID for the channel
 * @param config - Pusher configuration
 * @returns Pusher client, channel, connection status, and any errors
 */
export function usePusherAuth(
  conversationId: string | null,
  config: PusherConfig
): UsePusherAuthReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!conversationId || !config.key) {
      return;
    }

    try {
      // Initialize Pusher client
      const pusher = new Pusher(config.key, {
        cluster: config.cluster,
        authEndpoint: config.authEndpoint,
        forceTLS: config.forceTLS ?? true,
      });

      pusherRef.current = pusher;

      // Handle connection state changes
      pusher.connection.bind('connected', () => {
        setIsConnected(true);
        setError(null);
      });

      pusher.connection.bind('disconnected', () => {
        setIsConnected(false);
      });

      pusher.connection.bind('error', (err: { error?: { message?: string } }) => {
        setError(new Error(err.error?.message || 'Pusher connection error'));
      });

      // Subscribe to conversation-specific private channel
      const channelName = `private-chat-session-${conversationId}`;
      const channel = pusher.subscribe(channelName);

      channelRef.current = channel;

      // Handle subscription success
      channel.bind('pusher:subscription_succeeded', () => {
        console.log(`Successfully subscribed to ${channelName}`);
      });

      // Handle subscription error
      channel.bind('pusher:subscription_error', (status: number | string) => {
        setError(new Error(`Subscription failed with status: ${status}`));
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize Pusher'));
    }

    // Cleanup on unmount or when conversationId changes
    return () => {
      if (channelRef.current) {
        pusherRef.current?.unsubscribe(channelRef.current.name);
        channelRef.current = null;
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      setIsConnected(false);
    };
  }, [conversationId, config.key, config.cluster, config.authEndpoint, config.forceTLS]);

  return {
    pusher: pusherRef.current,
    channel: channelRef.current,
    isConnected,
    error,
  };
}
