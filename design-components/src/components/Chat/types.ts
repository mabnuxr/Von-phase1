/**
 * Type definitions for Chat component with backend integration
 */

import type { ConversationMode, ReferenceContext } from './StandardChatInput/types';
import type { FileArtifact } from './ArtifactCards/types';
import type { Command, ScheduleRecipient } from '../Commands/types';
import type { ResearchResultsMetadata } from './DeepResearch/types';
import type { FileAttachment } from './FileAttachment/types';
import type { MentionItem } from '../Mentions/types';

/**
 * Shared message status type used across Chat components
 */
export type MessageStatus =
  | 'created'
  | 'streaming'
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'expired';

/**
 * Additional options passed with the send message callback
 */
export interface SendMessageOptions {
  /** Selected agent mode for the message */
  agentMode?: ConversationMode;
  /** Selected command (when slash commands are enabled) */
  command?: Command;
  /** Selected @ mentions (when mentions are enabled) */
  mentions?: MentionItem[];
}

/**
 * Step message in a multi-step agent response
 * Each step has its own content and associated tool calls
 */
export interface StepMessage {
  message_id: string;
  content: string;
  toolCalls?: ToolCall[];
}

/**
 * Serializable file attachment for messages (without File object)
 * Used for displaying attachments in sent messages
 */
export interface MessageFileAttachment {
  /** Unique identifier for the attachment */
  id: string;
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** File extension (e.g., 'PDF', 'XLSX') */
  extension: string;
  /** File category */
  category: 'document' | 'spreadsheet' | 'presentation' | 'text' | 'image';
  /** Preview URL for images (data URL or blob URL) */
  previewUrl?: string;
}

/**
 * Dashboard metadata from a RUN_FINISHED event result
 * Present only when a dashboard was created/updated during that run
 */
export interface DashboardMetadata {
  dashboard_id: string;
  dashboard_name: string;
  dashboard_version: number;
  panel_count: number;
  query_count: number;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  /**
   * File attachments for user messages
   */
  attachments?: MessageFileAttachment[];
  /**
   * Thought content for assistant messages (separate from main content)
   */
  thoughtContent?: string;
  /**
   * Reasoning content from AI SDK (Claude thinking blocks)
   * This is streamed separately from the main content
   */
  reasoningContent?: string;
  timestamp?: Date;
  /**
   * Active tab for assistant messages
   * @default 'output'
   */
  activeTab?: 'output' | 'sources' | 'thought';
  /**
   * Whether this message is currently streaming
   */
  isStreaming?: boolean;
  /**
   * Whether the reasoning/thinking is currently streaming
   */
  isReasoningStreaming?: boolean;
  /**
   * Whether this message has an error
   */
  hasError?: boolean;
  /**
   * AGUI metadata
   */
  metadata?: {
    run_id: string;
    thread_id: string;
    sequences: number[];
  };
  /**
   * Message status from backend persistence
   * Tracks the lifecycle state of the message
   *
   * Note: Stuck/timed-out messages are soft-deleted by backend,
   * so they disappear from the list rather than showing timeout status.
   * However, client-side timeout recovery may set status to "timeout" temporarily.
   */
  status?: MessageStatus;
  /**
   * Error message if status is 'failed'
   */
  errorMessage?: string;
  /**
   * Complete event stream from backend (event array architecture)
   * Array of AG-UI events with sequence numbers and metadata
   * Enables event-driven rendering and complete playback
   */
  events?: AguiEventWrapper[];
  /**
   * Tool calls made during this message (AGUI)
   * @deprecated Use stepMessages with tool calls instead
   */
  toolCalls?: ToolCall[];
  /**
   * Multiple step messages (for multi-step agent responses)
   * Each step message contains its content and associated tool calls
   */
  stepMessages?: StepMessage[];
  /**
   * Message ID (for artifact fetching and API operations)
   * Same as `id` but explicitly typed for clarity in artifact contexts
   */
  messageId?: string;
  /**
   * Run ID from streaming session
   * Separate from message ID - can differ especially during retries
   * Used for tracking streaming sessions and live updates
   */
  runId?: string;
  /**
   * Conversation ID (for artifact fetching)
   */
  conversationId?: string;
  /**
   * Agent-generated file artifacts associated with this message (matched by runId)
   */
  artifacts?: Array<{
    fileId: string;
    fileName: string;
    artifactType: string;
    mimeType: string;
    isPending?: boolean;
    pdfPreview?: { id: string; fileName: string };
  }>;
  /**
   * Whether the response was stopped by user
   */
  stoppedByUser?: boolean;
  /**
   * Whether this is the latest message in the conversation
   * Used to control visibility of approval buttons
   */
  isLatestMessage?: boolean;

