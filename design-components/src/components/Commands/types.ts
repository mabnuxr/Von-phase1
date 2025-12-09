/**
 * Commands feature types
 * Self-contained module for slash command functionality
 */

export type CommandCategory = 'Sales' | 'Research' | 'Analysis' | 'Custom';

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

export interface Command {
  id: string;
  name: string;
  description: string;
  category: CommandCategory;
  dataSources: DataSource[];
  dataSourceConfigs?: Record<DataSource, DataSourceConfig>;
  actionType: ActionType;
  // Action-specific configurations
  salesforceFields?: SalesforceFieldConfig[];
  fillDocConfig?: FillDocConfig;
  prompt: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
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

/**
 * Internal docs folder options
 */
export const INTERNAL_DOC_FOLDERS = [
  'Sales Documents',
  'Product Specs',
  'Customer Research',
  'Marketing Materials',
] as const;

// Default commands that come pre-loaded
export const DEFAULT_COMMANDS: Command[] = [
  {
    id: 'default-follow-up-email',
    name: 'Follow-up email',
    description: 'Write a professional follow-up email for your contact',
    category: 'Sales',
    dataSources: ['emails', 'sfdc'],
    actionType: 'gmail_draft',
    prompt:
      'Write a professional follow-up email based on the recent communication history and deal context.',
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-deal-summary',
    name: 'Deal summary',
    description: 'Comprehensive summary of a deal with status and next steps',
    category: 'Sales',
    dataSources: ['emails', 'calls', 'sfdc'],
    actionType: 'text_output',
    prompt:
      'Provide a comprehensive summary of this deal including current status, key stakeholders, recent activities, and recommended next steps.',
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
