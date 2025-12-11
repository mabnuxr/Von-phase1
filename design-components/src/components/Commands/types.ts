/**
 * Commands feature types
 * Self-contained module for slash command functionality
 */

export type CommandCategory = 'Sales' | 'Research' | 'Analysis' | 'Custom';

export type DataSource = 'emails' | 'calls' | 'sfdc' | 'internal_docs';

export type ActionType = 'update_salesforce' | 'text_output' | 'fill_doc' | 'gmail_draft';

export interface Command {
  id: string;
  name: string;
  description: string;
  category: CommandCategory;
  dataSources: DataSource[];
  actionType: ActionType;
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

export const CATEGORY_OPTIONS: CommandCategory[] = ['Sales', 'Research', 'Analysis', 'Custom'];

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
