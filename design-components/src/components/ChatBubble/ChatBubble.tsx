import React from 'react';

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

  return (
    <div
      className={`flex items-start gap-2 mb-0 ${isUser ? 'justify-end' : 'justify-start'} ${className || ''}`}
    >
      {/* Avatar - Left side for assistant */}
      {!isUser && showAvatar && (
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {avatarLabel}
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`
          text-sm leading-relaxed text-[#1d1d1f]  antialiased
          whitespace-pre-wrap break-words
          ${
            isUser
              ? 'max-w-[70%] px-3.5 py-2.5 bg-[#E8EEF7] rounded-2xl shadow-sm'
              : 'max-w-full p-0 bg-transparent'
          }
        `}
      >
        {content}
      </div>

      {/* Avatar - Right side for user */}
      {isUser && showAvatar && (
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {avatarLabel}
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
