import { useState, useCallback } from 'react';
import type { Command } from '../../Commands/types';
import { getPlainText } from '../utils/text';

export interface UseCommandInputStateOptions {
  enableCommands: boolean;
  onChange?: (value: string) => void;
}

export interface UseCommandInputStateReturn {
  showCommandsList: boolean;
  commandSearch: string;
  selectedCommand: Command | null;
  /** Wraps the input's onChange — detects "/" prefix and opens the commands list */
  handleChange: (newValue: string) => void;
  /** Selects a command from the list, prefills the input, and closes the list */
  handleSelectCommand: (command: Command) => void;
  /** Closes the commands list without touching the input value (e.g. Escape / click outside) */
  handleCloseCommandsList: () => void;
  /** Clears the active command chip without touching the input value */
  clearSelectedCommand: () => void;
  /** Closes the commands list without clearing the input (e.g. after send) */
  dismissCommandsList: () => void;
}

export function useCommandInputState({
  enableCommands,
  onChange,
}: UseCommandInputStateOptions): UseCommandInputStateReturn {
  const [showCommandsList, setShowCommandsList] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);

  const handleChange = useCallback(
    (newValue: string) => {
      onChange?.(newValue);

      if (!enableCommands) return;

      const plainText = getPlainText(newValue);
      // Open the list when the field starts with "/".
      // Works even when a command is already selected — selecting a new one replaces it.
      if (plainText.startsWith('/')) {
        setShowCommandsList(true);
        setCommandSearch(plainText.slice(1).trim());
      } else {
        setShowCommandsList(false);
        setCommandSearch('');
      }
    },
    [onChange, enableCommands]
  );

  const handleSelectCommand = useCallback(
    (command: Command) => {
      setSelectedCommand(command);
      onChange?.(command.prefillText || '');
      setShowCommandsList(false);
      setCommandSearch('');
    },
    [onChange]
  );

  const handleCloseCommandsList = useCallback(() => {
    setShowCommandsList(false);
    setCommandSearch('');
  }, []);

  const clearSelectedCommand = useCallback(() => {
    setSelectedCommand(null);
  }, []);

  const dismissCommandsList = useCallback(() => {
    setShowCommandsList(false);
  }, []);

  return {
    showCommandsList,
    commandSearch,
    selectedCommand,
    handleChange,
    handleSelectCommand,
    handleCloseCommandsList,
    clearSelectedCommand,
    dismissCommandsList,
  };
}
