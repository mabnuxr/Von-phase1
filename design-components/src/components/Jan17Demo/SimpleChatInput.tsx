import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus as PlusIcon, UploadSimple as UploadSimpleIcon } from '@phosphor-icons/react';
import { SendIcon, StopIcon } from '../Chat/icons';
import { SecondaryIconButton } from '../forms/buttons';
import { ContextMenu, type ContextMenuItem } from '../popups';

export interface SimpleChatInputProps {
  placeholder?: string;
  onSend?: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  disableSubmit?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onUpload?: () => void;
}

/**
 * PlusButtonMenu - Plus button with context menu for upload option only
 */
interface PlusButtonMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onUpload: () => void;
  disabled?: boolean;
}

const PlusButtonMenu: React.FC<PlusButtonMenuProps> = ({
  isOpen,
  onClose,
  onOpen,
  onUpload,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const items: ContextMenuItem[] = [
    {
      id: 'upload',
      label: 'Upload files and photos',
      icon: <UploadSimpleIcon size={16} />,
    },
  ];

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.id === 'upload') {
      onUpload();
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
 * SimpleChatInput - A chat input with plus button (upload only, no deep research)
 *
 * Features:
 * - Simple textarea with auto-resize
 * - Plus button with upload option (no deep research)
 * - Send button
 * - Stop button during streaming
 * - White background with subtle gradient border
 */
export const SimpleChatInput: React.FC<SimpleChatInputProps> = ({
  placeholder = 'Type a message...',
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
  disableSubmit = false,
  value,
  onChange,
  onUpload,
}) => {
  const [internalMessage, setInternalMessage] = useState('');
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (messageToSend && onSend) {
      onSend(messageToSend);
      if (isControlled) {
        onChange?.('');
      } else {
        setInternalMessage('');
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [disableSubmit, message, onSend, isControlled, onChange]);

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

  const handleUpload = useCallback(() => {
    onUpload?.();
    setIsPlusMenuOpen(false);
  }, [onUpload]);

  const canSend = message.trim() && !disabled && !disableSubmit;

  return (
    <div className="w-full antialiased ">
      <div className="max-w-3xl mx-auto">
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
            {/* Text input area */}
            <div className="px-4 py-3">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled && !isStreaming}
                className="w-full resize-none outline-none bg-transparent text-sm text-gray-900 placeholder-gray-400 overflow-y-auto disabled:cursor-not-allowed settings-scrollbar"
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
              {/* Left side - Plus button */}
              <div className="flex items-center gap-2">
                <PlusButtonMenu
                  isOpen={isPlusMenuOpen}
                  onClose={() => setIsPlusMenuOpen(false)}
                  onOpen={() => setIsPlusMenuOpen(true)}
                  onUpload={handleUpload}
                  disabled={disabled && !isStreaming}
                />
              </div>

              {/* Right side - Send/Stop button */}
              <div className="flex items-center gap-2">
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

export default SimpleChatInput;
