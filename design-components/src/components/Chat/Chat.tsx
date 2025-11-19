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
import { AUTO_SCROLL_THRESHOLD_PX, SCROLL_LOCK_DURATION_MS } from '../../constants';

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
  userName,
  userEmail,
  apiBaseUrl,
  pusherConfig,
  messages: controlledMessages,
  onSendMessage,
  onError,
  onAguiStateUpdate,
  onUserMessage,
  onStopStreaming,
  inputValue: externalInputValue,
  onInputValueChange,
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
  banner,
  disableSubmit = false,
  examplePromptsDisabled = false,
  onExamplePromptDisabledClick,
  onInputWhileDisabled,
}) => {
  const isFixed = variant === 'fixed';
  const isFullPage = variant === 'fullpage';

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Input value state - use external control if provided, otherwise internal
  const [internalInputValue, setInternalInputValue] = useState('');
  const isInputControlled = externalInputValue !== undefined;
  const inputValue = isInputControlled ? externalInputValue : internalInputValue;
  const setInputValue = isInputControlled
    ? onInputValueChange || (() => {})
    : setInternalInputValue;

  const shouldAutoScrollRef = useRef(true);
  const scrollOnNewUserMessage = useRef(false);

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
      if (scrollOnNewUserMessage.current) return;

      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      // Within threshold distance of bottom → enable auto-scroll
      shouldAutoScrollRef.current = distanceFromBottom < AUTO_SCROLL_THRESHOLD_PX;
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

  // Get current streaming messages for initialization (refresh recovery)
  const currentStreamingMessages = useMemo(() => {
    const streaming = messages.filter((m) => m.isStreaming || m.status === 'streaming');
    return streaming.length > 0 ? [streaming[streaming.length - 1]] : [];
  }, [messages]);

  // Message streaming (only when channel is available)
  // Pass onAguiStateUpdate to hook for direct AGUI state updates
  // Pass onUserMessage to hook for user message events
  // Pass currentStreamingMessages for initialization after refresh
  useAguiMessageStream(
    enableRealtime ? channel : null,
    onAguiStateUpdate,
    onUserMessage,
    currentStreamingMessages
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

  // Handle stop streaming
  const handleStop = useCallback(() => {
    if (conversationId && onStopStreaming) {
      onStopStreaming(conversationId);
    }
  }, [conversationId, onStopStreaming]);

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (isControlled) {
        //Scroll to the bottom before calling onSendMessage
        shouldAutoScrollRef.current = true;
        scrollOnNewUserMessage.current = true;

        setTimeout(() => {
          scrollOnNewUserMessage.current = false;
        }, SCROLL_LOCK_DURATION_MS);

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
            disabled={examplePromptsDisabled}
            onDisabledClick={onExamplePromptDisabledClick}
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
                    stoppedByUser={message.stoppedByUser}
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

      {/* Banner above input (if provided) */}
      {banner && <div className="px-3">{banner}</div>}

      <ChatInput
        placeholder={placeholder}
        onSend={handleSendMessage}
        onStop={handleStop}
        disabled={
          isLoading || messages.some((m) => m.type === 'assistant' && m.isStreaming === true)
        }
        isStreaming={messages.some((m) => m.type === 'assistant' && m.isStreaming === true)}
        disableSubmit={disableSubmit}
        value={inputValue}
        onChange={setInputValue}
        onDisabledInput={onInputWhileDisabled}
      />
    </div>
  );
};

export default Chat;
