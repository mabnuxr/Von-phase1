import { Streamdown } from 'streamdown';
import { chatRemarkPlugins } from './chatRemarkPlugins';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallItem } from './ToolCallItem';
import { MessageAreaError } from './MessageAreaError';
import { SalesforceLink } from './SalesforceLink';
import type { MessageStatus, StepMessage } from './types';

export interface AssistantMessageV1Props {
  content: string;
  reasoningContent?: string;
  isStreaming?: boolean;
  isReasoningStreaming?: boolean;
  status?: MessageStatus;
  errorMessage?: string;
  stepMessages?: StepMessage[];
  messageId?: string;
  isLatestMessage?: boolean;
  onApprove?: (toolCallId: string, runId: string) => void;
  onReject?: (toolCallId: string, runId: string) => void;
  runId: string;
  salesforceInstanceUrl?: string;
  onArtifactClick?: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;
}

export const AssistantMessageV1: React.FC<AssistantMessageV1Props> = ({
  content,
  reasoningContent,
  isStreaming = false,
  isReasoningStreaming = false,
  status,
  errorMessage,
  stepMessages,
  messageId,
  isLatestMessage,
  onApprove,
  onReject,
  runId,
  salesforceInstanceUrl,
  onArtifactClick,
}) => {
  // Check for errors first (error replaces content)
  if (status === 'failed' && errorMessage) {
    return <MessageAreaError message={errorMessage} />;
  }

  const handleArtifactClick = (
    artifactId: string,
    toolName: string,
    artifactType: string,
    clickRunId: string
  ) => {
    onArtifactClick?.(artifactId, toolName, artifactType, clickRunId);
  };

  return (
    <>
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
          salesforceInstanceUrl={salesforceInstanceUrl}
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
              salesforceInstanceUrl={salesforceInstanceUrl}
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
                  salesforceInstanceUrl={salesforceInstanceUrl}
                />
              )}

              {/* Final Message - Rendered outside ThinkingBlock after completion */}
              {(() => {
                const finalStep = stepMessages[stepMessages.length - 1];
                return (
                  <div className="space-y-3">
                    {/* Final step content */}
                    {finalStep.content && (
                      <div className="markdown-content max-w-none">
                        <Streamdown
                          parseIncompleteMarkdown={false}
                          isAnimating={false}
                          controls={{ table: true }}
                          components={{ a: SalesforceLink }}
                          remarkPlugins={chatRemarkPlugins}
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
                            salesforceInstanceUrl={salesforceInstanceUrl}
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
          <div className="markdown-content max-w-none">
            <Streamdown
              parseIncompleteMarkdown={isStreaming}
              isAnimating={isStreaming}
              controls={{ table: true }}
              components={{ a: SalesforceLink }}
              remarkPlugins={chatRemarkPlugins}
            >
              {content}
            </Streamdown>
          </div>
        )
      )}
    </>
  );
};
