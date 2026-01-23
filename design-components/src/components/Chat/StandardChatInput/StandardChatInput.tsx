import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  MicrophoneIcon,
  ChartBar,
  Table,
  FileText,
  X,
  XIcon,
  CheckIcon,
  ChartLineIcon,
  HashIcon,
  DatabaseIcon,
  RobotIcon,
  ChartBarIcon,
  CaretRightIcon,
  UploadSimpleIcon,
  AtomIcon,
} from '@phosphor-icons/react';
import { SendIcon, StopIcon } from '../icons';
import { FilePreview } from '../FileAttachment/FilePreview';
import { useFileUpload } from '../FileAttachment/useFileUpload';
import { getAcceptString } from '../FileAttachment/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Toggle as _Toggle } from '../../forms/toggle';
import { SecondaryIconButton, RemoveButton } from '../../forms/buttons';
// ContextMenu removed - using custom menu with submenu support
import type { StandardChatInputProps, ReferenceContext } from './types';
import type { BuildMode } from '../../DashboardBuilder/types';
import { TiptapEditor, EditorToolbar } from '../../TiptapEditor';
import type { Editor } from '@tiptap/react';
import { ModeSelector } from './ModeSelector';
import { ChatInputPopover } from './ChatInputPopover';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _MODE_OPTIONS = [
  { value: 'ask' as BuildMode, label: 'Ask' },
  { value: 'build' as BuildMode, label: 'Build' },
];

/**
 * Agent mode type
 */
export type AgentMode = 'auto' | 'build-dashboard' | 'deep-research';

/**
 * PlusButtonMenu - Plus button with context menu for agent modes
 */
interface PlusButtonMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onAgentModeChange: (mode: AgentMode) => void;
  onBuildDashboard?: () => void;
  selectedAgentMode: AgentMode;
  disabled?: boolean;
}

