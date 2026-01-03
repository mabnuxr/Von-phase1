import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperPlaneTilt, User, Plus } from '@phosphor-icons/react';
import type { ChatMessage, BuildMode } from './types';
import { ThinkingProcess } from './ThinkingProcess';
import { ModeToggle } from './ModeToggle';

// Von logo SVG component
const VonLogo: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
      fill="url(#paint0_radial_build_chat)"
    />
    <path
      d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
      stroke="white"
      strokeWidth="1.33"
    />
    <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
    <defs>
      <radialGradient
        id="paint0_radial_build_chat"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)"
      >
        <stop stopColor="#FFF3EB" />
        <stop offset="0.26" stopColor="#FF9042" />
        <stop offset="1" stopColor="#854FFF" />
      </radialGradient>
    </defs>
  </svg>
);

export interface BuildChatProps {
  /**
   * Chat messages
   */
  messages: ChatMessage[];

  /**
   * Callback when a message is sent
   */
  onSendMessage?: (message: string) => void;

  /**
   * Current mode
   */
  mode: BuildMode;

  /**
   * Callback when mode changes
   */
  onModeChange?: (mode: BuildMode) => void;

  /**
   * Whether the chat is loading/streaming
   */
  isLoading?: boolean;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Callback when thinking is toggled
   */
  onToggleThinking?: (messageId: string) => void;
}

/**
 * BuildChat - Chat panel for build mode (right side)
 */
export const BuildChat: React.FC<BuildChatProps> = ({
  messages,
  onSendMessage,
  mode,
  onModeChange,
  isLoading = false,
  placeholder = 'Ask von anything...',
  onToggleThinking,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage?.(inputValue.trim());
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [inputValue, isLoading, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="h-14 px-3 border-b border-gray-200 flex items-center gap-2">
        <VonLogo size={20} />
        <span className="text-sm font-medium text-gray-900">Von AI</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {message.role === 'assistant' ? (
                  <VonLogo size={28} />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                    <User size={16} weight="duotone" className="text-gray-600" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div
                className={`flex-1 min-w-0 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block max-w-full text-left ${
                    message.role === 'user'
                      ? 'bg-gray-900 text-white rounded-2xl rounded-tr-sm px-4 py-2.5'
                      : ''
                  }`}
                >
                  {/* Thinking Process (for assistant messages) */}
                  {message.role === 'assistant' && message.thinkingSteps && (
                    <div className="mb-3">
                      <ThinkingProcess
                        steps={message.thinkingSteps}
                        isCollapsed={message.isThinkingCollapsed}
                        onToggleCollapse={() => onToggleThinking?.(message.id)}
                      />
                    </div>
                  )}

                  {/* Message Content */}
                  <div
                    className={`text-sm leading-relaxed ${
                      message.role === 'assistant' ? 'text-gray-800' : ''
                    }`}
                  >
                    {message.content.split('\n').map((line, i) => {
                      // Handle bold text
                      const parts = line.split(/(\*\*[^*]+\*\*)/g);
                      return (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>
                          {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return (
                                <strong key={j} className="font-semibold">
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            // Handle list items
                            if (part.trim().match(/^\d+\./)) {
                              return (
                                <span key={j} className="block ml-2">
                                  {part}
                                </span>
                              );
                            }
                            return <span key={j}>{part}</span>;
                          })}
                        </p>
                      );
                    })}
                  </div>
                </div>

                {/* Timestamp */}
                <p className="text-[10px] text-gray-400 mt-1">
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <VonLogo size={28} />
            <div className="flex items-center gap-1">
              <motion.div
                className="w-2 h-2 rounded-full bg-gray-400"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-gray-400"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 rounded-full bg-gray-400"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div
          className="p-[1px] rounded-2xl"
          style={{
            background:
              'radial-gradient(198.27% 158.06% at 85.59% -18.75%, #FFF2E9 0%, #FF9E8C 26%, #BE9AF3 100%)',
          }}
        >
          <div className="bg-white rounded-[15px] px-3 py-3">
            {/* Text input area */}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              rows={1}
              className="w-full resize-none outline-none bg-transparent text-sm placeholder-gray-400 min-h-[24px] max-h-[120px] disabled:opacity-50 mb-3"
            />

            {/* Bottom row: File upload + Mode toggle + Send */}
            <div className="flex items-center gap-2">
              {/* File upload button */}
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors cursor-pointer"
                title="Upload file"
              >
                <Plus size={16} weight="bold" />
              </button>

              {/* Mode toggle */}
              <ModeToggle mode={mode} onModeChange={onModeChange || (() => {})} size="sm" />

              {/* Spacer */}
              <div className="flex-1" />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  inputValue.trim() && !isLoading
                    ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <PaperPlaneTilt size={16} weight="fill" className="rotate-45" />
              </button>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Von AI may make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
};

export default BuildChat;
