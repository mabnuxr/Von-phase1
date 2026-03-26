/**
 * StandardChatInputWithCommands component
 * Wraps StandardChatInput with commands functionality
 * Commands appear as chips in the input when selected
 */

import React, { useRef, useState, useCallback } from 'react';
import { StandardChatInput } from './StandardChatInput';
import type { StandardChatInputProps } from './types';
import { CommandChip, CommandsOverlay, useCommandsInput } from '../../Commands';
import type { Command } from '../../Commands/types';
import type { FileAttachment } from '../FileAttachment/types';
import { SecondaryIconButton } from '../../forms/buttons';
import { SendIcon } from '../icons';

import { ConversationMode } from './types';

export interface StandardChatInputWithCommandsProps extends Omit<StandardChatInputProps, 'onSend'> {
  onSend?: (
    message: string,
    attachments?: FileAttachment[],
    command?: Command,
    agentMode?: ConversationMode
  ) => void;
  /** Optional: Salesforce fields for selection in command drawer */
  salesforceFields?: Array<{ name: string; label: string; type: string }>;
  /** Loading state for salesforce fields */
  isLoadingSalesforceFields?: boolean;
  /** Callback when user attempts to submit while disabled */
  onDisabledInput?: () => void;
}

export const StandardChatInputWithCommands: React.FC<StandardChatInputWithCommandsProps> = ({
  onSend,
  onStop,
  value,
  onChange,
  salesforceFields,
  isLoadingSalesforceFields,
  placeholder = 'Ask von anything',
  disabled = false,
  isStreaming = false,
  disableSubmit = false,
  onDisabledInput,
  isAgentLocked = false,
  lockedConversationMode = ConversationMode.Ask,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track agent mode at this level so it persists when switching to command mode
  // When locked, always use the locked mode from backend
  const [internalConversationMode, setInternalConversationMode] = useState<ConversationMode>(
    ConversationMode.Ask
  );
  const selectedConversationMode = isAgentLocked
    ? lockedConversationMode
    : internalConversationMode;

  const {
    commands,
    inputValue,
    selectedCommand,
    commandSearch,
    showCommandsList,
    showCommandDrawer,
    showManageDrawer,
    editingCommand,
    effectivePlaceholder,
    handleInputChange,
    handleSend,
    handleSelectCommand,
    handleRemoveCommand,
    handleNewCommand,
    handleManageCommands,
    handleEditCommand,
    handleSaveCommand,
    handleDeleteCommand,
    handleCloseCommandsList,
    closeCommandDrawer,
    closeManageDrawer,
  } = useCommandsInput({ value, onChange, onSend });

  // Wrapper for StandardChatInput's onSend that captures agentMode changes
  const handleStandardInputSend = useCallback(
    (message: string, attachments?: FileAttachment[], agentMode?: ConversationMode) => {
      // Update our tracked agent mode if user changed it (and not locked)
      if (agentMode && !isAgentLocked) {
        setInternalConversationMode(agentMode);
      }
      // Forward to useCommandsInput's handleSend with the agentMode
      handleSend(message, attachments, agentMode);
    },
    [handleSend, isAgentLocked]
  );

  // Send with command - use the tracked agent mode
  const handleSendWithCommand = useCallback(
    (message: string) => {
      handleSend(message, undefined, selectedConversationMode);
    },
    [handleSend, selectedConversationMode]
  );

  const isInputDisabled = disabled && !isStreaming;

  const commandInputShellClassName = `rounded-[18px] p-[2px] transition-all duration-200 ${
    disabled
      ? isStreaming
        ? 'opacity-75 cursor-not-allowed'
        : 'opacity-60 cursor-not-allowed'
      : 'shadow-sm hover:shadow-md'
  } ${isInputDisabled ? 'bg-gray-200' : 'bg-orange-100'}`;

  const commandGradientBorderStyle = {
    background: isInputDisabled
      ? '#e5e7eb'
      : 'radial-gradient(198.27% 158.06% at 85.59% -18.75%, #FFF8F4 0%, #FFCDBD 26%, #D8C6FA 100%)',
  };

  return (
    <div ref={containerRef} className="relative w-full antialiased px-2">
      {/* Commands Overlay (List + Drawers) */}
      <CommandsOverlay
        commands={commands}
        showCommandsList={showCommandsList}
        commandSearch={commandSearch}
        showCommandDrawer={showCommandDrawer}
        showManageDrawer={showManageDrawer}
        editingCommand={editingCommand}
        onSelectCommand={handleSelectCommand}
        onNewCommand={handleNewCommand}
        onManageCommands={handleManageCommands}
        onCloseCommandsList={handleCloseCommandsList}
        onEditCommand={handleEditCommand}
        onSaveCommand={handleSaveCommand}
        onDeleteCommand={handleDeleteCommand}
        onCloseCommandDrawer={closeCommandDrawer}
        onCloseManageDrawer={closeManageDrawer}
        salesforceFields={salesforceFields}
        isLoadingSalesforceFields={isLoadingSalesforceFields}
        commandsListClassName="absolute bottom-full left-0 right-0 max-w-4xl mx-auto w-full mb-1 z-50"
      />

      {/* Command Chip + Input Area (when command is selected) */}
      {selectedCommand ? (
        <div className="max-w-4xl mx-auto">
          {/* Main input container with orange shell and von gradient border */}
          <div className={commandInputShellClassName}>
            <div
              className="rounded-2xl p-px transition-all duration-200"
              style={commandGradientBorderStyle}
            >
              <div className="flex flex-col bg-white rounded-[15px] overflow-hidden">
                {/* Command Chip Row */}
                <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                  <CommandChip
                    command={selectedCommand}
                    onRemove={handleRemoveCommand}
                    showDescription={true}
                  />
                </div>

                {/* Text Input Row */}
                <div className="px-4 py-3">
                  <textarea
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        // Block sending while streaming
                        if (isStreaming) {
                          return;
                        }
                        if (disableSubmit) {
                          onDisabledInput?.();
                          return;
                        }
                        handleSendWithCommand(inputValue);
                      }
                    }}
                    placeholder={effectivePlaceholder(placeholder)}
                    disabled={disabled && !isStreaming}
                    className="w-full min-w-0 resize-none outline-none bg-transparent text-sm text-gray-900 placeholder-gray-400 overflow-y-auto"
                    style={{
                      minHeight: '24px',
                      maxHeight: '200px',
                      lineHeight: '1.5',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                    rows={1}
                  />
                </div>

                {/* Bottom toolbar */}
                <div className="flex items-center justify-end px-3 pb-3">
                  {/* Send/Stop button */}
                  {isStreaming ? (
                    <SecondaryIconButton
                      icon={
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <rect x="3" y="3" width="10" height="10" rx="1" />
                        </svg>
                      }
                      onClick={onStop}
                      title="Stop generating"
                      className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800 !w-8.5 !h-8.5 !rounded-full !p-0"
                    />
                  ) : (
                    <SecondaryIconButton
                      icon={<SendIcon size={16} />}
                      onClick={() => handleSendWithCommand(inputValue)}
                      disabled={disableSubmit || isStreaming}
                      title="Send message"
                      className={
                        !disableSubmit && !isStreaming
                          ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800 !w-8.5 !h-8.5 !rounded-full !p-0'
                          : 'opacity-80 !w-8.5 !h-8.5 !rounded-full !p-0'
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <StandardChatInput
          {...props}
          value={inputValue}
          onChange={handleInputChange}
          onSend={handleStandardInputSend}
          onStop={onStop}
          placeholder={effectivePlaceholder(placeholder)}
          disabled={disabled}
          isStreaming={isStreaming}
          disableSubmit={disableSubmit}
          isAgentLocked={isAgentLocked}
          lockedConversationMode={lockedConversationMode}
          onDisabledInput={onDisabledInput}
        />
      )}
    </div>
  );
};

export default StandardChatInputWithCommands;
