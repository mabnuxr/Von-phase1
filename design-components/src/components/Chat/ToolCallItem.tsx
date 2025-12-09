import { useState, useEffect, useRef } from 'react';
import type { ToolCall, ApprovalResult } from './types';
import {
  isApprovalTool,
  parseApprovalArgs,
  isGoogleCalendarApprovalTool,
  parseGoogleCalendarApprovalArgs,
} from './types';
import { ApprovalCard } from './ApprovalCard';
import { GoogleCalendarApprovalCard } from './GoogleCalendarApprovalCard';

interface ToolCallItemProps {
  toolCall: ToolCall;
  onArtifactClick: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;
  /**
   * Whether the content is currently streaming (live)
   * When false, we're replaying/displaying completed events
   */
  isStreaming?: boolean;
  /**
   * Callback when user approves a Salesforce CRUD operation
   * Only used for request_salesforce_approval tool
   */
  onApprove?: (toolCallId: string, runId: string) => void;
  /**
   * Callback when user rejects a Salesforce CRUD operation
   * Only used for request_salesforce_approval tool
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
  /**
   * Whether this is the latest message in the conversation
   * Used to control visibility of approval buttons
   */
  isLatestMessage?: boolean;
}

/**
 * Check if a tool call is an agent transfer (delegation) tool.
 * These tools delegate work to sub-agents and have no meaningful result body.
 */
function isTransferTool(toolName: string): boolean {
  return toolName.startsWith('transfer_to_');
}

/**
 * Check if a tool call is a completion tool (returns control to supervisor).
 */
function isCompletionTool(toolName: string): boolean {
  return toolName === 'complete_task';
}

/**
 * Get a human-readable display name for transfer tools.
 * Converts "transfer_to_rag_agent" to "RAG Agent"
 */
