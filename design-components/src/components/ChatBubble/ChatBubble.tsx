import React from 'react';
import { colors } from '../../theme';

export interface ChatBubbleProps {
  /**
   * Message content
   */
  content: string;

  /**
   * Message type - determines styling and alignment
   * @default 'assistant'
   */
  type?: 'user' | 'assistant';

  /**
   * Show avatar icon for user messages
   * @default false
   */
  showAvatar?: boolean;

  /**
   * Avatar icon background color
   * @default '#000000'
   */
  avatarColor?: string;

  /**
   * Avatar text/label
   * @default 'AI'
   */
  avatarLabel?: string;

  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * ChatBubble - Message bubble for chat conversations
 *
 * Two variants:
 * - User: Right-aligned with light blue background
 * - Assistant: Left-aligned with transparent background (just text)
 *
 * @example
 * ```tsx
 * <ChatBubble type="user" content="How much will I win this quarter?" showAvatar />
 * <ChatBubble type="assistant" content="Sure! I have built a forecast view..." />
 * ```
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  type = 'assistant',
  showAvatar = false,
  avatarColor = '#000000',
  avatarLabel = 'AI',
  className,
}) => {
  const isUser = type === 'user';

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: 0,
  };

  const bubbleStyles: React.CSSProperties = {
    maxWidth: isUser ? '70%' : '100%',
    padding: isUser ? '10px 14px' : '0',
    backgroundColor: isUser ? '#E8EEF7' : 'transparent',
    borderRadius: isUser ? '16px' : '0',
    fontSize: '14px',
    lineHeight: 1.5,
    color: '#1d1d1f',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    boxShadow: isUser ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
  };

  const avatarStyles: React.CSSProperties = {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: avatarColor,
    color: colors.common.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 600,
    flexShrink: 0,
  };

  return (
    <div className={className} style={containerStyles}>
      {!isUser && showAvatar && <div style={avatarStyles}>{avatarLabel}</div>}
      <div style={bubbleStyles}>{content}</div>
      {isUser && showAvatar && <div style={avatarStyles}>{avatarLabel}</div>}
    </div>
  );
};

export default ChatBubble;