  // V2 Thinking Process fields
  /**
   * Timeline steps for v2 thinking process visualization
   */
  timelineSteps?: import('../TimelineThinkingProcess').TimelineStep[];
  /**
   * Elapsed time in seconds for v2 thinking process
   */
  thinkingElapsedTime?: number;
  /**
   * Final response content for v2 (separated from reasoning steps)
   * This is the content from TEXT_MESSAGE with parent_message_id
   */
  v2FinalResponse?: string;
  /**
   * Whether the v2 final response is still streaming
   */
  v2FinalResponseStreaming?: boolean;
  /**
   * Conversation phase from RUN_FINISHED event (assistant messages only)
   * Controls whether approval buttons are shown
   * - "plan-proposed": Show approval buttons (Skip/Create Dashboard)
   * - "ask": Normal conversation mode (hide approval buttons)
   * - null/undefined: Normal conversation mode (hide approval buttons)
   */
  phase?: 'plan-proposed' | 'ask' | null;
  /**
   * Dashboard metadata from RUN_FINISHED event (assistant messages only)
   * Only present when a dashboard was created during this specific run.
   * Use this (not a global prop) to conditionally render the DashboardArtifactCard.
   */
  dashboard?: DashboardMetadata | null;
  /**
   * execution_id from RUN_FINISHED for workflow execution approval (dry_run completed).
   * When present alongside phase="plan-proposed", use the resume API with this
   * execution_id instead of sending a new chat message.
   */
  executionId?: string | null;
  /**
   * The slash command that was active when this message was sent.
   * Populated for user messages when the user selected a command before sending.
   */
  command?: Command;
}

