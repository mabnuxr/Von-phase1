/**
 * ChatInputWithCommands component
 * Wraps ChatInput with commands functionality
 * Commands appear as chips in the input when selected
 */

import React, { useRef } from 'react';
import type { ChatInputProps } from '../Chat/ChatInput';
import { ChatInput } from '../Chat/ChatInput';
import { CommandChip } from './CommandChip';
import { CommandsOverlay } from './CommandsOverlay';
import { useCommandsInput } from './useCommandsInput';
import type { Command } from './types';
import type { FileAttachment } from '../Chat/FileAttachment/types';

export interface ChatInputWithCommandsProps extends Omit<ChatInputProps, 'onSend'> {
  onSend?: (message: string, attachments?: FileAttachment[], command?: Command) => void;
  /** Optional: Salesforce fields for selection in command drawer */
  salesforceFields?: Array<{ name: string; label: string; type: string }>;
  /** Loading state for salesforce fields */
  isLoadingSalesforceFields?: boolean;
  /** Auto-focus the input on mount */
  autoFocus?: boolean;
}

export const ChatInputWithCommands: React.FC<ChatInputWithCommandsProps> = ({
  onSend,
  value,
  onChange,
  salesforceFields,
  isLoadingSalesforceFields,
  placeholder = 'Ask von anything',
  autoFocus = false,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative">
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
        commandsListClassName="absolute bottom-full left-0 right-0 px-6 max-w-4xl mx-auto w-full mb-1 z-50"
      />

      {/* Command Chip + Input Area */}
      {selectedCommand ? (
        <div className="ml-2 p-3 bg-white antialiased ">
          <div className="px-6 max-w-4xl mx-auto w-full flex flex-col gap-1.5">
            <div
              className="p-[1px] rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md"
              style={{
                background:
                  'radial-gradient(198.27% 158.06% at 85.59% -18.75%, #FFF2E9 0%, #FF9E8C 26%, #BE9AF3 100%)',
              }}
            >
              <div className="flex flex-col bg-white rounded-[15px] px-3 py-2">
                {/* Command Chip Row */}
                <div className="pb-2 border-b border-gray-100">
                  <CommandChip
                    command={selectedCommand}
                    onRemove={handleRemoveCommand}
                    showDescription={false}
                  />
                </div>

                {/* Text Input Row */}
                <div className="flex items-center gap-2 pt-2">
                  <textarea
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(inputValue);
                      }
                    }}
                    placeholder={effectivePlaceholder(placeholder)}
                    className="flex-1 min-w-0 resize-none outline-none bg-transparent text-sm placeholder-gray-400 overflow-y-auto settings-scrollbar"
                    style={{
                      minHeight: '20px',
                      maxHeight: '200px',
                      lineHeight: '1.5',
                    }}
                    rows={1}
                  />
                  <button
                    className="w-8 h-8 flex-shrink-0 rounded-full border-0 bg-gray-900 flex items-center justify-center text-white transition-all duration-150 cursor-pointer hover:bg-gray-800 hover:shadow-lg"
                    onClick={() => handleSend(inputValue)}
                    aria-label="Send message"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 19V5M12 5L5 12M12 5L19 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="text-xs leading-normal text-gray-500 text-center  mt-1">
              Von AI may make mistakes. Please recheck all important information.
            </div>
          </div>
        </div>
      ) : (
        <ChatInput
          {...props}
          value={inputValue}
          onChange={handleInputChange}
          onSend={handleSend}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
      )}
    </div>
  );
};
