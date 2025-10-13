import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import type { Channel } from 'pusher-js';

export interface PusherConfig {
  key: string;
  cluster: string;
  authEndpoint?: string;
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
      // Clean up any existing connection when conversationId becomes null
      if (channelRef.current) {
        pusherRef.current?.unsubscribe(channelRef.current.name);
        channelRef.current = null;
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem('access_token');

      // Initialize Pusher client with debug logging
      const pusher = new Pusher(config.key, {
        cluster: config.cluster,
        authEndpoint: config.authEndpoint,
        forceTLS: true,
        // Add Authorization header to auth requests
        auth: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });

      // Enable Pusher logging in development
      if (
        typeof window !== 'undefined' &&
        (window as Window & { localStorage?: Storage }).localStorage?.getItem('debug') === 'pusher'
      ) {
        Pusher.logToConsole = true;
      }

      pusherRef.current = pusher;

      if (import.meta.env.DEV) {
        console.log(`[Pusher] Initializing channel: private-${conversationId}`);
      }

      // Handle connection state changes
      pusher.connection.bind('connected', () => {
        setIsConnected(true);
        setError(null);
      });

      pusher.connection.bind('disconnected', () => {
        setIsConnected(false);
      });

      pusher.connection.bind('error', (err: { error?: { message?: string } }) => {
        if (import.meta.env.DEV) {
          console.error('[Pusher] Connection error:', err);
        }
        setError(new Error(err.error?.message || 'Pusher connection error'));
      });

      pusher.connection.bind('state_change', (states: { previous: string; current: string }) => {
        if (import.meta.env.DEV) {
          console.log(`[Pusher] ${states.previous} -> ${states.current}`);
        }
      });

      // Subscribe to conversation-specific private channel
      // conversationId is the UUID from the database (e.g., "550e8400-e29b-41d4-a716-446655440000")
      // Channel name becomes "private-{conversationId}"
      const channelName = `private-${conversationId}`;
      const channel = pusher.subscribe(channelName);

      channelRef.current = channel;

      // Handle subscription success
      channel.bind('pusher:subscription_succeeded', () => {
        if (import.meta.env.DEV) {
          console.log(`[Pusher] Subscribed to ${channelName}`);
        }
      });

      // Handle subscription error
      channel.bind('pusher:subscription_error', (status: unknown) => {
        if (import.meta.env.DEV) {
          console.error(`[Pusher] Subscription failed:`, status);
        }
        setError(new Error(`Subscription failed: ${JSON.stringify(status)}`));
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
  }, [conversationId, config.key, config.cluster, config.authEndpoint]);

  return {
    pusher: pusherRef.current,
    channel: channelRef.current,
    isConnected,
    error,
  };
}
