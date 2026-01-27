import React, { useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { CaretLeftIcon, CaretRightIcon, StarIcon } from '@phosphor-icons/react';
import { ChatInputSelector } from './ChatInputSelector';
import type { SendMessageOptions } from './types';
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type Template,
  type TemplateCategory,
} from '../Templates';
import type { BuildMode } from '../DashboardBuilder';
import type { AgentMode } from './StandardChatInput/types';
import type { FileAttachment } from './FileAttachment/types';

export interface ChatEmptyStateProps {
  /**
   * User's first name for personalized greeting
   */
  userName?: string;
  /**
   * Callback when a message is sent (from input or prompt click)
   * Includes SendMessageOptions with agentMode when using StandardChatInput
   */
  onSendMessage?: (
    message: string,
    attachments?: FileAttachment[],
    options?: SendMessageOptions
  ) => void;
  /**
   * Default value to pre-fill the input (useful for demos)
   */
  defaultValue?: string;
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
  /**
   * Enable slash commands feature
   */
  enableCommands?: boolean;
  /**
   * Optional banner to display above the input
   */
  banner?: React.ReactNode;
  /**
   * Optional banner to display at the very top of the empty state
   */
  topBanner?: React.ReactNode;
  /**
   * Enable file upload/attachment functionality
   */
  enableFileUpload?: boolean;
  /**
   * Callback when a file validation error occurs
   */
  onFileError?: (error: string, message: string) => void;
  /**
   * Files dropped via drag-and-drop (from parent Chat component)
   */
  droppedFiles?: File[];
  /**
   * Callback when dropped files have been processed
   */
  onDroppedFilesProcessed?: () => void;
  /**
   * Show mode toggle (Ask/Build) in the input
   */
  showModeToggle?: boolean;
  /**
   * Current mode (ask or build)
   */
  mode?: BuildMode;
  /**
   * Callback when mode changes
   */
  onModeChange?: (mode: BuildMode) => void;
  /**
   * Use the new StandardChatInput component with Tiptap editor
   * When enabled, replaces ChatInput/ChatInputWithCommands with StandardChatInput
   * @default false
   */
  useStandardInput?: boolean;
  /**
   * Whether agent selection is locked (after first message)
   */
  isAgentLocked?: boolean;
  /**
   * The agent mode to display when locked (from backend)
   */
  lockedAgentMode?: AgentMode;
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
  onSendMessage,
  defaultValue = '',
  disabled = false,
  onDisabledClick,
  placeholder = 'Ask von anything',
  enableCommands = false,
  banner,
  topBanner,
  enableFileUpload = false,
  onFileError,
  droppedFiles,
  onDroppedFilesProcessed,
  showModeToggle = false,
  mode = 'ask',
  onModeChange,
  useStandardInput = false,
  isAgentLocked,
  lockedAgentMode,
}) => {
  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  const displayName = userName || 'there';

  // Track input value for template filling
  const [inputValue, setInputValue] = useState(defaultValue);

  // Template state
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('Popular');
  const templates = useMemo(() => {
    if (activeCategory === 'Popular') {
      return DEFAULT_TEMPLATES.filter((tpl) => tpl.isPopular === true);
    }
    return DEFAULT_TEMPLATES.filter((tpl) => tpl.category === activeCategory);
  }, [activeCategory]);

  // Scroll state for chevrons
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftChevron, setShowLeftChevron] = useState(false);
  const [showRightChevron, setShowRightChevron] = useState(true);

  const updateChevronVisibility = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftChevron(scrollLeft > 0);
    setShowRightChevron(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useLayoutEffect(() => {
    updateChevronVisibility();
  }, [templates, updateChevronVisibility]);

  const handleScroll = useCallback(() => {
    updateChevronVisibility();
  }, [updateChevronVisibility]);

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // Scroll 4 cards at once: 4 cards (w-48 = 192px each) + 3 gaps (gap-3 = 12px each) = 804px
    const scrollAmount = 804;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const handleCategoryChange = useCallback((category: TemplateCategory) => {
    setActiveCategory(category);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
    setShowLeftChevron(false);
    setShowRightChevron(true);
  }, []);

  const handleTemplateClick = useCallback(
    (template: Template) => {
      if (disabled) {
        onDisabledClick?.();
        return;
      }
      // Fill the input with the template prompt
      setInputValue(template.prompt);
    },
    [disabled, onDisabledClick]
  );

  const handleSend = useCallback(
    (message: string, attachments?: FileAttachment[], options?: SendMessageOptions) => {
      onSendMessage?.(message, attachments, options);
      setInputValue('');
    },
    [onSendMessage]
  );

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center justify-start flex-1 min-h-0 px-6 pt-6 overflow-y-auto font-sf"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Top Banner (if provided) - at very top */}
      {topBanner && (
        <motion.div
          className="w-full max-w-3xl mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          {topBanner}
        </motion.div>
      )}

      {/* Spacer to push content down when no top banner */}
      {!topBanner && <div className="pt-30" />}

      {/* Animated Icon - Von Logo */}
      <motion.div
        className="mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 8C0 3.58172 3.58172 0 8 0H20C24.4183 0 28 3.58172 28 8V20C28 24.4183 24.4183 28 20 28H8C3.58172 28 0 24.4183 0 20V8Z"
            fill="url(#paint0_radial_empty_state)"
          />
          <path
            d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
            stroke="white"
            strokeWidth="1.33"
          />
          <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
          <defs>
            <radialGradient
              id="paint0_radial_empty_state"
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
        <p className="text-3xl text-gray-600">How can I help you today?</p>
      </motion.div>

      {/* Banner (if provided) */}
      {banner && (
        <motion.div
          className="w-full max-w-3xl px-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          {banner}
        </motion.div>
      )}

      {/* Input Field - Using ChatInput or StandardChatInput component */}
      <motion.div
        className="w-full max-w-3xl mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <ChatInputSelector
          useStandardInput={useStandardInput}
          enableCommands={enableCommands}
          placeholder={placeholder}
          onSend={handleSend}
          disabled={disabled}
          disableSubmit={disabled}
          value={inputValue}
          onChange={handleInputChange}
          onDisabledInput={onDisabledClick}
          hideDisclaimer
          autoFocus
          enableFileUpload={enableFileUpload}
          onFileError={onFileError}
          droppedFiles={droppedFiles}
          onDroppedFilesProcessed={onDroppedFilesProcessed}
          showModeToggle={showModeToggle}
          mode={mode}
          onModeChange={onModeChange}
          isAgentLocked={isAgentLocked}
          lockedAgentMode={lockedAgentMode}
        />
      </motion.div>

      {/* Templates Section */}
      <motion.div
        className="w-full max-w-3xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {TEMPLATE_CATEGORIES.map((category) => {
            const isActive = category === activeCategory;
            const isPopular = category === 'Popular';
            return (
              <button
                key={category}
                onClick={() => !disabled && handleCategoryChange(category)}
                className={`
                  px-3 py-1 text-xs font-medium rounded-full
                  transition-all duration-200 inline-flex items-center gap-1
                  ${
                    isActive
                      ? 'bg-gray-100 border border-gray-100 shadow-sm text-gray-900'
                      : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isPopular && <StarIcon size={12} weight="fill" className="text-amber-500" />}
                {category}
              </button>
            );
          })}
        </div>

        {/* Templates Carousel */}
        <div className="relative">
          {/* Left Chevron */}
          {showLeftChevron && (
            <button
              onClick={() => scrollBy('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
              aria-label="Scroll left"
            >
              <CaretLeftIcon size={16} weight="bold" className="text-gray-600" />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-3 overflow-x-auto px-1 py-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className={`
                  flex-shrink-0 w-48 px-4 py-2.5
                  shadow-xs rounded-xl bg-white border border-gray-200
                  text-left transition-all flex flex-col justify-start
                  ${
                    disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-gray-300 hover:shadow-sm cursor-pointer'
                  }
                `}
              >
                <div className="text-sm font-medium text-gray-700 line-clamp-3">
                  {template.shortPrompt}
                </div>
              </button>
            ))}
          </div>

          {/* Right Chevron */}
          {showRightChevron && templates.length > 3 && (
            <button
              onClick={() => scrollBy('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
              aria-label="Scroll right"
            >
              <CaretRightIcon size={16} weight="bold" className="text-gray-600" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Spacer to push disclaimer to bottom */}
      <div className="flex-1" />

      {/* Disclaimer at bottom */}
      <motion.div
        className="w-full text-center pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <p className="text-xs text-gray-500">
          Von AI may make mistakes. Please recheck all important information.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ChatEmptyState;
