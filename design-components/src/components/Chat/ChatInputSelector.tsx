import React from 'react';
import { ChatInput } from './ChatInput';
import { ChatInputWithCommands } from '../Commands/ChatInputWithCommands';
import { StandardChatInput, StandardChatInputWithCommands } from './StandardChatInput';
import type { BuildMode } from '../DashboardBuilder';
import type { FileAttachment } from './FileAttachment/types';
import type { AgentMode } from './StandardChatInput/types';
import type { SendMessageOptions } from './types';
import type { Command } from '../Commands/types';

// Re-export SendMessageOptions for consumers who import from this file
export type { SendMessageOptions } from './types';

export interface ChatInputSelectorProps {
  /** Use StandardChatInput instead of ChatInput */
  useStandardInput: boolean;
  /** Enable slash commands feature */
  enableCommands: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /**
   * Callback when send/enter is pressed
   * @param message - The message content
   * @param attachments - Optional file attachments
   * @param options - Additional options (agentMode, command, etc.)
   */
  onSend?: (message: string, attachments?: FileAttachment[], options?: SendMessageOptions) => void;
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
  /** Whether agent selection is locked (after first message) */
  isAgentLocked?: boolean;
  /** The agent mode to display when locked (from backend) */
  lockedAgentMode?: AgentMode;
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
  isAgentLocked,
  lockedAgentMode,
}) => {
  // Base props shared by all input variants (excluding onSend which has different signatures)
  const baseCommonProps = {
    placeholder,
    onStop,
    disabled,
    isStreaming,
    disableSubmit,
    value,
    onChange,
  };

  if (useStandardInput) {
    const sharedStandardProps = {
      ...baseCommonProps,
      onDisabledInput,
      onFileError,
      droppedFiles,
      onDroppedFilesProcessed,
      mode,
      onModeChange,
      isAgentLocked,
      lockedAgentMode,
    };

    if (enableCommands) {
      // StandardChatInputWithCommands passes (message, attachments, command, agentMode)
      const commandOnSend = onSend
        ? (
            message: string,
            attachments?: FileAttachment[],
            command?: Command,
            agentMode?: AgentMode
          ) => {
            onSend(message, attachments, { command, agentMode });
          }
        : undefined;

      return <StandardChatInputWithCommands {...sharedStandardProps} onSend={commandOnSend} />;
    }

    // StandardChatInput passes (message, attachments, agentMode)
    const standardOnSend = onSend
      ? (message: string, attachments?: FileAttachment[], agentMode?: AgentMode) => {
          onSend(message, attachments, { agentMode });
        }
      : undefined;

    return <StandardChatInput {...sharedStandardProps} onSend={standardOnSend} />;
  }

  if (enableCommands) {
    // ChatInputWithCommands passes (message, attachments, command) - wrap into SendMessageOptions
    const commandOnSend = onSend
      ? (message: string, attachments?: FileAttachment[], command?: Command) => {
          onSend(message, attachments, { command });
        }
      : undefined;

    return (
      <ChatInputWithCommands
        {...baseCommonProps}
        onSend={commandOnSend}
        onDisabledInput={onDisabledInput}
        hideDisclaimer={hideDisclaimer}
        autoFocus={autoFocus}
      />
    );
  }

  // For ChatInput, onSend doesn't use a third param
  const baseOnSend = onSend as
    | ((message: string, attachments?: FileAttachment[]) => void)
    | undefined;

  return (
    <ChatInput
      {...baseCommonProps}
      onSend={baseOnSend}
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
