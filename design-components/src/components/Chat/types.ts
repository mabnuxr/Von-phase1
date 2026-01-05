/**
 * Type definitions for Chat component with backend integration
 */

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
  status?: 'created' | 'streaming' | 'completed' | 'failed' | 'timeout';
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
   * Whether the response was stopped by user
   */
  stoppedByUser?: boolean;
  /**
   * Whether this is the latest message in the conversation
   * Used to control visibility of approval buttons
   */
  isLatestMessage?: boolean;
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

export interface PusherConfig {
  key: string;
  cluster: string;
  authEndpoint?: string;
  tenantId?: string;
  userId?: string;
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
  | RunFinishedEvent;

// Individual event types
export interface RunStartedEvent {
  type: 'RUN_STARTED';
  thread_id: string;
  run_id: string;
  message_id?: string; // MongoDB ObjectId of the message (for API calls like resume)
}

export interface StepStartedEvent {
  type: 'STEP_STARTED';
  step_name: string;
}

export interface TextMessageStartEvent {
  type: 'TEXT_MESSAGE_START';
  message_id: string;
  role: 'assistant';
}

export interface TextMessageContentEvent {
  type: 'TEXT_MESSAGE_CONTENT';
  message_id: string;
  delta: string;
}

export interface TextMessageEndEvent {
  type: 'TEXT_MESSAGE_END';
  message_id: string;
}

export interface ToolCallStartEvent {
  type: 'TOOL_CALL_START';
  tool_call_id: string;
  tool_call_name: string;
  parent_message_id: string;
}

export interface ToolCallArgsEvent {
  type: 'TOOL_CALL_ARGS';
  tool_call_id: string;
  delta: string;
}

export interface ToolCallEndEvent {
  type: 'TOOL_CALL_END';
  tool_call_id: string;
}

export interface ToolCallResultEvent {
  type: 'TOOL_CALL_RESULT';
  message_id: string;
  tool_call_id: string;
  content: string;
  role: 'tool';
}

export interface StepFinishedEvent {
  type: 'STEP_FINISHED';
  step_name: string;
}

export interface RunFinishedEvent {
  type: 'RUN_FINISHED';
  thread_id: string;
  run_id: string;
  result: {
    status: 'completed' | 'failed';
    stopped_by_user?: boolean;
  };
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
    | 'memory';
  table?: TableData;
  queries?: QueryInfo[];
  metrics?: MetricData[];
  values?: ValueData[];
  schema?: SchemaData;
  tables?: string[];
  statistics?: StatisticsData;
  memory?: MemoryResultData;
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
  return toolName === 'request_salesforce_approval';
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
   * Pusher configuration for real-time messaging
   */
  pusherConfig?: PusherConfig;

  /**
   * Messages to display in the chat (for controlled component)
   * @default []
   */
  messages?: Message[];

  /**
   * Callback when a new message is sent
   * Includes optional file attachments when enableFileUpload is true
   */
  onSendMessage?: (message: string, attachments?: MessageFileAttachment[]) => void;

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
   * Whether to enable real-time Pusher integration
   * @default false
   */
  enableRealtime?: boolean;

  /**
   * Active conversation ID (for multi-conversation support)
   */
  conversationId?: string;

  /**
   * Ref for infinite scroll trigger (load older messages)
   * Place this at the top of the messages container
   */
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;

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
   * Hook for fetching artifact data
   * Should be provided by the parent component (e.g., from app layer)
   * Example: useArtifact from @revenue-os/app
   */
  useArtifactHook?: (
    conversationId: string | null,
    messageId: string | null,
    artifactId: string | null
  ) => {
    data?: {
      artifact_id: string;
      tool_call_id: string;
      tool_name: string;
      artifact_type: string;
      content: Record<string, unknown>;
      size_bytes: number;
      persisted_at: string;
    };
    isLoading: boolean;
    error?: Error | null;
  };

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
   * Enable slash commands feature
   * When enabled, typing '/' in the input will show a commands popover
   * Commands are stored in localStorage and can be managed through UI
   * @default false
   */
  enableCommands?: boolean;

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
   * Enable deep links for Salesforce URLs in artifact pane DataTable
   * When enabled, URLs are rendered as clickable links
   * @default false
   */
  enableDeepLinks?: boolean;
}