const PlusButtonMenu: React.FC<PlusButtonMenuProps> = ({
  isOpen,
  onClose,
  onOpen,
  onAgentModeChange,
  onBuildDashboard,
  selectedAgentMode,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAgentSubmenuOpen, setIsAgentSubmenuOpen] = useState(false);

  const handleAgentSelect = (mode: AgentMode) => {
    onAgentModeChange(mode);
    if (mode === 'build-dashboard' && onBuildDashboard) {
      onBuildDashboard();
    }
    onClose();
    setIsAgentSubmenuOpen(false);
  };

  const handleMenuClose = () => {
    onClose();
    setIsAgentSubmenuOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <SecondaryIconButton
        icon={<PlusIcon size={16} weight="bold" className="text-gray-800" />}
        onClick={onOpen}
        disabled={disabled}
        title="More options"
        className="w-8.5 h-8.5 rounded-xl"
      />

      {/* Main Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50"
          >
            {/* Upload option - disabled with "Soon" tag */}
            <button
              disabled
              className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-gray-400 cursor-not-allowed text-left"
            >
              <div className="flex items-center gap-2.5">
                <UploadSimpleIcon size={16} className="text-gray-300" />
                <span>Upload</span>
              </div>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md font-medium">
                Soon
              </span>
            </button>

            {/* Divider */}
            <div className="my-1.5 border-t border-gray-100" />

            {/* Agents submenu trigger */}
            <div
              className="relative"
              onMouseEnter={() => setIsAgentSubmenuOpen(true)}
              onMouseLeave={() => setIsAgentSubmenuOpen(false)}
            >
              <button className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer text-left">
                <div className="flex items-center gap-2.5">
                  <RobotIcon size={16} className="text-gray-500" />
                  <span>Agents</span>
                </div>
                <CaretRightIcon size={14} className="text-gray-400" />
              </button>

              {/* Agents submenu */}
              <AnimatePresence>
                {isAgentSubmenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute left-full bottom-0 ml-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50"
                  >
                    {/* Auto (default) */}
                    <button
                      onClick={() => handleAgentSelect('auto')}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <RobotIcon size={16} className="text-gray-500" />
                        <span>Auto</span>
                      </div>
                      {selectedAgentMode === 'auto' && (
                        <CheckIcon size={14} weight="bold" className="text-green-600" />
                      )}
                    </button>

                    {/* Build Dashboard */}
                    <button
                      onClick={() => handleAgentSelect('build-dashboard')}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <ChartBarIcon size={16} className="text-gray-500" />
                        <span>Build Dashboard</span>
                      </div>
                      {selectedAgentMode === 'build-dashboard' && (
                        <CheckIcon size={14} weight="bold" className="text-green-600" />
                      )}
                    </button>

                    {/* Deep Research */}
                    <button
                      onClick={() => handleAgentSelect('deep-research')}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <AtomIcon size={16} className="text-gray-500" />
                        <span>Deep Research</span>
                      </div>
                      {selectedAgentMode === 'deep-research' && (
                        <CheckIcon size={14} weight="bold" className="text-green-600" />
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={handleMenuClose} />}
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
export const StandardChatInput: React.FC<StandardChatInputProps> = ({
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
  onBuildDashboard,
  agentMode,
  // Disclaimer
  hideDisclaimer = false,
}) => {
  const [internalMessage, setInternalMessage] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isAgentTagHovered, setIsAgentTagHovered] = useState(false);
  // Use external agentMode if provided, otherwise internal state
  const [internalAgentMode, setInternalAgentMode] = useState<AgentMode>('auto');
  const selectedAgentMode = agentMode ?? internalAgentMode;
  const setSelectedAgentMode = agentMode ? () => {} : setInternalAgentMode;
  const editorRef = useRef<Editor | null>(null);

  // File upload hook for uncontrolled mode
  const {
    attachments: internalAttachments,
    addFiles,
    removeFile,
    clearFiles,
    fileInputRef,
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
    if (droppedFiles && droppedFiles.length > 0 && !isAttachmentsControlled) {
      addFiles(droppedFiles);
      onDroppedFilesProcessed?.();
    }
  }, [droppedFiles, isAttachmentsControlled, addFiles, onDroppedFilesProcessed]);

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
    if (disableSubmit) {
      onDisabledInput?.();
      return;
    }

    // Extract plain text from HTML content for sending
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = message;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    const messageToSend = plainText.trim();
    const hasContent = messageToSend || hasAttachments;

    if (hasContent && onSend) {
      onSend(messageToSend, hasAttachments ? attachments : undefined);
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
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles]
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

  const canSend = (message.trim() || hasAttachments) && !disabled && !disableSubmit;

  const handlePlusButtonClick = useCallback(() => {
    setIsPlusMenuOpen(true);
  }, []);

  const handleAgentModeChange = useCallback((mode: AgentMode) => {
    setSelectedAgentMode(mode);
  }, []);

  const handleCancelAgentMode = useCallback(() => {
    setSelectedAgentMode('auto');
  }, []);

  // Helper to get agent mode display label and icon
  const getAgentModeDisplay = (mode: AgentMode) => {
    switch (mode) {
      case 'auto':
        return { label: 'Auto', icon: RobotIcon };
      case 'build-dashboard':
        return { label: 'Build Dashboard', icon: ChartBarIcon };
      case 'deep-research':
        return { label: 'Deep Research', icon: null }; // Uses green dot instead of icon
    }
  };

  return (
    <div className="bg-white antialiased font-sf">
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-1.5 relative">
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
                <span className="text-[13px] text-gray-900">
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
        >
          <div className="flex flex-col bg-white rounded-[15px]">
            {/* File previews - shown above the input when files are attached */}
            {hasAttachments && (
              <div className="px-4 pt-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <FilePreview
                      key={attachment.id}
                      attachment={attachment}
                      onRemove={handleRemoveAttachment}
                      removable={!disabled}
                      size="medium"
                      variant="minimal"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Text input area - Tiptap Editor */}
            <div className="px-4 py-3">
              <TiptapEditor
                content={message}
                onChange={handleChange}
                onSubmit={handleSend}
                placeholder={placeholder}
                disabled={disabled && !isStreaming}
                editorRef={editorRef}
              />
            </div>

            {/* Formatting toolbar - Slack-style */}
            {showFormattingToolbar && editorRef.current && (
              <EditorToolbar editor={editorRef.current} />
            )}

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-3 pb-3">
              {/* Left side - Plus button and Mode toggle */}
              <div className="flex items-center gap-2">
                {/* Plus button - opens menu with options */}
                <PlusButtonMenu
                  isOpen={isPlusMenuOpen}
                  onClose={() => setIsPlusMenuOpen(false)}
                  onOpen={handlePlusButtonClick}
                  onAgentModeChange={handleAgentModeChange}
                  onBuildDashboard={onBuildDashboard}
                  selectedAgentMode={selectedAgentMode}
                  disabled={disabled && !isStreaming}
                />

                {/* Agent mode tag - shown when a specific agent mode is selected (not auto) */}
                <AnimatePresence>
                  {selectedAgentMode !== 'auto' && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium rounded-xl transition-colors cursor-pointer ${
                        selectedAgentMode === 'deep-research'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'text-gray-900 border border-gray-100 hover:bg-gray-50'
                      }`}
                      onClick={handleCancelAgentMode}
                      onMouseEnter={() => setIsAgentTagHovered(true)}
                      onMouseLeave={() => setIsAgentTagHovered(false)}
                      title="Click to remove"
                    >
                      {isAgentTagHovered ? (
                        <XIcon
                          size={14}
                          weight="bold"
                          className={
                            selectedAgentMode === 'deep-research'
                              ? 'text-emerald-600'
                              : 'text-gray-800'
                          }
                        />
                      ) : selectedAgentMode === 'deep-research' ? (
                        // Green dot indicator for Deep Research
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-emerald-200" />
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
                </AnimatePresence>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={getAcceptString()}
                  onChange={handleFileInputChange}
                  className="hidden"
                  aria-hidden="true"
                />

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
};

export default StandardChatInput;
