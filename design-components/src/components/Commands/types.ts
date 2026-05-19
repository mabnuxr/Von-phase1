/**
 * Commands feature types
 * Self-contained module for slash command functionality
 */

import type { Schedule, ScheduleFrequency, ScheduleDay } from '../SchedulePicker';
import type { Recipient } from '../RecipientPicker';

export type CommandCategory = 'Sales' | 'Research' | 'Analysis' | 'Custom';

// ---------------------------------------------------------------------------
// Schedule types — re-exported from general-purpose components
// ---------------------------------------------------------------------------

export type { ScheduleFrequency, ScheduleDay };
export type ScheduleRecipient = Recipient;

export interface CommandSchedule extends Schedule {
  recipients: ScheduleRecipient[];
}

export type DataSource = 'emails' | 'calls' | 'sfdc' | 'internal_docs';

export type ActionType = 'update_salesforce' | 'text_output' | 'fill_doc' | 'gmail_draft';

export type FillDocType = 'upload_on_chat' | 'upload_template';

/**
 * Salesforce field configuration for Update Salesforce action
 */
export interface SalesforceFieldConfig {
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
}

/**
 * Data source configuration with granular settings
 */
export interface DataSourceConfig {
  enabled: boolean;
  instructions?: string;
  folders?: string[]; // For internal_docs
}

/**
 * Fill a Doc action configuration
 */
export interface FillDocConfig {
  type: FillDocType;
  templateFile?: File | null;
  templateName?: string;
}

export interface CommandDataSources {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extension: string;
  category: string;
  s3Key: string;
}

/** Dashboard reference tagged onto a command. Mirrors the backend DashboardReference shape. */
export interface CommandDashboardReference {
  refId: string;
  type: 'dashboard';
  context: {
    dashboardId: string;
    dashboardVersion: number;
    dashboardName: string;
  };
}

export type CommandReference = CommandDashboardReference;

/** Picker option presented to the user when tagging dashboards on a command. */
export interface DashboardOption {
  dashboardId: string;
  dashboardName: string;
  dashboardVersion: number;
}

/** UI-friendly attachment shape (populated by API mapping) */
export interface CommandAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  category: string;
  previewUrl?: string;
  s3Key?: string;
  /** Tracks eager-upload state for newly added files */
  uploadStatus?: 'uploading' | 'uploaded' | 'error';
}

/**
 * Generate a MongoDB-compatible 24-char hex ObjectId on the client.
 * Safe to use as a pre-generated command ID when creating a new command.
 */
export function generateCommandId(): string {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');
  const random = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return timestamp + random;
}

export interface Command {
  id: string;
  name: string;
  prompt: string;
  prefillText?: string;
  dataSources?: CommandAttachment[];
  references?: CommandReference[];
  createdAt: string;
  updatedAt: string;
  // Fields populated when mapped from the API response
  description?: string;
  sharingScope?: SharingScope;
  /** User IDs this command is explicitly shared with (only set when sharingScope === 'specific') */
  sharedUserIds?: string[];
  isFavorite?: boolean;
  usageCount?: number;
  lastUsedAt?: string;
  createdBy?: 'me' | 'team';
  /** Display name of the creator — populated for team-owned commands */
  creatorName?: string;
  actionType?: string;
  schedule?: CommandSchedule;
  /** Auto-approve actions during headless runs (scheduled or "Run sample"). Defaults to false. */
  autoApprove?: boolean;
}

export interface CommandsState {
  commands: Command[];
  isLoading: boolean;
}

export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  emails: 'Emails',
  calls: 'Calls',
  sfdc: 'SFDC',
  internal_docs: 'Internal Docs',
};

export const ACTION_TYPE_LABELS: Record<ActionType, { label: string; description: string }> = {
  update_salesforce: { label: 'Update Salesforce', description: 'Update fields based on context' },
  text_output: { label: 'Text Output', description: 'Generate text in chat' },
  fill_doc: { label: 'Fill a Doc', description: 'Fill document template' },
  gmail_draft: { label: 'Gmail Draft', description: 'Draft an email' },
};

export const FILL_DOC_TYPE_LABELS: Record<FillDocType, { label: string; description: string }> = {
  upload_on_chat: { label: 'Upload on Chat', description: 'Fill existing document' },
  upload_template: { label: 'Upload Template', description: 'Use blank template' },
};

export const CATEGORY_OPTIONS: CommandCategory[] = ['Sales', 'Research', 'Analysis', 'Custom'];

export type CommandSortOption = 'recently_used' | 'most_used' | 'created_by_me';

export const SORT_OPTIONS: { value: CommandSortOption; label: string }[] = [
  { value: 'recently_used', label: 'Recently used' },
  { value: 'most_used', label: 'Most used' },
  { value: 'created_by_me', label: 'Created by me' },
];

export type SharingScope = 'private' | 'org' | 'specific';

export const SHARING_SCOPE_LABELS: Record<SharingScope, string> = {
  private: 'Private',
  org: 'Org-wide',
  specific: 'Specific people',
};

/**
 * Internal docs folder options
 */
export const INTERNAL_DOC_FOLDERS = [
  'Sales Documents',
  'Product Specs',
  'Customer Research',
  'Marketing Materials',
] as const;

// ---------------------------------------------------------------------------
// Schedule constants & helpers — re-exported from SchedulePicker
// ---------------------------------------------------------------------------

export {
  SCHEDULE_FREQUENCIES,
  SCHEDULE_DAYS,
  SCHEDULE_TIMES,
  formatScheduleBadge,
} from '../SchedulePicker';

export const DEFAULT_SCHEDULE: CommandSchedule = {
  enabled: false,
  frequency: 'weekly',
  time: '09:00',
  days: ['Mon'],
  dayOfMonth: 1,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  recipients: [],
};

// Default commands that come pre-loaded
export const DEFAULT_COMMANDS: Command[] = [
  {
    id: 'default-follow-up-email',
    name: 'Follow-up email',
    prompt:
      'Write a professional follow-up email based on the recent communication history and deal context.',
    sharingScope: 'org',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-deal-summary',
    name: 'Deal summary',
    prompt:
      'Provide a comprehensive summary of this deal including current status, key stakeholders, recent activities, and recommended next steps.',
    sharingScope: 'org',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