export interface ChatSession {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface ChatUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface SourceReference {
  id: string;
  title: string;
  url?: string;
  snippet?: string;
  relevanceScore?: number;
}

export interface DashboardComponent {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text';
  title: string;
  data: unknown;
  config?: Record<string, unknown>;
}

export interface DashboardArtifact {
  id: string;
  messageId: string;
  title: string;
  description?: string;
  components: DashboardComponent[];
  createdAt: Date;
}

export interface ApiEndpoints {
  conversations: string;
  messages: string;
  history: string;
  auth: string;
}

export interface FixedPosition {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

/**
 * AGUI (Agent UI) Event Types
 * Following the AGUI convention for agent streaming events
 */

// AGUI Event wrapper - all events come wrapped in this structure
export interface AguiEventWrapper {
  sequence: number;
  timestamp: string;
  run_id: string; // Maps to message ID
  thread_id: string; // Maps to conversation ID
  event: AguiEvent;
  meta: EventMeta;
}

export interface EventMeta {
  backend: string;
  version: string;
  sequence_info: {
    total_events: number;
    run_start_time: string;
  };
}

// Import research results event types
import type {
  ResearchResultsStartEvent,
  ResearchResultsContentEvent,
  ResearchResultsEndEvent,
} from './DeepResearch/types';

// Re-export research results event types
export type {
  ResearchResultsStartEvent,
  ResearchResultsContentEvent,
  ResearchResultsEndEvent,
  ResearchResultsEvent,
  ResearchResultsMetadata,
} from './DeepResearch/types';

// Union type of all possible AGUI events
export type AguiEvent =
  | RunStartedEvent
  | StepStartedEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | ToolCallResultEvent
  | StepFinishedEvent
  | RunFinishedEvent
  | RunErrorEvent
  // Deep Research events
  | ResearchResultsStartEvent
  | ResearchResultsContentEvent
  | ResearchResultsEndEvent;

// Individual event types
export interface RunStartedEvent {
  type: 'RUN_STARTED';
  thread_id: string;
  run_id: string;
  message_id?: string; // MongoDB ObjectId of the message (for API calls like resume)
}

export interface StepStartedEvent {
  type: 'STEP_STARTED';
  step_number: number;
  step_name: string;
}

export interface TextMessageStartEvent {
  type: 'TEXT_MESSAGE_START';
  message_id: string;
  role: 'assistant';
  /** Present for final response messages, points to the thinking message_id */
  parent_message_id?: string;
  /** When true, this message should stream directly to the chat response (final response) */
  is_final_response?: boolean;
}

export interface TextMessageContentEvent {
  type: 'TEXT_MESSAGE_CONTENT';
  message_id: string;
  parent_message_id: string;
  delta: string;
  /** When true, this content is part of the final response */
  is_final_response?: boolean;
}

export interface TextMessageEndEvent {
  type: 'TEXT_MESSAGE_END';
  message_id: string;
  /** When true, this marks the end of the final response */
  is_final_response?: boolean;
}

export interface ToolCallStartEvent {
  type: 'TOOL_CALL_START';
  tool_call_id: string;
  tool_call_name: string;
  parent_message_id: string;
  /** Step number for correlating tool calls with steps in interleaved scenarios */
  step_number?: number;
}

export interface ToolCallArgsEvent {
  type: 'TOOL_CALL_ARGS';
  tool_call_id: string;
  delta: string;
  /** Step number for correlating tool calls with steps in interleaved scenarios */
  step_number?: number;
}

export interface ToolCallEndEvent {
  type: 'TOOL_CALL_END';
  tool_call_id: string;
  /** Step number for correlating tool calls with steps in interleaved scenarios */
  step_number?: number;
}

export interface ToolCallResultEvent {
  type: 'TOOL_CALL_RESULT';
  message_id: string;
  tool_call_id: string;
  content?: string; // Optional for backward compatibility (non-chunked results)
  delta?: string; // Optional for chunked results (accumulate across multiple events)
  role: 'tool';
  /** Step number for correlating tool calls with steps in interleaved scenarios */
  step_number?: number;
}

export interface StepFinishedEvent {
  type: 'STEP_FINISHED';
  step_number: number;
  step_name: string;
}

export interface RunFinishedEvent {
  type: 'RUN_FINISHED';
  thread_id: string;
  run_id: string;
  result: {
    status: 'completed' | 'failed';
    stopped_by_user?: boolean;
    error_occurred?: boolean;
    error_message?: string;
    /**
     * Conversation phase for approval button control (nested inside result)
     * - "plan-proposed": Show approval buttons (Skip/Create Dashboard)
     * - "ask": Normal conversation mode (hide approval buttons)
     * - null/undefined: Normal conversation mode (hide approval buttons)
     */
    phase?: 'plan-proposed' | 'ask' | null;
  };
}

export interface RunErrorEvent {
  type: 'RUN_ERROR';
  thread_id?: string;
  run_id?: string;
  error?: string;
  message?: string;
}

/**
 * Tool execution types
 */
export interface ToolCall {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  arguments: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: Record<string, any>; // Alias for arguments (used in some contexts)
  result?: ToolResult;
  status: 'pending' | 'running' | 'success' | 'error';
  executionTime?: number;
  startTime?: number; // Timestamp when tool execution started
  endTime?: number; // Timestamp when tool execution completed
  parentMessageId: string;
  /**
   * Artifact metadata for tool results stored separately
   * When present, the actual result content is stored as an artifact
   * and should be fetched lazily from the artifacts API
   */
  artifact?: {
    artifact_id: string;
    artifact_type:
      | 'table'
      | 'json'
      | 'text'
      | 'values'
      | 'metrics'
      | 'schema'
      | 'query'
      | 'statistics'
      | 'table_list';
    size_bytes: number;
    tool_name: string;
    run_id: string; // LangGraph run_id that created this artifact
    success?: boolean; // Tool execution success status
    error?: string; // Error message if tool execution failed
  };
}

export interface SchemaData {
  tableName?: string;
  columns: Array<{ name: string; type: string }>;
}

export interface StatisticsData {
  [key: string]: number | string | null;
}

export interface FetchConversationResult {
  success: boolean;
  conversation_id: string;
  conversation_type: 'call' | 'email';
  detail_level: 'summary' | 'full';
  call_metadata?: {
    call_title?: string;
    call_start_time?: string;
    call_end_time?: string;
    call_duration_seconds?: number;
    provider?: string;
    speakers?: Array<{
      name?: string;
      email?: string;
      title?: string;
      type: 'internal' | 'external';
    }>;
    crm_associations?: Array<{
      crm_object_type: string;
      crm_object_id: string;
    }>;
    keywords?: string[];
    topics?: string[];
    action_items?: string[];
    engagement_score?: number;
  };
  call_content?: {
    summary?: string;
    transcript?: string;
    transcript_token_count?: number;
    transcript_word_count?: number;
  };
  email_metadata?: {
    start_time?: string;
    crm_associations?: Array<{
      crm_object_type: string;
      crm_object_id: string;
    }>;
  };
  email_content?: {
    body?: string;
  };
  warnings?: string[];
  error_message?: string;
}

export interface ToolResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any; // Raw JSON result from tool
  type:
    | 'table'
    | 'query'
    | 'metrics'
    | 'values'
    | 'json'
    | 'schema'
    | 'table_list'
    | 'statistics'
    | 'memory'
    | 'call_search_union'
    | 'consolidated_conversation_search'
    | 'fetch_conversation';
  table?: TableData;
  queries?: QueryInfo[];
  metrics?: MetricData[];
  values?: ValueData[];
  schema?: SchemaData;
  tables?: string[];
  statistics?: StatisticsData;
  memory?: MemoryResultData;
  callSearchUnion?: CallSearchUnionResult;
  fetchConversation?: FetchConversationResult;
  error?: string;
}

export interface MemoryResultData {
  operation: 'retrieve' | 'save' | 'update';
  success: boolean;
  key: string;
  value?: string;
  char_count?: number;
  appended?: boolean;
  error?: string;
}

/**
 * Call Search Union Types
 * Used for comprehensive call search with multiple matching strategies
 */

/**
 * Match source types for call search union queries
 * Each represents a different search strategy used to find calls
 */
export type CallMatchSource =
  | 'crm_account' // Direct match on crm_object_id = account_id
  | 'crm_opportunity' // Match on crm_object_id = opportunity_id
  | 'crm_contact' // Match on crm_object_id = contact_id
  | 'email_external' // Match by external speaker email
  | 'email_internal' // Match by internal speaker email
  | 'email_domain' // Match by email domain
  | 'company_name' // Match by company name in external_speaker_companies
  | 'name_fuzzy' // Fuzzy match on speaker names or call title
  | 'job_title' // Match by speaker job titles
  | 'keyword' // Match in keywords/topics/action_items
  | 'topic' // Match in topics array
  | 'content'; // Match in title/description/summary

/**
 * Individual call result with match metadata
 */
export interface CallSearchResult {
  /** Unique call identifier from provider */
  call_id: string;
  /** Internal conversation ID */
  conversation_id?: string;
  /** Call title/subject */
  call_title: string;
  /** AI-generated summary (may be truncated) */
  summary?: string;
  /** Call start time (ISO format) */
  call_date: string;
  /** Duration in minutes */
  duration_minutes?: number;
  /** External speaker names (comma-separated or array) */
  external_speakers?: string | string[];
  /** Internal speaker names (comma-separated or array) */
  internal_speakers?: string | string[];
  /** External speaker companies */
  external_companies?: string[];
  /** Topics discussed */
  topics?: string[];
  /** Keywords from the call */
  keywords?: string[];
  /** Call provider (gong, fathom, etc.) */
  provider?: string;
  /** Deep link to view call recording */
  deep_link?: string;
  /** Meeting URL */
  meeting_url?: string;
  /** Engagement score (0-100) */
  engagement_score?: number;

