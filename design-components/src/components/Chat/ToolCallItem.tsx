import type { ToolCall } from './types';
import { ERROR_MESSAGE_TRUNCATE_LENGTH } from '../../constants';

interface ToolCallItemProps {
  toolCall: ToolCall;
  onArtifactClick: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;
}

/**
 * ToolCallItem Component
 *
 * Simple display for tool calls in the thinking block.
 * - No dots, no icons
 * - Shows "Query Executed" heading
 * - Blue if clickable (has artifact), red if error
 * - Shows "(failed)" indicator for errors
 * - Shows truncated error message below if present
 */
export function ToolCallItem({ toolCall, onArtifactClick }: ToolCallItemProps) {
  const hasArtifact = Boolean(toolCall.artifact?.artifact_id);
  const isError = toolCall.status === 'error' || toolCall.artifact?.success === false;
  const errorMessage = toolCall.artifact?.error || toolCall.result?.error;

  // All tool calls display "Query Executed"
  const headingText = 'Query Executed';

  // Determine color based on state
  const headingColor = isError ? 'text-red-600' : hasArtifact ? 'text-blue-600' : 'text-gray-900';

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
      {/* Simple heading - no icon, no dot */}
      <h4
        className={`mt-2 mb-2 text-sm font-semibold ${headingColor} ${clickableStyle} transition-colors`}
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

      {/* Error message if present - truncated */}
      {isError && errorMessage && (
        <p className="text-xs text-red-600 mt-1">
          {errorMessage.length > ERROR_MESSAGE_TRUNCATE_LENGTH
            ? `${errorMessage.substring(0, ERROR_MESSAGE_TRUNCATE_LENGTH)}...`
            : errorMessage}
        </p>
      )}
    </div>
  );
}
