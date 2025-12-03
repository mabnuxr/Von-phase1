/**
 * Commands module
 * Self-contained slash command functionality for chat
 */

// Components
export { CommandsList } from './CommandsList';
export { CommandDrawer } from './CommandDrawer';
export { ManageCommandsDrawer } from './ManageCommandsDrawer';
export { ChatInputWithCommands } from './ChatInputWithCommands';
export type { ChatInputWithCommandsProps } from './ChatInputWithCommands';

// Hook
export { useCommands } from './useCommands';

// Types
export type { Command, CommandCategory, DataSource, ActionType, CommandsState } from './types';

export {
  DATA_SOURCE_LABELS,
  ACTION_TYPE_LABELS,
  CATEGORY_OPTIONS,
  DEFAULT_COMMANDS,
} from './types';

// Storage utilities
export {
  getCommands,
  saveCommands,
  addCommand,
  updateCommand,
  deleteCommand,
  getCommandById,
  searchCommands,
  getCommandsByCategory,
  resetToDefaults,
} from './storage';
