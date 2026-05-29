import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  MicrophoneIcon,
  UploadSimpleIcon,
  LineVerticalIcon,
  XIcon,
  CheckIcon,
  CircleNotchIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { SendIcon, StopIcon } from '../icons';
import { Tooltip } from '../../Tooltip';
import { FilePreview } from '../FileAttachment/FilePreview';
import { MentionPreview } from '../FileAttachment/MentionPreview';
import { DragDropOverlay } from '../FileAttachment/DragDropOverlay';
import { FileErrorToast } from '../FileAttachment/FileErrorToast';
import { useFileUpload } from '../FileAttachment/useFileUpload';
import { getAcceptString } from '../FileAttachment/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Toggle as _Toggle } from '../../forms/toggle';
import { SecondaryIconButton, TransparentButton } from '../../forms/buttons';
// ContextMenu removed - using custom menu with submenu support
import type { StandardChatInputProps, StandardChatInputRef } from './types';
import { TiptapEditor, EditorToolbar } from '../../TiptapEditor';
import type { Editor } from '@tiptap/react';
import { ModeSelector } from './ModeSelector';
import { ModeSelectorPill } from './ModeSelectorPill';
import { ChatInputPopover } from './ChatInputPopover';
import { ConversationMode } from './types';
import { TruncateWithText } from '../../TruncateWithText/TruncateWithText';

// Re-export ConversationMode from types for external use
export { ConversationMode } from './types';

/**
 * PlusButtonMenu - Plus button with upload action
 */
interface PlusButtonMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onUploadClick?: () => void;
  disabled?: boolean;
  enableFileUpload?: boolean;
}

