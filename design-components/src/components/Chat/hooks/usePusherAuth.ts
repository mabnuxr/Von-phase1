import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import type { Channel } from 'pusher-js';

export interface PusherConfig {
  key: string;
  cluster: string;
  authEndpoint?: string;
  tenantId?: string;
  userId?: string;
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
 * @param conversationId - Conversation ID for channel naming
 * @param config - Pusher configuration (includes tenantId and userId for standardized channels)
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
    // Require conversationId, tenantId, and userId for standardized channel format
    if (!conversationId || !config.tenantId || !config.userId || !config.key) {
      // Clean up any existing connection when required params are missing
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

    // Build standardized channel name: private-vonlabs-chat-{tenant_id}-{user_id}-{conversation_id}
    const channelName = `private-vonlabs-chat-${config.tenantId}-${config.userId}-${conversationId}`;

    if (import.meta.env.DEV) {
      console.log(`[Pusher] Will subscribe to channel: ${channelName}`);
      console.log('[Pusher] Channel params:', {
        tenantId: config.tenantId,
        userId: config.userId,
        conversationId,
      });
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

      // Subscribe to conversation-specific private channel with standardized format
      // Channel name: private-vonlabs-chat-{tenant_id}-{user_id}-{conversation_uuid}
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
      if (channelRef.current && pusherRef.current) {
        const channelName = channelRef.current.name;
        console.log(`[Pusher] Unsubscribing from channel: ${channelName}`);
        pusherRef.current.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [
    conversationId,
    config.key,
    config.cluster,
    config.authEndpoint,
    config.tenantId,
    config.userId,
  ]);

  return {
    pusher: pusherRef.current,
    channel: channelRef.current,
    isConnected,
    error,
  };
}
