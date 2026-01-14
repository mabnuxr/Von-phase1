/**
 * ChatInputWithCommands component
 * Wraps ChatInput with commands functionality
 * Commands appear as chips in the input when selected
 */

import React, { useState, useCallback, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import type { ChatInputProps } from '../Chat/ChatInput';
import { ChatInput } from '../Chat/ChatInput';
import { CommandsList } from './CommandsList';
import { CommandDrawer } from './CommandDrawer';
import { ManageCommandsDrawer } from './ManageCommandsDrawer';
import { useCommands } from './useCommands';
import type { Command } from './types';

export interface ChatInputWithCommandsProps extends Omit<ChatInputProps, 'onSend'> {
  onSend?: (message: string, command?: Command) => void;
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
  const { commands, addCommand, updateCommand, deleteCommand } = useCommands();
  const containerRef = useRef<HTMLDivElement>(null);

  const [showCommandsList, setShowCommandsList] = useState(false);
  const [showCommandDrawer, setShowCommandDrawer] = useState(false);
  const [showManageDrawer, setShowManageDrawer] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [internalValue, setInternalValue] = useState('');

  // Selected command chip state
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);

  // Track search query (text after '/')
  const [commandSearch, setCommandSearch] = useState('');

  const isControlled = value !== undefined;
  const inputValue = isControlled ? value : internalValue;

  const handleInputChange = useCallback(
    (newValue: string) => {
      if (isControlled && onChange) {
        onChange(newValue);
      } else {
        setInternalValue(newValue);
      }

      // Check if input starts with '/' to show commands (only if no command selected)
      if (!selectedCommand && newValue.startsWith('/')) {
        setShowCommandsList(true);
        setCommandSearch(newValue.slice(1)); // Text after '/'
      } else {
        setShowCommandsList(false);
        setCommandSearch('');
      }
    },
    [isControlled, onChange, selectedCommand]
  );

  const handleSend = useCallback(
    (message: string) => {
      if (selectedCommand) {
        // Combine command prompt with any additional text
        const additionalText = message.trim();
        const fullPrompt = additionalText
          ? `${selectedCommand.prompt}\n\nAdditional context: ${additionalText}`
          : selectedCommand.prompt;

        onSend?.(fullPrompt, selectedCommand);

        // Clear selected command and input
        setSelectedCommand(null);
        if (isControlled && onChange) {
          onChange('');
        } else {
          setInternalValue('');
        }
        return;
      }

      // If sending a slash command without chip selection, find and execute it
      if (message.startsWith('/')) {
        const commandName = message.slice(1).toLowerCase().trim();
        const command = commands.find((cmd) => cmd.name.toLowerCase() === commandName);

        if (command) {
          onSend?.(command.prompt, command);
          setShowCommandsList(false);
          return;
        }
      }

      onSend?.(message);
      setShowCommandsList(false);
    },
    [commands, onSend, selectedCommand, isControlled, onChange]
  );

  const handleSelectCommand = useCallback(
    (command: Command) => {
      // Set the command as a chip instead of sending immediately
      setSelectedCommand(command);

      // Clear input (remove the '/' search text)
      if (isControlled && onChange) {
        onChange('');
      } else {
        setInternalValue('');
      }

      setShowCommandsList(false);
    },
    [isControlled, onChange]
  );

  const handleRemoveCommand = useCallback(() => {
    setSelectedCommand(null);
  }, []);

  const handleNewCommand = useCallback(() => {
    setShowCommandsList(false);
    setShowManageDrawer(false); // Close manage drawer when opening new command drawer
    setEditingCommand(null);
    setShowCommandDrawer(true);
  }, []);

  const handleManageCommands = useCallback(() => {
    setShowCommandsList(false);
    setShowManageDrawer(true);
  }, []);

  const handleEditCommand = useCallback((command: Command) => {
    setEditingCommand(command);
    setShowManageDrawer(false);
    setShowCommandDrawer(true);
  }, []);

  const handleSaveCommand = useCallback(
    (commandData: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (editingCommand) {
        updateCommand(editingCommand.id, commandData);
      } else {
        addCommand(commandData);
      }
      setShowCommandDrawer(false);
      setEditingCommand(null);
    },
    [editingCommand, addCommand, updateCommand]
  );

  const handleDeleteCommand = useCallback(
    (id: string) => {
      deleteCommand(id);
    },
    [deleteCommand]
  );

  const handleCloseCommandsList = useCallback(() => {
    setShowCommandsList(false);
    // Clear the '/' from input
    if (isControlled && onChange) {
      onChange('');
    } else {
      setInternalValue('');
    }
  }, [isControlled, onChange]);

  // Custom placeholder when command is selected
  const effectivePlaceholder = selectedCommand
    ? 'Add additional context (optional)...'
    : placeholder;

  return (
    <div ref={containerRef} className="relative">
      {/* Commands List Dropdown - positioned above input */}
      {showCommandsList && (
        <div className="absolute bottom-full left-0 right-0 px-6 max-w-4xl mx-auto w-full mb-1 z-50">
          <CommandsList
            commands={commands}
            onSelectCommand={handleSelectCommand}
            onNewCommand={handleNewCommand}
            onManageCommands={handleManageCommands}
            onClose={handleCloseCommandsList}
            searchQuery={commandSearch}
            position="above"
          />
        </div>
      )}

      {/* Command Chip + Input Area */}
      {selectedCommand ? (
        <div className="ml-2 p-3 bg-white antialiased font-sf">
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
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <span className="text-sm font-medium text-indigo-700">
                      {selectedCommand.name}
                    </span>
                    <button
                      onClick={handleRemoveCommand}
                      className="text-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <span className="text-sm text-gray-400 truncate flex-1">
                    {selectedCommand.name}
                  </span>
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
                    placeholder={effectivePlaceholder}
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

            <div className="text-xs leading-normal text-gray-500 text-center font-sf mt-1">
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

      {/* Command Drawer */}
      <CommandDrawer
        isOpen={showCommandDrawer}
        onClose={() => {
          setShowCommandDrawer(false);
          setEditingCommand(null);
        }}
        onSave={handleSaveCommand}
        editingCommand={editingCommand}
        salesforceFields={salesforceFields}
        isLoadingSalesforceFields={isLoadingSalesforceFields}
      />

      {/* Manage Commands Drawer */}
      <ManageCommandsDrawer
        isOpen={showManageDrawer}
        onClose={() => setShowManageDrawer(false)}
        commands={commands}
        onNewCommand={handleNewCommand}
        onEditCommand={handleEditCommand}
        onDeleteCommand={handleDeleteCommand}
      />
    </div>
  );
};
