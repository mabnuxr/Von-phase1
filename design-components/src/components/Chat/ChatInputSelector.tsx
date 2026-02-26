import { forwardRef, useCallback } from 'react';
import { ChatInput } from './ChatInput';
import { StandardChatInput } from './StandardChatInput';
import type { StandardChatInputRef } from './StandardChatInput';
import type { BuildMode } from '../DashboardBuilder';
import type { FileAttachment } from './FileAttachment/types';
import type { AgentMode } from './StandardChatInput/types';
import type { SendMessageOptions } from './types';
import { CommandsOverlay } from '../Commands';
import type { Command } from '../Commands';
import { CommandStrip } from './CommandStrip';

// Re-export SendMessageOptions for consumers who import from this file
export type { SendMessageOptions } from './types';

// Re-export StandardChatInputRef as ChatInputSelectorRef for consumers
export type ChatInputSelectorRef = StandardChatInputRef;

import { getPlainText } from './utils/text';
import { useCommandInputState } from './hooks/useCommandInputState';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ChatInputSelectorProps {
  /** Use StandardChatInput instead of ChatInput */
  useStandardInput: boolean;
  /** Enable slash commands feature */
  enableCommands: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /**
   * Callback when send/enter is pressed.
   * `options.command` is populated when the user selected a slash command.
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
  /** Whether to show the plus menu button (with agents and upload options) */
  showPlusMenu?: boolean;
  /** Controlled file attachments (when provided, input uses controlled mode) */
  attachments?: FileAttachment[];
  /** Callback when a file is removed in controlled mode */
  onRemoveAttachment?: (id: string) => void;
  /** Callback when files are selected in controlled mode */
  onFilesSelected?: (files: File[]) => void;
  /** File validation error message to display above the input */
  fileErrorMessage?: string | null;
  /** Callback to dismiss the file error toast */
  onDismissFileError?: () => void;

  // -------------------------------------------------------------------------
  // Commands props (used when enableCommands=true)
  // -------------------------------------------------------------------------

  /** Prefetched commands list — should be fetched when this component mounts */
  commands?: Command[];
  /** True while the initial commands fetch is in-flight */
  isLoadingCommands?: boolean;
  /**
   * Called for both create and edit.
   * Pass `editingId` to update; omit to create.
   */
  onSaveCommand?: (
    data: Pick<Command, 'name' | 'prompt' | 'prefillText' | 'sharingScope'>,
    editingId?: string
  ) => void;
  /** Called when a command is deleted from the manage drawer */
  onDeleteCommand?: (id: string) => void;
  /** True while a save/delete mutation is in-flight */
  isSavingCommand?: boolean;
  /** When true, the "Org-wide" sharing option is available in the command drawer */
  isAdmin?: boolean;
  /** Called when the bookmark/favorite icon is toggled on a command */
  onToggleFavorite?: (command: Command) => void;
  /** Fetches a presigned download URL for a command's already-uploaded data source file */
  onRequestFilePreviewUrl?: (s3Key: string) => Promise<string>;
  /** Eagerly uploads a file when picked in the command drawer */
  onUploadFile?: (commandId: string, file: File) => Promise<{ fileId: string; s3Key: string }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Selector component that renders the appropriate chat input based on configuration.
 * When enableCommands=true it also manages slash-command state and renders CommandsOverlay.
 */
export const ChatInputSelector = forwardRef<ChatInputSelectorRef, ChatInputSelectorProps>(
  (
    {
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
      showPlusMenu,
      attachments: controlledAttachments,
      onRemoveAttachment,
      onFilesSelected,
      fileErrorMessage,
      onDismissFileError,
      // Commands props
      commands = [],
      isLoadingCommands = false,
      onSaveCommand,
      onDeleteCommand,
      isSavingCommand = false,
      isAdmin = false,
      onToggleFavorite,
      onRequestFilePreviewUrl,
      onUploadFile,
    },
    ref
  ) => {
    // -----------------------------------------------------------------------
    // Slash-command state (only active when enableCommands=true)
    // -----------------------------------------------------------------------
    const {
      showCommandsList,
      commandSearch,
      selectedCommand,
      handleChange,
      handleSelectCommand,
      handleCloseCommandsList,
      clearSelectedCommand,
      dismissCommandsList,
    } = useCommandInputState({ enableCommands, onChange });

    // If the selected command is deleted, clear it from the chip.
    const handleDeleteCommand = useCallback(
      (id: string) => {
        if (selectedCommand?.id === id) {
          clearSelectedCommand();
        }
        onDeleteCommand?.(id);
      },
      [onDeleteCommand, selectedCommand, clearSelectedCommand]
    );

    const buildCommandStrip = (command: Command) => (
      <CommandStrip
        command={command}
        onRemove={clearSelectedCommand}
        onRequestFilePreviewUrl={onRequestFilePreviewUrl}
      />
    );

    // -----------------------------------------------------------------------
    // Build props shared across all input variants
    // -----------------------------------------------------------------------

    const baseCommonProps = {
      placeholder,
      onStop,
      disabled,
      isStreaming,
      disableSubmit,
      value,
      onChange: handleChange,
    };

    // Wrap onSend for ChatInput so that a selected command is forwarded via options,
    // even though ChatInput itself only accepts (message, attachments).
    const chatInputOnSend: ((message: string, attachments?: FileAttachment[]) => void) | undefined =
      onSend
        ? (message: string, attachments?: FileAttachment[]) => {
            if (enableCommands && selectedCommand) {
              const plainMessage = getPlainText(message).trim();
              onSend(plainMessage, attachments, { command: selectedCommand });
              onChange?.('');
              // Command chip stays visible and removable after send
              return;
            }
            onSend(message, attachments);
            if (enableCommands) dismissCommandsList();
          }
        : undefined;

    let chatInput = (
      <ChatInput
        {...baseCommonProps}
        onSend={chatInputOnSend}
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
        contextBar={
          enableCommands && selectedCommand ? buildCommandStrip(selectedCommand) : undefined
        }
      />
    );

    if (useStandardInput) {
      const sharedStandardProps = {
        ...baseCommonProps,
        onDisabledInput,
        hideDisclaimer,
        onFileError,
        droppedFiles,
        onDroppedFilesProcessed,
        mode,
        onModeChange,
        isAgentLocked,
        lockedAgentMode,
        showPlusMenu,
        attachments: controlledAttachments,
        onRemoveAttachment,
        onFilesSelected,
        fileErrorMessage,
        onDismissFileError,
      };

      // Wrap onSend to handle command execution
      const standardOnSend = onSend
        ? (message: string, attachments?: FileAttachment[], agentMode?: AgentMode) => {
            if (selectedCommand) {
              const plainMessage = getPlainText(message).trim();
              onSend(plainMessage, attachments, { agentMode, command: selectedCommand });
              onChange?.('');
              // Command chip stays visible and removable after send
              return;
            }
            onSend(message, attachments, { agentMode });
            dismissCommandsList();
          }
        : undefined;

      chatInput = (
        <StandardChatInput
          ref={ref}
          {...sharedStandardProps}
          onSend={standardOnSend}
          enableCommands={enableCommands}
          contextBar={selectedCommand ? buildCommandStrip(selectedCommand) : undefined}
        />
      );
    }

    return (
      <div className="relative">
        {enableCommands && (
          <CommandsOverlay
            showCommandsList={showCommandsList}
            commandSearch={commandSearch}
            commands={commands}
            isLoading={isLoadingCommands}
            onSelectCommand={handleSelectCommand}
            onCloseCommandsList={handleCloseCommandsList}
            onSaveCommand={onSaveCommand ?? (() => {})}
            onDeleteCommand={handleDeleteCommand}
            isSaving={isSavingCommand}
            isAdmin={isAdmin}
            onToggleFavorite={onToggleFavorite}
            onRequestFilePreviewUrl={onRequestFilePreviewUrl}
            onUploadFile={onUploadFile}
          />
        )}
        {chatInput}
      </div>
    );
  }
);

ChatInputSelector.displayName = 'ChatInputSelector';
