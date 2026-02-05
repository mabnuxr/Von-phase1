// ============================================================================
// TimelineThinkingProcess Types
// ============================================================================

/**
 * Type of step in the thinking process
 */
export type StepType = 'reasoning' | 'tool_call' | 'code_execution' | 'output' | 'approval';

/**
 * Source type for tool calls
 */
export type SourceType = 'salesforce' | 'gong' | 'email' | 'voniq' | 'calendar' | 'generic';

/**
 * event category
 */
export type EventCategory = 'e2b' | 'sql' | 'rag' | 'soql';

/**
 * Status of a step in the timeline
 */
export type StepStatus =
  | 'pending'
  | 'in-progress'
  | 'complete'
  | 'warning'
  | 'error'
  | 'awaiting-approval'
  | 'rejected';

/**
 * Single operation in a bulk approval request
 */
export interface BulkOperation {
  operation: 'create' | 'update' | 'delete';
  sobject_type: string;
  record_name: string;
  record_id?: string;
  fields?: Record<string, string | number | boolean | null>;
  changes?: Array<{
    field: string;
    before?: string | number | boolean | null;
    after: string | number | boolean | null;
  }>;
  status?: 'pending' | 'updating' | 'success' | 'rejected';
}

/**
 * Data for approval steps
 */
/**
 * Field type for approval changes - affects rendering
 */
export type ApprovalFieldType =
  | 'text'
  | 'long_text'
  | 'number'
  | 'currency'
  | 'date'
  | 'picklist'
  | 'multi_picklist'
  | 'boolean';

/**
 * Single record change for bulk approvals
 */
export interface BulkApprovalRecord {
  /** Unique ID for this record */
  recordId: string;
  /** Record name (e.g., deal name) */
  recordName: string;
  /** URL to the record (e.g., Salesforce record URL, Google Calendar event URL) */
  recordUrl?: string;
  /** Changes for this record */
  changes: Array<{
    field: string;
    before?: string | number | boolean | null;
    after: string | number | boolean | null;
    fieldType?: ApprovalFieldType;
  }>;
}

export interface ApprovalData {
  /** The actual tool_call_id from the backend - used for approval/rejection API calls */
  toolCallId: string;
  summary: string;
  objectType: string;
  recordName?: string;
  recordId?: string;
  recordUrl?: string;
  operation: 'create' | 'update' | 'delete';
  changes?: Array<{
    field: string;
    before?: string | number | boolean | null;
    after: string | number | boolean | null;
    /** Field type - affects how the value is rendered */
    fieldType?: ApprovalFieldType;
  }>;
  /** Fields for CREATE operations (initial values without before/after) */
  fields?: Record<string, string | number | boolean | null>;
  /** The type of approval - salesforce, calendar, bulk, deep_research, generic, etc. */
  approvalType?: 'salesforce' | 'calendar' | 'bulk' | 'deep_research' | 'generic';
  /** Number of records for bulk operations */
  recordCount?: number;
  /** Multiple records for bulk approvals */
  bulkRecords?: BulkApprovalRecord[];
  /** Deep research specific fields */
  researchQuery?: string;
  estimatedTime?: string;
  sampleContent?: string;
  dataSources?: Array<{
    name: string;
    record_count: number;
    description?: string;
  }>;
}

/**
 * A single step in the timeline
 */
export interface TimelineStep {
  id: string;
  text: string;
  status: StepStatus;
  /**
   * Type of step: reasoning, tool_call, code_execution, output, approval
   */
  type?: StepType;
  /**
   * Source type for tool calls: salesforce, gong, email, voniq, calendar
   */
  source?: SourceType;
  /**
   * Detailed description paragraph for the thinking process
   */
  description?: string;
  /**
   * Optional code content for code execution steps
   */
  code?: string;
  /**
   * Optional query ID that links to a query in the TransparencyDrawer
   */
  queryId?: string;
  /**
   * Artifact metadata for clickable artifact links
   * Display name is derived from tool_name (e.g., "execute_sql_query results")
   */
  artifact?: {
    artifact_id: string;
    run_id: string;
    tool_name: string;
    artifact_type: string;
  };
  /**
   * Sub-steps for grouped operations
   */
  subSteps?: Array<{
    id: string;
    text: string;
    status: StepStatus;
  }>;
  /**
   * Approval data for approval steps
   */
  approval?: ApprovalData;
  /**
   * Rejection reason when status is 'rejected' (user-provided explanation)
   */
  rejectionReason?: string;
  /**
   * Error message when status is 'error' (system failure message)
   */
  errorMessage?: string;
  /**
   * Event category
   */
  category?: EventCategory;
  /**
   * Whether this step is the final response (shown below timeline, not in expandable area)
   */
  isFinalResponse?: boolean;
}

