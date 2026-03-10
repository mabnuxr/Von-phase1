/**
 * Commands feature types
 * Self-contained module for slash command functionality
 */

export type CommandCategory = 'Sales' | 'Research' | 'Analysis' | 'Custom';

// ---------------------------------------------------------------------------
// Schedule types
// ---------------------------------------------------------------------------

export type ScheduleFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
export type ScheduleDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface ScheduleRecipient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface CommandSchedule {
  enabled: boolean;
  frequency: ScheduleFrequency;
  time: string; // "09:00"
  days: ScheduleDay[]; // for weekly/bi-weekly
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
  createdAt: string;
  updatedAt: string;
  // Fields populated when mapped from the API response
  description?: string;
  sharingScope?: 'private' | 'org';
  isFavorite?: boolean;
  usageCount?: number;
  lastUsedAt?: string;
  createdBy?: 'me' | 'team';
  /** Display name of the creator — populated for team-owned commands */
  creatorName?: string;
  actionType?: string;
  schedule?: CommandSchedule;
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

export type SharingScope = 'private' | 'org';

export const SHARING_SCOPE_LABELS: Record<SharingScope, string> = {
  private: 'Private',
  org: 'Org-wide',
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
// Schedule constants & helpers
// ---------------------------------------------------------------------------

export const SCHEDULE_FREQUENCIES: { value: ScheduleFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const SCHEDULE_DAYS: ScheduleDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SCHEDULE_TIMES: { value: string; label: string }[] = Array.from(
  { length: 15 },
  (_, i) => {
    const hour = i + 6; // 6 AM – 8 PM
    const value = `${hour.toString().padStart(2, '0')}:00`;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const display = hour === 12 ? 12 : hour > 12 ? hour - 12 : hour;
    return { value, label: `${display}:00 ${ampm}` };
  }
);

export const DEFAULT_SCHEDULE: CommandSchedule = {
  enabled: false,
  frequency: 'weekly',
  time: '09:00',
  days: ['Mon'],
  recipients: [],
};

export function formatScheduleBadge(schedule: CommandSchedule): string {
  const freq = SCHEDULE_FREQUENCIES.find((f) => f.value === schedule.frequency)?.label ?? schedule.frequency;
  const timeLabel = SCHEDULE_TIMES.find((t) => t.value === schedule.time)?.label ?? schedule.time;
  const parts = [freq];
  if (schedule.frequency === 'weekly' || schedule.frequency === 'bi-weekly') {
    parts.push(schedule.days.join(', '));
  }
  parts.push(timeLabel);
  return parts.join(' · ');
}

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
