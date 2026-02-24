import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  PlusIcon,
  MicrophoneIcon,
  ChartBar,
  Table,
  FileText,
  X,
  ChartLineIcon,
  HashIcon,
  DatabaseIcon,
} from '@phosphor-icons/react';
import { SendIcon, StopIcon } from '../icons';
import { FilePreview } from '../FileAttachment/FilePreview';
import { DragDropOverlay } from '../FileAttachment/DragDropOverlay';
import { useFileUpload } from '../FileAttachment/useFileUpload';
import { getAcceptString } from '../FileAttachment/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Toggle as _Toggle } from '../../forms/toggle';
import { SecondaryIconButton, RemoveButton } from '../../forms/buttons';
// ContextMenu removed - using custom menu with submenu support
import type { StandardChatInputProps, StandardChatInputRef, ReferenceContext } from './types';
import { TiptapEditor, EditorToolbar } from '../../TiptapEditor';
import type { Editor } from '@tiptap/react';
import { ModeSelector } from './ModeSelector';
import { ChatInputPopover } from './ChatInputPopover';
import { FileErrorToast } from '../FileAttachment/FileErrorToast';

/**
 * Get icon for reference type
 */
function getReferenceIcon(type: ReferenceContext['type']) {
  switch (type) {
    case 'dashboard':
      return <ChartBar size={14} weight="regular" className="text-gray-800" />;
    case 'report':
      return <Table size={14} weight="regular" className="text-gray-800" />;
    case 'document':
      return <FileText size={14} weight="regular" className="text-gray-800" />;
    case 'widget':
      return <ChartLineIcon size={14} weight="regular" className="text-gray-800" />;
    case 'kpi':
      return <HashIcon size={14} weight="regular" className="text-gray-800" />;
    case 'table':
      return <Table size={14} weight="regular" className="text-gray-800" />;
    case 'source':
      return <DatabaseIcon size={14} weight="regular" className="text-gray-800" />;
    default:
      return <ChartBar size={14} weight="regular" className="text-gray-800" />;
  }
}

/**
 * Get label for reference type
 */
function getReferenceLabel(type: ReferenceContext['type']) {
  switch (type) {
    case 'dashboard':
      return 'Dashboard';
    case 'report':
      return 'Report';
    case 'document':
      return 'Document';
    case 'widget':
      return 'Widget';
    case 'kpi':
      return 'KPI';
    case 'table':
      return 'Table';
    case 'source':
      return 'Reference';
    default:
      return 'Reference';
  }
}