  /** Match metadata for visualization */
  match_info: {
    /** Which strategy found this result */
    source: CallMatchSource;
    /** Priority (1=highest, higher numbers=lower priority) */
    priority: number;
    /** Confidence score (0-1) */
    confidence: number;
    /** Human-readable explanation of how match was found */
    match_reason: string;
    /** The specific value that matched (e.g., email, company name) */
    matched_value?: string;
  };
}

/**
 * Union query component for display
 */
export interface UnionQueryComponent {
  /** Human-readable label for this query part */
  label: string;
  /** The actual SQL query executed */
  query: string;
  /** Which match source this query targets */
  source: CallMatchSource;
  /** Number of results from this specific query (before dedup) */
  result_count: number;
}

/**
 * Deduplication info for merged results
 */
export interface DeduplicationInfo {
  /** Total calls before deduplication */
  total_raw_count: number;
  /** Total calls after deduplication */
  deduplicated_count: number;
  /** Number of duplicates merged */
  duplicates_merged: number;
  /** Details of which calls were merged (optional) */
  merge_details?: Array<{
    primary_call_id: string;
    merged_from_sources: CallMatchSource[];
  }>;
}

/**
 * Search parameters used for the query
 */
export interface CallSearchParams {
  /** CRM object IDs used */
  account_id?: string;
  opportunity_id?: string;
  contact_id?: string;
  /** Direct search parameters */
  emails?: string[];
  person_names?: string[];
  company_names?: string[];
  domains?: string[];
  job_titles?: string[];
  keywords?: string[];
  topics?: string[];
  content?: string;
  /** Filters applied */
  date_from?: string;
  date_to?: string;
  providers?: string[];
  call_outcome?: string;
  min_engagement_score?: number;
  /** Whether CRM resolution was attempted */
  crm_resolved?: boolean;
}

/**
 * Complete union query result for call search
 */
export interface CallSearchUnionResult {
  /** Result type identifier */
  type: 'call_search_union';

  /** Unified results after deduplication, sorted by relevance */
  results: CallSearchResult[];

  /** Union query components for display */
  union_query: {
    /** Combined query (for debugging/transparency) */
    combined_sql: string;
    /** Individual components of the union */
    components: UnionQueryComponent[];
    /** Total execution time in milliseconds */
    execution_time_ms: number;
  };

  /** Deduplication information */
  deduplication: DeduplicationInfo;

  /** Search parameters used */
  search_params: CallSearchParams;