const PlusButtonMenu: React.FC<PlusButtonMenuProps> = ({
  isOpen,
  onClose,
  onOpen,
  onUploadClick,
  disabled = false,
  enableFileUpload = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative group/plusbtn">
      <SecondaryIconButton
        icon={<PlusIcon size={16} weight="bold" className="text-gray-800" />}
        onClick={onOpen}
        disabled={disabled}
        title=""
        className="w-7.5! h-7.5! rounded-full! p-0!"
      />

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.1 }}
              className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 p-1 z-50"
            >
              {enableFileUpload && (
                <div className="py-0.5">
                  <TransparentButton
                    icon={<UploadSimpleIcon size={16} className="text-gray-800" />}
                    onClick={() => {
                      onUploadClick?.();
                      onClose();
                    }}
                  >
                    Upload
                  </TransparentButton>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * StandardChatInput - A standardized chat input component
 *
 * Features:
 * - Plus button for file upload (direct, no dropdown)
 * - Ask/Build mode toggle (using forms Toggle component)
 * - Voice input button
 * - Send button
 * - File preview area at the top when files are attached
 * - White background with subtle gradient border
 */

// Mac vs the rest, for labelling the push-to-talk hotkey. Browsers fire the
// same `AltLeft` / `AltRight` keycodes regardless of platform — only the
// human-readable key name differs (⌥ Option on macOS, Alt elsewhere).
const isMacPlatform = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

// Ghost text that appears at the caret position after "/" — no DOM manipulation needed.
const GhostCommandText: React.FC<{ text: string; offset: { left: number; top: number } }> = ({
  text,
  offset,
}) => (
  <span
    className="absolute z-10 pointer-events-none select-none whitespace-pre"
    style={{
      left: offset.left,
      top: offset.top,
      fontSize: '14px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
      lineHeight: '1.5',
      transform: 'translateY(1px)',
    }}
    aria-hidden="true"
  >
    <span className="bg-gray-100 text-gray-400 rounded px-2 py-1">/{text}</span>
  </span>
);

export const StandardChatInput = forwardRef<StandardChatInputRef, StandardChatInputProps>(
  (
    {
      placeholder = 'Type a message...',
      onSend,
      onStop,
      disabled = false,
      autoFocus = false,
      disabledTooltip,
      isStreaming = false,
      disableSubmit = false,
      onDisabledInput,
      value,
      onChange,
      onVoiceInput,
      isRecording = false,
      voiceStatus = 'idle',
      voiceVisualizer,
      onVoiceCancel,
      onVoiceConfirm,
      voiceError,
      onDismissVoiceError,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mode: _mode = 'ask',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onModeChange: _onModeChange,
      attachments: controlledAttachments,
      onRemoveAttachment,
      droppedFiles,
      onDroppedFilesProcessed,
      onFileError,
      onFilesSelected,
      showFormattingToolbar = false,
      // Mode selector props
      showModeSelector = false,
      autoEditMode = 'off',
      onAutoEditModeChange,
      // Popover props
      activePopover,
      onPopoverClose,
      onPopoverPrimaryAction,
      onPopoverFeedback,
      // Agent props
      onBuildDashboard,
      // Disclaimer
      hideDisclaimer = false,
      // Agent selection props (for locking after first message)
      isAgentLocked = false,
      lockedConversationMode = ConversationMode.Auto,
      // Command chip
      contextBar,
      // Commands
      enableCommands = false,
      onCloseCommandsList,
      ghostCommandName,
      // File error props
      fileErrorMessage,
      onDismissFileError,
      // Agent modes
      availableAgentModes = [ConversationMode.Auto],
      // File upload
      enableFileUpload = false,
      onFileUploadClick,
      // Additional Tiptap extensions
      additionalExtensions,
      // Mention previews
      selectedMentions,
      onRemoveMention,
    },
    ref
  ) => {
    const [internalMessage, setInternalMessage] = useState('');
    const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
    const [internalConversationMode, setInternalConversationMode] = useState<ConversationMode>(
      availableAgentModes[0] ?? ConversationMode.Auto
    );
    const editorRef = useRef<Editor | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // Focus the editor on mount when autoFocus is set. Effects run bottom-up
    // in React, so TiptapEditor's effect that populates editorRef.current
    // has already run by the time this fires. A 0ms timeout still hedges
    // against frameworks (framer-motion enter animations etc.) that delay
    // first paint by a tick.
    useEffect(() => {
      if (!autoFocus) return;
      const t = setTimeout(() => editorRef.current?.commands.focus(), 0);
      return () => clearTimeout(t);
    }, [autoFocus]);

    // When the commands list is open, consume the Escape event so it doesn't
    // bubble up to useEscapeToStopStreaming and stop an in-flight message.
    const handleEscape = useCallback((): boolean => {
      if (onCloseCommandsList) {
        onCloseCommandsList();
        return true;
      }
      return false;
    }, [onCloseCommandsList]);

    // Expose imperative methods via ref
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          editorRef.current?.commands.focus();
        },
        getCaretRect: () => {
          const view = editorRef.current?.view;
          if (!view) return null;
          const coords = view.coordsAtPos(view.state.selection.from);
          return { left: coords.left, top: coords.top, bottom: coords.bottom };
        },
        getEditor: () => editorRef.current,
      }),
      []
    );

    // Position ghost text at the caret. Captured once when the ghost first
    // appears — arrow-key navigation changes the label but not the caret position.
    const [caretOffset, setCaretOffset] = useState<{ left: number; top: number } | null>(null);
    const caretCaptured = useRef(false);
    useLayoutEffect(() => {
      if (!ghostCommandName) {
        setCaretOffset(null);
        caretCaptured.current = false;
        return;
      }
      if (caretCaptured.current) return;
      const view = editorRef.current?.view;
      const container = editorContainerRef.current;
      if (!view || !container) return;
      // Step back one position to start at the "/" character so the chip covers it too
      const slashPos = Math.max(0, view.state.selection.from - 1);
      const coords = view.coordsAtPos(slashPos);
      const rect = container.getBoundingClientRect();
      setCaretOffset({ left: coords.left - rect.left, top: coords.top - rect.top });
      caretCaptured.current = true;
    }, [ghostCommandName]);

    // When locked, show the locked mode from backend; otherwise use internal state
    const selectedConversationMode = isAgentLocked
      ? lockedConversationMode
      : internalConversationMode;

    // File upload hook for uncontrolled mode
    const {
      attachments: internalAttachments,
      addFiles,
      removeFile,
      clearFiles,
      fileInputRef,
      isDragActive,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
    } = useFileUpload({
      onError: (error, message) => {
        onFileError?.(error, message);
      },
    });

    // Use controlled or internal attachments
    const isAttachmentsControlled = controlledAttachments !== undefined;
    const attachments = isAttachmentsControlled ? controlledAttachments : internalAttachments;
    const hasAttachments = attachments.length > 0;

    // Show plus button only when file upload is available
    const showPlusButton = enableFileUpload;
    // Show the mode selector pill when multiple agent modes are available
    const hasAgentModes = availableAgentModes.length > 1;
    // Show the enhanced toolbar layout when plus button, commands, mode selector, or attachments are present
    const showPlusMenu = !!(hasAttachments || enableCommands || showPlusButton || hasAgentModes);

    // Handle dropped files from parent
    useEffect(() => {
      if (droppedFiles && droppedFiles.length > 0) {
        if (isAttachmentsControlled) {
          onFilesSelected?.(droppedFiles);
        } else {
          addFiles(droppedFiles);
        }
        onDroppedFilesProcessed?.();
      }
    }, [droppedFiles, isAttachmentsControlled, onFilesSelected, addFiles, onDroppedFilesProcessed]);

    // Determine if component is controlled
    const isControlled = value !== undefined;
    const message = isControlled ? value : internalMessage;

    const handleChange = useCallback(
      (newValue: string) => {
        if (isControlled) {
          onChange?.(newValue);
        } else {
          setInternalMessage(newValue);
        }
      },
      [isControlled, onChange]
    );

    const handleSend = useCallback(() => {
      // Block sending while streaming (agent is still running)
      if (isStreaming) {
        return;
      }

      if (disableSubmit) {
        onDisabledInput?.();
        return;
      }

      // message is now markdown from TiptapEditor
      const hasTextContent = message.trim().length > 0;
      const hasContent = hasTextContent || hasAttachments || Boolean(contextBar);

      if (hasContent && onSend) {
        // Send markdown directly
        const messageToSend = message.trim();

        onSend(messageToSend, hasAttachments ? attachments : undefined, selectedConversationMode);
        if (isControlled) {
          onChange?.('');
        } else {
          setInternalMessage('');
        }
        if (!isAttachmentsControlled) {
          clearFiles();
        }
        // Clear the editor
        if (editorRef.current) {
          editorRef.current.commands.clearContent();
        }
      }
    }, [
      isStreaming,
      disableSubmit,
      onDisabledInput,
      message,
      hasAttachments,
      contextBar,
      onSend,
      attachments,
      isControlled,
      onChange,
      isAttachmentsControlled,
      clearFiles,
      selectedConversationMode,
    ]);

    // handleKeyDown is now managed by TiptapEditor

    const handleFileInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
          if (isAttachmentsControlled) {
            onFilesSelected?.(Array.from(e.target.files));
          } else {
            addFiles(e.target.files);
          }
          e.target.value = '';
        }
      },
      [isAttachmentsControlled, onFilesSelected, addFiles]
    );

    const handleRemoveAttachment = useCallback(
      (id: string) => {
        if (isAttachmentsControlled) {
          onRemoveAttachment?.(id);
        } else {
          removeFile(id);
        }
      },
      [isAttachmentsControlled, onRemoveAttachment, removeFile]
    );

    // Wrap drop handler for controlled mode
    const wrappedHandleDrop = useCallback(
      (e: React.DragEvent) => {
        if (isAttachmentsControlled) {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFilesSelected?.(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
          }
        }
        // Always reset drag state (isDragActive + dragCounter)
        handleDrop(e);
      },
      [isAttachmentsControlled, onFilesSelected, handleDrop]
    );

    const canSend =
      (message.trim() || hasAttachments || Boolean(contextBar)) &&
      !disabled &&
      !disableSubmit &&
      !isStreaming;

    const handlePlusButtonClick = useCallback(() => {
      setIsPlusMenuOpen(true);
    }, []);

    const handleConversationModeChange = useCallback(
      (mode: ConversationMode) => {
        if (!isAgentLocked) {
          setInternalConversationMode(mode);
        }
      },
      [isAgentLocked]
    );

    const isInputDisabled = disabled && !isStreaming;
    const isVoiceActive =
      voiceStatus === 'connecting' ||
      voiceStatus === 'listening' ||
      voiceStatus === 'reconnecting' ||
      voiceStatus === 'processing';

    const inputShellClassName = `rounded-[17px] p-px transition-all duration-200 ${
      disabled
        ? isStreaming
          ? 'opacity-75 cursor-not-allowed'
          : 'opacity-60 cursor-not-allowed'
        : 'shadow-xs shadow-orange-100 hover:shadow-sm hover:shadow-orange-200'
    } ${isInputDisabled ? 'bg-gray-200' : isDragActive ? 'bg-orange-200' : 'bg-orange-100'}`;

    const gradientBorderStyle = {
      background: isInputDisabled
        ? '#e5e7eb'
        : 'radial-gradient(198.27% 158.06% at 85.59% -18.75%, #FFF8F4 0%, #FFCDBD 26%, #D8C6FA 100%)',
    };

    return (
      <div className="bg-white antialiased font-sf px-2">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-1.5 relative">
          {/* ChatInputPopover - shown above the input when active */}
          {activePopover && (
            <ChatInputPopover
              isOpen={true}
              onClose={onPopoverClose || (() => {})}
              intent={activePopover.intent}
              title={activePopover.title}
              content={activePopover.content}
              isStreaming={activePopover.isStreaming}
              primaryActionLabel={activePopover.primaryActionLabel}
              onPrimaryAction={onPopoverPrimaryAction || (() => {})}
              onFeedbackSubmit={onPopoverFeedback}
              hasUserEdits={activePopover.hasUserEdits}
            />
          )}

          {/* Toast + input wrapper */}
          <div className="flex flex-col gap-1.5">
            {/* File validation error toast — inline above input */}
            <FileErrorToast
              isVisible={!!fileErrorMessage}
              message={fileErrorMessage || ''}
              onDismiss={onDismissFileError || (() => {})}
            />

            {/* Voice-side error banner — mic permission blocked, etc.
                Renders above the input shell; dismissible by the user. */}
            <AnimatePresence>
              {voiceError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="w-full"
                >
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50">
                    <WarningCircleIcon size={16} weight="fill" className="text-red-500 shrink-0" />
                    <span className="text-[13px] font-medium text-red-700 truncate min-w-0 flex-1">
                      {voiceError}
                    </span>
                    {onDismissVoiceError && (
                      <button
                        onClick={onDismissVoiceError}
                        className="text-red-300 hover:text-red-500 transition-colors cursor-pointer shrink-0 p-0.5 rounded-md hover:bg-red-100"
                        aria-label="Dismiss"
                      >
                        <XIcon size={12} weight="bold" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Command chip - shown above the input when a command is selected */}
            {contextBar && !activePopover && (
              <div className="flex items-center px-1 pb-4 pt-1 -mb-4 bg-gray-50 border-t border-r border-l border-gray-100 rounded-t-[18px]">
                {contextBar}
              </div>
            )}

            {/* Main input container. When disabled, the caller can
                pass `disabledTooltip` to explain *why* via a custom
                portal-based tooltip (instant on hover; the browser's
                native `title` attribute has a 1-2s delay on first
                show and clutters the cursor area). The Tooltip
                wrapper is `block` so the input shell's layout width
                doesn't shrink to inline-flex behaviour. `enabled`
                gates the visibility so we don't pop a tooltip on the
                live input. */}
            <Tooltip
              content={disabledTooltip}
              enabled={isInputDisabled && !!disabledTooltip}
              wrapperClassName="block"
            >
              <div
                className={inputShellClassName}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={wrappedHandleDrop}
              >
                <div
                  className="rounded-2xl p-px transition-all duration-200"
                  style={gradientBorderStyle}
                >
                  <div className="flex flex-col bg-white rounded-[15px] gap-2">
                    {/* Drag-and-drop overlay */}
                    <DragDropOverlay isVisible={isDragActive} isDragActive={isDragActive} />
                    {/* File & mention previews - shown above the input */}
                    {(hasAttachments || (selectedMentions && selectedMentions.length > 0)) && (
                      <div className="px-2 pt-2 pb-1">
                        <div className="flex flex-wrap gap-1.5">
                          {attachments.map((attachment) => (
                            <FilePreview
                              key={attachment.id}
                              attachment={attachment}
                              onRemove={handleRemoveAttachment}
                              removable={!disabled}
                            />
                          ))}
                          {selectedMentions?.map((mention) => (
                            <MentionPreview
                              key={mention.id}
                              mention={mention}
                              onRemove={onRemoveMention}
                              removable={!disabled}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hidden file input - always render for ref access */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={getAcceptString()}
                      onChange={handleFileInputChange}
                      className="hidden"
                      aria-hidden="true"
                    />

                    {isVoiceActive ? (
                      <>
                        {/* Editor stays mounted during voice (disabled). The
                            existing text's DOM is preserved, so when the
                            polished dictation lands the user sees it grow at
                            the end rather than the whole input being redrawn. */}
                        <div className="px-3 py-2">
                          <div ref={editorContainerRef} className="flex-1 min-w-0 relative">
                            <TiptapEditor
                              content={message}
                              onChange={handleChange}
                              onSubmit={handleSend}
                              placeholder={
                                voiceStatus === 'connecting'
                                  ? 'Connecting…'
                                  : voiceStatus === 'reconnecting'
                                    ? 'Reconnecting…'
                                    : voiceStatus === 'listening'
                                      ? "Speak naturally — we'll polish it after."
                                      : placeholder
                              }
                              disabled
                              editorRef={editorRef}
                              onEscape={handleEscape}
                              additionalExtensions={additionalExtensions}
                            />
                          </div>
                          {voiceStatus === 'listening' && message.trim() && (
                            <div className="text-xs italic text-gray-400 mt-1">
                              keep speaking — we&apos;ll polish &amp; add it here
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 px-3 pb-3">
                          <div className="flex-1 min-w-0 flex items-center">
                            {voiceStatus === 'processing' ? (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <CircleNotchIcon size={14} weight="bold" className="animate-spin" />
                                Polishing
                              </div>
                            ) : (
                              voiceVisualizer
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <SecondaryIconButton
                              icon={<XIcon size={16} weight="bold" className="text-gray-800" />}
                              onClick={onVoiceCancel}
                              title="Cancel"
                              className="w-7.5! h-7.5! rounded-full! p-0!"
                            />
                            {voiceStatus === 'listening' && (
                              <SecondaryIconButton
                                icon={<CheckIcon size={16} weight="bold" />}
                                onClick={onVoiceConfirm}
                                title="Confirm"
                                className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800 w-7.5! h-7.5! rounded-full! p-0!"
                              />
                            )}
                          </div>
                        </div>
                      </>
                    ) : showPlusMenu ? (
                      <>
                        {/* Text input area - Tiptap Editor */}
                        <div className="px-3 py-2">
                          <div className="flex items-start gap-2">
                            <div ref={editorContainerRef} className="flex-1 min-w-0 relative">
                              <TiptapEditor
                                content={message}
                                onChange={handleChange}
                                onSubmit={handleSend}
                                placeholder={placeholder}
                                disabled={disabled && !isStreaming}
                                editorRef={editorRef}
                                onEscape={handleEscape}
                                onPasteFiles={(files) => {
                                  if (isAttachmentsControlled) {
                                    onFilesSelected?.(files);
                                  } else {
                                    addFiles(files);
                                  }
                                }}
                                additionalExtensions={additionalExtensions}
                              />
                              {caretOffset && ghostCommandName && (
                                <GhostCommandText text={ghostCommandName} offset={caretOffset} />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Formatting toolbar - Slack-style */}
                        {showFormattingToolbar && editorRef.current && (
                          <EditorToolbar editor={editorRef.current} />
                        )}

                        {/* Bottom toolbar with plus menu */}
                        <div className="flex items-center justify-between px-3 pb-3">
                          {/* Left side - Plus button, slash, and mode pill */}
                          <div className="flex items-center gap-1.5">
                            {/* Plus button - upload only */}
                            {showPlusButton && (
                              <PlusButtonMenu
                                isOpen={isPlusMenuOpen}
                                onClose={() => setIsPlusMenuOpen(false)}
                                onOpen={handlePlusButtonClick}
                                onUploadClick={() => {
                                  onFileUploadClick?.();
                                  fileInputRef.current?.click();
                                }}
                                disabled={disabled && !isStreaming}
                                enableFileUpload={enableFileUpload}
                              />
                            )}

                            {/* Slash commands button */}
                            {enableCommands && (
                              <SecondaryIconButton
                                icon={
                                  <span
                                    className="inline-flex"
                                    style={{ transform: 'rotate(30deg)' }}
                                  >
                                    <LineVerticalIcon
                                      size={16}
                                      weight="bold"
                                      className="text-gray-800"
                                    />
                                  </span>
                                }
                                onClick={() => {
                                  editorRef.current?.commands.insertContent('/');
                                  editorRef.current?.commands.focus('end');
                                }}
                                disabled={(disabled && !isStreaming) || message.trim().length > 0}
                                title="Commands"
                                className="w-7.5! h-7.5! rounded-full! p-0! border border-gray-200/80"
                              />
                            )}

                            {/* Mode selector pill - always visible when multiple modes available */}
                            {hasAgentModes && (
                              <ModeSelectorPill
                                selectedMode={selectedConversationMode}
                                onModeChange={handleConversationModeChange}
                                availableModes={availableAgentModes}
                                disabled={disabled && !isStreaming}
                                isAgentLocked={isAgentLocked}
                                onBuildDashboard={onBuildDashboard}
                              />
                            )}

                            {/* Mode selector - Auto edits: off/on/Plan Mode */}
                            {showModeSelector && onAutoEditModeChange && (
                              <ModeSelector
                                mode={autoEditMode}
                                onModeChange={onAutoEditModeChange}
                                disabled={disabled && !isStreaming}
                              />
                            )}
                          </div>

                          {/* Right side - Voice and Send buttons */}
                          <div className="flex items-center gap-1.5">
                            {/* Voice input button — swaps to a stop icon while recording. */}
                            {onVoiceInput && (
                              <Tooltip
                                content={
                                  isRecording ? (
                                    'Stop recording'
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                      Press and hold to record
                                      <span className="px-1.5 py-0.5 rounded border border-white/20 bg-white/10 text-white text-[11px] leading-none">
                                        {isMacPlatform() ? '⌥ Option' : 'Alt'}
                                      </span>
                                    </span>
                                  )
                                }
                              >
                                <SecondaryIconButton
                                  icon={
                                    isRecording ? (
                                      <StopIcon />
                                    ) : (
                                      <MicrophoneIcon
                                        size={16}
                                        weight="bold"
                                        className="text-gray-800"
                                      />
                                    )
                                  }
                                  onClick={onVoiceInput}
                                  disabled={disabled && !isStreaming}
                                  title=""
                                  className={
                                    isRecording
                                      ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 w-7.5! h-7.5! rounded-full! p-0!'
                                      : 'w-7.5! h-7.5! rounded-full! p-0!'
                                  }
                                />
                              </Tooltip>
                            )}

                            {/* Send/Stop button */}
                            {isStreaming ? (
                              <SecondaryIconButton
                                icon={<StopIcon />}
                                onClick={onStop}
                                title="Stop generating"
                                className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800 w-7.5! h-7.5! rounded-full! p-0!"
                              />
                            ) : (
                              <SecondaryIconButton
                                icon={<SendIcon size={16} />}
                                onClick={handleSend}
                                disabled={!canSend}
                                title="Send message"
                                className={
                                  canSend
                                    ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800 w-7.5! h-7.5! rounded-full! p-0!'
                                    : 'opacity-80 w-7.5! h-7.5! rounded-full! p-0!'
                                }
                              />
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Inline layout - text input with send button on same row */
                      <div className="flex items-center gap-2 px-4 py-3">
                        {/* Text input area - Tiptap Editor (flex-1 to take remaining space) */}
                        <div ref={editorContainerRef} className="flex-1 min-w-0 relative">
                          <TiptapEditor
                            content={message}
                            onChange={handleChange}
                            onSubmit={handleSend}
                            placeholder={placeholder}
                            disabled={disabled && !isStreaming}
                            editorRef={editorRef}
                            onEscape={handleEscape}
                            onPasteFiles={(files) => {
                              if (isAttachmentsControlled) {
                                onFilesSelected?.(files);
                              } else {
                                addFiles(files);
                              }
                            }}
                            additionalExtensions={additionalExtensions}
                          />
                          {caretOffset && ghostCommandName && (
                            <GhostCommandText text={ghostCommandName} offset={caretOffset} />
                          )}
                        </div>

                        {/* Send/Stop button inline */}
                        {isStreaming ? (
                          <SecondaryIconButton
                            icon={<StopIcon />}
                            onClick={onStop}
                            title="Stop generating"
                            className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800 w-7.5! h-7.5! rounded-full! p-0! shrink-0"
                          />
                        ) : (
                          <SecondaryIconButton
                            icon={<SendIcon size={16} />}
                            onClick={handleSend}
                            disabled={!canSend}
                            title="Send message"
                            className={`shrink-0 ${
                              canSend
                                ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800 w-7.5! h-7.5! rounded-full! p-0!'
                                : 'opacity-80 w-7.5! h-7.5! rounded-full! p-0!'
                            }`}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Tooltip>
          </div>

          {!hideDisclaimer && (
            <TruncateWithText className="w-full text-xs leading-normal text-gray-500 text-center font-sf mt-1">
              {voiceStatus === 'connecting'
                ? 'Connecting to voice service…'
                : voiceStatus === 'reconnecting'
                  ? "Reconnecting — we'll send what you're saying once we're back online"
                  : voiceStatus === 'listening'
                    ? "Listening — speak naturally, we'll polish it after"
                    : voiceStatus === 'processing'
                      ? 'Polishing your speech into clean text…'
                      : 'Von AI may make mistakes. Please recheck all important information.'}
            </TruncateWithText>
          )}
        </div>
      </div>
    );
  }
);

StandardChatInput.displayName = 'StandardChatInput';

export default StandardChatInput;
