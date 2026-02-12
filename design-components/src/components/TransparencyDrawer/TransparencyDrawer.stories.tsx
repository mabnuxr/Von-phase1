import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TransparencyDrawer, DataTabContent, CallsTabContent } from './index';
import type { QueryResult, CallTranscript, TabConfig } from './types';

const meta = {
  title: 'Components/TransparencyDrawer',
  component: TransparencyDrawer,
  parameters: {
    layout: 'fullscreen',
    componentSubtitle: 'Drawer showing query results and call transcripts for AI transparency',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the drawer is open',
    },
    title: {
      control: 'text',
      description: 'Title displayed in the drawer header',
    },
  },
} satisfies Meta<typeof TransparencyDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample query results
const sampleQueries: QueryResult[] = [
  {
    id: 'query-1',
    name: 'Account Opportunities',
    description: 'All open opportunities for the selected account',
    query:
      'SELECT Name, Amount, StageName, CloseDate FROM Opportunity WHERE AccountId = :accountId AND IsClosed = false',
    columns: [
      { key: 'name', label: 'Opportunity Name', type: 'string' },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'stage', label: 'Stage', type: 'string' },
      { key: 'closeDate', label: 'Close Date', type: 'date' },
      { key: 'probability', label: 'Probability', type: 'percentage' },
    ],
    rows: [
      {
        name: 'Enterprise License Deal',
        amount: 150000,
        stage: 'Negotiation',
        closeDate: '2024-02-15',
        probability: 75,
      },
      {
        name: 'Support Renewal',
        amount: 25000,
        stage: 'Proposal',
        closeDate: '2024-01-30',
        probability: 90,
      },
      {
        name: 'Add-on Services',
        amount: 45000,
        stage: 'Discovery',
        closeDate: '2024-03-01',
        probability: 40,
      },
      {
        name: 'Platform Expansion',
        amount: 200000,
        stage: 'Qualification',
        closeDate: '2024-04-15',
        probability: 25,
      },
      {
        name: 'Training Package',
        amount: 15000,
        stage: 'Closed Won',
        closeDate: '2024-01-10',
        probability: 100,
      },
    ],
    executedAt: new Date(),
    duration: 234,
  },
  {
    id: 'query-2',
    name: 'Revenue by Quarter',
    description: 'Quarterly revenue breakdown for the past year',
    query:
      'SELECT CALENDAR_QUARTER(CloseDate), SUM(Amount) FROM Opportunity GROUP BY CALENDAR_QUARTER(CloseDate)',
    columns: [
      { key: 'quarter', label: 'Quarter', type: 'string' },
      { key: 'revenue', label: 'Revenue', type: 'currency' },
      { key: 'deals', label: 'Deals Closed', type: 'number' },
      { key: 'growth', label: 'Growth', type: 'percentage' },
    ],
    rows: [
      { quarter: 'Q1 2023', revenue: 450000, deals: 12, growth: 15.2 },
      { quarter: 'Q2 2023', revenue: 520000, deals: 15, growth: 18.5 },
      { quarter: 'Q3 2023', revenue: 480000, deals: 11, growth: -7.7 },
      { quarter: 'Q4 2023', revenue: 680000, deals: 18, growth: 41.7 },
    ],
    executedAt: new Date(),
    duration: 156,
  },
  {
    id: 'query-3',
    name: 'Top Contacts',
    description: 'Key contacts associated with the account',
    columns: [
      { key: 'name', label: 'Name', type: 'string' },
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'email', label: 'Email', type: 'string' },
      { key: 'lastActivity', label: 'Last Activity', type: 'date' },
    ],
    rows: [
      {
        name: 'John Smith',
        title: 'VP of Engineering',
        email: 'john.smith@acme.com',
        lastActivity: '2024-01-12',
      },
      {
        name: 'Sarah Johnson',
        title: 'CTO',
        email: 'sarah.j@acme.com',
        lastActivity: '2024-01-08',
      },
      {
        name: 'Mike Chen',
        title: 'Director of IT',
        email: 'mchen@acme.com',
        lastActivity: '2024-01-05',
      },
    ],
    executedAt: new Date(),
    duration: 89,
  },
];

// Sample call transcripts
const sampleCalls: CallTranscript[] = [
  {
    id: 'call-1',
    title: 'Q4 Planning Discussion',
    date: '2024-01-10',
    duration: '45 min',
    timeRange: '10:00 AM - 10:45 AM',
    participants: ['John Smith', 'Sarah Johnson', 'Alex Brown'],
    sourceUrl: 'https://app.gong.io/call/123',
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
    sourceUrl: 'https://app.gong.io/call/124',
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
    sourceUrl: 'https://app.gong.io/call/125',
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
    sourceUrl: 'https://app.gong.io/call/126',
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
    sourceUrl: 'https://app.gong.io/call/127',
    accountName: 'Acme Corp',
    sentiment: 'positive',
    summary:
      'Comprehensive review of partnership success. Customer highlighted ROI achievements. Discussion about expanding to additional departments.',
  },
];

// Helper to create tab configs
const createDataTabConfig = (queries: QueryResult[]): TabConfig => ({
  id: 'data',
  label: 'Data',
  count: queries.length,
});

