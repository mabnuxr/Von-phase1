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
    label: 'Opportunity',
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
          label: 'Opportunity',
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
      label: 'Opportunity',
      recordUrl: `https://mycompany.my.salesforce.com/lightning/r/Opportunity/006${String(index + 1).padStart(12, '0')}/view`,
      changes,
    };
  });
};

// Generate calendar events for bulk calendar approval
const generateCalendarRecords = () => {
  const meetingTypes = [
    'Follow-up Call',
    'Demo Session',
    'Contract Review',
    'Stakeholder Meeting',
    'Technical Discussion',
    'Pricing Review',
    'Executive Briefing',
    'Onboarding Call',
  ];

  const attendees = [
    'john.smith@acme.com',
    'sarah.jones@techstart.io',
    'mike.chen@global.com',
    'lisa.wong@innovate.co',
    'david.kim@summit.io',
  ];

  // Generate 8 calendar events
  return Array.from({ length: 8 }, (_, index) => {
    const dealName = dealNames[index % dealNames.length];
    const meetingType = meetingTypes[index % meetingTypes.length];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + index + 1);
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + 2);

    return {
      recordId: `cal-record-${index + 1}`,
      recordName: `${meetingType}: ${dealName.split(' - ')[0]}`,
      label: 'Calendar Event',
      changes: [
        {
          field: 'Date',
          before: baseDate.toISOString().split('T')[0],
          after: newDate.toISOString().split('T')[0],
          fieldType: 'date' as const,
        },
        {
          field: 'Time',
          before: '10:00 AM',
          after: '2:00 PM',
          fieldType: 'text' as const,
        },
        {
          field: 'Duration',
          before: '30 min',
          after: '45 min',
          fieldType: 'text' as const,
        },
        {
          field: 'Attendees',
          before: attendees[index % attendees.length],
          after: `${attendees[index % attendees.length]}; ${attendees[(index + 1) % attendees.length]}`,
          fieldType: 'multi_picklist' as const,
        },
      ],
      recordUrl: `https://calendar.google.com/calendar/event?eid=${btoa(`cal-event-${index + 1}`)}`,
    };
  });
};

