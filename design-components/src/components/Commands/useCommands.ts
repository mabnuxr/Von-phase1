/**
 * Commands hook
 * Provides reactive state management for commands
 */

import { useState, useCallback } from 'react';
import { Command, CommandCategory } from './types';
import {
  getCommands,
  addCommand as storageAddCommand,
  updateCommand as storageUpdateCommand,
  deleteCommand as storageDeleteCommand,
  searchCommands,
  getCommandsByCategory,
} from './storage';

export function useCommands() {
  const [commands, setCommands] = useState<Command[]>(() => getCommands());
  const [isLoading, setIsLoading] = useState(false);

  const refreshCommands = useCallback(() => {
    setCommands(getCommands());
  }, []);

  const addCommand = useCallback((command: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      const newCommand = storageAddCommand(command);
      setCommands((prev) => [...prev, newCommand]);
      return newCommand;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCommand = useCallback(
    (id: string, updates: Partial<Omit<Command, 'id' | 'createdAt'>>) => {
      setIsLoading(true);
      try {
        const updated = storageUpdateCommand(id, updates);
        if (updated) {
          setCommands((prev) => prev.map((cmd) => (cmd.id === id ? updated : cmd)));
        }
        return updated;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteCommand = useCallback((id: string) => {
    setIsLoading(true);
    try {
      const success = storageDeleteCommand(id);
      if (success) {
        setCommands((prev) => prev.filter((cmd) => cmd.id !== id));
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterBySearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        return commands;
      }
      return searchCommands(query);
    },
    [commands]
  );

  const filterByCategory = useCallback((category: CommandCategory | 'All') => {
    return getCommandsByCategory(category);
  }, []);

  return {
    commands,
    isLoading,
    refreshCommands,
    addCommand,
    updateCommand,
    deleteCommand,
    filterBySearch,
    filterByCategory,
  };
}