const createCallsTabConfig = (calls: CallTranscript[]): TabConfig => ({
  id: 'calls',
  label: 'Calls',
  count: calls.length,
});

// Wrapper component for interactive stories
const DrawerWrapper = ({
  queries,
  calls,
  title,
}: {
  queries: QueryResult[];
  calls?: CallTranscript[];
  title?: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const hasCalls = calls && calls.length > 0;
  const hasQueries = queries.length > 0;

  return (
    <div style={{ height: '100vh', background: '#f5f5f5', padding: 20 }}>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '10px 20px',
          background: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        Open Drawer
      </button>
      <TransparencyDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} title={title}>
        {hasQueries && (
          <TransparencyDrawer.Tab config={createDataTabConfig(queries)}>
            <DataTabContent queries={queries} />
          </TransparencyDrawer.Tab>
        )}
        {hasCalls && (
          <TransparencyDrawer.Tab config={createCallsTabConfig(calls)}>
            <CallsTabContent calls={calls} />
          </TransparencyDrawer.Tab>
        )}
      </TransparencyDrawer>
    </div>
  );
};

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Data Sources',
    children: null,
  },
  render: () => <DrawerWrapper queries={sampleQueries} calls={sampleCalls} title="Data Sources" />,
};

export const QueriesOnly: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Query Results',
    children: null,
  },
  render: () => <DrawerWrapper queries={sampleQueries} title="Query Results" />,
};

export const CallsOnly: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Call Recordings',
    children: null,
  },
  render: () => <DrawerWrapper queries={[]} calls={sampleCalls} title="Call Recordings" />,
};

export const SingleQuery: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Query Result',
    children: null,
  },
  render: () => <DrawerWrapper queries={[sampleQueries[0]]} title="Query Result" />,
};

export const LargeDataset: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Large Dataset',
    children: null,
  },
  render: () => (
    <DrawerWrapper
      queries={[
        {
          ...sampleQueries[0],
          rows: Array.from({ length: 50 }, (_, i) => ({
            name: `Opportunity ${i + 1}`,
            amount: Math.floor(Math.random() * 200000) + 10000,
            stage: ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won'][
              Math.floor(Math.random() * 5)
            ],
            closeDate: `2024-0${Math.floor(Math.random() * 3) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            probability: Math.floor(Math.random() * 100),
          })),
        },
      ]}
      title="Large Dataset"
    />
  ),
};

export const EmptyState: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'No Data',
    children: null,
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div style={{ height: '100vh', background: '#f5f5f5', padding: 20 }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '10px 20px',
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Open Drawer
        </button>
        <TransparencyDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="No Data">
          <TransparencyDrawer.Tab config={createDataTabConfig([])}>
            <DataTabContent queries={[]} />
          </TransparencyDrawer.Tab>
          <TransparencyDrawer.Tab config={createCallsTabConfig([])}>
            <CallsTabContent calls={[]} />
          </TransparencyDrawer.Tab>
        </TransparencyDrawer>
      </div>
    );
  },
};

export const MixedSentiments: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Call Analysis',
    children: null,
  },
  render: () => (
    <DrawerWrapper
      queries={[]}
      calls={[
        { ...sampleCalls[0], sentiment: 'positive' },
        { ...sampleCalls[1], sentiment: 'neutral' },
        { ...sampleCalls[3], sentiment: 'negative' },
      ]}
      title="Call Analysis"
    />
  ),
};

export const WithLongQuery: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Complex Query',
    children: null,
  },
  render: () => (
    <DrawerWrapper
      queries={[
        {
          id: 'complex-query',
          name: 'Complex Analytics Query',
          description: 'Aggregated revenue metrics with multiple joins',
          query: `SELECT
  a.Name AS AccountName,
  a.Industry,
  a.AnnualRevenue,
  COUNT(o.Id) AS TotalOpportunities,
  SUM(o.Amount) AS TotalPipeline,
  SUM(CASE WHEN o.IsClosed AND o.IsWon THEN o.Amount ELSE 0 END) AS WonRevenue,
  AVG(o.Probability) AS AvgProbability
FROM Account a
LEFT JOIN Opportunity o ON o.AccountId = a.Id
WHERE a.CreatedDate >= LAST_N_MONTHS:12
GROUP BY a.Id, a.Name, a.Industry, a.AnnualRevenue
HAVING COUNT(o.Id) > 0
ORDER BY TotalPipeline DESC
LIMIT 100`,
          columns: [
            { key: 'account', label: 'Account', type: 'string' },
            { key: 'industry', label: 'Industry', type: 'string' },
            { key: 'pipeline', label: 'Pipeline', type: 'currency' },
            { key: 'won', label: 'Won Revenue', type: 'currency' },
          ],
          rows: [
            { account: 'Acme Corp', industry: 'Technology', pipeline: 500000, won: 250000 },
            { account: 'Global Inc', industry: 'Finance', pipeline: 350000, won: 180000 },
            { account: 'Tech Solutions', industry: 'Technology', pipeline: 280000, won: 120000 },
          ],
          executedAt: new Date(),
          duration: 1250,
        },
      ]}
      title="Complex Query"
    />
  ),
};

export const MultipleQueries: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Multiple Queries',
    children: null,
  },
  render: () => <DrawerWrapper queries={sampleQueries} title="Multiple Queries" />,
};
