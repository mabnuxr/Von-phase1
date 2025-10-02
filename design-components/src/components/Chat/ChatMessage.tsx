import React, { useState } from 'react';
import { colors, spacing, fontFamily, fontSize, fontWeight, semanticColors } from '../../theme';

export interface ChatMessageProps {
  /**
   * Type of message
   */
  type: 'user' | 'assistant';

  /**
   * Message content
   */
  content: string;

  /**
   * Timestamp of the message
   */
  timestamp?: Date;

  /**
   * Whether the message is in a loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * Active tab for assistant messages
   * @default 'output'
   */
  activeTab?: 'output' | 'sources' | 'thought';
}

/**
 * Individual chat message component
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content,
  timestamp,
  isLoading = false,
  activeTab: initialActiveTab = 'output',
}) => {
  const isUser = type === 'user';
  const [activeTab, setActiveTab] = useState<'output' | 'sources' | 'thought'>(initialActiveTab);

  const messageContainerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    width: '100%',
  };

  const messageBubbleStyles: React.CSSProperties = {
    maxWidth: '85%',
    borderRadius: '16px', // More Apple-like rounded corners
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    wordWrap: 'break-word',
    fontFamily: fontFamily.text,
    backgroundColor: isUser ? colors.primary[50] : semanticColors.background.primary, // Subtle light blue for user
    color: isUser ? colors.primary[700] : semanticColors.text.primary, // Dark blue text for user messages
    border: `1px solid ${isUser ? colors.primary[100] : semanticColors.border.default}`,
    boxShadow: isUser ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)', // Subtle shadow for assistant messages
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    overflow: 'hidden',
  };

  const messageContentStyles: React.CSSProperties = {
    padding: `${spacing[3]} ${spacing[4]}`, // More generous padding
  };

  const tabsContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[4],
    padding: `${spacing[2]} ${spacing[4]}`,
    borderBottom: `1px solid ${semanticColors.border.default}`,
    backgroundColor: 'transparent', // Clean transparent background
  };

  const tabStyles = (isActive: boolean): React.CSSProperties => ({
    fontSize: fontSize.xs.size,
    lineHeight: fontSize.xs.lineHeight,
    fontWeight: isActive ? fontWeight.semibold : fontWeight.medium,
    color: isActive ? semanticColors.text.primary : semanticColors.text.secondary,
    cursor: 'pointer',
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: '6px',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)', // Snappier transition
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: isActive ? semanticColors.background.secondary : 'transparent',
  });

  const timestampStyles: React.CSSProperties = {
    fontSize: fontSize.xs.size,
    lineHeight: fontSize.xs.lineHeight,
    color: semanticColors.text.tertiary,
    marginTop: spacing[1],
    textAlign: isUser ? 'right' : 'left',
    fontFamily: fontFamily.text,
  };

  const loadingContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[1],
    alignItems: 'center',
    justifyContent: 'flex-start',
  };

  const dotStyles = (delay: number): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: semanticColors.text.secondary,
    animation: `bounce 1.4s ease-in-out ${delay}s infinite`,
  });

  return (
    <div>
      <div style={messageContainerStyles}>
        <div style={messageBubbleStyles}>
          {!isUser && !isLoading && (
            <div style={tabsContainerStyles}>
              <div style={tabStyles(activeTab === 'output')} onClick={() => setActiveTab('output')}>
                <span>≡</span> Output
              </div>
              <div
                style={tabStyles(activeTab === 'sources')}
                onClick={() => setActiveTab('sources')}
              >
                <span>⊞</span> Sources
              </div>
              <div
                style={tabStyles(activeTab === 'thought')}
                onClick={() => setActiveTab('thought')}
              >
                <span>◇</span> Thought
              </div>
            </div>
          )}
          <div style={messageContentStyles}>
            {isLoading ? (
              <div style={loadingContainerStyles}>
                <div style={dotStyles(0)} />
                <div style={dotStyles(0.2)} />
                <div style={dotStyles(0.4)} />
              </div>
            ) : (
              content
            )}
          </div>
        </div>
      </div>
      {timestamp && !isLoading && (
        <div style={timestampStyles}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <style>
        {`
          @keyframes bounce {
            0%, 60%, 100% {
              transform: translateY(0);
              opacity: 0.7;
            }
            30% {
              transform: translateY(-10px);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ChatMessage;
