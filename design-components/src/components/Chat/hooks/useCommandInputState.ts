import { useState, useCallback, useEffect, useRef } from 'react';
import type { Command } from '../../Commands/types';
import { getPlainText } from '../utils/text';

export interface UseCommandInputStateOptions {
  enableCommands: boolean;
  onChange?: (value: string) => void;
  /**
   * The locked command derived from the last user message that was sent with a
   * data-sources command. Passed in from the parent so the chip is restored
   * when the component mounts or when messages finish loading asynchronously.
   */
  lockedCommandFromHistory?: Command | null;
}

export interface UseCommandInputStateReturn {
  showCommandsList: boolean;
  commandSearch: string;
  selectedCommand: Command | null;
  /**
   * True once the selected command (which has data sources) has been sent at
   * least once, OR when a locked command was restored from message history.
   * While locked the chip is non-removable and persists across messages.
   * Resets to false whenever a new command is selected.
   */
  isCommandLocked: boolean;
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
  /** Locks the current command chip — called after sending a message with a data-sources command */
  lockCommand: () => void;
}

export function useCommandInputState({
  enableCommands,
  onChange,
  lockedCommandFromHistory,
}: UseCommandInputStateOptions): UseCommandInputStateReturn {
  const [showCommandsList, setShowCommandsList] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  const [isCommandLocked, setIsCommandLocked] = useState(false);

  // Tracks whether the user has manually interacted with command state since
  // mount. Prevents the history-derived lock from overriding deliberate changes
  // when messages load asynchronously after the component is already mounted.
  const hasUserInteracted = useRef(false);

  // Sync the locked command from message history. Fires when messages first
  // arrive (async load) but is skipped once the user has touched the state.
  useEffect(() => {
    if (hasUserInteracted.current) return;
    if (lockedCommandFromHistory) {
      setSelectedCommand(lockedCommandFromHistory);
      setIsCommandLocked(true);
    }
  }, [lockedCommandFromHistory]);

  const handleChange = useCallback(
    (newValue: string) => {
      onChange?.(newValue);

      if (!enableCommands) return;

      const plainText = getPlainText(newValue);
      // Open the list when the field starts with "/" and no command is already selected.
      // Backspacing past "/" will close it again.
      if (!selectedCommand && plainText.startsWith('/')) {
        setShowCommandsList(true);
        setCommandSearch(plainText.slice(1).trim());
      } else {
        setShowCommandsList(false);
        setCommandSearch('');
      }
    },
    [onChange, enableCommands, selectedCommand]
  );

  const handleSelectCommand = useCallback(
    (command: Command) => {
      hasUserInteracted.current = true;
      setSelectedCommand(command);
      setIsCommandLocked(false);
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
    hasUserInteracted.current = true;
    setSelectedCommand(null);
    setIsCommandLocked(false);
  }, []);

  const dismissCommandsList = useCallback(() => {
    setShowCommandsList(false);
  }, []);

  const lockCommand = useCallback(() => {
    hasUserInteracted.current = true;
    setIsCommandLocked(true);
  }, []);

  return {
    showCommandsList,
    commandSearch,
    selectedCommand,
    isCommandLocked,
    handleChange,
    handleSelectCommand,
    handleCloseCommandsList,
    clearSelectedCommand,
    dismissCommandsList,
    lockCommand,
  };
}
