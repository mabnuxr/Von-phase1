/**
 * ChatInputWithCommands component
 * Wraps ChatInput with commands functionality
 */

import React, { useState, useCallback } from 'react';
import type { ChatInputProps } from '../Chat/ChatInput';
import { ChatInput } from '../Chat/ChatInput';
import { CommandsList } from './CommandsList';
import { CommandDrawer } from './CommandDrawer';
import { ManageCommandsDrawer } from './ManageCommandsDrawer';
import { useCommands } from './useCommands';
import type { Command } from './types';

export interface ChatInputWithCommandsProps extends Omit<ChatInputProps, 'onSend'> {
  onSend?: (message: string) => void;
}

export const ChatInputWithCommands: React.FC<ChatInputWithCommandsProps> = ({
  onSend,
  value,
  onChange,
  ...props
}) => {
  const { commands, addCommand, updateCommand, deleteCommand } = useCommands();

  const [showCommandsList, setShowCommandsList] = useState(false);
  const [showCommandDrawer, setShowCommandDrawer] = useState(false);
  const [showManageDrawer, setShowManageDrawer] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [internalValue, setInternalValue] = useState('');

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

      // Check if input starts with '/' to show commands
      if (newValue.startsWith('/')) {
        setShowCommandsList(true);
        setCommandSearch(newValue.slice(1)); // Text after '/'
      } else {
        setShowCommandsList(false);
        setCommandSearch('');
      }
    },
    [isControlled, onChange]
  );

  const handleSend = useCallback(
    (message: string) => {
      // If sending a slash command, find and execute it
      if (message.startsWith('/')) {
        const commandName = message.slice(1).toLowerCase().trim();
        const command = commands.find((cmd) => cmd.name.toLowerCase() === commandName);

        if (command) {
          // Send the command's prompt
          onSend?.(command.prompt);
          setShowCommandsList(false);
          return;
        }
      }

      onSend?.(message);
      setShowCommandsList(false);
    },
    [commands, onSend]
  );

  const handleSelectCommand = useCallback(
    (command: Command) => {
      // Insert the command's prompt into chat
      onSend?.(command.prompt);

      // Clear input
      if (isControlled && onChange) {
        onChange('');
      } else {
        setInternalValue('');
      }

      setShowCommandsList(false);
    },
    [isControlled, onChange, onSend]
  );

  const handleNewCommand = useCallback(() => {
    setShowCommandsList(false);
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

  return (
    <div className="relative">
      {/* Commands List Dropdown */}
      {showCommandsList && (
        <CommandsList
          commands={commands}
          onSelectCommand={handleSelectCommand}
          onNewCommand={handleNewCommand}
          onManageCommands={handleManageCommands}
          onClose={handleCloseCommandsList}
          searchQuery={commandSearch}
        />
      )}

      {/* Chat Input */}
      <ChatInput {...props} value={inputValue} onChange={handleInputChange} onSend={handleSend} />

      {/* Command Drawer */}
      <CommandDrawer
        isOpen={showCommandDrawer}
        onClose={() => {
          setShowCommandDrawer(false);
          setEditingCommand(null);
        }}
        onSave={handleSaveCommand}
        editingCommand={editingCommand}
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
