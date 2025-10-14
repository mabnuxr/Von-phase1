import React, { useState } from 'react';

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
}

/**
 * Chat input component with text field and action buttons
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  placeholder = 'Ask von anything',
  onSend,
  contextTag,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && onSend) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 px-4 bg-white flex flex-col gap-1.5 border-t border-gray-100 antialiased font-sf">
      {contextTag && (
        <div className="inline-block self-start px-2.5 py-1 bg-orange-50 rounded-xl text-xs text-gray-600 font-sf mb-1">
          {contextTag}
        </div>
      )}

      <div className="flex items-center gap-2 bg-white rounded-[20px] px-3 py-2 border border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md">
        <button
          className={`w-7 h-7 rounded-full border-0 bg-gray-100 flex items-center justify-center text-base text-gray-600 transition-all duration-150 flex-shrink-0 ${
            disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-200'
          }`}
          onClick={() => {}}
          disabled={disabled}
          aria-label="Add"
        >
          +
        </button>

        <input
          type="text"
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1 border-0 outline-none bg-transparent text-sm leading-5 font-sf text-gray-900 placeholder:text-gray-400 min-w-0"
        />

        <button
          className={`w-8 h-8 rounded-full border-0 bg-black flex items-center justify-center text-white transition-all duration-150 flex-shrink-0 ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-800'
          }`}
          onClick={handleSend}
          disabled={disabled}
          aria-label="Send"
        >
          ↑
        </button>
      </div>

      <div className="text-[11px] leading-normal text-gray-500 text-center font-sf mt-1">
        Von AI may make mistakes. Please recheck all important information.
      </div>
    </div>
  );
};

export default ChatInput;