// Re-export AgentMode type from types for external use
export type { AgentMode } from './types';

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
export const StandardChatInput = forwardRef<StandardChatInputRef, StandardChatInputProps>(
  (
    {
      placeholder = 'Type a message...',
      onSend,
      onStop,
      disabled = false,
      isStreaming = false,
      disableSubmit = false,
      onDisabledInput,
      value,
      onChange,
      onVoiceInput,
      isRecording = false,
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
      referenceContext,
      onRemoveReference,
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
      // onBuildDashboard,
      // Disclaimer
      hideDisclaimer = false,
      // Plus menu visibility (defaults to false when not provided, feature flag controls this)
      showPlusMenu = false,
      // Agent selection props (for locking after first message)
      // isAgentLocked = false,
      // lockedAgentMode = 'auto',
      // File error props
      fileErrorMessage,
      onDismissFileError,
      // Command chip
      commandChip,
      // Commands
      enableCommands = false,
    },
    ref
  ) => {
    const [internalMessage, setInternalMessage] = useState('');
    // TODO: Uncomment when agent mode functionality is reimplemented
    // const [isAgentTagHovered, setIsAgentTagHovered] = useState(false);
    // const [internalAgentMode, setInternalAgentMode] = useState<AgentMode>('auto');
    const editorRef = useRef<Editor | null>(null);

    // Expose focus method via ref
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          editorRef.current?.commands.focus();
        },
      }),
      []
    );

    // TODO: Uncomment when agent mode is reimplemented
    // const selectedAgentMode = isAgentLocked ? lockedAgentMode : internalAgentMode;

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
      const hasContent = hasTextContent || hasAttachments;

      if (hasContent && onSend) {
        // Send markdown directly
        const messageToSend = message.trim();

        onSend(messageToSend, hasAttachments ? attachments : undefined, 'auto');
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
      onSend,
      attachments,
      isControlled,
      onChange,
      isAttachmentsControlled,
      clearFiles,
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
      (message.trim() || hasAttachments) && !disabled && !disableSubmit && !isStreaming;

    // TODO: Uncomment when agent mode is reimplemented
    // const handleAgentModeChange = useCallback(
    //   (mode: AgentMode) => {
    //     if (!isAgentLocked) {
    //       setInternalAgentMode(mode);
    //     }
    //   },
    //   [isAgentLocked]
    // );
    //
    // const handleCancelAgentMode = useCallback(() => {
    //   if (!isAgentLocked) {
    //     setInternalAgentMode('auto');
    //   }
    // }, [isAgentLocked]);
    //
    // const getAgentModeDisplay = (mode: AgentMode) => {
    //   switch (mode) {
    //     case 'auto':
    //       return { label: 'Auto', icon: RobotIcon };
    //     case 'build-dashboard':
    //       return { label: 'Build Dashboard', icon: ChartBarIcon };
    //     case 'deep-research':
    //       return { label: 'Deep Research', icon: null };
    //   }
    // };

    return (
      <div className="bg-white antialiased font-sf">
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

          {/* Reference tag - shown above the input when a reference is set */}
          {referenceContext && !activePopover && (
            <div className="flex items-center justify-start px-3 pb-6 pt-2 -mb-4 bg-orange-50 border-t border-r border-l border-orange-100 rounded-t-xl">
              <div className="bg-orange-100 border border-orange-200 shadow-xs shadow-orange-100 flex flex-row gap-2.5 rounded-xl px-2 py-1">
                <div className="flex items-center gap-1.5">
                  {getReferenceIcon(referenceContext.type)}
                  <span className="text-sm text-gray-900">
                    {getReferenceLabel(referenceContext.type)}: {referenceContext.name}
                  </span>
                </div>
                {onRemoveReference && (
                  <RemoveButton
                    icon={<X size={12} weight="bold" />}
                    onClick={onRemoveReference}
                    title="Remove reference"
                    className="text-gray-800"
                  />
                )}
              </div>
            </div>
          )}

          {/* Toast + input wrapper */}
          <div className="flex flex-col gap-1.5">
            {/* File validation error toast — inline above input */}
            <FileErrorToast
              isVisible={!!fileErrorMessage}
              message={fileErrorMessage || ''}
              onDismiss={onDismissFileError || (() => {})}
            />

            {/* Command chip - shown above the input when a command is selected */}
            {commandChip && !activePopover && (
              <div className="flex items-center px-3 pb-6 pt-2 -mb-4 bg-gray-50 border-t border-r border-l border-gray-100 rounded-t-xl">
                {commandChip}
              </div>
            )}

            {/* Main input container with gradient border */}
            <div
              className={`p-[1px] rounded-2xl transition-all duration-200 ${
                disabled ? 'opacity-60 cursor-not-allowed' : 'shadow-sm hover:shadow-md'
              }`}
              style={{
                background: disabled
                  ? '#e5e7eb'
                  : 'linear-gradient(135deg, rgba(255, 158, 140, 0.3) 0%, rgba(190, 154, 243, 0.3) 100%)',
              }}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={wrappedHandleDrop}
            >
              <div className="flex flex-col bg-white rounded-[15px]">
                {/* Drag-and-drop overlay */}
                <DragDropOverlay isVisible={isDragActive} isDragActive={isDragActive} />
                {/* File previews - shown above the input when files are attached */}
                {hasAttachments && (
                  <div className="px-4 pt-3 pb-1">
                    <div className="flex flex-wrap gap-1.5">
                      {attachments.map((attachment) => (
                        <FilePreview
                          key={attachment.id}
                          attachment={attachment}
                          onRemove={handleRemoveAttachment}
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

                {showPlusMenu ? (
                  <>
                    {/* Text input area - Tiptap Editor */}
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <TiptapEditor
                            content={message}
                            onChange={handleChange}
                            onSubmit={handleSend}
                            placeholder={placeholder}
                            disabled={disabled && !isStreaming}
                            editorRef={editorRef}
                            onPasteFiles={(files) => {
                              if (isAttachmentsControlled) {
                                onFilesSelected?.(files);
                              } else {
                                addFiles(files);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Formatting toolbar - Slack-style */}
                    {showFormattingToolbar && editorRef.current && (
                      <EditorToolbar editor={editorRef.current} />
                    )}

                    {/* Bottom toolbar with plus menu */}
                    <div className="flex items-center justify-between px-3 pb-3">
                      {/* Left side - Plus button and Mode toggle */}
                      <div className="flex items-center gap-2">
                        {/* Plus button - directly opens file picker */}
                        <SecondaryIconButton
                          icon={<PlusIcon size={16} weight="bold" className="text-gray-800" />}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={disabled && !isStreaming}
                          title="Upload file"
                          className="w-8.5 h-8.5 rounded-xl"
                        />

                        {/* Slash commands button */}
                        {enableCommands && (
                          <SecondaryIconButton
                            icon={<span className="text-[13px] font-semibold text-gray-800 leading-none">/</span>}
                            onClick={() => {
                              onChange?.('/');
                              editorRef.current?.commands.focus('end');
                            }}
                            disabled={disabled && !isStreaming}
                            title="Open commands"
                            className="w-8.5 h-8.5 rounded-xl"
                          />
                        )}

                        {/* TODO: Uncomment when agent mode is reimplemented */}
                        {/* <AnimatePresence>
                        {selectedAgentMode !== 'auto' && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.15 }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                              selectedAgentMode === 'deep-research'
                                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                : 'text-gray-900 border border-gray-100 hover:bg-gray-50'
                            }`}
                            onClick={handleCancelAgentMode}
                            onMouseEnter={() => setIsAgentTagHovered(true)}
                            onMouseLeave={() => setIsAgentTagHovered(false)}
                            title={
                              isAgentLocked
                                ? 'Agent locked for this conversation'
                                : 'Click to reset to Auto mode'
                            }
                            disabled={isAgentLocked}
                          >
                            {isAgentTagHovered && !isAgentLocked ? (
                              <XIcon
                                size={14}
                                weight="bold"
                                className={
                                  selectedAgentMode === 'deep-research'
                                    ? 'text-green-600'
                                    : 'text-gray-800'
                                }
                              />
                            ) : selectedAgentMode === 'deep-research' ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-green-200" />
                            ) : (
                              (() => {
                                const AgentIcon = getAgentModeDisplay(selectedAgentMode).icon;
                                return AgentIcon ? (
                                  <AgentIcon size={14} weight="regular" className="text-gray-800" />
                                ) : null;
                              })()
                            )}
                            {getAgentModeDisplay(selectedAgentMode).label}
                          </motion.button>
                        )}
                      </AnimatePresence> */}

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
                      <div className="flex items-center gap-2">
                        {/* Voice input button */}
                        {onVoiceInput && (
                          <SecondaryIconButton
                            icon={
                              <MicrophoneIcon
                                size={16}
                                weight={isRecording ? 'fill' : 'bold'}
                                className={isRecording ? 'text-red-500' : 'text-gray-800'}
                              />
                            }
                            onClick={onVoiceInput}
                            disabled={disabled && !isStreaming}
                            title={isRecording ? 'Stop recording' : 'Start voice input'}
                            className={
                              isRecording
                                ? 'bg-red-50 border-red-200 w-8.5 h-8.5 rounded-xl'
                                : 'w-8.5 h-8.5 rounded-xl'
                            }
                          />
                        )}

                        {/* Send/Stop button */}
                        {isStreaming ? (
                          <SecondaryIconButton
                            icon={<StopIcon />}
                            onClick={onStop}
                            title="Stop generating"
                            className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800 w-8.5 h-8.5 rounded-xl"
                          />
                        ) : (
                          <SecondaryIconButton
                            icon={<SendIcon size={16} />}
                            onClick={handleSend}
                            disabled={!canSend}
                            title="Send message"
                            className={
                              canSend
                                ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800 w-8.5 h-8.5 rounded-xl'
                                : 'opacity-80 w-8.5 h-8.5 rounded-xl'
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
                    <div className="flex-1 min-w-0">
                      <TiptapEditor
                        content={message}
                        onChange={handleChange}
                        onSubmit={handleSend}
                        placeholder={placeholder}
                        disabled={disabled && !isStreaming}
                        editorRef={editorRef}
                        onPasteFiles={(files) => {
                          if (isAttachmentsControlled) {
                            onFilesSelected?.(files);
                          } else {
                            addFiles(files);
                          }
                        }}
                      />
                    </div>

                    {/* Send/Stop button inline */}
                    {isStreaming ? (
                      <SecondaryIconButton
                        icon={<StopIcon />}
                        onClick={onStop}
                        title="Stop generating"
                        className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800 w-8.5 h-8.5 rounded-xl flex-shrink-0"
                      />
                    ) : (
                      <SecondaryIconButton
                        icon={<SendIcon size={16} />}
                        onClick={handleSend}
                        disabled={!canSend}
                        title="Send message"
                        className={`flex-shrink-0 ${
                          canSend
                            ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800 w-8.5 h-8.5 rounded-xl'
                            : 'opacity-80 w-8.5 h-8.5 rounded-xl'
                        }`}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!hideDisclaimer && (
            <div className="text-xs leading-normal text-gray-500 text-center font-sf mt-1">
              Von AI may make mistakes. Please recheck all important information.
            </div>
          )}
        </div>
      </div>
    );
  }
);

StandardChatInput.displayName = 'StandardChatInput';

export default StandardChatInput;