  /** Summary statistics */
  summary: {
    total_results: number;
    by_source_counts: Partial<Record<CallMatchSource, number>>;
    time_range?: {
      earliest: string;
      latest: string;
    };
  };
}

export interface ColumnMetadata {
  name: string;
  display_name: string;
}

export interface TableData {
  columns: ColumnMetadata[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: Record<string, any>[];
  rowCount: number;
  isComplete: boolean;
}

export interface QueryInfo {
  label: string;
  dialect: string;
  statement: string;
}

export interface MetricData {
  label: string;
  value: number | string;
  type: 'currency' | 'count' | 'trend' | 'general';
}

export interface ValueData {
  value: string;
  count: number;
}

/**
 * Salesforce CRUD Approval Types
 * Used for the request_salesforce_approval tool
 */

/**
 * Single operation in a Salesforce CRUD approval request
 * Field names match backend API (approval_tools.py)
 */
export interface SalesforceOperation {
  /** Type of operation: create, update, or delete */
  operation: string;
  /** Salesforce object type (e.g., Account, Contact, Opportunity) */
  sobject_type: string;
  /** Record ID (for update/delete operations) */
  record_id?: string;
  /** Record name for display (optional) */
  record_name?: string;
  /** Fields being changed with before/after values */
  changes: Array<{
    field: string;
    before: string | number | boolean | null;
    after: string | number | boolean | null;
  }>;
}

/**
 * Arguments for the request_salesforce_approval tool
 */
export interface ApprovalToolArgs {
  /** Brief summary of the operation(s) */
  summary: string;
  /** List of operations to be performed */
  operations: SalesforceOperation[];
}

/**
 * Result from approval decision
 */
export interface ApprovalResult {
  /** Whether the user approved the operation */
  approved: boolean;
  /** Optional message from the user */
  message?: string;
}

/**
 * Check if a tool call is the Salesforce approval tool
 */
export function isApprovalTool(toolName: string): boolean {
  return toolName === 'request_salesforce_approval' || toolName === 'salesforce_tooling_mutate';
}

/**
 * Parse approval tool arguments from a tool call
 */
export function parseApprovalArgs(args: Record<string, unknown>): ApprovalToolArgs | null {
  try {
    if (!args.summary || !args.operations || !Array.isArray(args.operations)) {
      return null;
    }
    return args as unknown as ApprovalToolArgs;
  } catch {
    return null;
  }
}

/**
 * Google Calendar Event Types
 * Used for the request_google_calendar_approval tool
 */

/**
 * Change in a Google Calendar update operation
 */
export interface GoogleCalendarChange {
  /** Field name that changed */
  field: string;
  /** Previous value */
  before: string | number | boolean | null;
  /** New value */
  after: string | number | boolean | null;
}

/**
 * Single operation in a Google Calendar approval request
 */
export interface GoogleCalendarOperation {
  /** Type of operation: create, update, or delete */
  operation: 'create' | 'update' | 'delete';
  /** Google Calendar event ID (for update/delete operations) */
  event_id?: string;
  /** Changes being made (for update operations) */
  changes?: GoogleCalendarChange[];
  /** Event title/summary */
  summary: string;
  /** Event start time (ISO 8601 format) */
  start_datetime: string;
  /** Duration hours */
  event_duration_hour?: string;
  /** Duration minutes */
  event_duration_minutes?: number;
  /** Calendar ID (usually "primary") */
  calendar_id?: string;
  /** Event description */
  description?: string;
  /** Event location */
  location?: string;
  /** Comma-separated attendee emails */
  attendees_emails?: string;
  /** Timezone (e.g., "UTC") */
  timezone?: string;
  /** Whether to create a Google Meet link */
  create_meeting_room?: boolean;
  /** Event type (e.g., "default") */
  event_type?: string;
  /** Recurrence rule (e.g., "FREQ=DAILY;COUNT=5") */
  recurrence?: string;
  /** Whether guests can invite others */
  guests_can_invite_others?: boolean;
  /** Whether guests can modify the event */
  guests_can_modify?: boolean;
  /** Whether guests can see other guests */
  guests_can_see_other_guests?: boolean;
  /** Whether to send updates to attendees */
  send_updates?: boolean;
  /** Transparency: "opaque" or "transparent" */
  transparency?: string;
  /** Visibility: "default", "public", or "private" */
  visibility?: string;
}

/**
 * Arguments for the request_google_calendar_approval tool
 */
export interface GoogleCalendarApprovalToolArgs {
  /** Brief summary of the operation(s) */
  summary: string;
  /** List of calendar operations to be performed */
  operations: GoogleCalendarOperation[];
}

/**
 * Check if a tool call is the Google Calendar approval tool
 */
export function isGoogleCalendarApprovalTool(toolName: string): boolean {
  return toolName === 'request_google_calendar_approval';
}

/**
 * Parse Google Calendar approval tool arguments from a tool call
 */
export function parseGoogleCalendarApprovalArgs(
  args: Record<string, unknown>
): GoogleCalendarApprovalToolArgs | null {
  try {
    if (!args.summary || !args.operations || !Array.isArray(args.operations)) {
      return null;
    }
    return args as unknown as GoogleCalendarApprovalToolArgs;
  } catch {
    return null;
  }
}

/**
 * Deep Research Approval Types
 * Used for the request_deep_research_approval tool
 * Allows users to accept/reject proceeding with full research after initial sample analysis
 */

/**
 * Data source information for deep research
 */
export interface DeepResearchDataSource {
  /** Name of the data source (e.g., "Salesforce Opportunities") */
  name: string;
  /** Number of records in this source */
  record_count: number;
  /** Description of what data will be analyzed */
  description?: string;
}

/**
 * Arguments for the request_deep_research_approval tool
 */
export interface DeepResearchApprovalToolArgs {
  /** Brief summary of the research plan */
  summary: string;
  /** The research query/question being investigated */
  research_query: string;
  /** Estimated time for full analysis (e.g., "10-15 minutes") */
  estimated_time?: string;
  /** Data sources that will be analyzed */
  data_sources?: DeepResearchDataSource[];
  /** Total record count across all sources */
  total_records?: number;
  /** Sample analysis content (markdown) to show the user */
  sample_content?: string;
  /** Plan ID for tracking */
  plan_id?: string;
}

export interface ChatProps {
  /**
   * Title displayed in the chat header
   * @default 'Chat'
   */
  title?: string;

