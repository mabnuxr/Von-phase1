import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect } from 'react';
import { TimelineThinkingProcess } from './TimelineThinkingProcess';
import type { TimelineStep } from './types';

const meta = {
  title: 'Components/TimelineThinkingProcess',
  component: TimelineThinkingProcess,
  parameters: {
    layout: 'padded',
    componentSubtitle: 'Timeline visualization of AI thinking process',
  },
  tags: ['autodocs'],
  argTypes: {
    isThinking: {
      control: 'boolean',
      description: 'Whether the thinking process is still in progress',
    },
    elapsedTime: {
      control: 'number',
      description: 'Elapsed time in seconds',
    },
    title: {
      control: 'text',
      description: 'Title displayed at the top',
    },
    isCollapsed: {
      control: 'boolean',
      description: 'Whether the timeline is collapsed',
    },
  },
} satisfies Meta<typeof TimelineThinkingProcess>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample steps for stories
const sampleSteps: TimelineStep[] = [
  {
    id: '1',
    text: 'Understanding the request',
    status: 'complete',
    type: 'reasoning',
    description:
      'Analyzing the user query to understand what information is needed about account revenue.',
  },
  {
    id: '2',
    text: 'Fetching account data from Salesforce',
    status: 'complete',
    type: 'tool_call',
    source: 'salesforce',
    description: 'Querying Salesforce API to retrieve account details and related opportunities.',
    queryId: 'query-1',
  },
  {
    id: '3',
    text: 'Analyzing Gong call recordings',
    status: 'complete',
    type: 'tool_call',
    source: 'gong',
    description:
      'Searching through recent call recordings to find relevant discussions about the account.',
  },
  {
    id: '4',
    text: 'Processing revenue calculations',
    status: 'in-progress',
    type: 'code_execution',
    description: 'Running calculations to aggregate revenue data across all opportunities.',
    code: 'const totalRevenue = opportunities.reduce((sum, opp) => sum + opp.amount, 0);',
  },
  {
    id: '5',
    text: 'Generating summary report',
    status: 'pending',
    type: 'output',
    description: 'Preparing a comprehensive summary of the account revenue analysis.',
  },
];

const completedSteps: TimelineStep[] = sampleSteps.map((step) => ({
  ...step,
  status: 'complete',
}));

const approvalStep: TimelineStep = {
  id: '6',
  text: 'Update opportunity stage',
  status: 'awaiting-approval',
  type: 'approval',
  source: 'salesforce',
  description: 'Requesting approval to update the opportunity stage in Salesforce.',
  approval: {
    summary: 'Update opportunity stage to Closed Won',
    objectType: 'Opportunity',
    recordName: 'Acme Corp - Enterprise Deal',
    operation: 'update',
    changes: [
      { field: 'Stage', before: 'Negotiation', after: 'Closed Won' },
      { field: 'Close Date', before: '2024-03-15', after: '2024-01-13' },
      { field: 'Amount', before: 45000, after: 52000 },
    ],
  },
};

export const Default: Story = {
  args: {
    steps: sampleSteps,
    isThinking: true,
    elapsedTime: 12,
    title: 'Thinking',
  },
};

export const Completed: Story = {
  args: {
    steps: completedSteps,
    isThinking: false,
    elapsedTime: 28,
    title: 'Thinking',
  },
};

export const Collapsed: Story = {
  args: {
    steps: completedSteps,
    isThinking: false,
    elapsedTime: 28,
    title: 'Thinking',
    isCollapsed: true,
  },
};

export const WithApproval: Story = {
  args: {
    steps: [...sampleSteps.slice(0, 3), approvalStep],
    isThinking: true,
    elapsedTime: 15,
    title: 'Thinking',
    onApprove: (stepId) => console.log('Approved:', stepId),
    onReject: (stepId) => console.log('Rejected:', stepId),
  },
};

export const EmptyState: Story = {
  args: {
    steps: [],
    isThinking: true,
    elapsedTime: 0,
    title: 'Thinking',
  },
};

export const SingleStep: Story = {
  args: {
    steps: [sampleSteps[0]],
    isThinking: true,
    elapsedTime: 2,
    title: 'Thinking',
  },
};

// Interactive story with simulated progress
const SimulatedThinkingProcess = () => {
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isThinking, setIsThinking] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const addStep = (index: number) => {
      if (index >= sampleSteps.length) {
        setIsThinking(false);
        return;
      }

      setSteps((prev) => {
        const updated = prev.map((s) => ({ ...s, status: 'complete' as const }));
        return [...updated, { ...sampleSteps[index], status: 'in-progress' as const }];
      });

      setTimeout(() => addStep(index + 1), 3000);
    };

    addStep(0);
  }, []);

  return (
    <div style={{ maxWidth: 600 }}>
      <TimelineThinkingProcess
        steps={steps}
        isThinking={isThinking}
        elapsedTime={elapsed}
        title="Analyzing your request"
        onQueryClick={(queryId) => console.log('Query clicked:', queryId)}
      />
    </div>
  );
};

export const SimulatedProgress: Story = {
  args: {
    steps: [],
    isThinking: true,
    elapsedTime: 0,
  },
  render: () => <SimulatedThinkingProcess />,
};

