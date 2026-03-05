import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import { SendIcon, StopIcon } from './icons';
import { RichTextInput, hasPlaceholders } from './RichTextInput';
import { FilePreview } from './FileAttachment/FilePreview';
import { useFileUpload } from './FileAttachment/useFileUpload';
import { getAcceptString } from './FileAttachment/types';
import type { FileAttachment } from './FileAttachment/types';
import type { BuildMode } from './StandardChatInput/types';

export interface ChatInputProps {
  /**
   * Placeholder text for the input
   * @default 'Ask von anything'
   */
  placeholder?: string;

  /**
   * Callback when send/enter is pressed
   * Now includes optional file attachments
   */
  onSend?: (message: string, attachments?: FileAttachment[]) => void;

  /**
   * Callback when stop button is clicked during streaming
   */
  onStop?: () => void;

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

  /**
   * Whether to disable message submission (send button and Enter key)
   * Keeps the input field enabled for typing
   * @default false
   */
  disableSubmit?: boolean;

  /**
   * Controlled value for the input (makes component controlled)
   */
  value?: string;

  /**
   * Callback when input value changes (for controlled mode)
   */
  onChange?: (value: string) => void;

  /**
   * Callback when user tries to type while submit is disabled
   */
  onDisabledInput?: () => void;

  /**
   * Hide the disclaimer text below the input
   * @default false
   */
  hideDisclaimer?: boolean;

  /**
   * Enable file attachment functionality
   * @default false
   */
  enableFileUpload?: boolean;

  /**
   * Callback when a file validation error occurs
   */
  onFileError?: (error: string, message: string) => void;

  /**
   * Files dropped via drag-and-drop (from parent component)
   * These will be added to attachments when provided
   */
  droppedFiles?: File[];

  /**
   * Callback when dropped files have been processed
   */
  onDroppedFilesProcessed?: () => void;

  /**
   * Show mode toggle (Ask/Build) in the input
   * @default false
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
   * Auto-focus the input on mount
   * @default false
   */
  autoFocus?: boolean;

  /**
   * Optional node rendered above the input when a slash command is active
   * (e.g. a CommandChip showing the selected command with a remove button).
   */
  contextBar?: ReactNode;
  /** Called when the user presses Escape to dismiss the commands overlay */
  onCloseCommandsList?: () => void;
}

