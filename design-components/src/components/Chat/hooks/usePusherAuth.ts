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

  // Store previous config to detect actual changes
  const prevConfigRef = useRef<PusherConfig | null>(null);

  useEffect(() => {
    // Require conversationId, tenantId, and userId for standardized channel format
    if (!conversationId || !config.tenantId || !config.userId || !config.key) {
      if (import.meta.env.DEV) {
        console.log('[usePusherAuth] Missing required config:', {
          hasConversationId: !!conversationId,
          hasTenantId: !!config.tenantId,
          hasUserId: !!config.userId,
          hasKey: !!config.key,
        });
      }
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

    // Check if config actually changed (deep comparison of relevant fields)
    const configChanged =
      !prevConfigRef.current ||
      prevConfigRef.current.key !== config.key ||
      prevConfigRef.current.cluster !== config.cluster ||
      prevConfigRef.current.authEndpoint !== config.authEndpoint ||
      prevConfigRef.current.tenantId !== config.tenantId ||
      prevConfigRef.current.userId !== config.userId;

    // Store current config
    prevConfigRef.current = config;

    // Build standardized channel name: private-vonlabs-chat-{tenant_id}-{user_id}-{conversation_id}
    const channelName = `private-vonlabs-chat-${config.tenantId}-${config.userId}-${conversationId}`;

    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem('access_token');

      // Validate token exists before proceeding
      if (!accessToken || accessToken.trim() === '') {
        console.warn('[usePusherAuth] No access token available - cannot authenticate Pusher');
        setError(new Error('No access token available'));
        return;
      }

      if (import.meta.env.DEV) {
        console.log('[Pusher] Auth config:', {
          authEndpoint: config.authEndpoint,
          hasToken: !!accessToken,
          tokenLength: accessToken?.length,
        });
      }

      // Reuse existing Pusher instance if config hasn't changed
      let pusher = pusherRef.current;

      if (!pusher || configChanged) {
        console.log('[PUSHER] Creating new Pusher instance');

        // Disconnect old instance if it exists
        if (pusher) {
          pusher.disconnect();
        }

        // Initialize Pusher client with debug logging
        pusher = new Pusher(config.key, {
          cluster: config.cluster,
          authEndpoint: config.authEndpoint,
          forceTLS: true,
          // Add Authorization header to auth requests
          auth: {
            headers: {
              Authorization: `Bearer ${accessToken.trim()}`,
            },
          },
        });

        // Enable Pusher logging in development
        if (
          typeof window !== 'undefined' &&
          (window as Window & { localStorage?: Storage }).localStorage?.getItem('debug') ===
            'pusher'
        ) {
          Pusher.logToConsole = true;
        }

        pusherRef.current = pusher;
      } else {
        console.log('[PUSHER] Reusing existing Pusher instance');
      }

      // Only bind connection events if this is a new Pusher instance
      if (!pusherRef.current || configChanged) {
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
      }

      // Unsubscribe from old channel if switching conversations
      if (channelRef.current && channelRef.current.name !== channelName) {
        console.log(`[PUSHER] Switching from ${channelRef.current.name} to ${channelName}`);
        pusher.unsubscribe(channelRef.current.name);
        channelRef.current = null;
      }

      // Subscribe to conversation-specific private channel if not already subscribed
      if (!channelRef.current) {
        console.log(`[PUSHER] Subscribing to channel: ${channelName}`);
        const channel = pusher.subscribe(channelName);
        channelRef.current = channel;

        // Handle subscription success
        channel.bind('pusher:subscription_succeeded', () => {
          console.log(`[PUSHER] ✅ Successfully subscribed to ${channelName}`);
        });

        // Handle subscription error
        channel.bind('pusher:subscription_error', (status: unknown) => {
          console.error(`[PUSHER] ❌ Subscription failed:`, status);
          setError(new Error(`Subscription failed: ${JSON.stringify(status)}`));
        });
      } else {
        console.log(`[PUSHER] Already subscribed to ${channelName}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize Pusher'));
    }

    // Cleanup on unmount or when conversationId changes
    return () => {
      if (channelRef.current && pusherRef.current) {
        const channelName = channelRef.current.name;
        console.log(`[PUSHER] Cleanup: Unsubscribing from channel: ${channelName}`);
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
  ]); // FIX: Use primitive values only to prevent infinite reconnection loops

  return {
    pusher: pusherRef.current,
    channel: channelRef.current,
    isConnected,
    error,
  };
}
