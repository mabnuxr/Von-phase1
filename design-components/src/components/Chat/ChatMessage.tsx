import { useState, useRef, useLayoutEffect } from 'react';
import { InfoIcon } from '@phosphor-icons/react';
import { Streamdown } from 'streamdown';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallItem } from './ToolCallItem';
import { ArtifactPane, type UseArtifactResult } from './ArtifactPane';
import { MessageAreaError } from './MessageAreaError';

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

  /**
   * Message ID (for artifact fetching)
   */
  messageId?: string;

  /**
   * Conversation ID (for artifact fetching)
   */
  conversationId?: string;

  /**
   * Hook for fetching artifact data
   * Should be provided by the parent component (e.g., from app layer)
   * Example: useArtifact from @revenue-os/app
   */
  useArtifactHook?: (
    conversationId: string | null,
    messageId: string | null,
    artifactId: string | null
  ) => UseArtifactResult;

  /**
   * Whether the response was stopped by user
   */
  stoppedByUser?: boolean;

  /**
   * Callback when user approves a Salesforce CRUD operation
   */
  onApprove?: (toolCallId: string, runId: string) => void;

  /**
   * Callback when user rejects a Salesforce CRUD operation
   */
  onReject?: (toolCallId: string, runId: string) => void;

  /**
   * Run ID of the current streaming session (required for approval resume)
   */
  runId?: string;

  /**
   * Whether this is the latest message in the conversation
   * Used to control visibility of approval buttons
   */
  isLatestMessage?: boolean;
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
  stepMessages,
  status,
  errorMessage,
  conversationId,
  messageId,
  useArtifactHook,
  stoppedByUser,
  isLatestMessage,
  onApprove,
  onReject,
  runId = '',
}) => {
  const isUser = type === 'user';
  const userInitials = isUser ? getUserInitials(userName, userEmail) : 'A';

  // State for artifact pane
  const [openArtifact, setOpenArtifact] = useState<{
    artifactId: string;
    toolName: string;
    artifactType: string;
    runId: string; // Artifact's own run_id
  } | null>(null);

  // Ref and state for measuring user message height (for alignment)
  const userMessageRef = useRef<HTMLDivElement>(null);
  const [isSingleLine, setIsSingleLine] = useState(true);

  // Measure user message height to determine alignment
  useLayoutEffect(() => {
    if (isUser && userMessageRef.current) {
      // Single line threshold ~36px (accounts for line-height + padding)
      const height = userMessageRef.current.offsetHeight;
      setIsSingleLine(height <= 36);
    }
  }, [isUser, content]);

  // Handle artifact click from timeline
  const handleArtifactClick = (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => {
    setOpenArtifact({ artifactId, toolName, artifactType, runId });
  };

  return (
    <div className="w-full group font-sf">
      {/* Full-width section with alternating backgrounds */}
      <div
        className={`
          w-full transition-all duration-300
          ${
            isUser
              ? 'py-6 bg-white hover:bg-gray-50'
              : `pt-6 ${isStreaming ? 'min-h-[450px]' : ''} bg-white`
          }
        `}
      >
        {/* Centered container */}
        <div className="px-8">
          <div className={`max-w-4xl mx-auto ${isUser ? 'flex justify-end' : ''}`}>
            {/* Message layout */}
            <div className={`${isUser ? 'max-w-3xl' : 'w-full'}`}>
              {/* Horizontal layout: Avatar + Content (reversed for user) */}
              <div className={`flex gap-4 ${isUser ? `flex-row-reverse bg-gray-100 border border-gray-200 rounded-2xl p-2 ${isSingleLine ? 'items-center' : 'items-start'}` : 'items-start'}`}>
                {/* Avatar and Status Badge */}
                <div className="flex items-start gap-2 flex-shrink-0">
                  {isUser ? (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                      {userInitials}
                    </div>
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z" fill="url(#paint0_radial_chat_msg)"/>
                          <path d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z" stroke="white" strokeWidth="1.33"/>
                          <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33"/>
                          <defs>
                            <radialGradient id="paint0_radial_chat_msg" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)">
                              <stop stopColor="#FFF3EB"/>
                              <stop offset="0.26" stopColor="#FF9042"/>
                              <stop offset="1" stopColor="#854FFF"/>
                            </radialGradient>
                          </defs>
                        </svg>
                      </div>
                    </>
                  )}
                </div>

                {/* Content Column */}
                <div className="flex-1 min-w-0 -mt-0.5">
                  {/* For assistant messages: check for errors first */}
                  {!isUser && status === 'failed' && errorMessage ? (
                    <MessageAreaError message={errorMessage} />
                  ) : !isUser ? (
                    <div>
                      {isStreaming &&
                        !content &&
                        !reasoningContent &&
                        (!stepMessages || stepMessages.length === 0) && (
                          <ThinkingBlock content="" isStreaming={true} status="streaming" />
                        )}

                      {/* Thinking Block - Show immediately when reasoning starts */}
                      {(isReasoningStreaming || reasoningContent) && (
                        <ThinkingBlock
                          content={reasoningContent || ''}
                          isStreaming={isReasoningStreaming}
                          status={status}
                          messageId={messageId}
                          isLatestMessage={isLatestMessage}
                          onApprove={onApprove}
                          onReject={onReject}
                          runId={runId}
                        />
                      )}

                      {/* Render stepMessages if available (AGUI multi-step responses) */}
                      {stepMessages && stepMessages.length > 0 ? (
                        <div className="space-y-4">
                          {/* STREAMING STRATEGY: Split intermediate steps from final output */}
                          {isStreaming ? (
                            // While streaming: ALL steps go in ThinkingBlock (collapsed), summary shown in header
                            <ThinkingBlock
                              key="thinking-block"
                              isStreaming={isStreaming}
                              status={status}
                              stepMessages={stepMessages}
                              onArtifactClick={handleArtifactClick}
                              messageId={messageId}
                              isLatestMessage={isLatestMessage}
                              onApprove={onApprove}
                              onReject={onReject}
                              runId={runId}
                            />
                          ) : (
                            // After completion: Show intermediate steps in ThinkingBlock + final step outside
                            <>
                              {stepMessages.length > 1 && (
                                <ThinkingBlock
                                  key="thinking-block"
                                  messageId={messageId}
                                  isStreaming={false}
                                  status={status}
                                  stepMessages={stepMessages.slice(0, -1)}
                                  onArtifactClick={handleArtifactClick}
                                  isLatestMessage={isLatestMessage}
                                  onApprove={onApprove}
                                  onReject={onReject}
                                  runId={runId}
                                />
                              )}

                              {/* Final Message - Rendered outside ThinkingBlock after completion */}
                              {(() => {
                                const finalStep = stepMessages[stepMessages.length - 1];
                                return (
                                  <div className="space-y-3">
                                    {/* Final step content */}
                                    {finalStep.content && (
                                      <div className="prose-sm markdown-body max-w-none">
                                        <Streamdown
                                          parseIncompleteMarkdown={false}
                                          isAnimating={false}
                                          controls={{ table: true }}
                                        >
                                          {finalStep.content}
                                        </Streamdown>
                                      </div>
                                    )}

                                    {/* Tool calls for final step */}
                                    {finalStep.toolCalls && finalStep.toolCalls.length > 0 && (
                                      <div className="space-y-2">
                                        {finalStep.toolCalls.map((toolCall) => (
                                          <ToolCallItem
                                            key={toolCall.id}
                                            toolCall={toolCall}
                                            onArtifactClick={handleArtifactClick}
                                            isStreaming={false}
                                            isLatestMessage={isLatestMessage}
                                            onApprove={onApprove}
                                            onReject={onReject}
                                            runId={runId}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      ) : (
                        /* Fallback: render plain content if no stepMessages */
                        content && (
                          <div className="prose-sm markdown-body max-w-none">
                            <Streamdown
                              parseIncompleteMarkdown={isStreaming}
                              isAnimating={isStreaming}
                              controls={{ table: true }}
                            >
                              {content}
                            </Streamdown>
                          </div>
                        )
                      )}

                    </div>
                  ) : (
                    // User messages - simple rendering
                    <div ref={userMessageRef} className="prose-sm markdown-body max-w-none text-right">
                      <Streamdown parseIncompleteMarkdown={false} controls={{ table: true }}>
                        {content}
                      </Streamdown>
                    </div>
                  )}

                  {/* Show stopped indicator for assistant messages */}
                  {!isUser && stoppedByUser && (
                    <div className="max-w-fit flex items-start gap-2 py-2 px-2 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                      <div className="flex-shrink-0 mt-0.5">
                        <InfoIcon size={20} className="text-indigo-600" />
                      </div>
                      <span className="text-sm text-gray-800 font-sf leading-relaxed flex-1">
                        Response stopped by the user
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Artifact Pane - renders when user clicks on a tool call */}
      {openArtifact && conversationId && useArtifactHook && (
        <ArtifactPane
          conversationId={conversationId}
          runId={openArtifact.runId}
          artifactId={openArtifact.artifactId}
          toolName={openArtifact.toolName}
          artifactType={openArtifact.artifactType}
          onClose={() => setOpenArtifact(null)}
          useArtifactHook={useArtifactHook}
        />
      )}
    </div>
  );
};

export default ChatMessage;
