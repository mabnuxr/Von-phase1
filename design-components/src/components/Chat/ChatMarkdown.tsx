import { Streamdown } from 'streamdown';
import { chatRemarkPlugins } from './chatRemarkPlugins';

export interface ChatMarkdownProps {
  /**
   * Markdown content to render
   */
  content: string;

  /**
   * Whether the content is currently streaming
   * When true, enables incomplete markdown handling
   */
  isStreaming?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Markdown renderer optimized for chat streaming
 * Uses Streamdown for graceful handling of incomplete markdown blocks
 */
export const ChatMarkdown: React.FC<ChatMarkdownProps> = ({
  content,
  isStreaming = false,
  className = '',
}) => {
  return (
    <div className={`markdown-content ${className}`}>
      <Streamdown
        parseIncompleteMarkdown={isStreaming}
        isAnimating={isStreaming}
        controls={{
          code: !isStreaming, // Only show code copy button when not streaming
          table: true,
        }}
        remarkPlugins={chatRemarkPlugins}
      >
        {content || ''}
      </Streamdown>
    </div>
  );
};

export default ChatMarkdown;
