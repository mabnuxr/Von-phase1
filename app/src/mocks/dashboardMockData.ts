/**
 * Mock data for rendering the Dashboard component
 * Use this for development, testing, and demos
 */

import type {
  Conversation,
  MessageWithStreaming,
  PaginatedConversationsResponse,
  PaginatedMessagesResponse,
} from "../types/conversation";
import type {
  MessageArtifactsResponse,
  ArtifactResponse,
  ArtifactSummary,
} from "../services/conversationsService";
import type {
  Message,
  TimelineStep,
  ToolCall,
  StepMessage,
} from "@vonlabs/design-components";

// ============================================================================
// Mock User Data
// ============================================================================

export const mockUser = {
  id: "user-123",
  tenantId: "tenant-456",
  email: "john.doe@example.com",
  name: "John Doe",
  firstName: "John",
  lastName: "Doe",
  avatarUrl: undefined,
};

// ============================================================================
// Mock Conversations
// ============================================================================

export const mockConversations: Conversation[] = [
  {
    conversationId: "conv-001",
    userId: "user-123",
    tenantId: "tenant-456",
    title: "Q4 Revenue Analysis",
    mode: "auto",
    agentVersion: "v2",
    createdAt: "2024-01-15T10:00:00Z",
    createdBy: "user-123",
    updatedAt: "2024-01-15T14:30:00Z",
  },
  {
    conversationId: "conv-002",
    userId: "user-123",
    tenantId: "tenant-456",
    title: "Pipeline Health Check",
    mode: "auto",
    agentVersion: "v1",
    createdAt: "2024-01-14T09:00:00Z",
    createdBy: "user-123",
    updatedAt: "2024-01-14T16:45:00Z",
  },
  {
    conversationId: "conv-003",
    userId: "user-123",
    tenantId: "tenant-456",
    title: "Deep Research: Churn Analysis",
    mode: "deep_research",
    agentVersion: "v2",
    createdAt: "2024-01-13T08:00:00Z",
    createdBy: "user-123",
    updatedAt: "2024-01-13T12:00:00Z",
  },
  {
    conversationId: "conv-004",
    userId: "user-123",
    tenantId: "tenant-456",
    title: "Dashboard Builder: Sales Metrics",
    mode: "dashboard_builder",
    agentVersion: "v1",
    createdAt: "2024-01-12T11:00:00Z",
    createdBy: "user-123",
    updatedAt: "2024-01-12T15:30:00Z",
  },
];