  /**
   * User ID for the chat session
   */
  userId?: string;

  /**
   * User's name (for displaying initials in user messages)
   */
  userName?: string;

  /**
   * User's email (for displaying initials in user messages)
   */
  userEmail?: string;

  /**
   * Base URL for the backend API
   */
  apiBaseUrl?: string;

  /**
   * Messages to display in the chat (for controlled component)
   * @default []
   */
  messages?: Message[];

  /**
   * Callback when a new message is sent
   * Includes optional file attachments when enableFileUpload is true
   * Includes SendMessageOptions with agentMode when using StandardChatInput
   */
  onSendMessage?: (
    message: string,
    attachments?: FileAttachment[],
    options?: SendMessageOptions
  ) => void;

  /**
   * Callback when the add button is clicked
   */
  onAddClick?: () => void;

  /**
   * Callback when the refresh button is clicked
   */
  onRefreshClick?: () => void;

  /**
   * Callback when close button is clicked (for fixed variant)
   */
  onClose?: () => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Callback when AGUI state updates arrive from useAguiMessageStream (for controlled mode)
   * Receives direct AGUI protocol data without transformation
   */
  onAguiStateUpdate?: (update: {
    runId: string;
    messageContent: string;
    stepMessages: StepMessage[];
    toolCalls: ToolCall[];
    isStreaming: boolean;
    status: 'created' | 'streaming' | 'completed' | 'failed';
  }) => void;

  /**
   * Callback when user message is received from backend via Pusher
   * Used to add user messages to the store when backend confirms receipt
   */
  onUserMessage?: (data: {
    id: string;
    conversationId: string;
    messageContent: string;
    messageType: string;
    role: 'user';
    createdAt: string;
    createdBy: string;
  }) => void;

  /**
   * Callback when stop streaming is requested
   */
  onStopStreaming?: (conversationId: string) => void;

  /**
   * External control for input value (for auto-populate on error)
   */
  inputValue?: string;

  /**
   * Callback when input value changes (for controlled mode)
   */
  onInputValueChange?: (value: string) => void;

  /**
   * Placeholder text for the input
   * @default 'Ask von anything'
   */
  placeholder?: string;

  /**
   * Whether the chat is in a loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * Height of the chat container
   * @default '600px'
   */
  height?: string;

  /**
   * Width of the chat container
   * @default '400px'
   */
  width?: string;

  /**
   * Variant of the chat component
   * - floating: Normal document flow
   * - fixed: Fixed position overlay (bottom-right by default)
   * - fullpage: Full viewport coverage
   * @default 'floating'
   */
  variant?: 'floating' | 'fixed' | 'fullpage';

  /**
   * Position for fixed variant (ignored for fullpage variant)
   * @default { bottom: '24px', right: '24px' }
   */
  fixedPosition?: FixedPosition;

  /**
   * Active conversation ID (for multi-conversation support)
   */
  conversationId?: string;

  /**
   * Ref for infinite scroll trigger (load older messages)
   * Place this at the top of the messages container
   */
  loadMoreRef?: React.Ref<HTMLDivElement | null>;

  /**
   * Whether currently fetching older messages (for infinite scroll)
   * @default false
   */
  isFetchingMore?: boolean;

  /**
   * Index to start showing messages from (for visual message clearing)
   * Messages before this index will be hidden but preserved in state
   * Used for ChatGPT-style clean slate UX
   * Users can scroll up to see hidden messages once streaming completes
   * @default 0 (show all messages)
   */
  showMessagesFromIndex?: number;

  /**
   * Callback when user clicks on an artifact (from either V1 or V2 thinking process)
   * The consumer should render the appropriate UI with fetched data
   */
  onArtifactClick?: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;

  /**
   * Whether to show agent-generated artifact cards on messages.
   * Gated by feature flag — defaults to false.
   */
  showArtifacts?: boolean;

  /**
   * Custom renderer for artifact cards (e.g. email_draft → GmailDraftCard).
   * Return a ReactNode to override the default FileArtifactCard, or null to use the default.
   */
  renderArtifactCard?: (artifact: FileArtifact) => React.ReactNode | null;

  /**
   * Callback when user clicks on a file artifact card (agent-generated documents)
   * Opens the artifact viewer panel
   */
  onFileArtifactClick?: (
    fileId: string,
    fileName: string,
    artifactType: string,
    mimeType: string,
    pdfPreviewFileId?: string
  ) => void;

  /**
   * Callback to download an agent-generated file artifact via presigned URL
   */
  onArtifactDownload?: (fileId: string) => void;

