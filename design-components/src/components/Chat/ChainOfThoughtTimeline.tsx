import React from 'react';
import { motion } from 'framer-motion';
import { Streamdown } from 'streamdown';
import { ToolCallItem } from './ToolCallItem';
import type { StepMessage } from './types';

export interface ChainOfThoughtTimelineProps {
  /**
   * Array of step messages to render as timeline
   */
  stepMessages: StepMessage[];

  /**
   * Whether the content is currently streaming
   */
  isStreaming?: boolean;

  /**
   * Callback when artifact is clicked from tool call
   */
  onArtifactClick?: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;

  /**
   * Callback when user approves a Salesforce CRUD operation
   */
  onApprove?: (toolCallId: string, runId: string) => void;

  /**
   * Callback when user rejects a Salesforce CRUD operation
   */
  onReject?: (toolCallId: string, runId: string) => void;

  /**
   * Whether approval is being processed (loading state)
   */
  isApprovalProcessing?: boolean;

  /**
   * Run ID of the current streaming session (required for approval resume)
   */
  runId?: string;
}

/**
 * Chain-of-thought timeline component with animated dots and connecting lines
 * Creates a ChatGPT o1-style visualization of thinking steps
 */
export const ChainOfThoughtTimeline: React.FC<ChainOfThoughtTimelineProps> = ({
  stepMessages,
  isStreaming = false,
  onArtifactClick,
  onApprove,
  onReject,
  isApprovalProcessing = false,
  runId = '',
}) => {
  // Animation variants for staggered reveal
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }, // easeOut cubic-bezier
    },
  };

  const lineVariants = {
    hidden: { scaleY: 0 },
    visible: {
      scaleY: 1,
      transition: { duration: 0.4, ease: [0.4, 0, 0.6, 1] as const }, // easeInOut cubic-bezier
    },
  };

  const dotVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }, // easeOut cubic-bezier
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-0"
    >
      {stepMessages.map((step, index) => {
        const isLastStep = index === stepMessages.length - 1;

        return (
          <motion.div key={step.message_id || index} variants={stepVariants} className="relative">
            {/* Timeline structure */}
            <div className="flex items-stretch gap-3">
              {/* Timeline column (dot + line) */}
              <div className="relative flex flex-col items-center w-2 pt-2">
                {/* Dot */}
                <motion.div
                  variants={dotVariants}
                  className="w-2 h-2 rounded-full bg-gray-400 z-10"
                />

                {/* Connecting line (only if not last step) */}
                {!isLastStep && (
                  <motion.div
                    variants={lineVariants}
                    className="w-[2px] bg-gray-300 flex-1"
                    style={{ transformOrigin: 'top' }}
                  />
                )}
              </div>

              {/* Content column */}
              <div className="flex-1 pb-4">
                {/* Text content */}
                {step.content && (
                  <div className="prose-sm markdown-body max-w-none">
                    <Streamdown
                      parseIncompleteMarkdown={isStreaming && isLastStep}
                      isAnimating={isStreaming && isLastStep}
                      controls={{ table: true }}
                    >
                      {step.content}
                    </Streamdown>
                  </div>
                )}

                {/* Tool calls below text */}
                {step.toolCalls && step.toolCalls.length > 0 && onArtifactClick && (
                  <div className="mt-2 space-y-2">
                    {step.toolCalls.map((toolCall) => (
                      <ToolCallItem
                        key={toolCall.id}
                        toolCall={toolCall}
                        onArtifactClick={onArtifactClick}
                        isStreaming={isStreaming}
                        onApprove={onApprove}
                        onReject={onReject}
                        isApprovalProcessing={isApprovalProcessing}
                        runId={runId}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default ChainOfThoughtTimeline;
