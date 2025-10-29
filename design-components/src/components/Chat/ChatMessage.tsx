import { Streamdown } from 'streamdown';
import { ThinkingBlock } from './ThinkingBlock';
import { MessageStatusBadge } from './MessageStatusBadge';
import { ElegantToolBlock } from './ElegantToolBlock';

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

  /**
   * Message status from backend persistence
   * Includes 'timeout' for client-side timeout recovery
   */
  status?: 'created' | 'streaming' | 'completed' | 'failed' | 'timeout';

  /**
   * Error message if status is 'failed'
   */
  errorMessage?: string;

  /**
   * Complete event stream from backend (event array architecture)
   * Enables event-driven rendering of agent execution
   */
  events?: import('./types').AguiEventWrapper[];

  /**
   * Tool calls made during this message (AGUI)
   * @deprecated Use stepMessages with tool calls instead
   */
  toolCalls?: import('./types').ToolCall[];

  /**
   * Multiple step messages (for multi-step agent responses)
   * Each step message contains its content and associated tool calls
   */
  stepMessages?: import('./types').StepMessage[];

  /**
   * Whether this message should be displayed in compressed form
   * @default false
   */
  isCompressed?: boolean;
}

/**
 * Individual chat message component with full-width Claude-style layout
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content,
  reasoningContent,
  isStreaming = false,
  isReasoningStreaming = false,
  userName,
  userEmail,
  toolCalls: _toolCalls, // eslint-disable-line @typescript-eslint/no-unused-vars
  stepMessages,
  status,
  errorMessage,
  events: _events, // eslint-disable-line @typescript-eslint/no-unused-vars
  isCompressed: _isCompressed, // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  const isUser = type === 'user';
  const userInitials = isUser ? getUserInitials(userName, userEmail) : 'A';

  return (
    <div className="w-full group font-sf">
      {/* Full-width section with alternating backgrounds */}
      <div
        className={`
          w-full transition-all duration-300
          ${
            isUser
              ? 'py-6 bg-white hover:bg-gray-50/30'
              : `py-6 ${
                  isStreaming && !content && !reasoningContent
                    ? 'pb-48'
                    : ''
                } bg-gradient-to-br from-gray-50 via-gray-50/80 to-white hover:from-gray-100/50 hover:via-gray-50/90 hover:to-white`
          }
        `}
      >
        {/* Centered container */}
        <div className="px-8">
          <div className={`max-w-4xl mx-auto ${isUser ? 'flex justify-end' : ''}`}>
            {/* Message layout */}
            <div className={`${isUser ? 'max-w-3xl' : 'w-full'}`}>
              {/* Horizontal layout: Avatar + Content (reversed for user) */}
              <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                {/* Avatar and Status Badge */}
                <div className="flex items-start gap-2 flex-shrink-0">
                  {isUser ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                      {userInitials}
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-semibold">
                        AI
                      </div>
                      {/* Status badge inline with avatar for assistant messages */}
                      <MessageStatusBadge status={status} errorMessage={errorMessage} />
                    </>
                  )}
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0 -mt-0.5">
                  {/* For assistant messages: render thinking block and content */}
                  {!isUser ? (
                    <>
                      {/* Thinking Block - Show immediately when reasoning starts */}
                      {(isReasoningStreaming || reasoningContent) && (
                        <ThinkingBlock
                          content={reasoningContent || ''}
                          isStreaming={isReasoningStreaming}
                          status={status}
                        />
                      )}

                      {/* Render stepMessages if available (AGUI multi-step responses) */}
                      {stepMessages && stepMessages.length > 0 ? (
                        <div className="space-y-4">
                          {/* Always use same structure: ThinkingBlock for intermediate steps + final message */}
                          {stepMessages.length > 1 && (
                            <ThinkingBlock
                              key="thinking-block"
                              isStreaming={isStreaming}
                              status={status}
                            >
                              <div className="space-y-4">
                                {stepMessages.slice(0, -1).map((step, index) => (
                                  <div key={step.message_id || index} className="space-y-3">
                                    {/* Step content */}
                                    {step.content && (
                                      <div
                                        className={
                                          isStreaming
                                            ? 'prose max-w-none'
                                            : 'prose-sm max-w-none'
                                        }
                                      >
                                        <Streamdown
                                          parseIncompleteMarkdown={isStreaming}
                                          isAnimating={isStreaming}
                                        >
                                          {step.content}
                                        </Streamdown>
                                      </div>
                                    )}

                                    {/* Tool calls for this step */}
                                    {step.toolCalls && step.toolCalls.length > 0 && (
                                      <div
                                        className={
                                          isStreaming
                                            ? 'space-y-2'
                                            : 'space-y-2 scale-95 origin-left'
                                        }
                                      >
                                        {step.toolCalls.map((tool) => (
                                          <ElegantToolBlock key={tool.id} toolCall={tool} />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </ThinkingBlock>
                          )}

                          {/* Final Message - Always rendered prominently outside ThinkingBlock */}
                          {(() => {
                            const finalStep = stepMessages[stepMessages.length - 1];
                            return (
                              <div className="space-y-3">
                                {/* Final step content */}
                                {finalStep.content && (
                                  <div className="prose max-w-none">
                                    <Streamdown
                                      parseIncompleteMarkdown={isStreaming}
                                      isAnimating={isStreaming}
                                    >
                                      {finalStep.content}
                                    </Streamdown>
                                  </div>
                                )}

                                {/* Tool calls for final step */}
                                {finalStep.toolCalls && finalStep.toolCalls.length > 0 && (
                                  <div className="space-y-2">
                                    {finalStep.toolCalls.map((tool) => (
                                      <ElegantToolBlock key={tool.id} toolCall={tool} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        /* Fallback: render plain content if no stepMessages */
                        content && (
                          <div className="prose max-w-none">
                            <Streamdown
                              parseIncompleteMarkdown={isStreaming}
                              isAnimating={isStreaming}
                            >
                              {content}
                            </Streamdown>
                          </div>
                        )
                      )}
                    </>
                  ) : (
                    // User messages - simple rendering
                    <div className="prose max-w-none">
                      <Streamdown parseIncompleteMarkdown={false}>{content}</Streamdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;