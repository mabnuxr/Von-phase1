import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { MarkdownActionCard } from '../../../../components/Chat/DeepResearch/MarkdownActionCard';

// ============================================================================
// Decorator
// ============================================================================

const CardDecorator: Decorator = (Story) => (
  <div
    style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#ffffff',
      padding: '24px',
    }}
  >
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <Story />
    </div>
  </div>
);

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Components/Chat/MarkdownActionCard',
  component: MarkdownActionCard,
  decorators: [CardDecorator],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MarkdownActionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Plan Approval Variant
// ============================================================================

const planApprovalMarkdown = `## Dashboard Plan

I'll create a comprehensive pipeline dashboard with the following components:

### KPI Cards (3)
- **Total Pipeline Value** - Sum of all open opportunities
- **Deals Closing This Quarter** - Count of opportunities with close date in Q1
- **Average Deal Size** - Mean opportunity value

### Charts (2)
1. **Pipeline by Stage** - Bar chart showing value distribution across stages
2. **Deals by Risk Level** - Pie chart with Low/Medium/High risk breakdown

### Data Table
Full deal details with columns: Deal Name, Account, Owner, Amount, Close Date, Stage, and AI-generated insights (Deal Health, Next Best Action).

*Estimated build time: ~30 seconds*`;

export const PlanApproval: Story = {
  args: {
    variant: 'plan-approval',
    markdown: planApprovalMarkdown,
    primaryAction: {
      label: 'Approve',
      onClick: () => console.log('Plan approved'),
    },
    secondaryAction: {
      label: 'Reject',
      onClick: () => console.log('Plan rejected'),
    },
  },
};

// ============================================================================
// Analysis Request Variant (Deep Research)
// ============================================================================

const analysisRequestMarkdown = `## Sample Analysis Preview

Based on initial data review, here's a preview of the insights I can provide:

### Key Highlights
- **Total Q4 Revenue**: $12.8M across 847 closed deals
- **Top Region**: West Coast (+18% vs Q3)
- **Highest Growth Category**: Enterprise SaaS (+32%)

### Initial Observations
- Deal velocity improved by 12% compared to Q3
- Average deal size increased from $14.2K to $15.1K
- Win rate held steady at 28%

### Potential Areas of Concern
- Mid-market segment showing 8% decline
- Longer sales cycles in healthcare vertical

---

*This is a sample preview. The full analysis will include detailed breakdowns, competitive analysis, and strategic recommendations.*`;

export const AnalysisRequest: Story = {
  args: {
    variant: 'analysis-request',
    markdown: analysisRequestMarkdown,
    primaryAction: {
      label: 'Run Full Analysis',
      onClick: () => console.log('Running full analysis'),
    },
    secondaryAction: {
      label: 'Skip',
      onClick: () => console.log('Skipped'),
    },
  },
};

// ============================================================================
// Salesforce Single Update Variant
// ============================================================================

const salesforceSingleMarkdown = `### Acme Corp Enterprise Deal

I'm ready to update this opportunity with the following changes:

| Field | Current Value | New Value |
|-------|---------------|-----------|
| Amount | $245,000 | **$320,000** |
| Close Date | March 15, 2024 | **April 30, 2024** |
| Stage | Proposal | **Negotiation** |
| Probability | 50% | **70%** |

**Reason for changes**: Based on the latest call with Acme Corp, they've agreed to expand scope and confirmed budget approval.`;

export const SalesforceSingle: Story = {
  args: {
    variant: 'salesforce-single',
    markdown: salesforceSingleMarkdown,
    primaryAction: {
      label: 'Update',
      onClick: () => console.log('Updated'),
    },
    secondaryAction: {
      label: 'Cancel',
      onClick: () => console.log('Cancelled'),
    },
  },
};

// ============================================================================
// Salesforce Bulk Update Variant
// ============================================================================

const salesforceBulkMarkdown = `### Bulk Stage Update

Based on the recent pipeline review meeting, I'll update the following opportunities to reflect their current status.

**Summary of changes:**
- Move 5 deals through pipeline stages
- Update close dates to align with new forecasts
- Add notes from the pipeline review`;

