import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect, useCallback } from 'react';
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

// ============================================================================
// Bulk Approval Interactive Flow
// ============================================================================

// Generate 30 realistic deal names
const dealNames = [
  'Acme Corp - Enterprise Platform',
  'TechStart Inc - Annual License',
  'Global Dynamics - Q1 Expansion',
  'Innovate Labs - Pilot Program',
  'Summit Solutions - Renewal',
  'Nexus Systems - New Business',
  'Quantum Analytics - Upsell',
  'Pioneer Tech - Migration Deal',
  'Velocity Partners - Multi-year',
  'Horizon Group - SMB Package',
  'Atlas Industries - Enterprise Suite',
  'Spark Digital - Growth Plan',
  'CoreLogic Systems - Add-on',
  'Synergy Corp - Consolidation',
  'Momentum Inc - Team Expansion',
  'Apex Ventures - Starter Pack',
  'Fusion Technologies - Premium',
  'Elevate Solutions - Professional',
  'Prism Analytics - Data Package',
  'Zenith Corp - Full Platform',
  'Nova Dynamics - Integration',
  'Vertex Systems - Security Add-on',
  'Pulse Technologies - API Access',
  'Beacon Enterprises - Training',
  'Catalyst Group - Support Tier',
  'Orbit Solutions - Compliance',
  'Radiant Labs - Analytics Pro',
  'Stratos Inc - Cloud Migration',
  'Terraform Corp - DevOps Suite',
  'Luminary Tech - AI Features',
];

// Generate realistic stage progressions
const stageProgressions = [
  { before: 'Discovery', after: 'Qualification' },
  { before: 'Qualification', after: 'Proposal' },
  { before: 'Proposal', after: 'Negotiation' },
  { before: 'Negotiation', after: 'Closed Won' },
  { before: 'Discovery', after: 'Proposal' },
  { before: 'Qualification', after: 'Negotiation' },
];

// Sample next steps for realistic data
const nextStepsExamples = [
  'Schedule follow-up call with VP of Sales to discuss pricing.\nPrepare ROI analysis document.\nSend case studies from similar companies.',
  'Demo scheduled for next Tuesday.\nNeed to loop in technical team for integration questions.\nFollow up on security questionnaire.',
  'Contract review in progress with legal.\nExpecting redlines by EOW.\nPrepare implementation timeline.',
  'Waiting on budget approval from CFO.\nSchedule check-in call for Friday.\nSend competitive comparison deck.',
  'POC completed successfully.\nGather feedback from pilot users.\nPrepare business case for expansion.',
];

// Sample product interests (multi-picklist)
const productInterests = [
  'Analytics Pro; Data Integration; API Access',
  'Enterprise Suite; Security Add-on',
  'Professional; Training; Support',
  'Cloud Migration; DevOps; Monitoring',
  'AI Features; Automation; Reporting',
];

// Sample lead sources (picklist)
const leadSources = ['Inbound', 'Outbound', 'Partner Referral', 'Event', 'Website'];

// Generate bulk records for a single approval step
const generateBulkRecords = () => {
  return dealNames.map((dealName, index) => {
    const stageProgression = stageProgressions[index % stageProgressions.length];
    const baseAmount = 25000 + Math.floor(Math.random() * 175000);
    const newAmount = baseAmount + Math.floor(Math.random() * 15000);

    // Vary the fields shown based on index for variety
    const changes: Array<{
      field: string;
      before?: string | number | boolean | null;
      after: string | number | boolean | null;
      fieldType?:
        | 'text'
        | 'long_text'
        | 'number'
        | 'currency'
        | 'date'
        | 'picklist'
        | 'multi_picklist'
        | 'boolean';
    }> = [
      {
        field: 'Stage',
        before: stageProgression.before,
        after: stageProgression.after,
        fieldType: 'picklist',
      },
      {
        field: 'Amount',
        before: baseAmount,
        after: newAmount,
        fieldType: 'currency',
      },
      {
        field: 'Close Date',
        before: '2025-03-15',
        after: '2025-02-28',
        fieldType: 'date',
      },
    ];

    // Add Next Steps to some deals (every 3rd deal)
    if (index % 3 === 0) {
      changes.push({
        field: 'Next Steps',
        before: nextStepsExamples[(index + 1) % nextStepsExamples.length],
        after: nextStepsExamples[index % nextStepsExamples.length],
        fieldType: 'long_text',
      });
    }

    // Add Product Interest (multi-picklist) to some deals
    if (index % 4 === 1) {
      changes.push({
        field: 'Product Interest',
        before: productInterests[(index + 1) % productInterests.length],
        after: productInterests[index % productInterests.length],
        fieldType: 'multi_picklist',
      });
    }

    // Add Lead Source (picklist) to some deals
    if (index % 5 === 2) {
      changes.push({
        field: 'Lead Source',
        before: leadSources[(index + 1) % leadSources.length],
        after: leadSources[index % leadSources.length],
        fieldType: 'picklist',
      });
    }

    // Add boolean field to some deals
    if (index % 6 === 3) {
      changes.push({
        field: 'Champion Identified',
        before: false,
        after: true,
        fieldType: 'boolean',
      });
    }

    return {
      recordId: `record-${index + 1}`,
      recordName: dealName,
      changes,
    };
  });
};