function getTransferAgentName(toolName: string): string {
  const agentName = toolName.replace('transfer_to_', '');
  return agentName
    .split('_')
    .map((word) => {
      if (word.toLowerCase() === 'rag') return 'RAG';
      if (word.toLowerCase() === 'crm') return 'CRM';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * ToolCallItem Component
 *
 * Simple display for tool calls in the thinking block.
 * - No dots, no icons
 * - Shows "Executing query..." while pending, "Query executed" when complete
 * - For transfer tools: Shows "Delegating to X Agent..." / "Delegated to X Agent"
 * - For completion tools: Shows "Completing task..." / "Task completed"
 * - Blue if clickable (has artifact), gray for transfer/completion tools, red if error
 * - Shows "(failed)" indicator for errors
 * - Shows truncated error message below if present
 * - Shows incrementing timer during execution with purple shimmer animation
 */
export function ToolCallItem({
  toolCall,
  onArtifactClick,
  isStreaming = false,
  isLatestMessage,
  onApprove,
  onReject,
  isApprovalProcessing = false,
  runId = '',
}: ToolCallItemProps) {
  // Timer state - hooks must be called unconditionally at the top
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerIdRef = useRef<number | null>(null);

  // Check tool type
  const isTransfer = isTransferTool(toolCall.name);
  const isCompletion = isCompletionTool(toolCall.name);
  const isApproval = isApprovalTool(toolCall.name);
  const isGoogleCalendarApproval = isGoogleCalendarApprovalTool(toolCall.name);

  // Transfer and completion tools don't have clickable artifacts
  const hasArtifact = !isTransfer && !isCompletion && Boolean(toolCall.artifact?.artifact_id);
  const isError = toolCall.status === 'error' || toolCall.artifact?.success === false;

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Dynamic status text based on tool type and metadata presence
  const getDisplayText = () => {
    const hasMetadata = toolCall.artifact || toolCall.result;
    const isExecutingStatus = !hasMetadata && toolCall.status !== 'error';

    // Transfer tools: "Delegating to X Agent..." / "Delegated to X Agent"
    if (isTransfer) {
      const agentName = getTransferAgentName(toolCall.name);
      return isExecutingStatus ? `Delegating to ${agentName}...` : `Delegated to ${agentName}`;
    }

    // Completion tools: "Completing task..." / "Task completed"
    if (isCompletion) {
      return isExecutingStatus ? 'Completing task...' : 'Task completed';
    }

    // Default query tools
    return isExecutingStatus ? 'Executing query...' : 'Query executed';
  };

  const headingText = getDisplayText();
  const isExecuting = headingText.endsWith('...');

  // Timer effect - must be called unconditionally before any early returns
  useEffect(() => {
    // Skip timer logic for approval tools
    if (isApproval || isGoogleCalendarApproval) {
      return;
    }

    // Replay detection: If not streaming OR both times exist, show final time without animation
    const isReplay = !isStreaming || (toolCall.startTime && toolCall.endTime);

    if (isReplay && toolCall.startTime && toolCall.endTime) {
      // REPLAY MODE: Calculate final time once, no animation
      const finalTime = toolCall.endTime - toolCall.startTime;
      setElapsedMs(finalTime);

      // Clear any running timer
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    } else if (isExecuting && isStreaming && toolCall.startTime && !toolCall.endTime) {
      // LIVE STREAMING MODE: Animate timer
      timerIdRef.current = window.setInterval(() => {
        const elapsed = Date.now() - toolCall.startTime!;
        setElapsedMs(elapsed);
      }, 100);

      return () => {
        if (timerIdRef.current) {
          clearInterval(timerIdRef.current);
          timerIdRef.current = null;
        }
      };
    }
  }, [isApproval, isGoogleCalendarApproval, isExecuting, isStreaming, toolCall.startTime, toolCall.endTime]);

  // Format elapsed time
  const formatTime = (ms: number): string => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // For approval tools, render the ApprovalCard instead
  if (isApproval) {
    const args = toolCall.args || toolCall.arguments || {};
    const approvalArgs = parseApprovalArgs(args);

    // Parse result if available (from tool call result)
    let approvalResult: ApprovalResult | undefined;
    if (toolCall.result?.raw) {
      try {
        const rawResult =
          typeof toolCall.result.raw === 'string'
            ? JSON.parse(toolCall.result.raw)
            : toolCall.result.raw;
        if (typeof rawResult.approved === 'boolean') {
          approvalResult = {
            approved: rawResult.approved,
            message: rawResult.message,
          };
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Determine if pending (no result yet)
    // For approval tools, we show buttons if there's no approval result yet
    // The tool status might not be 'pending'/'running' when LangGraph is interrupted
    const isPending = !approvalResult;

    if (approvalArgs) {
      return (
        <ApprovalCard
          toolCallId={toolCall.id}
          runId={runId}
          args={approvalArgs}
          isPending={isPending}
          isLatestMessage={isLatestMessage}
          onApprove={onApprove || (() => {})}
          onReject={onReject || (() => {})}
          isProcessing={isApprovalProcessing}
          result={approvalResult}
        />
      );
    }
  }

  // For Google Calendar approval tools, render the GoogleCalendarApprovalCard
  if (isGoogleCalendarApproval) {
    const args = toolCall.args || toolCall.arguments || {};
    const calendarApprovalArgs = parseGoogleCalendarApprovalArgs(args);

    // Parse result if available (from tool call result)
    let approvalResult: ApprovalResult | undefined;
    if (toolCall.result?.raw) {
      try {
        const rawResult =
          typeof toolCall.result.raw === 'string'
            ? JSON.parse(toolCall.result.raw)
            : toolCall.result.raw;
        if (typeof rawResult.approved === 'boolean') {
          approvalResult = {
            approved: rawResult.approved,
            message: rawResult.message,
          };
        }
      } catch {
        // Ignore parse errors
      }
    }

    const isPending = !approvalResult;

    if (calendarApprovalArgs) {
      return (
        <GoogleCalendarApprovalCard
          toolCallId={toolCall.id}
          runId={runId}
          args={calendarApprovalArgs}
          isPending={isPending}
          isLatestMessage={isLatestMessage}
          onApprove={onApprove || (() => {})}
          onReject={onReject || (() => {})}
          isProcessing={isApprovalProcessing}
          result={approvalResult}
        />
      );
    }
  }

  // Determine color based on state
  // Transfer/completion tools are always gray (not clickable)
  // Error state also uses gray to keep it subtle
  const headingColor =
    isTransfer || isCompletion
      ? 'text-gray-600'
      : isError
        ? 'text-gray-600'
        : hasArtifact
          ? 'text-indigo-600'
          : 'text-gray-900';

  const clickableStyle = hasArtifact ? 'cursor-pointer hover:underline' : '';

  const handleClick = () => {
    if (hasArtifact && toolCall.artifact) {
      onArtifactClick(
        toolCall.artifact.artifact_id,
        toolCall.artifact.tool_name,
        toolCall.artifact.artifact_type,
        toolCall.artifact.run_id
      );
    }
  };

  return (
    <div>
      {/* Flex layout: Text on left, timer on right */}
      <div className="flex justify-between items-center mt-2 mb-2">
        {/* Text with optional purple shimmer animation */}
        <h4
          className={`pl-2 text-sm font-semibold ${headingColor} ${clickableStyle} transition-colors ${
            isExecuting
              ? 'bg-clip-text text-transparent bg-gradient-to-r from-gray-700 via-purple-600 to-gray-700'
              : ''
          }`}
          style={
            isExecuting
              ? {
                  backgroundSize: '250% 100%',
                  animation: prefersReducedMotion
                    ? undefined
                    : 'thinkingShimmer 2.2s linear infinite',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }
              : undefined
          }
          onClick={hasArtifact ? handleClick : undefined}
          role={hasArtifact ? 'button' : undefined}
          tabIndex={hasArtifact ? 0 : undefined}
          onKeyDown={
            hasArtifact
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                  }
                }
              : undefined
          }
        >
          {headingText}
          {isError && <span className="text-xs ml-1">(failed)</span>}
        </h4>

        {/* Timer on the right - only show during live streaming */}
        {isStreaming && toolCall.startTime && (
          <span className="mr-4 text-xs text-gray-500 font-medium ml-2">
            {formatTime(elapsedMs)}
          </span>
        )}
      </div>

      {/* Keyframe animation for purple shimmer */}
      <style>{`
        @keyframes thinkingShimmer {
          0% { background-position: -150% 0 }
          50% { background-position: 50% 0 }
          100% { background-position: 250% 0 }
        }
      `}</style>
    </div>
  );
}