const bulkItems = [
  {
    id: '1',
    summary: 'TechStart Enterprise - Move to Discovery',
    changes: [
      { field: 'Stage', before: 'Qualification', after: 'Discovery' },
      { field: 'Close Date', before: 'Mar 15', after: 'Apr 30' },
      { field: 'Notes', before: null, after: 'Needs additional stakeholder alignment' },
    ],
  },
  {
    id: '2',
    summary: 'Global Retail Expansion - Update Amount',
    changes: [
      { field: 'Amount', before: '$180,000', after: '$220,000' },
      { field: 'Stage', before: 'Proposal', after: 'Negotiation' },
      { field: 'Notes', before: null, after: 'Scope expanded to include APAC' },
    ],
  },
  {
    id: '3',
    summary: 'FinServ Platform Deal - Extend Close Date',
    changes: [
      { field: 'Close Date', before: 'Mar 30', after: 'May 15' },
      { field: 'Notes', before: null, after: 'Legal review taking longer than expected' },
    ],
  },
  {
    id: '4',
    summary: 'Healthcare Plus Upgrade - Stage Update',
    changes: [
      { field: 'Stage', before: 'Discovery', after: 'Qualification' },
      { field: 'Probability', before: '20%', after: '40%' },
      { field: 'Notes', before: null, after: 'Champion identified, budget confirmed' },
    ],
  },
  {
    id: '5',
    summary: 'Manufacturing Co. Renewal - Add Risk Flag',
    changes: [
      { field: 'Deal Risk', before: 'Low', after: 'Medium' },
      { field: 'Notes', before: null, after: 'Competitor mentioned in last call' },
    ],
  },
];

export const SalesforceBulk: Story = {
  args: {
    variant: 'salesforce-bulk',
    markdown: salesforceBulkMarkdown,
    items: bulkItems,
    primaryAction: {
      label: 'Update All',
      onClick: () => console.log('All updated'),
    },
    secondaryAction: {
      label: 'Cancel',
      onClick: () => console.log('Cancelled'),
    },
  },
};

// ============================================================================
// Additional Stories
// ============================================================================

/**
 * Minimal variant - simple confirmation
 */
export const SimpleConfirmation: Story = {
  args: {
    variant: 'analysis-request',
    markdown: `I've identified **3 at-risk deals** that need immediate attention. Would you like me to create follow-up tasks?

- Acme Corp ($245K) - No activity in 28 days
- TechStart ($180K) - Champion left company
- Global Retail ($320K) - Budget concerns raised`,
    primaryAction: {
      label: 'Create Tasks',
      onClick: () => console.log('Tasks created'),
    },
    secondaryAction: {
      label: 'Dismiss',
      onClick: () => console.log('Dismissed'),
    },
  },
};

/**
 * Closed Won confirmation
 */
export const ClosedWonConfirmation: Story = {
  args: {
    variant: 'salesforce-single',
    markdown: `Are you sure you want to mark the **Acme Corp Enterprise Deal** as **Closed Won**?

This will:
- Update the opportunity stage to "Closed Won"
- Trigger the win notification workflow
- Update the forecast automatically`,
    primaryAction: {
      label: 'Confirm',
      onClick: () => console.log('Confirmed'),
    },
    secondaryAction: {
      label: 'Cancel',
      onClick: () => console.log('Cancelled'),
    },
  },
};

// ============================================================================
// Calendar Variant
// ============================================================================

const calendarCreateMarkdown = `### Schedule Meeting

I'll create the following calendar event based on your request.`;

const calendarCreateEvents = [
  {
    id: '1',
    operation: 'create' as const,
    summary: 'Q1 Pipeline Review with Sales Team',
    startTime: 'Tomorrow, Jan 21 at 2:00 PM',
    duration: '1 hour',
    location: 'Conference Room A',
    hasVideoCall: true,
    attendees: ['sarah@company.com', 'mike@company.com', 'jennifer@company.com'],
    description: 'Review Q1 pipeline status and discuss key deals approaching close.',
  },
];

