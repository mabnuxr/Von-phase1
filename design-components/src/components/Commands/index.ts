/**
 * Commands module
 * Self-contained slash command functionality for chat
 */

// Components
export { CommandsList } from './CommandsList';
export type { CommandsListProps } from './CommandsList';
export { CommandChip } from './CommandChip';
export type { CommandChipProps } from './CommandChip';
export { CommandDrawer } from './CommandDrawer';
export type { CommandDrawerProps } from './CommandDrawer';
export { ManageCommandsDrawer } from './ManageCommandsDrawer';
export type { ManageCommandsDrawerProps } from './ManageCommandsDrawer';
export { CommandsOverlay } from './CommandsOverlay';
export type { CommandsOverlayProps } from './CommandsOverlay';
export { CommandPreview } from './CommandPreview';
export type { CommandPreviewProps } from './CommandPreview';
export { ScheduleSection } from './ScheduleSection';
export type { ScheduleSectionProps } from './ScheduleSection';

// Hooks
export { useCommands } from './useCommands';
export { useCommandsInput } from './useCommandsInput';
export type { UseCommandsInputOptions, UseCommandsInputReturn } from './useCommandsInput';
export { useCommandsFilter } from './useCommandsFilter';
export type { UseCommandsFilterReturn } from './useCommandsFilter';
export { useCommandForm } from './useCommandForm';
export type { UseCommandFormOptions, UseCommandFormReturn, FormValues } from './useCommandForm';
export { useCommandDataSources } from './useCommandDataSources';
export type {
  UseCommandDataSourcesOptions,
  UseCommandDataSourcesReturn,
} from './useCommandDataSources';

// Types
export type {
  Command,
  CommandAttachment,
  CommandCategory,
  DataSource,
  ActionType,
  CommandsState,
  FillDocType,
  SalesforceFieldConfig,
  DataSourceConfig,
  FillDocConfig,
  CommandSchedule,
  ScheduleFrequency,
  ScheduleDay,
  ScheduleRecipient,
} from './types';

export {
  DATA_SOURCE_LABELS,
  ACTION_TYPE_LABELS,
  CATEGORY_OPTIONS,
  DEFAULT_COMMANDS,
  FILL_DOC_TYPE_LABELS,
  INTERNAL_DOC_FOLDERS,
  generateCommandId,
  SCHEDULE_FREQUENCIES,
  SCHEDULE_DAYS,
  SCHEDULE_TIMES,
  DEFAULT_SCHEDULE,
  formatScheduleBadge,
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
