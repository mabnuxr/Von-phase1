/**
 * Deep Research Streaming Types
 *
 * Event types and state interfaces for the Deep Research streaming workflow.
 * These types follow the AGUI event pattern used throughout the codebase.
 *
 * @see Documentation: Section 10 - Research Results Streaming
 */

// ============================================================================
// Research Results Event Types
// ============================================================================

/**
 * Data source information for deep research
 */
export interface ResearchDataSource {
  /** Name of the data source (e.g., "Salesforce Opportunities") */
  name: string;
  /** Number of records in this source */
  record_count: number;
  /** Description of what data will be analyzed */
  description?: string;
}

/**
 * Approval action configuration for deep research
 */
export interface ResearchApprovalAction {
  /** Button label */
  label: string;
  /** Whether the action is enabled */
  enabled?: boolean;
}

/**
 * Metadata about the research execution
 * Included in RESEARCH_RESULTS_START event
 */
export interface ResearchResultsMetadata {
  /** Research plan ID */
  plan_id?: string;
  /** Research plan name for display */
  plan_name?: string;
  /** Unique execution ID */
  execution_id?: string;
  /** Total nodes executed in the research plan */
  total_nodes?: number;
  /** Execution status */
  status?: 'completed' | 'partial_failure';

  // ============================================================================
  // Approval Flow Configuration
  // ============================================================================

  /**
   * Whether this research results requires user approval to proceed with full analysis
   * When true, show approval UI after results complete
   * @default true for sample analysis results
   */
  requires_approval?: boolean;

  /**
   * The research query/question being investigated
   */
  research_query?: string;

  /**
   * Estimated time for full analysis (e.g., "10-15 minutes")
   */
  estimated_time?: string;

  /**
   * Total record count across all data sources
   */
  total_records?: number;

  /**
   * Data sources that will be analyzed in full research
   */
  data_sources?: ResearchDataSource[];

  /**
   * Run ID for the approval API call (to resume the workflow)
   */
  run_id?: string;

  /**
   * Primary action configuration (default: "Run Full Analysis")
   */
  primary_action?: ResearchApprovalAction;

  /**
   * Secondary action configuration (default: "Skip")
   */
  secondary_action?: ResearchApprovalAction;

  /** Extensible for future metadata */
  [key: string]: unknown;
}

/**
 * RESEARCH_RESULTS_START event
 * Signals the beginning of a research results block
 */
export interface ResearchResultsStartEvent {
  type: 'RESEARCH_RESULTS_START';
  /** Unique message ID for this research results content */
  message_id: string;
  /** Optional metadata about the research execution */
  metadata?: ResearchResultsMetadata;
}

/**
 * RESEARCH_RESULTS_CONTENT event
 * Streams research results content in chunks
 */
export interface ResearchResultsContentEvent {
  type: 'RESEARCH_RESULTS_CONTENT';
  /** Same message_id as RESEARCH_RESULTS_START */
  message_id: string;
  /** Incremental content (for streaming) */
  delta: string;
  /** Full accumulated content so far */
  snapshot: string;
}

/**
 * RESEARCH_RESULTS_END event
 * Signals the end of a research results block
 */
export interface ResearchResultsEndEvent {
  type: 'RESEARCH_RESULTS_END';
  /** Same message_id as RESEARCH_RESULTS_START */
  message_id: string;
  /** Total character count of results content */
  total_length: number;
  /** Optional MD5/SHA hash for integrity verification */
  checksum?: string;
}

/**
 * Union type of all research results events
 */
export type ResearchResultsEvent =
  | ResearchResultsStartEvent
  | ResearchResultsContentEvent
  | ResearchResultsEndEvent;

// ============================================================================
// Research Results State
// ============================================================================

/**
 * Streaming status for research results
 */
export type ResearchResultsStatus = 'idle' | 'streaming' | 'completed' | 'error';

/**
 * State shape for research results streaming
 * Used by the useDeepResearchStreaming hook
 */
