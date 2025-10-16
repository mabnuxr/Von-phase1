import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { usePusherAuth } from './hooks/usePusherAuth';
import { useMessageStream } from './hooks/useMessageStream';
import { sendMessage as apiSendMessage } from './utils/api';
import { saveConversation, loadConversation } from './utils/localStorage';

// Export types from types.ts
export type {
  Message,
  ChatSession,
  ChatUser,
  SourceReference,
  DashboardComponent,
  DashboardArtifact,
  PusherConfig,
  ApiEndpoints,
  FixedPosition,
  ChatProps,
} from './types';

import type { ChatProps, Message } from './types';

/**
 * Chat component with optional Pusher real-time integration
 *
 * Can be used in two modes:
 * 1. UI-only mode: Pass messages prop and handle onSendMessage callback
 * 2. Real-time mode: Set enableRealtime=true and provide userId, apiBaseUrl, pusherConfig
 */
export const Chat: React.FC<ChatProps> = ({
  title = 'Chat',
  userId,
  apiBaseUrl,
  pusherConfig,
  messages: controlledMessages,
  onSendMessage,
  onAddClick,
  onRefreshClick,
  onClose,
  onError,
  onPusherMessage,
  placeholder = 'Ask von anything',
  isLoading: controlledIsLoading = false,
  height = '600px',
  width = '400px',
  variant = 'floating',
  fixedPosition = { bottom: '24px', right: '24px' },
  enableRealtime = false,
  conversationId,
  loadMoreRef,
  isFetchingMore = false,
}) => {
  const isFixed = variant === 'fixed';
  const isFullPage = variant === 'fullpage';

  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Track last seen message ID for smart scrolling
  const lastSeenMessageIdRef = useRef<string | null>(null);

  // Internal state for real-time mode
  const [internalMessages, setInternalMessages] = useState<Message[]>([]);
  const [internalIsLoading, setInternalIsLoading] = useState(false);

  // Determine if we're in controlled or uncontrolled mode
  const isControlled = controlledMessages !== undefined;
  const messages = isControlled ? controlledMessages : internalMessages;
  const isLoading = isControlled ? controlledIsLoading : internalIsLoading;

  /**
   * Check if user is near the bottom of the scroll container
   * Used to determine if we should auto-scroll when new messages arrive
   */
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Consider "near bottom" if within 100px
    return distanceFromBottom < 100;
  }, []);

  // Pusher integration (only when enableRealtime is true)
  const { channel, error: pusherError } = usePusherAuth(
    enableRealtime && conversationId ? conversationId : null,
    enableRealtime && pusherConfig ? pusherConfig : { key: '', cluster: '' }
  );

  // Message streaming (only when channel is available)
  const { streamingMessages } = useMessageStream(enableRealtime ? channel : null, {
    onMessageReceived: (messageId, content, role) => {
      // Handle immediate complete messages (user messages after POST, or assistant non-streaming)
      const receivedMessage: Message = {
        id: messageId,
        type: role,
        content,
        isStreaming: false,
        timestamp: new Date(),
      };

      if (isControlled) {
        // In controlled mode, notify parent to add complete message
        onPusherMessage?.(receivedMessage);
      } else {
        // In uncontrolled mode, add to internal state
        setInternalMessages((prev) => [...prev, receivedMessage]);
      }
    },
    onMessageStart: (messageId) => {
      const newMessage: Message = {
        id: messageId,
        type: 'assistant',
        content: '',
        isStreaming: true,
        timestamp: new Date(),
      };

      if (isControlled) {
        // In controlled mode, notify parent to add message
        onPusherMessage?.(newMessage);
      } else {
        // In uncontrolled mode, update internal state
        setInternalMessages((prev) => [...prev, newMessage]);
      }
    },
    onMessageChunk: (messageId) => {
      const content = streamingMessages.get(messageId) || '';

      if (isControlled) {
        // In controlled mode, notify parent to update message
        onPusherMessage?.({
          id: messageId,
          type: 'assistant',
          content,
          isStreaming: true,
          timestamp: new Date(),
        });
      } else {
        // In uncontrolled mode, update internal state
        setInternalMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, content } : msg))
        );
      }
    },
    onMessageComplete: (messageId, fullContent) => {
      const completedMessage: Message = {
        id: messageId,
        type: 'assistant',
        content: fullContent,
        isStreaming: false,
        timestamp: new Date(),
      };

      if (isControlled) {
        // In controlled mode, notify parent of completed message
        onPusherMessage?.(completedMessage);
      } else {
        // In uncontrolled mode, update internal state
        setInternalMessages((prev) => {
          const updatedMessages = prev.map((msg) =>
            msg.id === messageId ? completedMessage : msg
          );

          // Save to localStorage
          if (conversationId && userId) {
            saveConversation(
              conversationId,
              {
                conversationId: conversationId,
                title: title,
                userId,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              updatedMessages
            );
          }

          return updatedMessages;
        });
      }
    },
    onError: (error) => {
      onError?.(error);
      if (!isControlled) {
        setInternalIsLoading(false);
      }
    },
  });

  // Load messages from localStorage on mount (real-time mode only)
  useEffect(() => {
    if (enableRealtime && conversationId && !isControlled) {
      const stored = loadConversation(conversationId);
      if (stored) {
        setInternalMessages(stored.messages);
      }
    }
  }, [conversationId, enableRealtime, isControlled]);

  // Handle Pusher errors
  useEffect(() => {
    if (pusherError) {
      onError?.(pusherError);
    }
  }, [pusherError, onError]);

  // Smart auto-scroll: Only scroll when appropriate using Message ID tracking
  useEffect(() => {
    if (messages.length === 0 || !messagesEndRef.current) return;

    const lastMessage = messages[messages.length - 1];
    const lastSeenId = lastSeenMessageIdRef.current;

    // Detect if this is a NEW message (not just a re-render or older message load)
    const isNewMessage = lastSeenId !== lastMessage.id;

    if (isNewMessage && !isFetchingMore) {
      // Determine if we should scroll:
      // 1. Always scroll for user's own messages (they just sent it)
      // 2. For assistant messages, only scroll if user is near bottom
      //    (don't interrupt if they're reading older messages)
      const shouldScroll = lastMessage.type === 'user' || isNearBottom();

      if (shouldScroll) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }

      // Update last seen message ID
      lastSeenMessageIdRef.current = lastMessage.id;
    }
  }, [messages, isFetchingMore, isNearBottom]);

  // Always scroll to bottom when conversation changes (switching conversations)
  useEffect(() => {
    if (conversationId && messages.length > 0 && messagesEndRef.current) {
      // Reset tracking for new conversation
      lastSeenMessageIdRef.current = null;

      // Capture last message ID outside timeout to avoid stale closure
      const lastMessageId = messages[messages.length - 1]?.id;

      // Use timeout to ensure DOM is fully updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });

        // Set initial last seen message ID
        if (lastMessageId) {
          lastSeenMessageIdRef.current = lastMessageId;
        }
      }, 100);
    }
  }, [conversationId, messages]);

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (isControlled) {
        // Controlled mode: just call the callback
        onSendMessage?.(content);
        return;
      }

      // Uncontrolled mode with real-time integration
      if (!enableRealtime || !apiBaseUrl || !conversationId || !userId) {
        onError?.(new Error('Real-time mode requires apiBaseUrl, conversationId, and userId'));
        return;
      }

      try {
        setInternalIsLoading(true);

        // Add user message optimistically
        const userMessage: Message = {
          id: `temp-${Date.now()}`,
          type: 'user',
          content,
          timestamp: new Date(),
        };

        setInternalMessages((prev) => [...prev, userMessage]);

        // Send to API
        const response = await apiSendMessage(apiBaseUrl, conversationId, content, userId);

        // Update with real ID from server
        setInternalMessages((prev) =>
          prev.map((msg) => (msg.id === userMessage.id ? { ...msg, id: response.id } : msg))
        );

        // Save to localStorage
        saveConversation(
          conversationId,
          {
            conversationId: conversationId,
            title,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          [...messages, { ...userMessage, id: response.id }]
        );
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Failed to send message'));
        setInternalIsLoading(false);
      }
    },
    [
      isControlled,
      onSendMessage,
      enableRealtime,
      apiBaseUrl,
      conversationId,
      userId,
      title,
      messages,
      onError,
    ]
  );

  // Generate container class names based on variant
  const containerClassName = [
    'flex',
    'flex-col',
    'overflow-hidden',
    'bg-white',
    'antialiased',
    'font-sf',
    isFullPage
      ? 'w-screen h-screen rounded-none border-none'
      : `rounded-2xl border border-gray-200`,
    isFixed && 'fixed z-[1000] shadow-[0_8px_24px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.08)]',
    !isFixed && !isFullPage && 'shadow-[0_4px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]',
    isFullPage && 'fixed inset-0 z-[999]',
  ]
    .filter(Boolean)
    .join(' ');

  // Inline styles only for dynamic width/height and fixedPosition
  const containerStyles: React.CSSProperties = {
    ...(!isFullPage && width && { width }),
    ...(!isFullPage && height && { height }),
    ...(isFixed && fixedPosition),
  };

  return (
    <div className={containerClassName} style={containerStyles}>
      <ChatHeader
        title={title}
        onAddClick={onAddClick}
        onRefreshClick={onRefreshClick}
        onClose={onClose}
        showClose={isFixed || isFullPage}
      />

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-white chat-messages-wrapper"
      >
        {/* Loading indicator for older messages (infinite scroll) */}
        <AnimatePresence>
          {isFetchingMore && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center py-3 text-xs text-gray-500 font-sf"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                ⟳
              </motion.div>{' '}
              Loading older messages...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Infinite scroll trigger at TOP (for loading older messages) */}
        {loadMoreRef && <div ref={loadMoreRef} className="h-px" />}

        {/* Messages or Empty State */}
        <AnimatePresence mode="wait">
          {messages.length === 0 ? (
            <ChatEmptyState
              key="empty-state"
              onPromptClick={(prompt) => {
                handleSendMessage(prompt);
              }}
            />
          ) : (
            <motion.div
              key={conversationId || 'messages'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.2,
                    ease: 'easeOut',
                  }}
                  layout
                >
                  <ChatMessage
                    type={message.type}
                    content={message.content}
                    timestamp={message.timestamp}
                    activeTab={message.activeTab}
                    isLoading={message.isStreaming}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator for new message - Enhanced typing indicator */}
        <AnimatePresence>{isLoading && <ChatTypingIndicator />}</AnimatePresence>

        {/* Invisible div for auto-scroll to bottom */}
        <div ref={messagesEndRef} className="h-px" />
      </div>

      <ChatInput placeholder={placeholder} onSend={handleSendMessage} />
    </div>
  );
};

export default Chat;