/**
 * Chat input component with simple textarea and optional file attachments
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  placeholder = 'Ask von anything',
  onSend,
  onStop,
  contextTag,
  disabled = false,
  isStreaming = false,
  disableSubmit = false,
  value,
  onChange,
  onDisabledInput,
  hideDisclaimer = false,
  enableFileUpload = false,
  onFileError,
  droppedFiles,
  onDroppedFilesProcessed,
  autoFocus = false,
  contextBar,
  onCloseCommandsList,
}) => {
  const [internalMessage, setInternalMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // File upload hook
  const { attachments, addFiles, removeFile, clearFiles, openFilePicker, fileInputRef } =
    useFileUpload({
      onError: (error, message) => {
        onFileError?.(error, message);
      },
    });

  // Handle dropped files from parent (drag-drop overlay)
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0 && enableFileUpload) {
      addFiles(droppedFiles);
      onDroppedFilesProcessed?.();
    }
  }, [droppedFiles, enableFileUpload, addFiles, onDroppedFilesProcessed]);

  // Determine if component is controlled
  const isControlled = value !== undefined;
  const message = isControlled ? value : internalMessage;
  const messageHasPlaceholders = hasPlaceholders(message);
  const hasAttachments = attachments.length > 0;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleChange = useCallback(
    (newValue: string) => {
      // Trigger callback if user is typing while submit is disabled
      if (disableSubmit && newValue.length > message.length) {
        onDisabledInput?.();
      }

      if (isControlled) {
        onChange?.(newValue);
      } else {
        setInternalMessage(newValue);
      }
    },
    [disableSubmit, message.length, onDisabledInput, isControlled, onChange]
  );

  const handleSend = useCallback(() => {
    // Don't send if submit is disabled
    if (disableSubmit) {
      return;
    }

    const messageToSend = message.trim();
    const hasContent = messageToSend || hasAttachments;

    if (hasContent && onSend) {
      onSend(messageToSend, hasAttachments ? attachments : undefined);
      // Clear the input and attachments after sending
      if (isControlled) {
        onChange?.('');
      } else {
        setInternalMessage('');
      }
      clearFiles();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [
    disableSubmit,
    message,
    hasAttachments,
    onSend,
    attachments,
    isControlled,
    onChange,
    clearFiles,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Detect actual mobile devices via user agent (phones/tablets)
      // Touch capability alone is not reliable - many desktop browsers support touch
      // iPadOS 13+ in desktop mode uses macOS-style UA, so also check for MacIntel with touch
      const isMobileDevice =
        typeof navigator !== 'undefined' &&
        (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) ||
          (navigator.platform === 'MacIntel' &&
            typeof navigator.maxTouchPoints === 'number' &&
            navigator.maxTouchPoints > 1));

      if (e.key === 'Escape' && onCloseCommandsList) {
        e.preventDefault();
        onCloseCommandsList();
        return;
      }
      if (!isMobileDevice && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isStreaming && !disableSubmit) {
          handleSend();
        }
      }
    },
    [isStreaming, disableSubmit, handleSend, onCloseCommandsList]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!enableFileUpload) return;
      const files = Array.from(e.clipboardData.files);
      if (files.length > 0) {
        e.preventDefault();
        addFiles(files);
      }
    },
    [enableFileUpload, addFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        // Reset input so the same file can be selected again
        e.target.value = '';
      }
    },
    [addFiles]
  );

  const canSend = (message.trim() || hasAttachments) && !disabled && !disableSubmit;

  return (
    <div className="bg-white antialiased px-2">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-1.5">
        {contextTag && (
          <div className="inline-block self-start px-2.5 py-1 bg-orange-50 rounded-xl text-xs text-gray-600  mb-1">
            {contextTag}
          </div>
        )}

        {/* Command chip - shown above the input when a command is selected */}
        {contextBar && (
          <div className="flex items-center px-1 pb-4 pt-1 -mb-4 bg-gray-50 border-t border-r border-l border-gray-100 rounded-t-xl">
            {contextBar}
          </div>
        )}

        <div
          className={`p-[1px] rounded-2xl transition-all duration-200 ${
            disabled
              ? isStreaming
                ? 'opacity-75 cursor-not-allowed'
                : 'opacity-60 cursor-not-allowed'
              : 'shadow-sm hover:shadow-md'
          }`}
          style={{
            background:
              disabled && !isStreaming
                ? '#e5e7eb'
                : 'radial-gradient(198.27% 158.06% at 85.59% -18.75%, #FFF2E9 0%, #FF9E8C 26%, #BE9AF3 100%)',
          }}
        >
          <div className="flex flex-col bg-white rounded-[15px] overflow-hidden">
            {/* File previews - shown above the input when files are attached */}
            {hasAttachments && (
              <div className="px-3 pt-3 pb-2 border-b border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <FilePreview
                      key={attachment.id}
                      attachment={attachment}
                      onRemove={removeFile}
                      removable={!disabled}
                      size="medium"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Input row */}
            <div className="flex items-center gap-2 px-3 py-2">
              {/* File attachment button */}
              {enableFileUpload && (
                <>
                  <button
                    onClick={openFilePicker}
                    disabled={disabled && !isStreaming}
                    className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-150 border ${
                      disabled && !isStreaming
                        ? 'cursor-not-allowed opacity-50 bg-white border-gray-200 text-gray-400'
                        : 'cursor-pointer bg-white border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                    }`}
                    aria-label="Attach files"
                  >
                    <PlusIcon size={18} weight="bold" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={getAcceptString()}
                    onChange={handleFileInputChange}
                    className="hidden"
                    aria-hidden="true"
                  />
                </>
              )}

              {/* Mode toggle (Ask/Build) - removed, was DashboardBuilder-specific */}

              {/* Text input */}
              {messageHasPlaceholders ? (
                <RichTextInput
                  value={message}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={placeholder}
                  disabled={disabled && !isStreaming}
                  className="flex-1 w-0 min-w-0 outline-none bg-transparent text-sm placeholder-gray-400 disabled:cursor-not-allowed settings-scrollbar"
                  style={{
                    minHeight: '20px',
                    maxHeight: '200px',
                    lineHeight: '1.5',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                />
              ) : (
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => handleChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={placeholder}
                  disabled={disabled && !isStreaming}
                  autoFocus={autoFocus}
                  className="flex-1 w-0 min-w-0 resize-none outline-none bg-transparent text-sm placeholder-gray-400 overflow-y-auto overflow-x-hidden disabled:cursor-not-allowed settings-scrollbar"
                  style={{
                    minHeight: '20px',
                    maxHeight: '200px',
                    lineHeight: '1.5',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                  rows={1}
                />
              )}

              {/* Send/Stop button */}
              {isStreaming ? (
                // Stop button during streaming
                <button
                  className="w-8 h-8 flex-shrink-0 rounded-full border-0 bg-white flex items-center justify-center text-gray-900 transition-all duration-150 cursor-pointer hover:opacity-80"
                  onClick={onStop}
                  aria-label="Stop generating"
                >
                  <StopIcon />
                </button>
              ) : (
                // Send button when not streaming
                <button
                  className={`w-8 h-8 flex-shrink-0 rounded-full border-0 bg-gray-900 flex items-center justify-center text-white transition-all duration-150 ${
                    !canSend
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-gray-800 hover:shadow-lg'
                  }`}
                  onClick={handleSend}
                  disabled={!canSend}
                  aria-label="Send message"
                >
                  <SendIcon size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {!hideDisclaimer && (
          <div className="text-xs leading-normal text-gray-500 text-center  mt-1">
            Von AI may make mistakes. Please recheck all important information.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
