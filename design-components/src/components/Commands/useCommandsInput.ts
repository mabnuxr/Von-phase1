/**
 * useCommandsInput hook
 * Shared business logic for command input components
 * Handles command selection, input state, and drawer management
 */

import { useState, useCallback } from 'react';
import { useCommands } from './useCommands';
import type { Command } from './types';

export interface UseCommandsInputOptions {
  /** Controlled value */
  value?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Callback when message is sent */
  onSend?: (message: string, command?: Command) => void;
}

export interface UseCommandsInputReturn {
  // State
  commands: Command[];
  inputValue: string;
  selectedCommand: Command | null;
  commandSearch: string;
  showCommandsList: boolean;
  showCommandDrawer: boolean;
  showManageDrawer: boolean;
  editingCommand: Command | null;

  // Derived
  effectivePlaceholder: (defaultPlaceholder: string) => string;

  // Handlers
  handleInputChange: (newValue: string) => void;
  handleSend: (message: string) => void;
  handleSelectCommand: (command: Command) => void;
  handleRemoveCommand: () => void;
  handleNewCommand: () => void;
  handleManageCommands: () => void;
  handleEditCommand: (command: Command) => void;
  handleSaveCommand: (commandData: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>) => void;
  handleDeleteCommand: (id: string) => void;
  handleCloseCommandsList: () => void;
  closeCommandDrawer: () => void;
  closeManageDrawer: () => void;
}

export function useCommandsInput({
  value,
  onChange,
  onSend,
}: UseCommandsInputOptions): UseCommandsInputReturn {
  const { commands, addCommand, updateCommand, deleteCommand } = useCommands();

  // UI state
  const [showCommandsList, setShowCommandsList] = useState(false);
  const [showCommandDrawer, setShowCommandDrawer] = useState(false);
  const [showManageDrawer, setShowManageDrawer] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);

  // Input state
  const [internalValue, setInternalValue] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [commandSearch, setCommandSearch] = useState('');

  const isControlled = value !== undefined;
  const inputValue = isControlled ? value : internalValue;

  const clearInput = useCallback(() => {
    if (isControlled && onChange) {
      onChange('');
    } else {
      setInternalValue('');
    }
  }, [isControlled, onChange]);

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
        clearInput();
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
    [commands, onSend, selectedCommand, clearInput]
  );

  const handleSelectCommand = useCallback(
    (command: Command) => {
      setSelectedCommand(command);
      clearInput();
      setShowCommandsList(false);
    },
    [clearInput]
  );

  const handleRemoveCommand = useCallback(() => {
    setSelectedCommand(null);
  }, []);

  const handleNewCommand = useCallback(() => {
    setShowCommandsList(false);
    setShowManageDrawer(false);
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
    clearInput();
  }, [clearInput]);

  const closeCommandDrawer = useCallback(() => {
    setShowCommandDrawer(false);
    setEditingCommand(null);
  }, []);

  const closeManageDrawer = useCallback(() => {
    setShowManageDrawer(false);
  }, []);

  const effectivePlaceholder = useCallback(
    (defaultPlaceholder: string) => {
      return selectedCommand ? 'Add additional context (optional)...' : defaultPlaceholder;
    },
    [selectedCommand]
  );

  return {
    // State
    commands,
    inputValue,
    selectedCommand,
    commandSearch,
    showCommandsList,
    showCommandDrawer,
    showManageDrawer,
    editingCommand,

    // Derived
    effectivePlaceholder,

    // Handlers
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
  };
}
