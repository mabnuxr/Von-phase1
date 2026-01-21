import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { ChatMessage } from '../../../../components/Chat/ChatMessage';
import type { StepMessage } from '../../../../components/Chat/types';
import {
  TimelineThinkingProcess,
  type TimelineStep,
} from '../../../../components/Jan17Demo/TimelineThinkingProcess';
import { StandardChatInput } from '../../../../components/Chat/StandardChatInput';
import { DeepResearchNotificationBar } from './DeepResearchNotificationBar';

/**
 * ChatInteractionsDecorator - Wraps stories in a container that mimics the chat area
 */
const ChatInteractionsDecorator: Decorator = (Story) => (
  <div
    style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#ffffff',
      padding: '24px',
    }}
  >
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Story />
    </div>
  </div>
);

// Using ChatMessage as the base component
const meta = {
  title: '3-Pane/Components/Chat/ChatInteractions',
  component: ChatMessage,
  decorators: [ChatInteractionsDecorator],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChatMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// User Messages
// ============================================================================

/**
 * UserMessage - Basic
 *
 * A basic user message with avatar showing initials on the right side.
 * Gray background bubble with the message content.
 */
export const UserMessage: Story = {
  render: () => (
    <ChatMessage
      type="user"
      content="Show me the deal pipeline by stage for Q4"
      userName="John Doe"
      userEmail="john@example.com"
    />
  ),
};

/**
 * UserMessage - With Files
 *
 * A user message with file attachments displayed above the text.
 */
export const UserMessageWithFiles: Story = {
  render: () => (
    <ChatMessage
      type="user"
      content="Can you analyze the data in these files and create a summary?"
      userName="Sarah Chen"
      userEmail="sarah@example.com"
      attachments={[
        {
          id: '1',
          name: 'Q4 Sales Report.pdf',
          size: 2458624,
          type: 'application/pdf',
          extension: 'PDF',
          category: 'document',
        },
        {
          id: '2',
          name: 'Revenue Data 2024.xlsx',
          size: 512000,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          extension: 'XLSX',
          category: 'spreadsheet',
        },
      ]}
    />
  ),
};

/**
 * UserMessage - Long Text
 *
 * A user message with longer text content including markdown formatting.
 */
export const UserMessageLong: Story = {
  render: () => (
    <ChatMessage
      type="user"
      content={`I need a comprehensive analysis of our sales performance. Specifically:

1. **Revenue by Region** - Break down Q4 revenue by EMEA, APAC, and Americas
2. **Top 10 Deals** - Show the largest closed-won deals with their close dates
3. **Pipeline Health** - Current pipeline value vs target

Please include any notable trends or concerns you identify.`}
      userName="Mike Johnson"
      userEmail="mike@example.com"
    />
  ),
};

// ============================================================================
// Assistant Messages
// ============================================================================

const sampleAssistantContent = `Based on your Q4 deal pipeline data, here's what I found:

## Pipeline Overview

Your current pipeline shows **$4.2M** in total value across **47 opportunities**.

### Stage Breakdown:
- **Discovery**: $890K (12 deals)
- **Qualification**: $1.1M (15 deals)
- **Proposal**: $1.4M (11 deals)
- **Negotiation**: $810K (9 deals)

The pipeline is healthy with good distribution across stages. I notice a slight bottleneck in the Proposal stage - you may want to review those deals for any blockers.`;

/**
 * AssistantMessage - Basic
 *
 * A basic assistant response with markdown content.
 */
export const AssistantMessage: Story = {
  render: () => (
    <ChatMessage
      type="assistant"
      content={sampleAssistantContent}
      status="completed"
      onSourcesClick={() => console.log('Sources clicked')}
    />
  ),
};

const thinkingMessageContent = `I've analyzed your sales data and here are the key insights:

## Revenue by Region (Q4)

| Region | Revenue | % of Total | YoY Growth |
|--------|---------|------------|------------|
| Americas | $2.4M | 48% | +12% |
| EMEA | $1.6M | 32% | +8% |
| APAC | $1.0M | 20% | +22% |

**Key Finding**: APAC shows the strongest growth momentum at 22% YoY, driven primarily by expansion in the ANZ market.`;

/**
 * AssistantMessage - With Thinking
 *
 * An assistant message showing the thinking/reasoning process in a collapsible block.
 */
export const AssistantMessageWithThinking: Story = {
  render: () => (
    <ChatMessage
      type="assistant"
      content={thinkingMessageContent}
      reasoningContent={`Let me analyze the sales data step by step:

1. First, I'll aggregate the revenue by region from the opportunities table
2. Then calculate the percentage distribution
3. Compare with same period last year for YoY growth
4. Identify any notable trends or outliers

Looking at the data, I can see that APAC has shown remarkable growth despite being the smallest region by revenue. This is worth highlighting as a key insight.`}
      status="completed"
      onSourcesClick={() => console.log('Sources clicked')}
    />
  ),
};

/**
 * AssistantMessage - With Step Messages (Multi-step Agent)
 *
 * An assistant message showing multi-step agent execution with tool calls.
 */
export const AssistantMessageWithSteps: Story = {
  render: () => {
    const stepMessages: StepMessage[] = [
      {
        message_id: 'step-1',
        content: 'Let me fetch the deal data from Salesforce...',
        toolCalls: [
          {
            id: 'tc-1',
            name: 'fetch_salesforce_data',
            arguments: { object: 'Opportunity', filters: { CloseDate: 'THIS_QUARTER' } },
            status: 'success',
            executionTime: 1250,
            parentMessageId: 'msg-1',
          },
        ],
      },
      {
        message_id: 'step-2',
        content: 'Now analyzing the pipeline data...',
        toolCalls: [
          {
            id: 'tc-2',
            name: 'analyze_data',
            arguments: { query: 'pipeline_by_stage' },
            status: 'success',
            executionTime: 890,
            parentMessageId: 'msg-1',
          },
        ],
      },
      {
        message_id: 'step-3',
        content: `Here's your pipeline analysis:

## Q4 Pipeline Summary

Your pipeline is performing well with **$4.2M** in total value.

### Recommendations:
1. Focus on the 11 deals in Proposal stage
2. Schedule follow-ups for the Discovery deals approaching 30 days
3. Consider increasing APAC investment given the growth trend`,
      },
    ];

    return (
      <ChatMessage
        type="assistant"
        content=""
        stepMessages={stepMessages}
        status="completed"
        onSourcesClick={() => console.log('Sources clicked')}
      />
    );
  },
};

/**
 * AssistantMessage - Streaming
 *
 * An assistant message while it's actively streaming.
 */
export const AssistantMessageStreaming: Story = {
  render: () => (
    <ChatMessage
      type="assistant"
      content="I'm analyzing your sales data now. Looking at the deal pipeline for Q4, I can see that..."
      isStreaming={true}
      status="streaming"
    />
  ),
};

/**
 * AssistantMessage - With Error
 *
 * An assistant message that failed with an error.
 */
export const AssistantMessageError: Story = {
  render: () => (
    <ChatMessage
      type="assistant"
      content=""
      status="failed"
      errorMessage="Failed to connect to Salesforce. Please check your integration settings and try again."
    />
  ),
};

/**
 * AssistantMessage - Stopped by User
 *
 * An assistant message that was stopped mid-generation by the user.
 */
export const AssistantMessageStopped: Story = {
  render: () => (
    <ChatMessage
      type="assistant"
      content="Based on the data, your pipeline shows strong performance in Q4 with total value of $4.2M across 47 opportunities. The breakdown by stage is as follows..."
      status="completed"
      stoppedByUser={true}
    />
  ),
};

// ============================================================================
// Conversation Flow
// ============================================================================

/**
 * Conversation - Full Example
 *
 * A complete conversation showing the back-and-forth between user and assistant.
 */
export const ConversationFlow: Story = {
  render: () => (
    <div className="space-y-0">
      <ChatMessage
        type="user"
        content="What's our current pipeline value?"
        userName="John Doe"
        userEmail="john@example.com"
      />
      <ChatMessage
        type="assistant"
        content={`Your current pipeline shows **$4.2M** in total value across **47 active opportunities**.

### Quick Stats:
- Average deal size: **$89K**
- Weighted pipeline: **$2.1M**
- Expected close this month: **$680K** (8 deals)`}
        status="completed"
      />
      <ChatMessage
        type="user"
        content="Which deals are at risk?"
        userName="John Doe"
        userEmail="john@example.com"
      />
      <ChatMessage
        type="assistant"
        content={`I've identified **3 deals** that may be at risk:

| Deal | Value | Days Stale | Risk Reason |
|------|-------|------------|-------------|
| Acme Corp Expansion | $245K | 28 days | No activity since last meeting |
| TechStart Enterprise | $180K | 21 days | Champion left company |
| Global Retail Upgrade | $320K | 14 days | Budget concerns raised |

**Recommended Actions:**
1. Schedule urgent call with Acme Corp - need to re-engage
2. Identify new champion at TechStart
3. Prepare ROI analysis for Global Retail`}
        status="completed"
      />
    </div>
  ),
};

// ============================================================================
// Timeline Thinking Process
// ============================================================================

const sampleThinkingSteps: TimelineStep[] = [
  {
    id: 'step-1',
    text: 'Analyzing the request for pipeline data',
    status: 'complete',
    type: 'reasoning',
    description:
      'Understanding the user query to determine what data sources and operations are needed to fulfill the request.',
  },
  {
    id: 'step-2',
    text: 'Fetching opportunities from Salesforce',
    status: 'complete',
    type: 'tool_call',
    source: 'salesforce',
    description: 'Querying Salesforce Opportunity object for Q4 deals with relevant fields.',
    queryId: 'query-sf-opportunities',
  },
  {
    id: 'step-3',
    text: 'Aggregating pipeline by stage',
    status: 'complete',
    type: 'code_execution',
    code: `const pipelineByStage = opportunities.reduce((acc, opp) => {
  if (!acc[opp.StageName]) {
    acc[opp.StageName] = { count: 0, value: 0 };
  }
  acc[opp.StageName].count++;
  acc[opp.StageName].value += opp.Amount;
  return acc;
}, {});`,
    description: 'Running aggregation logic to group deals by stage and sum their values.',
  },
  {
    id: 'step-4',
    text: 'Generating summary report',
    status: 'complete',
    type: 'output',
    artifactName: 'Q4 Pipeline Summary.md',
    description: 'Creating a formatted summary of the pipeline analysis with key insights.',
  },
];

const inProgressThinkingSteps: TimelineStep[] = [
  {
    id: 'step-1',
    text: 'Analyzing the request for pipeline data',
    status: 'complete',
    type: 'reasoning',
    description:
      'Understanding the user query to determine what data sources and operations are needed.',
  },
  {
    id: 'step-2',
    text: 'Fetching opportunities from Salesforce',
    status: 'complete',
    type: 'tool_call',
    source: 'salesforce',
    description: 'Querying Salesforce Opportunity object for Q4 deals.',
  },
  {
    id: 'step-3',
    text: 'Pulling call recordings from Gong',
    status: 'in-progress',
    type: 'tool_call',
    source: 'gong',
    description: 'Fetching recent call recordings to analyze deal sentiment.',
    subSteps: [
      { id: 'sub-1', text: 'Authenticating with Gong API', status: 'complete' },
      { id: 'sub-2', text: 'Fetching call list for accounts', status: 'in-progress' },
      { id: 'sub-3', text: 'Downloading transcripts', status: 'pending' },
    ],
  },
  {
    id: 'step-4',
    text: 'Analyze call sentiment',
    status: 'pending',
    type: 'reasoning',
  },
  {
    id: 'step-5',
    text: 'Generate combined report',
    status: 'pending',
    type: 'output',
  },
];

const approvalThinkingSteps: TimelineStep[] = [
  {
    id: 'step-1',
    text: 'Analyzing deal update request',
    status: 'complete',
    type: 'reasoning',
    description: 'Understanding the changes requested for the Acme Corp opportunity.',
  },
  {
    id: 'step-2',
    text: 'Validating field values',
    status: 'complete',
    type: 'code_execution',
    description: 'Checking that the new close date and amount are valid.',
  },
  {
    id: 'step-3',
    text: 'Preparing Salesforce update',
    status: 'awaiting-approval',
    type: 'approval',
    source: 'salesforce',
    approval: {
      summary: 'Update opportunity with new close date and increased deal value',
      objectType: 'Opportunity',
      recordName: 'Acme Corp Enterprise Deal',
      operation: 'update',
      changes: [
        { field: 'Amount', before: 245000, after: 320000 },
        { field: 'CloseDate', before: '2024-03-15', after: '2024-04-30' },
        { field: 'StageName', before: 'Proposal', after: 'Negotiation' },
      ],
    },
  },
  {
    id: 'step-4',
    text: 'Apply changes to Salesforce',
    status: 'pending',
    type: 'tool_call',
    source: 'salesforce',
  },
];

/**
 * TimelineThinkingProcess - Complete
 *
 * Shows a completed thinking process with all steps marked as complete.
 */
export const TimelineThinkingProcessComplete: Story = {
  render: () => (
    <div className="max-w-[700px]">
      <TimelineThinkingProcess
        steps={sampleThinkingSteps}
        isThinking={false}
        elapsedTime={12}
        title="Thinking"
      />
    </div>
  ),
};

/**
 * TimelineThinkingProcess - In Progress
 *
 * Shows a thinking process that is currently running with some completed steps.
 */
export const TimelineThinkingProcessInProgress: Story = {
  render: () => (
    <div className="max-w-[700px]">
      <TimelineThinkingProcess
        steps={inProgressThinkingSteps}
        isThinking={true}
        elapsedTime={8}
        title="Thinking"
      />
    </div>
  ),
};

/**
 * TimelineThinkingProcess - Awaiting Approval
 *
 * Shows a thinking process paused for user approval before making changes.
 */
export const TimelineThinkingProcessAwaitingApproval: Story = {
  render: () => (
    <div className="max-w-[700px]">
      <TimelineThinkingProcess
        steps={approvalThinkingSteps}
        isThinking={true}
        elapsedTime={5}
        title="Thinking"
        onApprove={(stepId) => console.log('Approved:', stepId)}
        onReject={(stepId) => console.log('Rejected:', stepId)}
      />
    </div>
  ),
};

/**
 * TimelineThinkingProcess - Collapsed
 *
 * Shows the thinking process in a collapsed state (header only).
 */
export const TimelineThinkingProcessCollapsed: Story = {
  render: () => (
    <div className="max-w-[700px]">
      <TimelineThinkingProcess
        steps={sampleThinkingSteps}
        isThinking={false}
        elapsedTime={12}
        title="Thinking"
        isCollapsed={true}
      />
    </div>
  ),
};

// ============================================================================
// Deep Research Notification Bar with Chat Input
// ============================================================================

/**
 * ChatInputWithNotificationBar - Deep Research Running
 *
 * Shows the chat input with a notification bar above it, indicating that
 * a long-running deep research task is in progress. Users can continue
 * with other conversations while waiting.
 */
export const ChatInputWithNotificationBar: Story = {
  render: () => (
    <div className="max-w-3xl mx-auto">
      <DeepResearchNotificationBar isVisible={true} />
      <StandardChatInput
        placeholder="Ask a follow-up question..."
        agentMode="deep-research"
        isStreaming={true}
        onStop={() => console.log('Stop clicked')}
      />
    </div>
  ),
};

/**
 * ChatInputWithNotificationBar - Custom Message
 *
 * Shows the notification bar with a custom message.
 */
export const ChatInputWithCustomNotification: Story = {
  render: () => (
    <div className="max-w-3xl mx-auto">
      <DeepResearchNotificationBar
        isVisible={true}
        message="Your analysis is running in the background. We'll notify you when complete."
      />
      <StandardChatInput
        placeholder="Ask something else while you wait..."
        agentMode="deep-research"
      />
    </div>
  ),
};

/**
 * ConversationWithNotificationBar
 *
 * Shows a full conversation context with the notification bar,
 * demonstrating how it appears during an active deep research session.
 */
export const ConversationWithNotificationBar: Story = {
  render: () => (
    <div className="space-y-4">
      {/* Previous messages */}
      <ChatMessage
        type="user"
        content="Perform a comprehensive analysis of our Q4 sales performance across all regions"
        userName="John Doe"
        userEmail="john@example.com"
      />

      {/* Thinking process in progress */}
      <div className="flex gap-2">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-200 via-orange-400 to-purple-500 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
              <path
                d="M15.937 11.1501C17.7702 12.4452 19.151 13.9556 19.9152 15.3235C20.7057 16.7385 20.7316 17.7813 20.3233 18.3594C19.9149 18.9375 18.9234 19.2616 17.3256 18.9894C15.7809 18.7262 13.8959 17.9296 12.0627 16.6345C10.2294 15.3394 8.84791 13.8285 8.08365 12.4605C7.29337 11.0458 7.26805 10.0032 7.67638 9.42519C8.08475 8.84721 9.07582 8.52262 10.6733 8.7947C12.2181 9.05788 14.1037 9.855 15.937 11.1501Z"
                stroke="white"
                strokeWidth="1.33"
              />
              <circle cx="13.9932" cy="14" r="7.835" stroke="white" strokeWidth="1.33" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <TimelineThinkingProcess
            steps={inProgressThinkingSteps}
            isThinking={true}
            elapsedTime={45}
            title="Deep Research"
          />
        </div>
      </div>

      {/* Chat input with notification bar */}
      <div className="pt-4 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <DeepResearchNotificationBar isVisible={true} />
          <StandardChatInput
            placeholder="Ask a follow-up question..."
            agentMode="deep-research"
            isStreaming={true}
            onStop={() => console.log('Stop clicked')}
          />
        </div>
      </div>
    </div>
  ),
};