// Interactive Bulk Approval component
const BulkApprovalFlow = () => {
  const [phase, setPhase] = useState<'thinking' | 'approval' | 'complete'>('thinking');
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [approvedRecordIds, setApprovedRecordIds] = useState<Set<string>>(new Set());
  const [rejectedRecordIds, setRejectedRecordIds] = useState<Set<string>>(new Set());

  // Pre-generate bulk records to keep them stable
  const [bulkRecords] = useState(() => generateBulkRecords());

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate thinking process
  useEffect(() => {
    const thinkingSteps: TimelineStep[] = [
      {
        id: 'step-1',
        text: 'Understanding the bulk update request',
        status: 'complete',
        type: 'reasoning',
        description:
          'Analyzing the request to update opportunity stages based on recent activity signals.',
      },
      {
        id: 'step-2',
        text: 'Fetching opportunity data from Salesforce',
        status: 'complete',
        type: 'tool_call',
        source: 'salesforce',
        description: 'Querying 30 opportunities that match the criteria for stage advancement.',
      },
      {
        id: 'step-3',
        text: 'Analyzing Gong call recordings',
        status: 'complete',
        type: 'tool_call',
        source: 'gong',
        description:
          'Reviewing recent call recordings to validate deal progression signals for each opportunity.',
        subSteps: [
          { id: '3-1', text: 'Processed 47 call recordings', status: 'complete' },
          { id: '3-2', text: 'Identified 30 deals with progression signals', status: 'complete' },
          { id: '3-3', text: 'Extracted key moments and action items', status: 'complete' },
        ],
      },
      {
        id: 'step-4',
        text: 'Cross-referencing email engagement',
        status: 'complete',
        type: 'tool_call',
        source: 'email',
        description: 'Checking email activity to confirm buyer engagement levels.',
      },
      {
        id: 'step-5',
        text: 'Calculating optimal stage updates',
        status: 'complete',
        type: 'code_execution',
        description: 'Running analysis to determine the appropriate stage for each opportunity.',
      },
    ];

    const runThinkingPhase = async () => {
      for (let i = 0; i < thinkingSteps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSteps((prev) => {
          const updated = prev.map((s) => ({ ...s, status: 'complete' as const }));
          return [...updated, { ...thinkingSteps[i], status: 'in-progress' as const }];
        });
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setSteps((prev) => prev.map((s) => ({ ...s, status: 'complete' as const })));
      }

      // Transition to approval phase
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPhase('approval');

      // Add a single bulk approval step with all records
      const bulkApprovalStep: TimelineStep = {
        id: 'bulk-approval',
        text: 'Update 30 opportunities in Salesforce',
        status: 'awaiting-approval',
        type: 'approval',
        source: 'salesforce',
        description:
          'The following opportunities are ready for stage updates based on the analysis.',
        approval: {
          toolCallId: 'bulk-update-001',
          summary: 'Bulk update opportunity stages',
          objectType: 'Opportunity',
          operation: 'update',
          approvalType: 'bulk',
          recordCount: 30,
          bulkRecords,
        },
      };

      setSteps((prev) => [...prev, bulkApprovalStep]);
    };

    runThinkingPhase();
  }, [bulkRecords]);

  const handleApproveRecord = useCallback((recordId: string) => {
    setApprovedRecordIds((prev) => new Set([...prev, recordId]));
  }, []);

  const handleRejectRecord = useCallback((recordId: string) => {
    setRejectedRecordIds((prev) => new Set([...prev, recordId]));
  }, []);

  const handleApproveAll = useCallback(() => {
    const pendingIds = bulkRecords
      .filter((r) => !approvedRecordIds.has(r.recordId) && !rejectedRecordIds.has(r.recordId))
      .map((r) => r.recordId);
    setApprovedRecordIds((prev) => new Set([...prev, ...pendingIds]));
  }, [bulkRecords, approvedRecordIds, rejectedRecordIds]);

  const handleRejectAll = useCallback(() => {
    const pendingIds = bulkRecords
      .filter((r) => !approvedRecordIds.has(r.recordId) && !rejectedRecordIds.has(r.recordId))
      .map((r) => r.recordId);
    setRejectedRecordIds((prev) => new Set([...prev, ...pendingIds]));
  }, [bulkRecords, approvedRecordIds, rejectedRecordIds]);

  const pendingCount = bulkRecords.filter(
    (r) => !approvedRecordIds.has(r.recordId) && !rejectedRecordIds.has(r.recordId)
  ).length;

  const isThinking = phase === 'thinking' || (phase === 'approval' && pendingCount > 0);

  // Update step status when all records are processed
  const stepsWithStatus = steps.map((step) => {
    if (step.id === 'bulk-approval' && pendingCount === 0 && phase === 'approval') {
      return { ...step, status: 'complete' as const };
    }
    return step;
  });

  return (
    <div className="max-w-4xl">
      <TimelineThinkingProcess
        steps={stepsWithStatus}
        isThinking={isThinking}
        elapsedTime={elapsed}
        title="Bulk Opportunity Update"
        onApproveRecord={handleApproveRecord}
        onRejectRecord={handleRejectRecord}
        onApproveAll={handleApproveAll}
        onRejectAll={handleRejectAll}
        approvedRecordIds={approvedRecordIds}
        rejectedRecordIds={rejectedRecordIds}
      />
    </div>
  );
};

export const BulkApprovalInteractive: Story = {
  args: {
    steps: [],
    isThinking: true,
    elapsedTime: 0,
  },
  render: () => <BulkApprovalFlow />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo simulating a complete bulk approval flow with 30 opportunities. The first deal is expanded by default, and you can scroll through to approve/reject individually or use the bulk action buttons.',
      },
    },
  },
};
