import { useState, useEffect, useRef } from 'react';
import type { ToolCall } from './types';

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
}

/**
 * ToolCallItem Component
 *
 * Simple display for tool calls in the thinking block.
 * - No dots, no icons
 * - Shows "Executing query..." while pending, "Query executed" when complete
 * - Blue if clickable (has artifact), red if error
 * - Shows "(failed)" indicator for errors
 * - Shows truncated error message below if present
 * - Shows incrementing timer during execution with purple shimmer animation
 */
export function ToolCallItem({
  toolCall,
  onArtifactClick,
  isStreaming = false,
}: ToolCallItemProps) {
  const hasArtifact = Boolean(toolCall.artifact?.artifact_id);
  const isError = toolCall.status === 'error' || toolCall.artifact?.success === false;

  // Timer state
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerIdRef = useRef<number | null>(null);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Dynamic status text based on metadata presence
  // Show "Executing query..." until metadata arrives from backend
  const getDisplayText = () => {
    // Show "Executing query..." until we have metadata from backend
    // Metadata = artifact data OR inline result (not just status change)
    const hasMetadata = toolCall.artifact || toolCall.result;

    if (!hasMetadata && toolCall.status !== 'error') {
      return 'Executing query...';
    }

    return 'Query executed';
  };

  const headingText = getDisplayText();
  const isExecuting = headingText === 'Executing query...';

  // Timer effect
  useEffect(() => {
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
  }, [isExecuting, isStreaming, toolCall.startTime, toolCall.endTime]);

  // Format elapsed time
  const formatTime = (ms: number): string => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Determine color based on state
  const headingColor = isError ? 'text-gray-600' : hasArtifact ? 'text-blue-600' : 'text-gray-900';

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
          className={`pl-4 text-sm font-semibold ${headingColor} ${clickableStyle} transition-colors ${
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
