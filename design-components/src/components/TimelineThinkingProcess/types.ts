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
  | 'awaiting-approval';

/**
 * Data for approval steps
 */
export interface ApprovalData {
  summary: string;
  objectType: string;
  recordName?: string;
  operation: 'create' | 'update' | 'delete';
  changes?: Array<{
    field: string;
    before?: string | number | boolean | null;
    after: string | number | boolean | null;
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
   * Title displayed at the top (when collapsed, shows step count)
   */
  title?: string;

  /**
   * Whether the thinking block is collapsed (hides the step details)
   */
  isCollapsed?: boolean;

  /**
   * Callback when collapse state changes
   */
  onToggleCollapse?: () => void;

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
}

/**
 * Props for StepIndicator component
 */
export interface StepIndicatorProps {
  status: StepStatus;
}