export const mockPaginatedConversations: PaginatedConversationsResponse = {
  data: mockConversations,
  pagination: {
    page: 1,
    limit: 20,
    total: 4,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

// ============================================================================
// Mock Messages (Backend Format)
// ============================================================================

export const mockMessagesBackend: MessageWithStreaming[] = [
  {
    id: "msg-001",
    runId: "run-001",
    conversationId: "conv-001",
    messageType: "text",
    messageContent: "What were our top performing accounts in Q4?",
    role: "user",
    createdAt: "2024-01-15T10:00:00Z",
    createdBy: "user-123",
    status: "completed",
  },
  {
    id: "msg-002",
    runId: "run-002",
    conversationId: "conv-001",
    messageType: "markdown",
    messageContent: `Based on my analysis of your Q4 data, here are the top performing accounts:

## Top 5 Accounts by Revenue

| Account | Revenue | Growth |
|---------|---------|--------|
| Acme Corp | $2.5M | +45% |
| TechStart Inc | $1.8M | +32% |
| Global Systems | $1.5M | +28% |
| Innovation Labs | $1.2M | +22% |
| DataFlow Corp | $950K | +18% |

### Key Insights
- **Acme Corp** showed exceptional growth driven by their enterprise expansion
- **TechStart Inc** benefited from the new product launch
- Overall Q4 revenue increased by **35%** compared to Q3`,
    role: "assistant",
    createdAt: "2024-01-15T10:01:00Z",
    createdBy: null,
    status: "completed",
    isStreaming: false,
  },
  {
    id: "msg-003",
    runId: "run-003",
    conversationId: "conv-001",
    messageType: "text",
    messageContent: "Can you show me the pipeline breakdown by stage?",
    role: "user",
    createdAt: "2024-01-15T10:05:00Z",
    createdBy: "user-123",
    status: "completed",
  },
  {
    id: "msg-004",
    runId: "run-004",
    conversationId: "conv-001",
    messageType: "markdown",
    messageContent: `Here's the current pipeline breakdown by stage:

## Pipeline Summary

- **Discovery**: $4.2M (32 opportunities)
- **Qualification**: $3.1M (24 opportunities)
- **Proposal**: $2.8M (18 opportunities)
- **Negotiation**: $1.9M (12 opportunities)
- **Closed Won**: $8.5M (45 opportunities)

The pipeline is healthy with a good distribution across stages.`,
    role: "assistant",
    createdAt: "2024-01-15T10:06:00Z",
    createdBy: null,
    status: "completed",
    isStreaming: false,
  },
];

export const mockPaginatedMessages: PaginatedMessagesResponse = {
  data: mockMessagesBackend,
  pagination: {
    page: 1,
    limit: 50,
    total: 4,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

// ============================================================================
// Mock Messages (Frontend/Chat Component Format)
// ============================================================================

export const mockMessagesFrontend: Message[] = [
  {
    id: "msg-001",
    type: "user",
    content: "What were our top performing accounts in Q4?",
    timestamp: new Date("2024-01-15T10:00:00Z"),
    runId: "run-001",
    conversationId: "conv-001",
  },
  {
    id: "msg-002",
    type: "assistant",
    content: `Based on my analysis of your Q4 data, here are the top performing accounts:

## Top 5 Accounts by Revenue

| Account | Revenue | Growth |
|---------|---------|--------|
| Acme Corp | $2.5M | +45% |
| TechStart Inc | $1.8M | +32% |
| Global Systems | $1.5M | +28% |
| Innovation Labs | $1.2M | +22% |
| DataFlow Corp | $950K | +18% |

### Key Insights
- **Acme Corp** showed exceptional growth driven by their enterprise expansion
- **TechStart Inc** benefited from the new product launch
- Overall Q4 revenue increased by **35%** compared to Q3`,
    timestamp: new Date("2024-01-15T10:01:00Z"),
    runId: "run-002",
    conversationId: "conv-001",
    messageId: "msg-002",
    status: "completed",
    isStreaming: false,
  },
  {
    id: "msg-003",
    type: "user",
    content: "Can you show me the pipeline breakdown by stage?",
    timestamp: new Date("2024-01-15T10:05:00Z"),
    runId: "run-003",
    conversationId: "conv-001",
  },
  {
    id: "msg-004",
    type: "assistant",
    content: `Here's the current pipeline breakdown by stage:

## Pipeline Summary

- **Discovery**: $4.2M (32 opportunities)
- **Qualification**: $3.1M (24 opportunities)
- **Proposal**: $2.8M (18 opportunities)
- **Negotiation**: $1.9M (12 opportunities)
- **Closed Won**: $8.5M (45 opportunities)

The pipeline is healthy with a good distribution across stages.`,
    timestamp: new Date("2024-01-15T10:06:00Z"),
    runId: "run-004",
    conversationId: "conv-001",
    messageId: "msg-004",
    status: "completed",
    isStreaming: false,
  },
];

// ============================================================================
// Mock Streaming Message (V1 with Tool Calls)
// ============================================================================

export const mockToolCalls: ToolCall[] = [
  {
    id: "tool-001",
    name: "execute_sql_query",
    arguments: {
      query:
        "SELECT account_name, SUM(amount) as revenue FROM opportunities GROUP BY account_name ORDER BY revenue DESC LIMIT 5",
    },
    status: "success",
    parentMessageId: "msg-streaming",
    startTime: Date.now() - 5000,
    endTime: Date.now() - 3000,
    executionTime: 2000,
    result: {
      raw: {
        columns: ["account_name", "revenue"],
        rows: [
          { account_name: "Acme Corp", revenue: 2500000 },
          { account_name: "TechStart Inc", revenue: 1800000 },
        ],
      },
      type: "table",
      table: {
        columns: [
          { name: "account_name", display_name: "Account Name" },
          { name: "revenue", display_name: "Revenue" },
        ],
        rows: [
          { account_name: "Acme Corp", revenue: 2500000 },
          { account_name: "TechStart Inc", revenue: 1800000 },
        ],
        rowCount: 2,
        isComplete: true,
      },
    },
    artifact: {
      artifact_id: "artifact-001",
      artifact_type: "table",
      size_bytes: 1024,
      tool_name: "execute_sql_query",
      run_id: "run-streaming",
      success: true,
    },
  },
];

export const mockStepMessages: StepMessage[] = [
  {
    message_id: "step-001",
    content: "Let me analyze the Q4 revenue data for your top accounts.",
    toolCalls: mockToolCalls,
  },
];

export const mockStreamingMessageV1: Message = {
  id: "msg-streaming",
  type: "assistant",
  content: "Analyzing your Q4 data...",
  timestamp: new Date(),
  runId: "run-streaming",
  conversationId: "conv-001",
  messageId: "msg-streaming",
  status: "streaming",
  isStreaming: true,
  stepMessages: mockStepMessages,
  toolCalls: mockToolCalls,
};

// ============================================================================
// Mock Timeline Steps (V2 Thinking Process)
// ============================================================================

export const mockTimelineSteps: TimelineStep[] = [
  {
    id: "step-1",
    text: "Understanding your question about Q4 revenue",
    status: "complete",
    type: "reasoning",
    description:
      "Parsing the user query to identify the key metrics and time period requested.",
  },
  {
    id: "step-2",
    text: "Querying Salesforce for opportunity data",
    status: "complete",
    type: "tool_call",
    source: "salesforce",
    description:
      "Executing SOQL query to retrieve closed-won opportunities from Q4.",
    artifact: {
      artifact_id: "artifact-sf-001",
      run_id: "run-v2",
      tool_name: "salesforce_soql_query",
      artifact_type: "table",
    },
  },
  {
    id: "step-3",
    text: "Analyzing revenue by account",
    status: "complete",
    type: "tool_call",
    source: "voniq",
    category: "sql",
    description:
      "Running SQL aggregation to calculate total revenue per account.",
    artifact: {
      artifact_id: "artifact-sql-001",
      run_id: "run-v2",
      tool_name: "execute_sql_query",
      artifact_type: "table",
    },
  },
  {
    id: "step-4",
    text: "Calculating growth percentages",
    status: "complete",
    type: "code_execution",
    code: `import pandas as pd

# Calculate YoY growth
df['growth_pct'] = ((df['q4_revenue'] - df['q3_revenue']) / df['q3_revenue'] * 100).round(1)
df_sorted = df.sort_values('q4_revenue', ascending=False).head(5)`,
    description:
      "Computing quarter-over-quarter growth rates for each account.",
  },
  {
    id: "step-5",
    text: "Generating response",
    status: "in-progress",
    type: "output",
    description:
      "Formatting the analysis results into a comprehensive response.",
  },
];

export const mockStreamingMessageV2: Message = {
  id: "msg-v2-streaming",
  type: "assistant",
  content: "",
  timestamp: new Date(),
  runId: "run-v2",
  conversationId: "conv-001",
  messageId: "msg-v2-streaming",
  status: "streaming",
  isStreaming: true,
  timelineSteps: mockTimelineSteps,
  thinkingElapsedTime: 15,
  v2FinalResponse: "",
  v2FinalResponseStreaming: false,
};

// ============================================================================
// Mock Approval Step (Salesforce CRUD)
// ============================================================================

export const mockApprovalStep: TimelineStep = {
  id: "step-approval",
  text: "Requesting approval to update Salesforce",
  status: "awaiting-approval",
  type: "approval",
  source: "salesforce",
  approval: {
    toolCallId: "tool-approval-001",
    summary: "Update opportunity stage to Closed Won",
    label: "Opportunity",
    recordName: "Acme Corp - Enterprise Deal",
    operation: "update",
    approvalType: "salesforce",
    changes: [
      { field: "Stage", before: "Negotiation", after: "Closed Won" },
      { field: "Close Date", before: "2024-02-15", after: "2024-01-15" },
      { field: "Amount", before: 450000, after: 500000 },
    ],
  },
};

// ============================================================================
// Mock Deep Research Approval
// ============================================================================

export const mockDeepResearchApprovalStep: TimelineStep = {
  id: "step-dr-approval",
  text: "Requesting approval to run full analysis",
  status: "awaiting-approval",
  type: "approval",
  approval: {
    toolCallId: "tool-dr-001",
    summary: "Run comprehensive churn analysis",
    label: "Deep Research",
    operation: "create",
    approvalType: "deep_research",
    researchQuery: "What are the main drivers of customer churn in Q4?",
    estimatedTime: "10-15 minutes",
    sampleContent: `## Sample Analysis Preview

Based on initial sampling of 50 accounts:
- **High risk accounts**: 12 showing engagement decline
- **Key factors**: Support ticket volume, usage drops
- **Potential revenue at risk**: $2.1M`,
    dataSources: [
      {
        name: "Salesforce Opportunities",
        record_count: 1250,
        description: "Closed lost and churned accounts",
      },
      {
        name: "Support Tickets",
        record_count: 3400,
        description: "Customer support interactions",
      },
      {
        name: "Usage Analytics",
        record_count: 8900,
        description: "Product usage data",
      },
    ],
  },
};

// ============================================================================
// Mock Artifacts
// ============================================================================

export const mockArtifactSummaries: ArtifactSummary[] = [
  {
    artifact_id: "artifact-001",
    tool_call_id: "tool-001",
    tool_name: "execute_sql_query",
    artifact_type: "table",
    category: "iq",
    size_bytes: 2048,
    persisted_at: "2024-01-15T10:01:30Z",
  },
  {
    artifact_id: "artifact-002",
    tool_call_id: "tool-002",
    tool_name: "salesforce_soql_query",
    artifact_type: "table",
    category: "Salesforce",
    size_bytes: 4096,
    persisted_at: "2024-01-15T10:01:25Z",
  },
  {
    artifact_id: "artifact-003",
    tool_call_id: "tool-003",
    tool_name: "search_gong_calls",
    artifact_type: "table",
    category: "RAG",
    size_bytes: 8192,
    persisted_at: "2024-01-15T10:01:20Z",
  },
];

export const mockMessageArtifacts: MessageArtifactsResponse = {
  conversation_id: "conv-001",
  run_id: "run-002",
  total_count: 3,
  artifacts: mockArtifactSummaries,
};

export const mockArtifactContent: ArtifactResponse = {
  artifact_id: "artifact-001",
  tool_call_id: "tool-001",
  tool_name: "execute_sql_query",
  artifact_type: "table",
  category: "iq",
  size_bytes: 2048,
  persisted_at: "2024-01-15T10:01:30Z",
  content: {
    columns: [
      { name: "account_name", display_name: "Account Name" },
      { name: "revenue", display_name: "Revenue" },
      { name: "growth", display_name: "Growth %" },
    ],
    rows: [
      { account_name: "Acme Corp", revenue: 2500000, growth: 45 },
      { account_name: "TechStart Inc", revenue: 1800000, growth: 32 },
      { account_name: "Global Systems", revenue: 1500000, growth: 28 },
      { account_name: "Innovation Labs", revenue: 1200000, growth: 22 },
      { account_name: "DataFlow Corp", revenue: 950000, growth: 18 },
    ],
    rowCount: 5,
    isComplete: true,
    query: {
      label: "Top Accounts by Revenue",
      dialect: "postgresql",
      statement:
        "SELECT account_name, SUM(amount) as revenue, ROUND((SUM(amount) - LAG(SUM(amount)) OVER (ORDER BY account_name)) / LAG(SUM(amount)) OVER (ORDER BY account_name) * 100, 0) as growth FROM opportunities WHERE close_date >= '2024-10-01' AND stage = 'Closed Won' GROUP BY account_name ORDER BY revenue DESC LIMIT 5",
    },
  },
};

// ============================================================================
// Mock Deep Research Results
// ============================================================================

export const mockResearchResults = {
  isStreaming: false,
  isCompleted: true,
  content: `# Customer Churn Analysis - Q4 2024

## Executive Summary

After analyzing 1,250 accounts and 8,900 usage records, we identified key patterns driving customer churn in Q4.

## Key Findings

### 1. Support Ticket Volume Correlation
Accounts with **>10 support tickets/month** had a **3.2x higher churn rate**.

### 2. Usage Decline Indicators
- **30-day inactive users**: 78% correlation with churn
- **Feature adoption < 25%**: 2.1x churn likelihood

### 3. At-Risk Segments

| Segment | Accounts | Revenue at Risk |
|---------|----------|-----------------|
| Enterprise | 23 | $4.2M |
| Mid-Market | 45 | $2.8M |
| SMB | 89 | $1.1M |

## Recommendations

1. **Implement proactive health scoring** - Flag accounts showing early warning signs
2. **Increase CSM touchpoints** - Monthly reviews for at-risk enterprise accounts
3. **Feature adoption campaigns** - Targeted enablement for underutilized features

## Data Sources Used
- Salesforce Opportunities (1,250 records)
- Zendesk Support Tickets (3,400 records)
- Product Analytics (8,900 records)`,
  metadata: {
    totalRecords: 13550,
    dataSourcesUsed: 3,
    analysisTimeSeconds: 847,
    planId: "plan-dr-001",
  },
  messageId: "msg-dr-001",
};

// ============================================================================
// Mock Error States
// ============================================================================

export const mockFailedMessage: Message = {
  id: "msg-failed",
  type: "assistant",
  content: "",
  timestamp: new Date(),
  runId: "run-failed",
  conversationId: "conv-001",
  messageId: "msg-failed",
  status: "failed",
  errorMessage:
    "Failed to connect to Salesforce. Please check your connection and try again.",
  isStreaming: false,
};

export const mockTimeoutMessage: Message = {
  id: "msg-timeout",
  type: "assistant",
  content: "The request timed out while processing...",
  timestamp: new Date(),
  runId: "run-timeout",
  conversationId: "conv-001",
  messageId: "msg-timeout",
  status: "timeout",
  isStreaming: false,
};

// ============================================================================
// Mock Complete Dashboard State
// ============================================================================

export const mockDashboardState = {
  user: mockUser,
  conversations: mockPaginatedConversations,
  currentConversationId: "conv-001",
  messages: mockMessagesFrontend,
  isLoading: false,
  isSalesforceConnected: true,
  isAgentV2: true,
  isDeepResearchMode: false,
};

// ============================================================================
// Helper Functions for Testing
// ============================================================================

/**
 * Creates a mock streaming message with configurable state
 */
export function createMockStreamingMessage(options: {
  content?: string;
  progress?: number;
  hasToolCalls?: boolean;
  isV2?: boolean;
}): Message {
  const {
    content = "",
    progress = 0,
    hasToolCalls = false,
    isV2 = false,
  } = options;

  if (isV2) {
    const steps = mockTimelineSteps.map((step, index) => ({
      ...step,
      status:
        index < Math.floor(progress / 20)
          ? ("complete" as const)
          : index === Math.floor(progress / 20)
            ? ("in-progress" as const)
            : ("pending" as const),
    }));

    return {
      id: `msg-${Date.now()}`,
      type: "assistant",
      content: "",
      timestamp: new Date(),
      runId: `run-${Date.now()}`,
      conversationId: "conv-001",
      status: "streaming",
      isStreaming: true,
      timelineSteps: steps,
      thinkingElapsedTime: Math.floor(progress / 4),
      v2FinalResponse: content,
      v2FinalResponseStreaming: progress > 80,
    };
  }

  return {
    id: `msg-${Date.now()}`,
    type: "assistant",
    content,
    timestamp: new Date(),
    runId: `run-${Date.now()}`,
    conversationId: "conv-001",
    status: "streaming",
    isStreaming: true,
    toolCalls: hasToolCalls ? mockToolCalls : undefined,
    stepMessages: hasToolCalls ? mockStepMessages : undefined,
  };
}

/**
 * Simulates a delay for mock API calls
 */
export function mockApiDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
