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
export { CommandChip } from './CommandChip';
export type { CommandChipProps } from './CommandChip';
export { CommandsOverlay } from './CommandsOverlay';
export type { CommandsOverlayProps } from './CommandsOverlay';

// Hooks
export { useCommands } from './useCommands';
export { useCommandsInput } from './useCommandsInput';
export type { UseCommandsInputOptions, UseCommandsInputReturn } from './useCommandsInput';

// Types
export type {
  Command,
  CommandCategory,
  DataSource,
  ActionType,
  CommandsState,
  FillDocType,
  SalesforceFieldConfig,
  DataSourceConfig,
  FillDocConfig,
} from './types';

export {
  DATA_SOURCE_LABELS,
  ACTION_TYPE_LABELS,
  CATEGORY_OPTIONS,
  DEFAULT_COMMANDS,
  FILL_DOC_TYPE_LABELS,
  INTERNAL_DOC_FOLDERS,
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
