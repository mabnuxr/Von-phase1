import React, { useState } from 'react';
import { ChatBubble } from '../ChatBubble';
import { DocumentCard } from '../DocumentCard';
import { TabSwitcher, type TabSwitcherTab } from '../TabSwitcher';
import { ChatInput } from '../Chat/ChatInput';
import { colors, spacing } from '../../theme';

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  showTabs?: boolean;
  activeTab?: string;
  documents?: Array<{
    id: string;
    title: string;
    timestamp?: string;
  }>;
  showAvatar?: boolean;
}

export interface ChatConversationProps {
  /**
   * Question/title at the top of the conversation
   */
  question?: string;

  /**
   * List of messages in the conversation
   */
  messages?: ConversationMessage[];

  /**
   * Callback when a message is sent
   */
  onSend?: (message: string) => void;

  /**
   * Callback when Ask button is clicked
   */
  onAsk?: (message: string) => void;

  /**
   * Callback when Build button is clicked
   */
  onBuild?: () => void;

  /**
   * Context tag for the input (e.g., "@Forecast Q3")
   */
  contextTag?: string;

  /**
   * Show action buttons in input
   * @default true
   */
  showActionButtons?: boolean;

  /**
   * Placeholder for input
   * @default 'Ask von anything'
   */
  placeholder?: string;

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * ChatConversation - Full chat conversation view
 *
 * Complete chat interface with question header, messages, and input area.
 * Supports user/assistant messages, tab switchers, and document cards.
 *
 * @example
 * ```tsx
 * <ChatConversation
 *   question="How much will I win this quarter?"
 *   messages={[
 *     { id: '1', type: 'assistant', content: 'Sure! I have built...' },
 *     { id: '2', type: 'user', content: 'Show my pipeline', showAvatar: true }
 *   ]}
 *   onSend={(msg) => console.log(msg)}
 *   contextTag="@Forecast Q3"
 * />
 * ```
 */
export const ChatConversation: React.FC<ChatConversationProps> = ({
  question,
  messages = [],
  onSend,
  onAsk,
  onBuild,
  contextTag,
  showActionButtons = true,
  placeholder = 'Ask von anything',
  className,
}) => {
  const [activeTabIds, setActiveTabIds] = useState<Record<string, string>>({});

  const defaultTabs: TabSwitcherTab[] = [
    {
      id: 'output',
      label: 'Output',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
          <path d="M3 9h18" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 'sources',
      label: 'Sources',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeWidth="2" />
          <path d="M14 2v6h6" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 'thought',
      label: 'Thought',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" strokeWidth="2" />
        </svg>
      ),
    },
  ];

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#FFFFFF',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  };

  const headerStyles: React.CSSProperties = {
    padding: '12px 20px',
    borderBottom: `1px solid rgba(0,0,0,0.08)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const questionStyles: React.CSSProperties = {
    fontSize: '17px',
    fontWeight: 600,
    color: '#1d1d1f',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
    margin: 0,
    letterSpacing: '-0.02em',
  };

  const iconButtonStyles: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.neutral[600],
    transition: 'background-color 0.15s ease',
  };

  const messagesContainerStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  const messageGroupStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const handleTabChange = (messageId: string, tabId: string) => {
    setActiveTabIds((prev) => ({
      ...prev,
      [messageId]: tabId,
    }));
  };

  return (
    <div className={className} style={containerStyles}>
      {/* Header with Question */}
      {question && (
        <div style={headerStyles}>
          <h2 style={questionStyles}>{question}</h2>
          <div style={{ display: 'flex', gap: spacing[2] }}>
            <button
              style={iconButtonStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.neutral[100];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Add"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              style={iconButtonStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.neutral[100];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Refresh"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div style={messagesContainerStyles}>
        {messages.map((message) => {
          const activeTab = activeTabIds[message.id] || message.activeTab || 'output';

          return (
            <div key={message.id} style={messageGroupStyles}>
              {/* Tab Switcher (for assistant messages) */}
              {message.type === 'assistant' && message.showTabs && (
                <TabSwitcher
                  tabs={defaultTabs}
                  activeTabId={activeTab}
                  onTabClick={(tabId) => handleTabChange(message.id, tabId)}
                />
              )}

              {/* Message Bubble */}
              <ChatBubble
                type={message.type}
                content={message.content}
                showAvatar={message.showAvatar}
              />

              {/* Document Cards (for assistant messages) */}
              {message.type === 'assistant' &&
                message.documents &&
                message.documents.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {message.documents.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        title={doc.title}
                        timestamp={doc.timestamp}
                        onClick={() => console.log('Open document:', doc.id)}
                      />
                    ))}
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <ChatInput
        placeholder={placeholder}
        onSend={onSend}
        onAsk={onAsk}
        onBuild={onBuild}
        contextTag={contextTag}
        showActionButtons={showActionButtons}
      />
    </div>
  );
};

export default ChatConversation;
