/**
 * Commands localStorage service
 * Self-contained storage for slash commands
 */

import type { Command } from './types';
import { DEFAULT_COMMANDS } from './types';

const STORAGE_KEY = 'von-commands';

/**
 * Get all commands from localStorage
 * Returns default commands if none exist
 */
export function getCommands(): Command[] {
  if (typeof window === 'undefined') return DEFAULT_COMMANDS;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Initialize with default commands
      saveCommands(DEFAULT_COMMANDS);
      return DEFAULT_COMMANDS;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.warn('[Commands] Failed to load commands from localStorage:', error);
    return DEFAULT_COMMANDS;
  }
}

/**
 * Save commands to localStorage
 */
export function saveCommands(commands: Command[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
  } catch (error) {
    console.warn('[Commands] Failed to save commands to localStorage:', error);
  }
}

/**
 * Add a new command
 */
export function addCommand(command: Omit<Command, 'id' | 'createdAt' | 'updatedAt'>): Command {
  const commands = getCommands();
  const newCommand: Command = {
    ...command,
    id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveCommands([...commands, newCommand]);
  return newCommand;
}

/**
 * Update an existing command
 */
export function updateCommand(
  id: string,
  updates: Partial<Omit<Command, 'id' | 'createdAt'>>
): Command | null {
  const commands = getCommands();
  const index = commands.findIndex((cmd) => cmd.id === id);

  if (index === -1) return null;

  const updatedCommand: Command = {
    ...commands[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  commands[index] = updatedCommand;
  saveCommands(commands);
  return updatedCommand;
}

/**
 * Delete a command
 */
export function deleteCommand(id: string): boolean {
  const commands = getCommands();
  const filtered = commands.filter((cmd) => cmd.id !== id);

  if (filtered.length === commands.length) return false;

  saveCommands(filtered);
  return true;
}

/**
 * Get a single command by ID
 */
export function getCommandById(id: string): Command | null {
  const commands = getCommands();
  return commands.find((cmd) => cmd.id === id) || null;
}

/**
 * Search commands by name or description
 */
export function searchCommands(query: string): Command[] {
  const commands = getCommands();
  const lowerQuery = query.toLowerCase();

  return commands.filter((cmd) => cmd.name.toLowerCase().includes(lowerQuery));
}

/**
 * Get commands by category
 */
export function getCommandsByCategory(category: string): Command[] {
  const commands = getCommands();
  if (category === 'All') return commands;
  return commands.filter((cmd) => cmd.dataSources?.some((ds) => ds.category === category));
}

/**
 * Reset commands to defaults
 */
export function resetToDefaults(): void {
  saveCommands(DEFAULT_COMMANDS);
}
