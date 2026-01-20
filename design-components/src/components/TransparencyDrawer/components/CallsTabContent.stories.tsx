import type { Meta, StoryObj } from '@storybook/react-vite';
import { CallsTabContent } from './CallsTabContent';
import type { CallTranscript } from '../types';

const meta = {
  title: 'Components/TransparencyDrawer/CallsTabContent',
  component: CallsTabContent,
  parameters: {
    layout: 'padded',
    componentSubtitle: 'Timeline view of call recordings with expandable details',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 500, height: 600, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CallsTabContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample call transcripts
const sampleCalls: CallTranscript[] = [
  {
    id: 'call-1',
    title: 'Q4 Planning Discussion',
    date: '2024-01-10',
    duration: '45 min',
    timeRange: '10:00 AM - 10:45 AM',
    participants: ['John Smith', 'Sarah Johnson', 'Alex Brown'],
    meetingUrl: 'https://app.gong.io/call/123',
    accountName: 'Acme Corp',
    opportunityName: 'Enterprise License Deal',
    sentiment: 'positive',
    summary:
      'Discussed Q4 priorities and budget allocation. Customer expressed strong interest in expanding the platform usage. Key decision makers are aligned on timeline.',
  },
  {
    id: 'call-2',
    title: 'Technical Requirements Review',
    date: '2024-01-05',
    duration: '30 min',
    timeRange: '2:00 PM - 2:30 PM',
    participants: ['Mike Chen', 'Dev Team'],
    meetingUrl: 'https://app.gong.io/call/124',
    accountName: 'Acme Corp',
    sentiment: 'neutral',
    summary:
      'Reviewed technical requirements for the integration. Some concerns about API rate limits were raised. Follow-up meeting scheduled to address security questions.',
  },
  {
    id: 'call-3',
    title: 'Contract Negotiation',
    date: '2023-12-20',
    duration: '60 min',
    timeRange: '11:00 AM - 12:00 PM',
    participants: ['Sarah Johnson', 'Legal Team'],
    meetingUrl: 'https://app.gong.io/call/125',
    accountName: 'Acme Corp',
    opportunityName: 'Enterprise License Deal',
    sentiment: 'positive',
    summary:
      'Made significant progress on contract terms. Customer agreed to multi-year commitment. Final approval expected by end of month.',
  },
  {
    id: 'call-4',
    title: 'Support Escalation',
    date: '2023-12-15',
    duration: '20 min',
    participants: ['Support Team', 'Mike Chen'],
    meetingUrl: 'https://app.gong.io/call/126',
    accountName: 'Acme Corp',
    sentiment: 'negative',
    summary:
      'Customer raised concerns about recent downtime. Issue was resolved but customer requested compensation. Need to follow up with account team.',
  },
  {
    id: 'call-5',
    title: 'Quarterly Business Review',
    date: '2023-11-30',
    duration: '90 min',
    timeRange: '9:00 AM - 10:30 AM',
    participants: ['Executive Team', 'John Smith', 'Sarah Johnson'],
    meetingUrl: 'https://app.gong.io/call/127',
    accountName: 'Acme Corp',
    sentiment: 'positive',
    summary:
      'Comprehensive review of partnership success. Customer highlighted ROI achievements. Discussion about expanding to additional departments.',
  },
];

export const Default: Story = {
  args: {
    calls: sampleCalls,
  },
};

export const Empty: Story = {
  args: {
    calls: [],
  },
};

export const SingleCall: Story = {
  args: {
    calls: [sampleCalls[0]],
  },
};

export const MixedSentiments: Story = {
  args: {
    calls: [
      { ...sampleCalls[0], sentiment: 'positive' },
      { ...sampleCalls[1], sentiment: 'neutral' },
      { ...sampleCalls[3], sentiment: 'negative' },
    ],
  },
};

export const MinimalData: Story = {
  args: {
    calls: [
      {
        id: 'minimal-1',
        title: 'Quick Sync',
        date: '2024-01-15',
      },
      {
        id: 'minimal-2',
        title: 'Follow-up Call',
        date: '2024-01-10',
      },
    ],
  },
};

export const WithMarkdownSummary: Story = {
  args: {
    calls: [
      {
        id: 'markdown-call',
        title: 'Product Demo with Engineering',
        date: '2024-01-12',
        duration: '60 min',
        timeRange: '3:00 PM - 4:00 PM',
        participants: ['Product Team', 'Engineering Lead'],
        meetingUrl: 'https://app.gong.io/call/128',
        accountName: 'TechStart Inc',
        sentiment: 'positive',
        summary: `## Key Takeaways

- **Feature Request**: Customer wants bulk import functionality
- **Timeline**: Looking to go live by Q2
- **Budget**: Approved for enterprise tier

### Action Items
1. Send technical documentation
2. Schedule follow-up with solutions architect
3. Prepare custom pricing proposal

> "This is exactly what we've been looking for" - Engineering Lead`,
      },
    ],
  },
};

export const MultipleMonths: Story = {
  args: {
    calls: [
      ...sampleCalls,
      {
        id: 'call-6',
        title: 'Initial Discovery Call',
        date: '2023-10-15',
        duration: '30 min',
        participants: ['Sales Rep', 'Prospect'],
        accountName: 'Acme Corp',
        sentiment: 'positive',
        summary: 'Initial introduction and needs assessment.',
      },
      {
        id: 'call-7',
        title: 'Product Overview',
        date: '2023-09-20',
        duration: '45 min',
        participants: ['Sales Engineer', 'IT Team'],
        accountName: 'Acme Corp',
        sentiment: 'neutral',
        summary: 'Presented product capabilities and integration options.',
      },
    ],
  },
};

export const ManyParticipants: Story = {
  args: {
    calls: [
      {
        id: 'large-meeting',
        title: 'All-Hands Customer Meeting',
        date: '2024-01-08',
        duration: '120 min',
        timeRange: '9:00 AM - 11:00 AM',
        participants: [
          'CEO',
          'CTO',
          'VP Sales',
          'VP Engineering',
          'Product Manager',
          'Account Executive',
          'Solutions Architect',
          'Customer Success Manager',
        ],
        meetingUrl: 'https://app.gong.io/call/129',
        accountName: 'Enterprise Client',
        opportunityName: 'Strategic Partnership',
        sentiment: 'positive',
        summary: 'Executive alignment meeting to finalize strategic partnership terms.',
      },
    ],
  },
};

export const LongCallHistory: Story = {
  args: {
    calls: Array.from({ length: 20 }, (_, i) => ({
      id: `call-${i}`,
      title: `Meeting ${i + 1}`,
      date: new Date(2024, 0, 20 - i).toISOString().split('T')[0],
      duration: `${30 + (i % 4) * 15} min`,
      participants: ['Team Member'],
      accountName: 'Test Account',
      sentiment: (['positive', 'neutral', 'negative'] as const)[i % 3],
      summary: `Summary for meeting ${i + 1}. This is a sample call recording summary.`,
    })),
  },
};