  /**
   * Callback when user clicks Google Drive button on an artifact card
   */
  onGoogleDriveClick?: (fileId: string) => void;

  /**
   * Whether Google Drive export is enabled (feature flag is on)
   */
  isDriveEnabled?: boolean;

  /**
   * Whether Google Drive is connected (user has authenticated).
   * When isDriveEnabled but not isDriveConnected, clicking navigates to settings.
   */
  isDriveConnected?: boolean;

  /**
   * Tooltip text for the Google Drive button
   */
  driveTooltip?: string;

  /**
   * File ID of the artifact currently being exported to Drive (shows spinner)
   */
  driveLoadingFileId?: string | null;

  /**
   * Callback when a file attachment pill is clicked (for preview/download)
   */
  onFileClick?: (attachment: MessageFileAttachment) => void;

  /**
   * Banner element to show above the chat input
   * Use this to show warnings or important messages to the user
   */
  banner?: React.ReactNode;

  /**
   * Top banner element to show at the very top of the empty state
   * Use this for org context notification or similar announcements
   */
  topBanner?: React.ReactNode;

  /**
   * Disable message submission (send button and Enter key)
   * Input field remains enabled for typing
   * @default false
   */
  disableSubmit?: boolean;

  /**
   * Whether the example prompts in empty state are disabled
   * @default false
   */
  examplePromptsDisabled?: boolean;

  /**
   * Callback when a disabled example prompt is clicked
   */
  onExamplePromptDisabledClick?: () => void;

  /**
   * Callback when user types in input while submit is disabled
   */
  onInputWhileDisabled?: () => void;

  /**
   * Callback when user approves a Salesforce CRUD operation
   * Called with the tool call ID and run ID for tracking and resuming the workflow
   * Backend looks up the message by run_id, so messageId is not needed
   */
  onApprove?: (toolCallId: string, runId: string) => void;

  /**
   * Callback when user rejects a Salesforce CRUD operation
   * Called with the tool call ID and run ID for tracking and resuming the workflow
   * Backend looks up the message by run_id, so messageId is not needed
   */
  onReject?: (toolCallId: string, runId: string) => void;

  /**
   * Callback when user approves a workflow execution plan
   * Called with the run ID and execution ID
   */
  onApprovePlan?: (runId: string, executionId: string) => void;

  /**
   * Callback when user rejects a workflow execution plan
   * Called with the run ID and execution ID
   */
  onRejectPlan?: (runId: string, executionId: string) => void;

  /**
   * Enable slash commands feature
   * When enabled, typing '/' in the input will show a commands popover
   * @default false
   */
  enableCommands?: boolean;

  /**
   * Prefetched commands list — fetch these when the chat input mounts so
   * the "/" dropdown appears instantly without a loading state.
   */
  commands?: Command[];

  /** True while the initial commands fetch is in-flight */
  isLoadingCommands?: boolean;

  /**
   * Called for both create and edit.
   * `editingId`  — set when updating; omit to create.
   * `dataSources` — already-uploaded attachments.
   * `commandId`  — pre-generated ObjectId used for presigning; pass as `id` on create.
   */
  onSaveCommand?: (
    data: Pick<Command, 'name' | 'prompt' | 'prefillText' | 'sharingScope' | 'schedule'>,
    editingId?: string,
    dataSources?: import('../Commands/types').CommandAttachment[],
    commandId?: string
  ) => void | Promise<void>;

  /** Called when a command is deleted from the manage drawer */
  onDeleteCommand?: (id: string) => void;

  /** True while a save/delete mutation is in-flight */
  isSavingCommand?: boolean;

  /** Called when the bookmark/favorite icon is toggled on a command */
  onToggleFavorite?: (command: Command) => void;

  /** Fetches a presigned download URL for a command's already-uploaded data source file */
  onRequestFilePreviewUrl?: (s3Key: string) => Promise<string>;

  /** Eagerly uploads a file when the user picks it in the command drawer */
  onUploadFile?: (commandId: string, file: File) => Promise<{ fileId: string; s3Key: string }>;
  /** When true, the "Org-wide" sharing option is available in the command drawer */
  isAdmin?: boolean;
  /** Team members available as schedule recipients */
  teamMembers?: ScheduleRecipient[];
  /** Current user — auto-added as recipient when schedule is first enabled */
  currentUser?: ScheduleRecipient;
  /** Called when the user clicks "Send test" in the schedule section. Receives current form data. */
  onSendTest?: (
    data: Pick<Command, 'name' | 'prompt'>,
    dataSources: import('../Commands/types').CommandAttachment[],
    recipients: ScheduleRecipient[]
  ) => Promise<void>;

  /**
   * Enable additional actions menu (three dots with convert to dashboard, etc.)
   * Controlled by feature flag in parent component
   * @default false
   */
  enableActions?: boolean;

  /**
   * Callback when convert to dashboard is clicked
   */
  onConvertToDashboard?: (messageId: string) => void;

