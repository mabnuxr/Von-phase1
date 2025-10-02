import React, { useState, useEffect, useCallback } from 'react';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { spacing, fontFamily, fontSize, semanticColors } from '../../theme';
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
  placeholder = 'Ask von anything',
  isLoading: controlledIsLoading = false,
  height = '600px',
  width = '400px',
  variant = 'floating',
  fixedPosition = { bottom: '24px', right: '24px' },
  enableRealtime = false,
  conversationId,
}) => {
  const isFixed = variant === 'fixed';
  const isFullPage = variant === 'fullpage';

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

  // Message streaming (only when channel is available)
  const { streamingMessages } = useMessageStream(enableRealtime ? channel : null, {
    onMessageStart: (messageId) => {
      if (!isControlled) {
        setInternalMessages((prev) => [
          ...prev,
          {
            id: messageId,
            type: 'assistant',
            content: '',
            isStreaming: true,
            timestamp: new Date(),
          },
        ]);
      }
    },
    onMessageChunk: (messageId) => {
      if (!isControlled) {
        setInternalMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, content: streamingMessages.get(messageId) || '' } : msg
          )
        );
      }
    },
    onMessageComplete: (messageId, fullContent) => {
      if (!isControlled) {
        setInternalMessages((prev) => {
          const updatedMessages = prev.map((msg) =>
            msg.id === messageId ? { ...msg, content: fullContent, isStreaming: false } : msg
          );

          // Save to localStorage
          if (conversationId && userId) {
            saveConversation(
              conversationId,
              {
                id: conversationId,
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
            id: conversationId,
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

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: isFullPage ? '100vw' : width,
    height: isFullPage ? '100vh' : height,
    backgroundColor: semanticColors.background.primary,
    borderRadius: isFullPage ? '0' : '16px',
    border: isFullPage ? 'none' : `1px solid ${semanticColors.border.default}`,
    overflow: 'hidden',
    boxShadow: isFixed
      ? '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)'
      : isFullPage
        ? 'none'
        : '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
    fontFamily: fontFamily.text,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    ...(isFixed && {
      position: 'fixed',
      zIndex: 1000,
      ...fixedPosition,
    }),
    ...(isFullPage && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
    }),
  };

  const messagesContainerStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: spacing[5],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
    backgroundColor: semanticColors.background.primary,
  };

  return (
    <div style={containerStyles}>
      <ChatHeader
        title={title}
        onAddClick={onAddClick}
        onRefreshClick={onRefreshClick}
        onClose={onClose}
        showClose={isFixed || isFullPage}
      />

      <div style={messagesContainerStyles}>
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: semanticColors.text.tertiary,
              padding: spacing[6],
              fontSize: fontSize.sm.size,
              lineHeight: fontSize.sm.lineHeight,
            }}
          >
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              type={message.type}
              content={message.content}
              timestamp={message.timestamp}
              activeTab={message.activeTab}
              isLoading={message.isStreaming}
            />
          ))
        )}
        {isLoading && <ChatMessage type="assistant" content="Thinking..." isLoading />}
      </div>

      <ChatInput placeholder={placeholder} onSend={handleSendMessage} />
    </div>
  );
};

export default Chat;
