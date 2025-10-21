import { motion, AnimatePresence } from 'framer-motion';
import { ChatMarkdown } from './ChatMarkdown';
import { ThinkingBlock } from './ThinkingBlock';

/**
 * Get user initials from name or email
 */
function getUserInitials(name?: string, email?: string): string {
  // Try to get initials from name first
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
      // First and last name
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      // Single name, take first character
      return parts[0][0].toUpperCase();
    }
  }

  // Fallback to email
  if (email && email.trim()) {
    const emailUsername = email.split('@')[0];
    if (emailUsername.length >= 2) {
      return emailUsername.substring(0, 2).toUpperCase();
    } else if (emailUsername.length === 1) {
      return emailUsername[0].toUpperCase();
    }
  }

  // Final fallback
  return 'U';
}

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
   * Thought content (for assistant messages)
   */
  thoughtContent?: string;

  /**
   * Reasoning content from AI SDK (Claude thinking blocks)
   */
  reasoningContent?: string;

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

  /**
   * Whether the message is currently streaming
   */
  isStreaming?: boolean;

  /**
   * Whether the reasoning is currently streaming
   */
  isReasoningStreaming?: boolean;

  /**
   * User's name (for user messages)
   */
  userName?: string;

  /**
   * User's email (for user messages)
   */
  userEmail?: string;
}

/**
 * Individual chat message component with full-width Claude-style layout
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content,
  reasoningContent,
  isLoading = false,
  isStreaming = false,
  isReasoningStreaming = false,
  userName,
  userEmail,
}) => {
  const isUser = type === 'user';
  const userInitials = isUser ? getUserInitials(userName, userEmail) : 'A';

  return (
    <div className="w-full group">
      {/* Full-width section container */}
      <div
        className={`
          w-full py-6 transition-all duration-300
          ${
            isUser
              ? 'bg-white hover:bg-gray-50/30'
              : 'bg-gradient-to-br from-gray-50 via-gray-50/80 to-white hover:from-gray-100/50 hover:via-gray-50/90 hover:to-white'
          }
        `}
      >
        {/* Centered content area */}
        <div className="max-w-3xl mx-auto px-8">
          {/* Label: "You" or "Assistant" with elegant spacing */}
          <div
            className={`mb-3 text-[13px] font-medium flex items-center gap-2 ${
              isUser ? 'text-gray-700' : 'text-gray-600'
            }`}
          >
            {isUser ? (
              <>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white text-[11px] font-semibold shadow-sm ring-1 ring-black/5">
                  {userInitials}
                </div>
                <span className="tracking-wide">You</span>
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white text-[11px] font-semibold shadow-sm ring-1 ring-black/5">
                  A
                </div>
                <span className="tracking-wide">Assistant</span>
              </>
            )}
          </div>

          {/* Thinking Block - Only for assistant messages with reasoning */}
          {!isUser && reasoningContent && (
            <ThinkingBlock
              content={reasoningContent}
              isStreaming={isReasoningStreaming}
              defaultExpanded={isReasoningStreaming}
            />
          )}

          {/* Message Content */}
          <div className="text-sm">
            <AnimatePresence mode="wait">
              {isLoading || (isStreaming && !content) ? (
                // Loading indicator - show when explicitly loading OR when streaming with no content yet
                <motion.div
                  key="loading"
                  className="flex gap-1.5 items-center justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-gray-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-gray-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.2,
                    }}
                  />
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-gray-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.4,
                    }}
                  />
                  <span className="text-sm text-gray-400 ml-1">thinking</span>
                </motion.div>
              ) : (
                // Markdown content - Claude style (no tabs)
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChatMarkdown content={content} isStreaming={isStreaming} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
