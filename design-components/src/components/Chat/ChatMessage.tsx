import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

/**
 * Individual chat message component
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content,
  isLoading = false,
  activeTab: initialActiveTab = 'output',
}) => {
  const isUser = type === 'user';
  const [activeTab, setActiveTab] = useState<'output' | 'sources' | 'thought'>(initialActiveTab);

  return (
    <div>
      {/* Message Container */}
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
        {/* Message Bubble */}
        <div
          className={`
            max-w-[85%] rounded-2xl text-sm break-words antialiased overflow-hidden
            ${
              isUser
                ? 'bg-[#E8EEF7] text-[#1d1d1f] border border-blue-100'
                : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
            }
          `}
        >
          {/* Tabs for assistant messages */}
          {!isUser && !isLoading && (
            <div className="flex gap-4 px-4 py-2 border-b border-gray-200 bg-transparent">
              <div
                className={`
                  text-xs cursor-pointer px-2 py-1 rounded-md transition-all duration-150
                  flex items-center gap-1 select-none
                  ${
                    activeTab === 'output'
                      ? 'font-semibold text-gray-900 bg-gray-100'
                      : 'font-medium text-gray-600 bg-transparent hover:bg-gray-50'
                  }
                `}
                onClick={() => setActiveTab('output')}
              >
                <span>≡</span> Output
              </div>
              <div
                className={`
                  text-xs cursor-pointer px-2 py-1 rounded-md transition-all duration-150
                  flex items-center gap-1 select-none
                  ${
                    activeTab === 'sources'
                      ? 'font-semibold text-gray-900 bg-gray-100'
                      : 'font-medium text-gray-600 bg-transparent hover:bg-gray-50'
                  }
                `}
                onClick={() => setActiveTab('sources')}
              >
                <span>⊞</span> Sources
              </div>
              <div
                className={`
                  text-xs cursor-pointer px-2 py-1 rounded-md transition-all duration-150
                  flex items-center gap-1 select-none
                  ${
                    activeTab === 'thought'
                      ? 'font-semibold text-gray-900 bg-gray-100'
                      : 'font-medium text-gray-600 bg-transparent hover:bg-gray-50'
                  }
                `}
                onClick={() => setActiveTab('thought')}
              >
                <span>◇</span> Thought
              </div>
            </div>
          )}

          {/* Message Content */}
          <div className="px-4 py-3">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  className="flex gap-1 items-center justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-gray-500"
                    animate={{ y: [0, -10, 0], opacity: [0.7, 1, 0.7] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-gray-500"
                    animate={{ y: [0, -10, 0], opacity: [0.7, 1, 0.7] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.2,
                    }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-gray-500"
                    animate={{ y: [0, -10, 0], opacity: [0.7, 1, 0.7] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.4,
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`content-${activeTab}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {content}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
