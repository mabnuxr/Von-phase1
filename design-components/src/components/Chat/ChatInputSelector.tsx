import React from 'react';
import { ChatInput } from './ChatInput';
import { ChatInputWithCommands } from '../Commands/ChatInputWithCommands';
import { StandardChatInput, StandardChatInputWithCommands } from './StandardChatInput';
import type { BuildMode } from '../DashboardBuilder';

export interface ChatInputSelectorProps {
  /** Use StandardChatInput instead of ChatInput */
  useStandardInput: boolean;
  /** Enable slash commands feature */
  enableCommands: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Callback when send/enter is pressed */
  onSend?: (message: string) => void;
  /** Callback when stop button is clicked during streaming */
  onStop?: () => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether a message is actively streaming */
  isStreaming?: boolean;
  /** Whether to disable message submission */
  disableSubmit?: boolean;
  /** Controlled value for the input */
  value?: string;
  /** Callback when input value changes */
  onChange?: (value: string) => void;
  /** Callback when user tries to type while submit is disabled */
  onDisabledInput?: () => void;
  /** Hide the disclaimer text below the input */
  hideDisclaimer?: boolean;
  /** Auto-focus the input on mount */
  autoFocus?: boolean;
  /** Enable file attachment functionality (ChatInput only) */
  enableFileUpload?: boolean;
  /** Callback when a file validation error occurs */
  onFileError?: (error: string, message: string) => void;
  /** Files dropped via drag-and-drop */
  droppedFiles?: File[];
  /** Callback when dropped files have been processed */
  onDroppedFilesProcessed?: () => void;
  /** Show mode toggle (ChatInput only) */
  showModeToggle?: boolean;
  /** Current mode (ask or build) */
  mode?: BuildMode;
  /** Callback when mode changes */
  onModeChange?: (mode: BuildMode) => void;
}

/**
 * Selector component that renders the appropriate chat input based on configuration.
 * Reduces conditional complexity in parent components.
 */
export const ChatInputSelector: React.FC<ChatInputSelectorProps> = ({
  useStandardInput,
  enableCommands,
  placeholder,
  onSend,
  onStop,
  disabled,
  isStreaming,
  disableSubmit,
  value,
  onChange,
  onDisabledInput,
  hideDisclaimer,
  autoFocus,
  enableFileUpload,
  onFileError,
  droppedFiles,
  onDroppedFilesProcessed,
  showModeToggle,
  mode,
  onModeChange,
}) => {
  const commonProps = {
    placeholder,
    onSend,
    onStop,
    disabled,
    isStreaming,
    disableSubmit,
    value,
    onChange,
  };

  if (useStandardInput) {
    const standardProps = {
      ...commonProps,
      onFileError,
      droppedFiles,
      onDroppedFilesProcessed,
      mode,
      onModeChange,
    };

    return enableCommands ? (
      <StandardChatInputWithCommands {...standardProps} />
    ) : (
      <StandardChatInput {...standardProps} />
    );
  }

  if (enableCommands) {
    return (
      <ChatInputWithCommands
        {...commonProps}
        onDisabledInput={onDisabledInput}
        hideDisclaimer={hideDisclaimer}
        autoFocus={autoFocus}
      />
    );
  }

  return (
    <ChatInput
      {...commonProps}
      onDisabledInput={onDisabledInput}
      hideDisclaimer={hideDisclaimer}
      enableFileUpload={enableFileUpload}
      onFileError={onFileError}
      droppedFiles={droppedFiles}
      onDroppedFilesProcessed={onDroppedFilesProcessed}
      showModeToggle={showModeToggle}
      mode={mode}
      onModeChange={onModeChange}
      autoFocus={autoFocus}
    />
  );
};
