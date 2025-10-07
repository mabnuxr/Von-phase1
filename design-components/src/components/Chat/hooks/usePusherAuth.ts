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
      if (typeof window !== 'undefined' && (window as any).localStorage?.getItem('debug') === 'pusher') {
        Pusher.logToConsole = true;
      }

      pusherRef.current = pusher;

      console.log(`[Pusher] Initializing with channel: private-${conversationId}`);
      console.log(`[Pusher] Auth endpoint:`, config.authEndpoint);
      console.log(`[Pusher] Has access token:`, !!accessToken);

      // Handle connection state changes
      pusher.connection.bind('connected', () => {
        console.log('[Pusher] Connected to Pusher');
        setIsConnected(true);
        setError(null);
      });

      pusher.connection.bind('disconnected', () => {
        console.log('[Pusher] Disconnected from Pusher');
        setIsConnected(false);
      });

      pusher.connection.bind('error', (err: { error?: { message?: string } }) => {
        console.error('[Pusher] Connection error:', err);
        setError(new Error(err.error?.message || 'Pusher connection error'));
      });

      pusher.connection.bind('state_change', (states: { previous: string; current: string }) => {
        console.log(`[Pusher] State changed: ${states.previous} -> ${states.current}`);
      });

      // Subscribe to conversation-specific private channel
      // conversationId should be the full channel name (e.g., vonlabs-chat-{tenant_id}-{user_id}-{uuid})
      const channelName = `private-${conversationId}`;
      console.log(`[Pusher] Subscribing to channel: ${channelName}`);

      const channel = pusher.subscribe(channelName);

      channelRef.current = channel;

      // Handle subscription success
      channel.bind('pusher:subscription_succeeded', () => {
        console.log(`[Pusher] ✓ Successfully subscribed to ${channelName}`);
      });

      // Handle subscription error
      channel.bind('pusher:subscription_error', (status: any) => {
        console.error(`[Pusher] ✗ Subscription failed:`, status);
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