export const WithSubSteps: Story = {
  args: {
    steps: [
      {
        id: '1',
        text: 'Gathering data from multiple sources',
        status: 'complete',
        type: 'tool_call',
        source: 'generic',
        description: 'Collecting data from various integrations.',
        subSteps: [
          { id: '1-1', text: 'Fetching from Salesforce', status: 'complete' },
          { id: '1-2', text: 'Fetching from Gong', status: 'complete' },
          { id: '1-3', text: 'Fetching from Email', status: 'complete' },
        ],
      },
      {
        id: '2',
        text: 'Processing results',
        status: 'in-progress',
        type: 'reasoning',
        description: 'Analyzing and correlating the collected data.',
      },
    ],
    isThinking: true,
    elapsedTime: 8,
    title: 'Thinking',
  },
};

export const AllStepTypes: Story = {
  args: {
    steps: [
      {
        id: '1',
        text: 'Reasoning step',
        status: 'complete',
        type: 'reasoning',
        description: 'This is a reasoning step where the AI thinks through the problem.',
      },
      {
        id: '2',
        text: 'Salesforce tool call',
        status: 'complete',
        type: 'tool_call',
        source: 'salesforce',
        description: 'Calling Salesforce API.',
      },
      {
        id: '3',
        text: 'Gong tool call',
        status: 'complete',
        type: 'tool_call',
        source: 'gong',
        description: 'Calling Gong API.',
      },
      {
        id: '4',
        text: 'Email tool call',
        status: 'complete',
        type: 'tool_call',
        source: 'email',
        description: 'Searching emails.',
      },
      {
        id: '5',
        text: 'Calendar tool call',
        status: 'complete',
        type: 'tool_call',
        source: 'calendar',
        description: 'Checking calendar.',
      },
      {
        id: '6',
        text: 'Code execution',
        status: 'complete',
        type: 'code_execution',
        description: 'Running code.',
        code: 'console.log("Hello World");',
      },
      {
        id: '7',
        text: 'Output generation',
        status: 'in-progress',
        type: 'output',
        description: 'Generating final output.',
        artifactName: 'report.pdf',
      },
    ],
    isThinking: true,
    elapsedTime: 20,
    title: 'Thinking',
  },
};

/**
 * Showcases all possible step statuses with their corresponding icons:
 * - pending: empty circle
 * - in-progress: spinning loader
 * - complete: green checkmark
 * - warning: orange warning triangle
 * - error: red X circle
 * - awaiting-approval: amber hourglass
 */
export const AllStepStatuses: Story = {
  args: {
    steps: [
      {
        id: '1',
        text: 'Completed step - Successfully finished',
        status: 'complete',
        type: 'reasoning',
        description: 'This step has been completed successfully. Shows a green checkmark icon.',
      },
      {
        id: '2',
        text: 'In-progress step - Currently running',
        status: 'in-progress',
        type: 'tool_call',
        source: 'salesforce',
        description: 'This step is currently being executed. Shows a spinning loader icon.',
      },
      {
        id: '3',
        text: 'Awaiting approval - Needs user action',
        status: 'awaiting-approval',
        type: 'approval',
        source: 'salesforce',
        description: 'This step requires user approval before proceeding. Shows an hourglass icon.',
        approval: {
          toolCallId: 'tool-call-1',
          summary: 'Update opportunity stage to Closed Won',
          objectType: 'Opportunity',
          recordName: 'Acme Corp - Enterprise Deal',
          operation: 'update',
          changes: [
            { field: 'Stage', before: 'Negotiation', after: 'Closed Won' },
            { field: 'Amount', before: 45000, after: 52000 },
          ],
        },
      },
      {
        id: '4',
        text: 'Warning step - Completed with issues',
        status: 'warning',
        type: 'tool_call',
        source: 'gong',
        description:
          'This step completed but encountered some issues that may need attention. Shows an orange warning triangle icon.',
      },
      {
        id: '5',
        text: 'Error step - Failed to execute',
        status: 'error',
        type: 'code_execution',
        description:
          'This step failed to execute properly. Shows a red X circle icon. Error: Connection timeout after 30 seconds.',
        code: 'await fetch("https://api.example.com/data")',
      },
      {
        id: '6',
        text: 'Pending step - Waiting to start',
        status: 'pending',
        type: 'output',
        description: 'This step is queued and waiting to start. Shows an empty circle icon.',
      },
    ],
    isThinking: true,
    elapsedTime: 15,
    title: 'All Step Statuses',
    onApprove: (stepId) => console.log('Approved:', stepId),
    onReject: (stepId) => console.log('Rejected:', stepId),
  },
};

/**
 * Shows sub-steps with different statuses
 */
export const SubStepsWithAllStatuses: Story = {
  args: {
    steps: [
      {
        id: '1',
        text: 'Gathering data from multiple sources',
        status: 'in-progress',
        type: 'tool_call',
        source: 'generic',
        description: 'Collecting data from various integrations with mixed results.',
        subSteps: [
          { id: '1-1', text: 'Fetching from Salesforce', status: 'complete' },
          { id: '1-2', text: 'Fetching from Gong', status: 'complete' },
          { id: '1-3', text: 'Fetching from Email', status: 'in-progress' },
          { id: '1-4', text: 'Fetching from Calendar', status: 'warning' },
          { id: '1-5', text: 'Fetching from HubSpot', status: 'error' },
          { id: '1-6', text: 'Fetching from Slack', status: 'pending' },
        ],
      },
      {
        id: '2',
        text: 'Processing results',
        status: 'pending',
        type: 'reasoning',
        description: 'Will analyze and correlate the collected data once all sources are fetched.',
      },
    ],
    isThinking: true,
    elapsedTime: 12,
    title: 'Sub-steps with All Statuses',
  },
};
