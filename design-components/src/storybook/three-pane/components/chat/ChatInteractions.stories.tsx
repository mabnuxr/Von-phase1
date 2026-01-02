import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { ChatMessage } from '../../../../components/Chat/ChatMessage';
import type { StepMessage } from '../../../../components/Chat/types';

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

/**
 * AssistantMessage - Basic
 *
 * A basic assistant response with markdown content.
 */
export const AssistantMessage: Story = {
  render: () => (
    <ChatMessage
      type="assistant"
      content={`Based on your Q4 deal pipeline data, here's what I found:

## Pipeline Overview

Your current pipeline shows **$4.2M** in total value across **47 opportunities**.

### Stage Breakdown:
- **Discovery**: $890K (12 deals)
- **Qualification**: $1.1M (15 deals)
- **Proposal**: $1.4M (11 deals)
- **Negotiation**: $810K (9 deals)

The pipeline is healthy with good distribution across stages. I notice a slight bottleneck in the Proposal stage - you may want to review those deals for any blockers.`}
      status="completed"
    />
  ),
};

/**
 * AssistantMessage - With Thinking
 *
 * An assistant message showing the thinking/reasoning process in a collapsible block.
 */
export const AssistantMessageWithThinking: Story = {
  render: () => (
    <ChatMessage
      type="assistant"
      content={`I've analyzed your sales data and here are the key insights:

## Revenue by Region (Q4)

| Region | Revenue | % of Total | YoY Growth |
|--------|---------|------------|------------|
| Americas | $2.4M | 48% | +12% |
| EMEA | $1.6M | 32% | +8% |
| APAC | $1.0M | 20% | +22% |

**Key Finding**: APAC shows the strongest growth momentum at 22% YoY, driven primarily by expansion in the ANZ market.`}
      reasoningContent={`Let me analyze the sales data step by step:

1. First, I'll aggregate the revenue by region from the opportunities table
2. Then calculate the percentage distribution
3. Compare with same period last year for YoY growth
4. Identify any notable trends or outliers

Looking at the data, I can see that APAC has shown remarkable growth despite being the smallest region by revenue. This is worth highlighting as a key insight.`}
      status="completed"
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
      <ChatMessage type="assistant" content="" stepMessages={stepMessages} status="completed" />
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
