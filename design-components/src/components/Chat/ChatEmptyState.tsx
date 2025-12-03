import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChatInput } from './ChatInput';

export interface ChatEmptyStateProps {
  /**
   * User's first name for personalized greeting
   */
  userName?: string;
  /**
   * Optional example prompts to show
   */
  examplePrompts?: string[];
  /**
   * Callback when a message is sent (from input or prompt click)
   */
  onSendMessage?: (message: string) => void;
  /**
   * Whether the input/prompts are disabled
   */
  disabled?: boolean;
  /**
   * Callback when a disabled prompt/input is clicked
   */
  onDisabledClick?: () => void;
  /**
   * Placeholder text for the input
   */
  placeholder?: string;
}

/**
 * Get greeting based on time of day
 */
const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'Good evening';
  } else {
    return 'Good evening';
  }
};

/**
 * Beautiful empty state for chat with animations
 */
export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  userName,
  examplePrompts = [
    'Show me my \n revenue forecast',
    'What deals are \n at risk this quarter',
    'Generate a \n sales report',
  ],
  onSendMessage,
  disabled = false,
  onDisabledClick,
  placeholder = 'Ask von anything',
}) => {
  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  const displayName = userName || 'there';

  const handlePromptClick = (prompt: string) => {
    if (disabled) {
      onDisabledClick?.();
      return;
    }
    onSendMessage?.(prompt);
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-start flex-1 min-h-0 px-6 pt-36 overflow-y-auto font-sf"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Animated Icon - Von Logo */}
      <motion.div
        className="mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg width="48" height="48" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z" fill="url(#paint0_radial_empty_state)"/>
          <path d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z" stroke="white" strokeWidth="1.33"/>
          <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33"/>
          <defs>
            <radialGradient id="paint0_radial_empty_state" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(21.875 1.75) rotate(120.964) scale(30.6125)">
              <stop stopColor="#FFF3EB"/>
              <stop offset="0.26" stopColor="#FF9042"/>
              <stop offset="1" stopColor="#854FFF"/>
            </radialGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Personalized Greeting */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h2 className="text-3xl text-gray-900">
          {greeting}, {displayName}
        </h2>
        <p className="text-3xl text-gray-600">
          How can I help you today?
        </p>
      </motion.div>

      {/* Input Field - Using ChatInput component */}
      <motion.div
        className="w-full max-w-3xl mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <ChatInput
          placeholder={placeholder}
          onSend={onSendMessage}
          disabled={disabled}
          disableSubmit={disabled}
          onDisabledInput={onDisabledClick}
        />
      </motion.div>

      {/* Example Prompts - Horizontal Layout */}
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        {/* <p className="text-xs font-medium text-gray-400 uppercase tracking-wider text-center mb-4">
          Or try asking
        </p> */}
        <div className="flex flex-row justify-center gap-3">
          {examplePrompts.map((prompt, index) => (
            <motion.button
              key={prompt}
              className={`px-4 py-2.5 shadow-xs rounded-xl w-full bg-white border border-gray-200 text-sm text-gray-700 font-medium transition-all whitespace-pre-line text-start ${
                disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-gray-300 hover:shadow-sm cursor-pointer'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: disabled ? 0.5 : 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
              whileHover={disabled ? {} : { scale: 1.02 }}
              whileTap={disabled ? {} : { scale: 0.98 }}
              onClick={() => handlePromptClick(prompt)}
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatEmptyState;
