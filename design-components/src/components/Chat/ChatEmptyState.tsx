import React, { useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { ChatInputSelector } from './ChatInputSelector';
import { LOGO_MARK_URL } from '../../constants';
import type { SendMessageOptions } from './types';
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type Template,
  type TemplateCategory,
} from '../Templates';
import type { BuildMode } from './StandardChatInput/types';
import type { ConversationMode } from './StandardChatInput/types';
import type { FileAttachment } from './FileAttachment/types';
import type { Command, DashboardOption } from '../Commands';
import type { MentionItem } from '../Mentions';

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
   * Disable message submission — the send button, Enter key, AND the
   * example prompts/category pills. Input field remains enabled for
   * typing (use `disableInput` to also block typing).
   * @default false
   */
  disableSubmit?: boolean;
  /**
   * Fully disable the input — blocks typing AND submission. Pair with
   * `disabledTooltip` to explain why. Stronger than `disableSubmit`.
   * @default false
   */
  disableInput?: boolean;
  /**
   * Tooltip surfaced on hover when the input is disabled.
   */
  disabledTooltip?: string;
  /**
   * Callback when a disabled prompt/input is clicked
   */
  onDisabledClick?: () => void;
  /**
   * Callback when a template category pill is clicked
   */
  onTemplateCategoryClick?: (category: TemplateCategory) => void;
  /**
   * Callback when a suggested prompt card is clicked (position is 1-based)
   */
  onTemplateClick?: (template: Template, position: number) => void;
  /**
   * Callback when the left/right arrow is clicked to scroll prompts
   */
  onTemplateArrowClick?: (direction: 'left' | 'right', activeCategory: TemplateCategory) => void;
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
  lockedConversationMode?: ConversationMode;
  /**
   * Controlled attachments from parent (wired to useFileUploadPipeline)
   */
  controlledAttachments?: FileAttachment[];
  /**
   * Callback to remove an attachment (controlled mode)
   */
  onRemoveAttachment?: (id: string) => void;
  /**
   * Callback when files are selected (controlled mode)
   */
  onFilesSelected?: (files: File[]) => void;
  /**
   * File validation error message to display above the input
   */
  fileErrorMessage?: string | null;
  /**
   * Callback to dismiss the file error toast
   */
  onDismissFileError?: () => void;
  /** Prefetched commands list */
  commands?: Command[];
  /** True while the initial commands fetch is in-flight */
  isLoadingCommands?: boolean;
  /** Called for both create and edit */
  onSaveCommand?: (
    data: Pick<Command, 'name' | 'prompt' | 'prefillText' | 'sharingScope'>,
    editingId?: string
  ) => void | Promise<void>;
  /** Called when a command is deleted */
  onDeleteCommand?: (id: string) => void;
  /** True while a save/delete mutation is in-flight */
  isSavingCommand?: boolean;
  /** Called when the bookmark/favorite icon is toggled on a command */
  onToggleFavorite?: (command: Command) => void;
  /** Fetches a presigned download URL for a command's already-uploaded data source file */
  onRequestFilePreviewUrl?: (s3Key: string) => Promise<string>;
  /** Eagerly uploads a file when the user picks it in the command drawer */
  onUploadFile?: (commandId: string, file: File) => Promise<{ fileId: string; s3Key: string }>;
  /** Dashboards available to tag onto commands (renders the chip-picker when provided) */
  availableDashboards?: DashboardOption[];
  /** Tenant members available as schedule recipients */
  tenantMembers?: import('../Commands/types').ScheduleRecipient[];
  /** Current user — auto-added as recipient when schedule is first enabled */
  currentUser?: import('../Commands/types').ScheduleRecipient;
  /** Called when the user clicks "Send test" in the schedule section */
  onSendTest?: (
    data: Pick<Command, 'name' | 'prompt'>,
    dataSources: import('../Commands/types').CommandAttachment[],
    recipients: import('../Commands/types').ScheduleRecipient[]
  ) => Promise<void>;
  /** Agent modes available for selection in the plus menu */
  availableAgentModes?: ConversationMode[];
  /** Enable @ mentions feature */
  enableMentions?: boolean;
  /** Available mention items for the @ overlay */
  mentionItems?: MentionItem[];
  /** Loading state for mention items */
  isLoadingMentions?: boolean;
  /** Called when a mention is selected from the @ overlay */
  onSelectMention?: (item: MentionItem) => void;
  /** Called when the user first types "@" — use to lazy-load mention items */
  onMentionsActivated?: () => void;
  /** Dashboard mention to auto-add when chat opens alongside a dashboard */
  dashboardMention?: MentionItem | null;
  /** Widget mentions added by the user via the Add-to-Chat widget icon */
  widgetMentions?: MentionItem[];
  /** Called when a widget chip is removed via its X button */
  onWidgetMentionRemoved?: (args: { id: string }) => void;

  /** Click handler for the mic button in the empty-state input. */
  onVoiceInput?: () => void;
  /** Red-fill / stop-icon state when a voice session is active. */
  isRecording?: boolean;
  /** Voice dictation state — drives the in-input UI. */
  voiceStatus?: 'idle' | 'connecting' | 'listening' | 'reconnecting' | 'processing';
  /** Visualizer rendered inside the input during listening. */
  voiceVisualizer?: React.ReactNode;
  /** Cancel handler for the X button on the voice input. */
  onVoiceCancel?: () => void;
  /** Confirm handler for the ✓ button on the voice input. */
  onVoiceConfirm?: () => void;
  /** Voice-side error banner shown above the input. */
  voiceError?: string | null;
  /** Dismiss handler for the voice error banner. */
  onDismissVoiceError?: () => void;

  /** Controlled input value — when provided, overrides internal state.
   *  Voice transcription streams interim transcripts via this prop. */
  inputValue?: string;
  /** Fires on any input change (user typing or external set). */
  onInputValueChange?: (value: string) => void;
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
  disableSubmit = false,
  disableInput = false,
  disabledTooltip,
  onDisabledClick,
  onTemplateCategoryClick,
  onTemplateClick,
  onTemplateArrowClick,
  placeholder = 'Ask von anything',
  enableCommands = false,
  banner,
  topBanner,
  enableFileUpload = false,
  onFileError,
  droppedFiles,
  onDroppedFilesProcessed,
  mode = 'ask',
  onModeChange,
  useStandardInput = false,
  isAgentLocked,
  lockedConversationMode,
  controlledAttachments,
  onRemoveAttachment,
  onFilesSelected,
  fileErrorMessage,
  onDismissFileError,
  commands,
  isLoadingCommands,
  onSaveCommand,
  onDeleteCommand,
  isSavingCommand,
  tenantMembers,
  currentUser,
  onSendTest,
  onToggleFavorite,
  onRequestFilePreviewUrl,
  onUploadFile,
  availableDashboards,
  availableAgentModes,
  enableMentions,
  mentionItems,
  isLoadingMentions,
  onSelectMention,
  onMentionsActivated,
  dashboardMention,
  widgetMentions,
  onWidgetMentionRemoved,
  onVoiceInput,
  isRecording,
  voiceStatus,
  voiceVisualizer,
  onVoiceCancel,
  onVoiceConfirm,
  voiceError,
  onDismissVoiceError,
  inputValue: controlledInputValue,
  onInputValueChange,
}) => {
  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  const displayName = userName || 'there';

  // Track input value for template filling. When `inputValue` is supplied
  // by the parent (e.g. voice transcription), the controlled value wins.
  const [internalInputValue, setInternalInputValue] = useState(defaultValue);
  const isInputControlled = controlledInputValue !== undefined;
  const inputValue = isInputControlled ? controlledInputValue : internalInputValue;
  const setInputValue = useCallback(
    (next: string) => {
      if (!isInputControlled) setInternalInputValue(next);
      onInputValueChange?.(next);
    },
    [isInputControlled, onInputValueChange]
  );

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

  const scrollBy = useCallback(
    (direction: 'left' | 'right') => {
      const container = scrollContainerRef.current;
      if (!container) return;
      // Scroll 4 cards at once: 4 cards (w-48 = 192px each) + 3 gaps (gap-3 = 12px each) = 804px
      const scrollAmount = 804;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      onTemplateArrowClick?.(direction, activeCategory);
    },
    [activeCategory, onTemplateArrowClick]
  );

  const handleCategoryChange = useCallback(
    (category: TemplateCategory) => {
      setActiveCategory(category);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
      }
      setShowLeftChevron(false);
      setShowRightChevron(true);
      onTemplateCategoryClick?.(category);
    },
    [onTemplateCategoryClick]
  );

  // Templates/category pills are blocked whenever submission is — that
  // covers both `disableSubmit` and the stronger `disableInput`.
  const promptsDisabled = disableSubmit || disableInput;

  const handleTemplateClick = useCallback(
    (template: Template, position: number) => {
      if (promptsDisabled) {
        onDisabledClick?.();
        return;
      }
      // Fill the input with the template prompt
      setInputValue(template.prompt);
      onTemplateClick?.(template, position);
    },
    [promptsDisabled, onDisabledClick, onTemplateClick]
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
      className="flex flex-col items-center justify-start flex-1 min-h-0 px-6 pt-6 overflow-y-auto "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Top Banner (if provided) - at very top */}
      {topBanner && (
        <motion.div
          className="w-full max-w-3xl mb-8"
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
        className="mb-3"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <img src={LOGO_MARK_URL} alt="Von" width={44} height={44} />
      </motion.div>

      {/* Personalized Greeting */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <h2 className="text-3xl text-gray-900 tracking-tight">
          {greeting}, {displayName}
        </h2>
        <p className="text-3xl text-gray-900 tracking-tight">How can I help you today?</p>
      </motion.div>

      {/* Banner (if provided) */}
      {banner && (
        <motion.div
          className="w-full max-w-3xl mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          {banner}
        </motion.div>
      )}

      {/* Input Field - Using ChatInput or StandardChatInput component */}
      <motion.div
        className="w-full max-w-3xl mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <ChatInputSelector
          useStandardInput={useStandardInput}
          enableCommands={enableCommands}
          commands={commands}
          isLoadingCommands={isLoadingCommands}
          onSaveCommand={onSaveCommand}
          onDeleteCommand={onDeleteCommand}
          isSavingCommand={isSavingCommand}
          tenantMembers={tenantMembers}
          currentUser={currentUser}
          onSendTest={onSendTest}
          onToggleFavorite={onToggleFavorite}
          onRequestFilePreviewUrl={onRequestFilePreviewUrl}
          onUploadFile={onUploadFile}
          availableDashboards={availableDashboards}
          placeholder={placeholder}
          onSend={handleSend}
          disabled={disableInput}
          disabledTooltip={disabledTooltip}
          disableSubmit={disableSubmit || disableInput}
          value={inputValue}
          onChange={handleInputChange}
          onDisabledInput={onDisabledClick}
          hideDisclaimer
          autoFocus
          enableFileUpload={enableFileUpload}
          onFileError={onFileError}
          droppedFiles={droppedFiles}
          onDroppedFilesProcessed={onDroppedFilesProcessed}
          mode={mode}
          onModeChange={onModeChange}
          isAgentLocked={isAgentLocked}
          lockedConversationMode={lockedConversationMode}
          attachments={controlledAttachments}
          onRemoveAttachment={onRemoveAttachment}
          onFilesSelected={onFilesSelected}
          fileErrorMessage={fileErrorMessage}
          onDismissFileError={onDismissFileError}
          availableAgentModes={availableAgentModes}
          enableMentions={enableMentions}
          mentionItems={mentionItems}
          isLoadingMentions={isLoadingMentions}
          onSelectMention={onSelectMention}
          onMentionsActivated={onMentionsActivated}
          dashboardMention={dashboardMention}
          widgetMentions={widgetMentions}
          onWidgetMentionRemoved={onWidgetMentionRemoved}
          onVoiceInput={onVoiceInput}
          isRecording={isRecording}
          voiceStatus={voiceStatus}
          voiceVisualizer={voiceVisualizer}
          onVoiceCancel={onVoiceCancel}
          onVoiceConfirm={onVoiceConfirm}
          voiceError={voiceError}
          onDismissVoiceError={onDismissVoiceError}
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
            return (
              <button
                key={category}
                onClick={() => !promptsDisabled && handleCategoryChange(category)}
                className={`
                  px-3 py-1 text-xs font-medium rounded-full
                  transition-all duration-200 inline-flex items-center gap-1
                  ${
                    isActive
                      ? 'bg-gray-50 border border-gray-200 shadow-xs text-gray-900'
                      : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200'
                  }
                  ${promptsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
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
            {templates.map((template, index) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template, index + 1)}
                className={`
                  shrink-0 w-48 px-4 py-2.5
                  rounded-xl bg-white border border-gray-100
                  text-left transition-all flex flex-col justify-start
                  ${
                    promptsDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-gray-200 cursor-pointer'
                  }
                `}
              >
                <div className="text-sm text-gray-800 line-clamp-3">{template.shortPrompt}</div>
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
