import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, MicrophoneIcon, ChartBar, Table, FileText, X, XIcon, UploadSimpleIcon, AtomIcon, CheckIcon } from '@phosphor-icons/react';
import { SendIcon, StopIcon } from '../icons';
import { FilePreview } from '../FileAttachment/FilePreview';
import { useFileUpload } from '../FileAttachment/useFileUpload';
import { getAcceptString } from '../FileAttachment/types';
import { Toggle } from '../../forms/toggle';
import { SecondaryIconButton, RemoveButton } from '../../forms/buttons';
import { ContextMenu, type ContextMenuItem } from '../../popups';
import type { StandardChatInputProps, ReferenceContext } from './types';
import type { BuildMode } from '../../DashboardBuilder/types';

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
    default:
      return 'Reference';
  }
}

const MODE_OPTIONS = [
  { value: 'ask' as BuildMode, label: 'Ask' },
  { value: 'build' as BuildMode, label: 'Build' },
];

/**
 * PlusButtonMenu - Plus button with context menu for upload and deep research options
 */
interface PlusButtonMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onUpload: () => void;
  onDeepResearch: () => void;
  isDeepResearch: boolean;
  disabled?: boolean;
}

const PlusButtonMenu: React.FC<PlusButtonMenuProps> = ({
  isOpen,
  onClose,
  onOpen,
  onUpload,
  onDeepResearch,
  isDeepResearch,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const items: ContextMenuItem[] = [
    {
      id: 'upload',
      label: 'Upload files and photos',
      icon: <UploadSimpleIcon size={16} />,
    },
    {
      id: 'deep-research',
      label: 'Deep research',
      icon: <AtomIcon size={16} />,
      active: isDeepResearch,
      rightContent: isDeepResearch ? <CheckIcon size={14} weight="bold" className="text-green-600" /> : undefined,
    },
  ];

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.id === 'upload') {
      onUpload();
    } else if (item.id === 'deep-research') {
      onDeepResearch();
    }
    onClose();
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

      <ContextMenu
        isOpen={isOpen}
        onClose={onClose}
        items={items}
        anchorRef={containerRef}
        position="top-start"
        width={208}
        onItemClick={handleItemClick}
      />
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
  value,
  onChange,
  onVoiceInput,
  isRecording = false,
  mode = 'ask',
  onModeChange,
  attachments: controlledAttachments,
  onRemoveAttachment,
  droppedFiles,
  onDroppedFilesProcessed,
  onFileError,
  referenceContext,
  onRemoveReference,
}) => {
  const [internalMessage, setInternalMessage] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isResearchTagHovered, setIsResearchTagHovered] = useState(false);
  const [isDeepResearch, setIsDeepResearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // File upload hook for uncontrolled mode
  const {
    attachments: internalAttachments,
    addFiles,
    removeFile,
    clearFiles,
    openFilePicker,
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

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
    if (disableSubmit) return;

    const messageToSend = message.trim();
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
    isAttachmentsControlled,
    clearFiles,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isStreaming && !disableSubmit) {
          handleSend();
        }
      }
    },
    [isStreaming, disableSubmit, handleSend]
  );

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

  const handleUploadFilesClick = useCallback(() => {
    setIsPlusMenuOpen(false);
    openFilePicker();
  }, [openFilePicker]);

  const handleDeepResearchClick = useCallback(() => {
    setIsPlusMenuOpen(false);
    setIsDeepResearch(true);
  }, []);

  const handleCancelDeepResearch = useCallback(() => {
    setIsDeepResearch(false);
  }, []);

  return (
    <div className="w-full antialiased font-sf">
      <div className="max-w-3xl mx-auto">
        {/* Reference tag - shown above the input when a reference is set */}
        {referenceContext && (
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
            disabled
              ? 'opacity-60 cursor-not-allowed'
              : 'shadow-sm hover:shadow-md'
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

            {/* Text input area */}
            <div className="px-4 py-3">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled && !isStreaming}
                className="w-full resize-none outline-none bg-transparent text-[15px] text-gray-900 placeholder-gray-400 overflow-y-auto disabled:cursor-not-allowed settings-scrollbar"
                style={{
                  minHeight: '24px',
                  maxHeight: '200px',
                  lineHeight: '1.5',
                }}
                rows={1}
              />
            </div>

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between px-3 pb-3">
              {/* Left side - Plus button and Mode toggle */}
              <div className="flex items-center gap-2">
                {/* Plus button - opens menu with options */}
                <PlusButtonMenu
                  isOpen={isPlusMenuOpen}
                  onClose={() => setIsPlusMenuOpen(false)}
                  onOpen={handlePlusButtonClick}
                  onUpload={handleUploadFilesClick}
                  onDeepResearch={isDeepResearch ? handleCancelDeepResearch : handleDeepResearchClick}
                  isDeepResearch={isDeepResearch}
                  disabled={disabled && !isStreaming}
                />

                {/* Research tag - shown when deep research mode is active */}
                <AnimatePresence>
                  {isDeepResearch && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-900 border border-gray-100 hover:bg-gray-50 text-[13px] font-medium rounded-xl transition-colors cursor-pointer"
                      onClick={handleCancelDeepResearch}
                      onMouseEnter={() => setIsResearchTagHovered(true)}
                      onMouseLeave={() => setIsResearchTagHovered(false)}
                      title="Click to cancel deep research"
                    >
                      {isResearchTagHovered ? (
                        <XIcon size={14} weight="bold" className="text-gray-800" />
                      ) : (
                        <AtomIcon size={14} weight="regular" className="text-gray-800" />
                      )}
                      Research
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

                {/* Mode toggle (Ask/Build) using forms Toggle component */}
                {/* <Toggle
                  options={MODE_OPTIONS}
                  value={mode}
                  onChange={(newMode) => onModeChange?.(newMode)}
                  disabled={disabled}
                /> */}
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
                    className={isRecording ? 'bg-red-50 border-red-200 w-8.5 h-8.5 rounded-xl' : 'w-8.5 h-8.5 rounded-xl'}
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
      </div>
    </div>
  );
};

export default StandardChatInput;