export interface ResearchResultsState {
  /** Current streaming status */
  status: ResearchResultsStatus;
  /** Message ID for the current research results */
  messageId: string | null;
  /** Execution metadata from RESEARCH_RESULTS_START */
  metadata: ResearchResultsMetadata | null;
  /** Accumulated content (snapshot from latest CONTENT event) */
  content: string;
  /** Total expected length (from END event) */
  totalLength: number | null;
  /** Checksum for verification (from END event) */
  checksum: string | null;
  /** Error message if status is 'error' */
  error: string | null;
  /** Timestamp when streaming started */
  startedAt: number | null;
  /** Timestamp when streaming completed */
  completedAt: number | null;
}

/**
 * Initial state for research results
 */
export const initialResearchResultsState: ResearchResultsState = {
  status: 'idle',
  messageId: null,
  metadata: null,
  content: '',
  totalLength: null,
  checksum: null,
  error: null,
  startedAt: null,
  completedAt: null,
};

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for the DeepResearchResults component
 */
export interface DeepResearchResultsProps {
  /** Research results state from the hook */
  state: ResearchResultsState;
  /** Title to display (defaults to plan_name from metadata) */
  title?: string;
  /** Whether to show the expand button */
  showExpand?: boolean;
  /** Whether to show the footer actions (copy, download, thumbs, sources) inside the card */
  showFooterActions?: boolean;
  /** Callback when expand is clicked */
  onExpand?: () => void;
  /** Callback when "Build Dashboard" is clicked */
  onBuildDashboard?: () => void;
  /** Callback when "Download PDF" is clicked */
  onDownload?: () => void;
  /** Callback for thumbs up feedback */
  onThumbsUp?: () => void;
  /** Callback for thumbs down feedback */
  onThumbsDown?: () => void;
  /** Callback when "Sources" is clicked */
  onSourcesClick?: () => void;
  /** Custom className for the container */
  className?: string;
}

/**
 * Props for the DeepResearchThinkingIndicator component
 * Shows a thinking/analyzing indicator during research
 */
export interface DeepResearchThinkingIndicatorProps {
  /** Whether research is in progress */
  isThinking: boolean;
  /** Elapsed time in seconds */
  elapsedTime?: number;
  /** Current thinking step text */
  currentStep?: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Estimated time remaining */
  estimatedTimeRemaining?: string;
  /** Custom className */
  className?: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useDeepResearchStreaming hook
 */
export interface UseDeepResearchStreamingReturn {
  /** Current state of research results streaming */
  state: ResearchResultsState;
  /** Whether research is currently streaming */
  isStreaming: boolean;
  /** Whether research has completed */
  isCompleted: boolean;
  /** Reset state to initial values */
  reset: () => void;
}

/**
 * Configuration for useDeepResearchStreaming hook
 */
export interface UseDeepResearchStreamingConfig {
  /** Conversation ID to listen for events */
  conversationId: string | null;
  /** Tenant ID for Pusher channel */
  tenantId: string | undefined;
  /** User ID for Pusher channel */
  userId: string | undefined;
  /** Whether the hook is enabled */
  enabled?: boolean;
  /** Callback when research starts */
  onStart?: (metadata: ResearchResultsMetadata | null) => void;
  /** Callback on each content chunk */
  onContent?: (delta: string, snapshot: string) => void;
  /** Callback when research completes */
  onComplete?: (content: string, totalLength: number) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for ResearchResultsStartEvent
 */
export function isResearchResultsStartEvent(event: unknown): event is ResearchResultsStartEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    (event as ResearchResultsStartEvent).type === 'RESEARCH_RESULTS_START'
  );
}

/**
 * Type guard for ResearchResultsContentEvent
 */
export function isResearchResultsContentEvent(
  event: unknown
): event is ResearchResultsContentEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    (event as ResearchResultsContentEvent).type === 'RESEARCH_RESULTS_CONTENT'
  );
}

/**
 * Type guard for ResearchResultsEndEvent
 */
export function isResearchResultsEndEvent(event: unknown): event is ResearchResultsEndEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    (event as ResearchResultsEndEvent).type === 'RESEARCH_RESULTS_END'
  );
}

/**
 * Type guard for any ResearchResultsEvent
 */
export function isResearchResultsEvent(event: unknown): event is ResearchResultsEvent {
  return (
    isResearchResultsStartEvent(event) ||
    isResearchResultsContentEvent(event) ||
    isResearchResultsEndEvent(event)
  );
}