export const CalendarCreate: Story = {
  args: {
    variant: 'calendar',
    markdown: calendarCreateMarkdown,
    calendarEvents: calendarCreateEvents,
    primaryAction: {
      label: 'Create Event',
      onClick: () => console.log('Event created'),
    },
    secondaryAction: {
      label: 'Cancel',
      onClick: () => console.log('Cancelled'),
    },
  },
};

const calendarUpdateMarkdown = `### Reschedule Meeting

I'll update the following calendar event with your requested changes.`;

const calendarUpdateEvents = [
  {
    id: '1',
    operation: 'update' as const,
    summary: 'Weekly Team Standup',
    startTime: 'Monday, Jan 27 at 10:00 AM',
    changes: [
      { field: 'Start Time', before: '9:00 AM', after: '10:00 AM' },
      { field: 'Duration', before: '30 minutes', after: '45 minutes' },
      { field: 'Location', before: 'Zoom', after: 'Conference Room B' },
    ],
  },
];

export const CalendarUpdate: Story = {
  args: {
    variant: 'calendar',
    markdown: calendarUpdateMarkdown,
    calendarEvents: calendarUpdateEvents,
    primaryAction: {
      label: 'Update Event',
      onClick: () => console.log('Event updated'),
    },
    secondaryAction: {
      label: 'Cancel',
      onClick: () => console.log('Cancelled'),
    },
  },
};

const calendarDeleteMarkdown = `### Cancel Meeting

I'll delete the following calendar event and notify all attendees.`;

const calendarDeleteEvents = [
  {
    id: '1',
    operation: 'delete' as const,
    summary: 'Vendor Demo - Cancelled',
    startTime: 'Friday, Jan 24 at 3:00 PM',
  },
];

export const CalendarDelete: Story = {
  args: {
    variant: 'calendar',
    markdown: calendarDeleteMarkdown,
    calendarEvents: calendarDeleteEvents,
    primaryAction: {
      label: 'Delete Event',
      onClick: () => console.log('Event deleted'),
    },
    secondaryAction: {
      label: 'Keep Event',
      onClick: () => console.log('Cancelled'),
    },
  },
};

const calendarBulkMarkdown = `### Calendar Updates

Based on your schedule optimization request, I'll make the following changes to your calendar.`;

const calendarBulkEvents = [
  {
    id: '1',
    operation: 'create' as const,
    summary: 'Focus Time - Deep Work',
    startTime: 'Monday, Jan 27 at 9:00 AM',
    duration: '2 hours',
    description: 'Protected time for focused work. No meetings.',
  },
  {
    id: '2',
    operation: 'update' as const,
    summary: '1:1 with Sarah Chen',
    startTime: 'Monday, Jan 27 at 2:00 PM',
    changes: [
      { field: 'Start Time', before: '11:00 AM', after: '2:00 PM' },
      { field: 'Duration', before: '30 minutes', after: '45 minutes' },
    ],
  },
  {
    id: '3',
    operation: 'delete' as const,
    summary: 'Recurring: Daily Sync (Duplicate)',
    startTime: 'Monday, Jan 27 at 4:00 PM',
  },
  {
    id: '4',
    operation: 'create' as const,
    summary: 'Customer Call - Acme Corp',
    startTime: 'Tuesday, Jan 28 at 10:00 AM',
    duration: '45 minutes',
    hasVideoCall: true,
    attendees: ['john@acme.com', 'lisa@acme.com'],
    description: 'Follow-up call to discuss contract terms.',
  },
];

export const CalendarBulk: Story = {
  args: {
    variant: 'calendar',
    markdown: calendarBulkMarkdown,
    calendarEvents: calendarBulkEvents,
    primaryAction: {
      label: 'Apply All Changes',
      onClick: () => console.log('All changes applied'),
    },
    secondaryAction: {
      label: 'Cancel',
      onClick: () => console.log('Cancelled'),
    },
  },
};