/**
 * Query result interface (minimal - for independence)
 */
export interface QueryResult {
  id: string;
  name: string;
}

/**
 * Props for the TimelineThinkingProcess component
 */
export interface TimelineThinkingProcessProps {
  /**
   * List of thinking steps
   */
  steps: TimelineStep[];

  /**
   * Whether the thinking is still in progress
   */
  isThinking?: boolean;

  /**
   * Whether content is actively being streamed (new tokens arriving)
   * Used to differentiate between active streaming and waiting states:
   * - isThinking=true, isStreaming=true → Only show spinner icon (content arriving)
   * - isThinking=true, isStreaming=false → Show spinner with engaging messages (waiting)
   */
  isStreaming?: boolean;

  /**
   * When true, automatically collapses the thinking process.
   * Used to collapse the timeline when the final response starts streaming.
   */
  autoCollapse?: boolean;

  /**
   * When true, the thinking process starts in collapsed state.
   * Used when a response already exists on page refresh.
   */
  initiallyCollapsed?: boolean;

  /**
   * Elapsed time in seconds (for display)
   */
  elapsedTime?: number;

  /**
   * Callback when a query link is clicked in the thinking drawer
   */
  onQueryClick?: (queryId: string) => void;

  /**
   * Available queries for the thinking drawer links
   */
  queries?: QueryResult[];

  /**
   * Title displayed in the header (e.g., "Thinking", "Deep Research")
   */
  title?: string;

  /**
   * Callback when a step is expanded to show full details
   */
  onExpandStep?: (step: TimelineStep) => void;

  /**
   * Callback when an approval is approved
   */
  onApprove?: (stepId: string) => void;

  /**
   * Callback when an approval is rejected
   */
  onReject?: (stepId: string) => void;

  /**
   * Callback when an artifact is clicked in a step
   * Opens the transparency drawer with the artifact data
   */
  onArtifactClick?: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;

  /**
   * Bulk approval handlers - for approving/rejecting individual records
   */
  onApproveRecord?: (recordId: string) => void;
  onRejectRecord?: (recordId: string) => void;
  onApproveAll?: () => void;
  onRejectAll?: () => void;

  /**
   * Set of approved/rejected record IDs for bulk approval UI state
   */
  approvedRecordIds?: Set<string>;
  rejectedRecordIds?: Set<string>;

  /**
   * Salesforce instance URL for building deep links when recordUrl is not provided
   */
  salesforceInstanceUrl?: string;
}

/**
 * Props for StepRow component
 */
export interface StepRowProps {
  step: TimelineStep;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand?: () => void;
  isLast: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onArtifactClick?: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;
  /** Whether this step was locally approved (optimistic UI) */
  isLocallyApproved?: boolean;
  /** Whether this step was locally rejected (optimistic UI) */
  isLocallyRejected?: boolean;
  /** Whether approval card should be expanded by default (for bulk scenarios) */
  defaultApprovalExpanded?: boolean;
  /** Bulk approval handlers */
  onApproveRecord?: (recordId: string) => void;
  onRejectRecord?: (recordId: string) => void;
  onApproveAll?: () => void;
  onRejectAll?: () => void;
  /** Set of approved/rejected record IDs for bulk approval */
  approvedRecordIds?: Set<string>;
  rejectedRecordIds?: Set<string>;
  /** Salesforce instance URL for building deep links when recordUrl is not provided */
  salesforceInstanceUrl?: string;
}

/**
 * Props for CollapsedStepRow component
 */
export interface CollapsedStepRowProps {
  step: TimelineStep;
  onClick: () => void;
}

/**
 * Props for CompactApprovalCard component
 */
export interface CompactApprovalCardProps {
  approval: ApprovalData;
  onApprove: () => void;
  onReject: () => void;
  isApproved?: boolean;
  isRejected?: boolean;
  /** Whether the card should be expanded by default (defaults to true) */
  defaultExpanded?: boolean;
  /** Whether to hide individual approve/reject buttons (used in bulk approval context) */
  hideActions?: boolean;
}

/**
 * Props for StepIndicator component
 */
export interface StepIndicatorProps {
  status: StepStatus;
  /** Whether the step is expanded (for complete status with expandable content) */
  isExpanded?: boolean;
  /** Callback to toggle expand/collapse (for complete status with expandable content) */
  onToggle?: () => void;
  /** Whether the step has expandable content */
  hasExpandableContent?: boolean;
}
