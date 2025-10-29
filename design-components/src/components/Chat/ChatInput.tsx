import { useState, useRef, useEffect } from 'react';

export interface ChatInputProps {
  /**
   * Placeholder text for the input
   * @default 'Ask von anything'
   */
  placeholder?: string;

  /**
   * Callback when send/enter is pressed
   */
  onSend?: (message: string) => void;

  /**
   * Callback when Ask button is clicked
   */
  onAsk?: (message: string) => void;

  /**
   * Callback when Build button is clicked
   */
  onBuild?: () => void;

  /**
   * Context tag to display above input (e.g., "@Forecast Q3")
   */
  contextTag?: string;

  /**
   * Whether to show Ask and Build buttons
   * @default true
   */
  showActionButtons?: boolean;

  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * FIX: Whether a message is actively streaming
   * @default false
   */
  isStreaming?: boolean;
}

/**
 * Chat input component with simple textarea
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  placeholder = 'Ask von anything',
  onSend,
  contextTag,
  disabled = false,
  isStreaming = false, // FIX: Default to false
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 bg-white antialiased font-sf">
      <div className="px-6 max-w-4xl mx-auto w-full flex flex-col gap-1.5">
        {contextTag && (
          <div className="inline-block self-start px-2.5 py-1 bg-orange-50 rounded-xl text-xs text-gray-600 font-sf mb-1">
            {contextTag}
          </div>
        )}

        <div
          className={`flex items-center gap-2 bg-white rounded-[20px] px-3 py-2 border transition-all duration-200 ${
            disabled
              ? isStreaming
                ? 'border-von-purple-light opacity-75 cursor-not-allowed'
                : 'border-gray-200 opacity-60 cursor-not-allowed'
              : 'border-gray-200 shadow-sm hover:shadow-md hover:border-von-purple-light'
          }`}
        >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Waiting for response...' : placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 resize-none outline-none bg-transparent text-sm placeholder-gray-400 overflow-hidden disabled:cursor-not-allowed"
          style={{
            minHeight: '20px',
            maxHeight: '200px',
            padding: '0',
            lineHeight: '1.5',
          }}
          rows={1}
        />

        <button
          className={`w-8 h-8 flex-shrink-0 rounded-full border-0 gradient-von-purple flex items-center justify-center text-white transition-all duration-150 ${
            disabled || !message.trim()
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer hover:opacity-90 hover:shadow-lg'
          }`}
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          aria-label="Send message"
        >
          ↑
        </button>
        </div>

        <div className="text-xs leading-normal text-gray-500 text-center font-sf mt-1">
          Von AI may make mistakes. Please recheck all important information.
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
