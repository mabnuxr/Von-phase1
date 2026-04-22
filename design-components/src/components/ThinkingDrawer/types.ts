// ============================================================================
// ThinkingDrawer Types
// ============================================================================

/**
 * Step status type for thinking drawer steps
 */
export type StepStatus =
  | 'pending'
  | 'in-progress'
  | 'complete'
  | 'error'
  | 'rejected'
  | 'expired'
  | 'skipped';

/**
 * Detailed information about a thinking step
 */
export interface ThinkingStepDetail {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  /**
   * Optional query ID that links to a query in the TransparencyDrawer
   */
  queryId?: string;
  /**
   * Optional timestamp for when this step completed
   */
  completedAt?: Date;
  /**
   * Optional code content for code execution steps
   */
  code?: string;
  /**
   * Optional artifact name
   */
  artifactName?: string;
}

/**
 * Selected step from TimelineThinkingProcess (includes additional fields)
 */
export interface SelectedStep {
  id: string;
  text: string;
  status: string;
  type?: string;
  source?: string;
  description?: string;
  code?: string;
  queryId?: string;
  artifactName?: string;
}

/**
 * Query result interface (minimal - for independence from TransparencyDrawer)
 */
export interface QueryResult {
  id: string;
  name: string;
}

/**
 * Props for the ThinkingDrawer component
 */
export interface ThinkingDrawerProps {
  /**
   * Whether the drawer is open
   */
  isOpen: boolean;

  /**
   * Callback when the drawer should close
   */
  onClose: () => void;

  /**
   * List of thinking steps with details
   */
  steps: ThinkingStepDetail[];

  /**
   * Title for the drawer
   */
  title?: string;

  /**
   * Callback when a query link is clicked
   */
  onQueryClick?: (queryId: string) => void;

  /**
   * Available queries to show the "query executed" link
   */
  queries?: QueryResult[];

  /**
   * Typing speed in milliseconds per character
   */
  typingSpeed?: number;

  /**
   * Selected step to show expanded details (code, artifact, etc.)
   */
  selectedStep?: SelectedStep | null;
}
