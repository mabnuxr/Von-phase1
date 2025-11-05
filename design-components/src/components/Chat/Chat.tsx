import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { usePusherAuth } from './hooks/usePusherAuth';
import { useAguiMessageStream } from './hooks/useAguiMessageStream';
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

import type { ChatProps, Message, ToolCall, StepMessage } from './types';

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
  userName,
  userEmail,
  apiBaseUrl,
  pusherConfig,
  messages: controlledMessages,
  onSendMessage,
  onAddClick: _onAddClick, // eslint-disable-line @typescript-eslint/no-unused-vars
  onRefreshClick: _onRefreshClick, // eslint-disable-line @typescript-eslint/no-unused-vars
  onClose: _onClose, // eslint-disable-line @typescript-eslint/no-unused-vars
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
  showMessagesFromIndex = 0,
  useArtifactHook,
}) => {
  const isFixed = variant === 'fixed';
  const isFullPage = variant === 'fullpage';

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const shouldAutoScrollRef = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    // ChatGPT-style scroll: scroll to absolute bottom
    const container = containerRef.current;
    if (!container) return;

    const targetScroll = container.scrollHeight - container.clientHeight;

    if (behavior === 'smooth') {
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    } else {
      container.scrollTop = targetScroll;
    }
  }, []);

  // Internal state for real-time mode
  const [internalMessages, setInternalMessages] = useState<Message[]>([]);
  const [internalIsLoading, setInternalIsLoading] = useState(false);

  // Determine if we're in controlled or uncontrolled mode
  const isControlled = controlledMessages !== undefined;
  const messages = isControlled ? controlledMessages : internalMessages;
  const isLoading = isControlled ? controlledIsLoading : internalIsLoading;

  // Pusher integration (only when enableRealtime is true)
  const { channel, error: pusherError } = usePusherAuth(
    enableRealtime && conversationId ? conversationId : null,
    enableRealtime && pusherConfig ? pusherConfig : { key: '', cluster: '' }
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      // Within 50px of bottom → enable auto-scroll (ChatGPT uses tighter threshold)
      shouldAutoScrollRef.current = distanceFromBottom < 100;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom when new messages arrive or content updates
  useEffect(() => {
    if (messages.length === 0) return;

    const isStreaming = messages.some((m) => m.isStreaming);

    // Always scroll to bottom when new messages are added or streaming, unless user has scrolled up
    if (shouldAutoScrollRef.current) {
      // Use smooth scroll for new messages, instant for streaming updates (ChatGPT style)
      scrollToBottom(isStreaming ? 'smooth' : 'smooth');
    }
  }, [messages, scrollToBottom]);

  // Message streaming (only when channel is available)
  const { streamingMessages, streamingToolCalls, streamingStepMessages } = useAguiMessageStream(
    enableRealtime ? channel : null,
    {
      onMessageReceived: (messageId: string, content: string, role: 'user' | 'assistant') => {
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
      onMessageStart: (messageId: string) => {
        const newMessage: Message = {
          id: messageId,
          type: 'assistant',
          content: '',
          isStreaming: true,
          isReasoningStreaming: true, // Show thinking block immediately
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
      onMessageChunk: (messageId: string) => {
        const content = streamingMessages.get(messageId) || '';
        const toolCalls = streamingToolCalls.get(messageId) || [];
        const stepMessages = streamingStepMessages.get(messageId) || [];

        if (isControlled) {
          // In controlled mode, notify parent to update message
          onPusherMessage?.({
            id: messageId,
            type: 'assistant',
            content,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            stepMessages: stepMessages.length > 0 ? stepMessages : undefined,
            isStreaming: true,
            timestamp: new Date(),
          });
        } else {
          // In uncontrolled mode, update internal state
          setInternalMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    content,
                    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                    stepMessages: stepMessages.length > 0 ? stepMessages : undefined,
                  }
                : msg
            )
          );
        }
      },
      onMessageComplete: (
        messageId: string,
        fullContent: string,
        toolCalls?: ToolCall[],
        stepMessages?: StepMessage[]
      ) => {
        const completedMessage: Message = {
          id: messageId,
          type: 'assistant',
          content: fullContent,
          toolCalls,
          stepMessages,
          isStreaming: false,
          status: 'completed',
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
      onError: (error: Error) => {
        onError?.(error);
        if (!isControlled) {
          setInternalIsLoading(false);
        }
      },
    }
  );

  // Load messages from localStorage on mount (real-time mode only)
  useEffect(() => {
    if (enableRealtime && conversationId && !isControlled) {
      const stored = loadConversation(conversationId);
      if (stored) {
        setInternalMessages(stored.messages);

        // Scroll to bottom after loading messages
        setTimeout(() => {
          scrollToBottom('auto');
        }, 100);
      }
    }
  }, [conversationId, enableRealtime, isControlled, scrollToBottom]);

  // Handle Pusher errors
  useEffect(() => {
    if (pusherError) {
      onError?.(pusherError);
    }
  }, [pusherError, onError]);

  // Determine effective showFromIndex (use prop)
  const effectiveShowFromIndex = showMessagesFromIndex || 0;

  // FIX: Memoize visible messages to avoid O(N) filtering on every render
  const visibleMessages = useMemo(() => {
    return messages
      .map((message, index) => ({
        ...message,
        // Mark messages before showMessagesFromIndex as compressed
        isCompressed: index < effectiveShowFromIndex,
        originalIndex: index,
      }))
      .filter((message) => {
        // Hide empty assistant messages when typing indicator is showing
        if (
          isLoading &&
          message.type === 'assistant' &&
          !message.content &&
          !message.reasoningContent
        ) {
          return false;
        }
        return true;
      });
  }, [messages, isLoading, effectiveShowFromIndex]);

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

        // Force scroll to bottom when user sends a message
        setTimeout(() => {
          scrollToBottom('smooth');
        }, 50);

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
      scrollToBottom,
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
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto flex flex-col bg-white chat-messages-wrapper"
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
        {messages.length === 0 ? (
          <ChatEmptyState
            onPromptClick={(prompt) => {
              handleSendMessage(prompt);
            }}
          />
        ) : (
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {visibleMessages.map((message) => (
                <motion.div
                  key={message.id}
                  layout={false}
                  initial={false}
                  animate={false}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeInOut',
                  }}
                  className="mb-4"
                >
                  <ChatMessage
                    type={message.type}
                    content={message.content}
                    reasoningContent={message.reasoningContent}
                    timestamp={message.timestamp}
                    activeTab={message.activeTab}
                    isLoading={false}
                    isStreaming={message.isStreaming}
                    isReasoningStreaming={message.isReasoningStreaming}
                    toolCalls={message.toolCalls}
                    stepMessages={message.stepMessages}
                    userName={userName}
                    userEmail={userEmail}
                    status={message.status}
                    errorMessage={message.errorMessage}
                    messageId={message.messageId || message.id}
                    conversationId={message.conversationId || conversationId}
                    useArtifactHook={useArtifactHook}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Loading indicator for new message */}
        <AnimatePresence>{isLoading && <ChatTypingIndicator />}</AnimatePresence>

        {/* Invisible div for auto-scroll to bottom */}
        <div ref={messagesEndRef} className="h-px" />
      </div>

      <ChatInput
        placeholder={placeholder}
        onSend={handleSendMessage}
        disabled={
          isLoading || messages.some((m) => m.type === 'assistant' && m.isStreaming === true)
        }
        isStreaming={messages.some((m) => m.type === 'assistant' && m.isStreaming === true)}
      />
    </div>
  );
};

export default Chat;