// Interactive Bulk Approval component
const BulkApprovalFlow = () => {
  const [phase, setPhase] = useState<
    'thinking' | 'sfdc-approval' | 'calendar-thinking' | 'calendar-approval' | 'complete'
  >('thinking');
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [approvedRecordIds, setApprovedRecordIds] = useState<Set<string>>(new Set());
  const [rejectedRecordIds, setRejectedRecordIds] = useState<Set<string>>(new Set());
  const [calendarApprovedIds, setCalendarApprovedIds] = useState<Set<string>>(new Set());
  const [calendarRejectedIds, setCalendarRejectedIds] = useState<Set<string>>(new Set());

  // Pre-generate bulk records to keep them stable
  const [bulkRecords] = useState(() => generateBulkRecords());
  const [calendarRecords] = useState(() => generateCalendarRecords());

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
        category: 'soql',
        description: 'Querying 30 opportunities that match the criteria for stage advancement.',
        code: `SELECT Id, Name, StageName, Amount, CloseDate, OwnerId,
       Account.Name, Account.Industry
FROM Opportunity
WHERE StageName NOT IN ('Closed Won', 'Closed Lost')
  AND CloseDate >= THIS_QUARTER
  AND Amount > 25000
ORDER BY Amount DESC
LIMIT 30`,
        artifact: {
          artifact_id: 'artifact-sf-001',
          run_id: 'run-bulk-001',
          tool_name: 'execute_soql_query',
          artifact_type: 'table',
        },
        queryId: 'query-sf-opportunities',
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
        artifact: {
          artifact_id: 'artifact-gong-001',
          run_id: 'run-bulk-001',
          tool_name: 'search_gong_calls',
          artifact_type: 'table',
        },
      },
      {
        id: 'step-4',
        text: 'Cross-referencing email engagement',
        status: 'complete',
        type: 'tool_call',
        source: 'email',
        description: 'Checking email activity to confirm buyer engagement levels.',
        artifact: {
          artifact_id: 'artifact-email-001',
          run_id: 'run-bulk-001',
          tool_name: 'search_emails',
          artifact_type: 'table',
        },
      },
      {
        id: 'step-5',
        text: 'Calculating optimal stage updates',
        status: 'complete',
        type: 'code_execution',
        category: 'sql',
        description: 'Running analysis to determine the appropriate stage for each opportunity.',
        code: `-- Analyze deal progression signals
WITH deal_signals AS (
  SELECT
    o.id AS opportunity_id,
    o.name AS deal_name,
    o.stage_name AS current_stage,
    COUNT(DISTINCT g.call_id) AS call_count,
    COUNT(DISTINCT e.email_id) AS email_count,
    MAX(g.call_date) AS last_call_date,
    AVG(g.sentiment_score) AS avg_sentiment
  FROM opportunities o
  LEFT JOIN gong_calls g ON g.opportunity_id = o.id
  LEFT JOIN emails e ON e.opportunity_id = o.id
  WHERE o.close_date >= CURRENT_DATE
  GROUP BY o.id, o.name, o.stage_name
)
SELECT
  opportunity_id,
  deal_name,
  current_stage,
  CASE
    WHEN call_count >= 3 AND avg_sentiment > 0.7 THEN 'Negotiation'
    WHEN call_count >= 2 AND email_count >= 5 THEN 'Proposal'
    ELSE 'Qualification'
  END AS recommended_stage
FROM deal_signals
WHERE call_count > 0;`,
        artifact: {
          artifact_id: 'artifact-analysis-001',
          run_id: 'run-bulk-001',
          tool_name: 'execute_sql_query',
          artifact_type: 'table',
        },
        queryId: 'query-stage-analysis',
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

      // Transition to Salesforce approval phase
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPhase('sfdc-approval');

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
          label: '30 Opportunities',
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

  // Transition to calendar phase when Salesforce approval is complete
  useEffect(() => {
    const sfdcPendingCount = bulkRecords.filter(
      (r) => !approvedRecordIds.has(r.recordId) && !rejectedRecordIds.has(r.recordId)
    ).length;

    if (phase === 'sfdc-approval' && sfdcPendingCount === 0) {
      // Start calendar thinking phase
      const runCalendarPhase = async () => {
        setPhase('calendar-thinking');

        // Mark Salesforce approval as complete
        setSteps((prev) =>
          prev.map((s) => (s.id === 'bulk-approval' ? { ...s, status: 'complete' as const } : s))
        );

        // Add calendar analysis steps
        await new Promise((resolve) => setTimeout(resolve, 800));

        const calendarThinkingStep: TimelineStep = {
          id: 'calendar-analysis',
          text: 'Analyzing calendar conflicts',
          status: 'in-progress',
          type: 'tool_call',
          source: 'calendar',
          description:
            'Checking Google Calendar for scheduling conflicts and optimal meeting times.',
        };
        setSteps((prev) => [...prev, calendarThinkingStep]);

        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Complete calendar analysis and add artifact
        setSteps((prev) =>
          prev.map((s) =>
            s.id === 'calendar-analysis'
              ? {
                  ...s,
                  status: 'complete' as const,
                  artifact: {
                    artifact_id: 'artifact-calendar-001',
                    run_id: 'run-bulk-001',
                    tool_name: 'search_calendar_events',
                    artifact_type: 'table',
                  },
                }
              : s
          )
        );

        await new Promise((resolve) => setTimeout(resolve, 500));
        setPhase('calendar-approval');

        // Add calendar bulk approval step
        const calendarApprovalStep: TimelineStep = {
          id: 'calendar-approval',
          text: 'Reschedule 8 follow-up meetings',
          status: 'awaiting-approval',
          type: 'approval',
          source: 'calendar',
          description:
            'The following calendar events need to be rescheduled based on the deal stage updates.',
          approval: {
            toolCallId: 'calendar-bulk-001',
            summary: 'Bulk reschedule calendar events',
            label: '8 Calendar Events',
            operation: 'update',
            approvalType: 'bulk',
            recordCount: 8,
            bulkRecords: calendarRecords,
          },
        };

        setSteps((prev) => [...prev, calendarApprovalStep]);
      };

      runCalendarPhase();
    }
  }, [phase, bulkRecords, approvedRecordIds, rejectedRecordIds, calendarRecords]);

  const handleApproveRecord = useCallback(
    (recordId: string) => {
      if (phase === 'sfdc-approval') {
        setApprovedRecordIds((prev) => new Set([...prev, recordId]));
      } else if (phase === 'calendar-approval') {
        setCalendarApprovedIds((prev) => new Set([...prev, recordId]));
      }
    },
    [phase]
  );

  const handleRejectRecord = useCallback(
    (recordId: string) => {
      if (phase === 'sfdc-approval') {
        setRejectedRecordIds((prev) => new Set([...prev, recordId]));
      } else if (phase === 'calendar-approval') {
        setCalendarRejectedIds((prev) => new Set([...prev, recordId]));
      }
    },
    [phase]
  );

  const handleApproveAll = useCallback(() => {
    if (phase === 'sfdc-approval') {
      const pendingIds = bulkRecords
        .filter((r) => !approvedRecordIds.has(r.recordId) && !rejectedRecordIds.has(r.recordId))
        .map((r) => r.recordId);
      setApprovedRecordIds((prev) => new Set([...prev, ...pendingIds]));
    } else if (phase === 'calendar-approval') {
      const pendingIds = calendarRecords
        .filter((r) => !calendarApprovedIds.has(r.recordId) && !calendarRejectedIds.has(r.recordId))
        .map((r) => r.recordId);
      setCalendarApprovedIds((prev) => new Set([...prev, ...pendingIds]));
    }
  }, [
    phase,
    bulkRecords,
    approvedRecordIds,
    rejectedRecordIds,
    calendarRecords,
    calendarApprovedIds,
    calendarRejectedIds,
  ]);

  const handleRejectAll = useCallback(() => {
    if (phase === 'sfdc-approval') {
      const pendingIds = bulkRecords
        .filter((r) => !approvedRecordIds.has(r.recordId) && !rejectedRecordIds.has(r.recordId))
        .map((r) => r.recordId);
      setRejectedRecordIds((prev) => new Set([...prev, ...pendingIds]));
    } else if (phase === 'calendar-approval') {
      const pendingIds = calendarRecords
        .filter((r) => !calendarApprovedIds.has(r.recordId) && !calendarRejectedIds.has(r.recordId))
        .map((r) => r.recordId);
      setCalendarRejectedIds((prev) => new Set([...prev, ...pendingIds]));
    }
  }, [
    phase,
    bulkRecords,
    approvedRecordIds,
    rejectedRecordIds,
    calendarRecords,
    calendarApprovedIds,
    calendarRejectedIds,
  ]);

  const sfdcPendingCount = bulkRecords.filter(
    (r) => !approvedRecordIds.has(r.recordId) && !rejectedRecordIds.has(r.recordId)
  ).length;

  const calendarPendingCount = calendarRecords.filter(
    (r) => !calendarApprovedIds.has(r.recordId) && !calendarRejectedIds.has(r.recordId)
  ).length;

  const isThinking =
    phase === 'thinking' ||
    phase === 'calendar-thinking' ||
    (phase === 'sfdc-approval' && sfdcPendingCount > 0) ||
    (phase === 'calendar-approval' && calendarPendingCount > 0);

  // Determine which approval IDs to pass based on current phase
  const currentApprovedIds =
    phase === 'calendar-approval' ? calendarApprovedIds : approvedRecordIds;
  const currentRejectedIds =
    phase === 'calendar-approval' ? calendarRejectedIds : rejectedRecordIds;

  // Update step status when all records are processed
  const stepsWithStatus = steps.map((step) => {
    if (step.id === 'bulk-approval' && sfdcPendingCount === 0 && phase !== 'thinking') {
      return { ...step, status: 'complete' as const };
    }
    if (
      step.id === 'calendar-approval' &&
      calendarPendingCount === 0 &&
      phase === 'calendar-approval'
    ) {
      return { ...step, status: 'complete' as const };
    }
    return step;
  });

  // Sample queries for the drawer
  const queries = [
    { id: 'query-sf-opportunities', name: 'Salesforce Opportunities Query' },
    { id: 'query-stage-analysis', name: 'Stage Analysis Query' },
  ];

  // Handle query click - opens transparency drawer
  const handleQueryClick = useCallback((queryId: string) => {
    console.log('Query clicked:', queryId);
    // In real app, this would open the TransparencyDrawer to the specific query
  }, []);

  // Handle artifact click - opens transparency drawer with results
  const handleArtifactClick = useCallback(
    (artifactId: string, toolName: string, artifactType: string, runId: string) => {
      console.log('Artifact clicked:', { artifactId, toolName, artifactType, runId });
      // In real app, this would open the TransparencyDrawer with the artifact data
    },
    []
  );

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
        approvedRecordIds={currentApprovedIds}
        rejectedRecordIds={currentRejectedIds}
        onQueryClick={handleQueryClick}
        onArtifactClick={handleArtifactClick}
        queries={queries}
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
          'Interactive demo simulating a complete multi-phase bulk approval flow. First, 30 Salesforce opportunities are analyzed with SQL queries and tool calls (with expandable code blocks and artifact links). After approving/rejecting the Salesforce updates, the flow transitions to a Google Calendar phase where 8 follow-up meetings need to be rescheduled.',
      },
    },
  },
};
