import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Command } from '../../Commands/types';

export interface UseCommandsKeyboardNavOptions {
  commands: Command[];
  commandSearch: string;
  showCommandsList: boolean;
  onSelectCommand: (command: Command) => void;
  /** When true, attaches a document-level keydown listener instead of returning a keydown handler */
  useDocumentListener?: boolean;
}

export interface UseCommandsKeyboardNavReturn {
  highlightedIndex: number;
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
  filteredCommands: Command[];
  /** Call this in a textarea/input's onKeyDown when useDocumentListener is false */
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
}

export function useCommandsKeyboardNav({
  commands,
  commandSearch,
  showCommandsList,
  onSelectCommand,
  useDocumentListener = false,
}: UseCommandsKeyboardNavOptions): UseCommandsKeyboardNavReturn {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const highlightedIndexRef = useRef(-1);
  // Keep ref in sync with state so navigate always reads the latest value
  highlightedIndexRef.current = highlightedIndex;

  const filteredCommands = useMemo(
    () =>
      commandSearch
        ? commands.filter((c) => c.name.toLowerCase().includes(commandSearch.toLowerCase().trim()))
        : commands,
    [commands, commandSearch]
  );

  // Reset to no highlight when list opens or search changes
  useEffect(() => {
    if (showCommandsList) setHighlightedIndex(-1);
  }, [showCommandsList, commandSearch]);

  const navigate = useCallback(
    (key: string): boolean => {
      if (!showCommandsList || filteredCommands.length === 0) return false;
      if (key === 'ArrowDown') {
        setHighlightedIndex((i) => {
          const next = i < 0 ? 0 : Math.min(i + 1, filteredCommands.length - 1);
          highlightedIndexRef.current = next;
          return next;
        });
        return true;
      }
      if (key === 'ArrowUp') {
        setHighlightedIndex((i) => {
          const next = i <= 0 ? -1 : i - 1;
          highlightedIndexRef.current = next;
          return next;
        });
        return true;
      }
      if (key === 'Enter') {
        if (highlightedIndexRef.current < 0) return false;
        const cmd = filteredCommands[highlightedIndexRef.current];
        if (cmd) {
          onSelectCommand(cmd);
          return true;
        }
      }
      return false;
    },
    [showCommandsList, filteredCommands, onSelectCommand]
  );

  // Document-level listener mode (for inputs that don't expose onKeyDown)
  useEffect(() => {
    if (!useDocumentListener || !showCommandsList) return;
    const handler = (e: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
        const handled = navigate(e.key);
        if (handled) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [useDocumentListener, showCommandsList, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return false;
      const handled = navigate(e.key);
      if (handled) e.preventDefault();
      return handled;
    },
    [navigate]
  );

  return { highlightedIndex, setHighlightedIndex, filteredCommands, handleKeyDown };
}