  /**
   * Callback when transparency (data sources) button is clicked
   */
  onTransparencyClick?: (messageId: string) => void;

  /**
   * Whether to show the transparency button
   * @default true
   */
  showTransparency?: boolean;

  /**
   * Salesforce instance URL for building deep links in approval cards
   * Example: "https://mycompany.my.salesforce.com"
   * Used as fallback when instance_url is not available in streamed tool args
   */
  salesforceInstanceUrl?: string;

  /**
   * Enable file upload/attachment functionality
   * When enabled, shows a + button in the chat input to attach files
   * @default false
   */
  enableFileUpload?: boolean;

  /**
   * Callback when a file validation error occurs
   * Use this to show toast notifications for errors
   */
  onFileError?: (error: string, message: string) => void;

  /**
   * File validation error message to display inline above the input
   */
  fileErrorMessage?: string | null;

  /**
   * Callback to dismiss the file error toast
   */
  onDismissFileError?: () => void;

  /**
   * Enable deep links for Salesforce URLs in artifact pane DataTable
   * When enabled, URLs are rendered as clickable links
   * @default false
   */
  enableDeepLinks?: boolean;

  /**
   * Version of thinking process component to use
   * 'v1' uses ThinkingBlock, 'v2' uses TimelineThinkingProcess
   * @default 'v1'
   */
  thinkingProcessVersion?: 'v1' | 'v2';

  /**
   * Use the new StandardChatInput component with Tiptap editor
   * When enabled, replaces ChatInput/ChatInputWithCommands with StandardChatInput
   * This provides rich text editing, file upload UI, and voice input support
   * @default false
   */
  useStandardInput?: boolean;

  // ============================================================================
  // Agent Selection Props (for locking after first message)
  // ============================================================================

  /**
   * Whether agent selection is locked (e.g., after first message in conversation)
   * When true, the agent selector will be disabled and show lockedConversationMode
   * @default false
   */
  isAgentLocked?: boolean;

  /**
   * The agent mode to display when locked (from backend/conversation data)
   * Only used when isAgentLocked is true
   * @default 'auto'
   */
  lockedConversationMode?: ConversationMode;

  /**
   * Agent modes available for selection in the plus menu.
   * When more than just "Auto" is provided, the Agents submenu is shown in the plus menu.
   * @default [ConversationMode.Auto]
   */
  availableAgentModes?: ConversationMode[];

  /**
   * Agent modes shown in the selector popover but kept non-selectable.
   */
  disabledAgentModes?: ConversationMode[];

  /**
   * Controlled file attachments for the chat input.
   * When provided, the input uses controlled mode — parent owns state.
   */
  controlledAttachments?: FileAttachment[];

  /**
   * Callback when a file is removed in controlled mode
   */
  onRemoveAttachment?: (id: string) => void;

  /**
   * Callback when files are selected via plus menu or drag-drop in controlled mode
   */
  onFilesSelected?: (files: File[]) => void;

  /**
   * Reference context shown above the input (e.g. dashboard/widget context)
   */
  referenceContext?: ReferenceContext;

  /**
   * Callback when the reference context is removed
   */
  onRemoveReference?: () => void;

  // ============================================================================
  // @ Mention Props
  // ============================================================================

  /**
   * Enable @ mentions feature
   * When enabled, typing '@' in the input will show a mentions overlay
   * @default false
   */
  enableMentions?: boolean;

  /**
   * Available mention items (e.g. dashboards) for the @ overlay
   */
  mentionItems?: MentionItem[];

  /**
   * Loading state for mention items
   */
  isLoadingMentions?: boolean;

  /**
   * Called when a mention is selected from the @ overlay
   */
  onSelectMention?: (item: MentionItem) => void;

  /**
   * Called when the user first types "@" — use to lazy-load mention items
   */
  onMentionsActivated?: () => void;

  // ============================================================================
  // Deep Research Results Props (V2 only)
  // ============================================================================

  /**
   * Research results state from the transform/Pusher hook
   * When present and isCompleted or isStreaming, shows the research results UI
   */
  researchResults?: {
    isStreaming: boolean;
    isCompleted: boolean;
    content: string;
    metadata: ResearchResultsMetadata | null;
    messageId: string | null;
  };

  /**
   * Whether deep research is currently running (for UI state)
   */
  isDeepResearchRunning?: boolean;

  /**
   * Callback when user clicks the DataTablesCard to review source data
   */
  onDataTablesClick?: () => void;

  /**
   * Information for the DataTablesCard (number of tables, records processed, etc.)
   */
  dataTablesInfo?: {
    tableCount: number;
    processedRecords?: number;
    totalRecords?: number;
  };

  /**
   * Optional children — use <Chat.EmptyState> to provide a custom empty state
   * that replaces the default ChatEmptyState when messages is empty.
   * The bottom input is always shown when a Chat.EmptyState child is present.
   */
  children?: React.ReactNode;
}
