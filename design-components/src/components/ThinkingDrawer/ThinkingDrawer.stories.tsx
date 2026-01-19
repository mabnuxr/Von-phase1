import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ThinkingDrawer } from './ThinkingDrawer';
import type { ThinkingStepDetail, SelectedStep } from './types';

const meta = {
  title: 'Components/ThinkingDrawer',
  component: ThinkingDrawer,
  parameters: {
    layout: 'fullscreen',
    componentSubtitle: 'Drawer showing detailed AI thinking process with typing animation',
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
    typingSpeed: {
      control: 'number',
      description: 'Typing animation speed in ms per character',
    },
  },
} satisfies Meta<typeof ThinkingDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample steps
const sampleSteps: ThinkingStepDetail[] = [
  {
    id: '1',
    title: 'Understanding the request',
    description:
      'Analyzing the user query to understand what information is needed. The user is asking about account revenue trends over the past quarter.',
    status: 'complete',
  },
  {
    id: '2',
    title: 'Fetching account data',
    description:
      'Querying the Salesforce API to retrieve account details, opportunity records, and related revenue data for the specified time period.',
    status: 'complete',
    queryId: 'query-1',
  },
  {
    id: '3',
    title: 'Analyzing call recordings',
    description:
      'Searching through Gong call recordings to find relevant discussions about the account, focusing on mentions of budget, timeline, and decision makers.',
    status: 'complete',
    queryId: 'query-2',
  },
  {
    id: '4',
    title: 'Processing calculations',
    description:
      'Running revenue calculations and aggregations to determine total revenue, growth rate, and trend analysis across all opportunities.',
    status: 'in-progress',
  },
  {
    id: '5',
    title: 'Generating report',
    description: 'Preparing a comprehensive summary with visualizations and key insights.',
    status: 'pending',
  },
];

const completedSteps: ThinkingStepDetail[] = sampleSteps.map((step) => ({
  ...step,
  status: 'complete',
}));

const sampleQueries = [
  { id: 'query-1', name: 'Account Opportunities' },
  { id: 'query-2', name: 'Call Recordings' },
];

// Wrapper component for interactive stories
const DrawerWrapper = ({
  steps,
  title,
  typingSpeed,
  queries,
  selectedStep,
}: {
  steps: ThinkingStepDetail[];
  title?: string;
  typingSpeed?: number;
  queries?: { id: string; name: string }[];
  selectedStep?: SelectedStep | null;
}) => {
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
      <ThinkingDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        steps={steps}
        title={title}
        typingSpeed={typingSpeed}
        queries={queries}
        selectedStep={selectedStep}
        onQueryClick={(queryId) => console.log('Query clicked:', queryId)}
      />
    </div>
  );
};

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    steps: sampleSteps,
    title: 'Thinking',
    queries: sampleQueries,
  },
  render: (args) => (
    <DrawerWrapper
      steps={args.steps}
      title={args.title}
      typingSpeed={args.typingSpeed}
      queries={args.queries}
    />
  ),
};

export const AllCompleted: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    steps: completedSteps,
    title: 'Thinking',
    queries: sampleQueries,
  },
  render: (args) => (
    <DrawerWrapper
      steps={args.steps}
      title={args.title}
      typingSpeed={args.typingSpeed}
      queries={args.queries}
    />
  ),
};

export const FastTyping: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    steps: sampleSteps,
    title: 'Thinking',
    typingSpeed: 5,
    queries: sampleQueries,
  },
  render: (args) => (
    <DrawerWrapper
      steps={args.steps}
      title={args.title}
      typingSpeed={args.typingSpeed}
      queries={args.queries}
    />
  ),
};

export const SlowTyping: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    steps: sampleSteps,
    title: 'Thinking',
    typingSpeed: 50,
    queries: sampleQueries,
  },
  render: (args) => (
    <DrawerWrapper
      steps={args.steps}
      title={args.title}
      typingSpeed={args.typingSpeed}
      queries={args.queries}
    />
  ),
};

export const EmptyState: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    steps: [],
    title: 'Thinking',
  },
  render: (args) => <DrawerWrapper steps={args.steps} title={args.title} />,
};

export const SingleStep: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    steps: [sampleSteps[0]],
    title: 'Thinking',
  },
  render: (args) => <DrawerWrapper steps={args.steps} title={args.title} />,
};

export const WithCodePreview: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    steps: sampleSteps,
    title: 'Code Execution',
    selectedStep: {
      id: '4',
      text: 'Processing calculations',
      status: 'complete',
      type: 'code_execution',
      description: 'Running revenue calculations and aggregations.',
      code: `// Calculate total revenue
const opportunities = await salesforce.query('SELECT Amount FROM Opportunity');
const totalRevenue = opportunities.reduce((sum, opp) => {
  return sum + (opp.Amount || 0);
}, 0);

// Calculate growth rate
const previousQuarter = await getPreviousQuarterRevenue();
const growthRate = ((totalRevenue - previousQuarter) / previousQuarter) * 100;

console.log(\`Total Revenue: $\${totalRevenue.toLocaleString()}\`);
console.log(\`Growth Rate: \${growthRate.toFixed(1)}%\`);`,
    },
  },
  render: (args) => (
    <DrawerWrapper steps={args.steps} title={args.title} selectedStep={args.selectedStep} />
  ),
};

export const WithArtifact: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    steps: sampleSteps,
    title: 'Output',
    selectedStep: {
      id: '5',
      text: 'Generating report',
      status: 'complete',
      type: 'output',
      description: 'Generated a comprehensive revenue analysis report with charts and insights.',
      artifactName: 'Q4_Revenue_Analysis.pdf',
    },
  },
  render: (args) => (
    <DrawerWrapper steps={args.steps} title={args.title} selectedStep={args.selectedStep} />
  ),
};

export const LongDescriptions: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    steps: [
      {
        id: '1',
        title: 'Comprehensive data analysis',
        description:
          'Performing a deep analysis of the account data including historical trends, seasonal patterns, and year-over-year comparisons. This involves processing multiple data sources including CRM records, financial reports, and market intelligence data to provide a complete picture of the account health and revenue trajectory.',
        status: 'complete',
      },
      {
        id: '2',
        title: 'Multi-source data correlation',
        description:
          'Cross-referencing information from Salesforce opportunities, Gong call transcripts, email communications, and calendar events to identify patterns and correlations that might indicate buying signals or potential risks. This step is crucial for building a holistic understanding of the customer relationship.',
        status: 'in-progress',
      },
    ],
    title: 'Deep Analysis',
  },
  render: (args) => <DrawerWrapper steps={args.steps} title={args.title} />,
};
