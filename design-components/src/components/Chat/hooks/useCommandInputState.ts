import { useState, useCallback } from 'react';
import type { Command } from '../../Commands/types';
import { getPlainText } from '../utils/text';

export interface UseCommandInputStateOptions {
  onChange?: (value: string) => void;
  onSlashCommandOpened?: () => void;
}

export interface UseCommandInputStateReturn {
  showCommandsList: boolean;
  commandSearch: string;
  selectedCommand: Command | null;
  /** Wraps the input's onChange — detects "/" prefix and opens the commands list */
  handleChange: (newValue: string) => void;
  /** Selects a command from the list, prefills the input, and closes the list */
  handleSelectCommand: (command: Command) => void;
  /** Closes the commands list and clears the input (e.g. Escape / click outside while list is open) */
  handleCloseCommandsList: () => void;
  /** Clears the active command chip without touching the input value */
  clearSelectedCommand: () => void;
  /** Closes the commands list without clearing the input (e.g. after send) */
  dismissCommandsList: () => void;
}

export function useCommandInputState({
  onChange,
  onSlashCommandOpened,
}: UseCommandInputStateOptions): UseCommandInputStateReturn {
  const [showCommandsList, setShowCommandsList] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);

  const handleChange = useCallback(
    (newValue: string) => {
      onChange?.(newValue);

      const plainText = getPlainText(newValue);
      // Show the list when text is "/" optionally followed by non-space chars.
      // Close it as soon as a space is typed after "/".
      const afterSlash = plainText.slice(1);
      if (plainText.startsWith('/') && !afterSlash.startsWith(' ')) {
        setShowCommandsList(true);
        setCommandSearch(afterSlash);
        onSlashCommandOpened?.();
      } else {
        setShowCommandsList(false);
        setCommandSearch('');
      }
    },
    [onChange, onSlashCommandOpened]
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
    onChange?.('');
  }, [onChange]);

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
