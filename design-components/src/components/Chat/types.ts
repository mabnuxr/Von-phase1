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

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
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
  type: 'table' | 'query' | 'metrics' | 'values' | 'json' | 'schema' | 'table_list' | 'statistics';
  table?: TableData;
  queries?: QueryInfo[];
  metrics?: MetricData[];
  values?: ValueData[];
  schema?: SchemaData;
  tables?: string[];
  statistics?: StatisticsData;
  error?: string;
}

export interface TableData {
  columns: string[];
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
   */
  onSendMessage?: (message: string) => void;

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
   * Callback when a message is received via Pusher (for controlled mode)
   * Allows parent component to handle message updates
   */
  onPusherMessage?: (message: Message) => void;

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
}
