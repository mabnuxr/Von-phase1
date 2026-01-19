// ============================================================================
// TransparencyDrawer Types
// ============================================================================

/**
 * Column definition for query result tables
 */
export interface QueryColumn {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'currency' | 'date' | 'percentage';
}

/**
 * Query result with columns and data rows
 */
export interface QueryResult {
  id: string;
  name: string;
  description?: string;
  query?: string;
  columns: QueryColumn[];
  rows: Record<string, string | number>[];
  executedAt?: Date;
  duration?: number; // in ms
}

/**
 * Sentiment type for call recordings
 */
export type SentimentType = 'positive' | 'negative' | 'neutral';

/**
 * Call transcript/recording data
 */
export interface CallTranscript {
  id: string;
  title: string;
  date: string;
  duration?: string;
  timeRange?: string;
  participants?: string[];
  sourceUrl?: string;
  accountName?: string;
  opportunityName?: string;
  sentiment?: SentimentType;
  summary?: string;
}

/**
 * Top-level tab selection
 */
export type TopLevelTab = 'data' | 'calls';

/**
 * Artifact summary for lazy loading (without full content)
 */
export interface ArtifactSummary {
  artifact_id: string;
  tool_call_id: string;
  tool_name: string;
  artifact_type: string;
  size_bytes: number;
  persisted_at: string;
}

/**
 * Full artifact response with content
 */
export interface ArtifactResponse {
  artifact_id: string;
  tool_call_id: string;
  tool_name: string;
  artifact_type: string;
  content: Record<string, unknown>;
  size_bytes: number;
  persisted_at: string;
}

/**
 * Props for the TransparencyDrawer component
 */
export interface TransparencyDrawerProps {
  /**
   * Whether the drawer is open
   */
  isOpen: boolean;

  /**
   * Callback when the drawer should close
   */
  onClose: () => void;

  /**
   * List of query results to display in the Data tab
   * @deprecated Use artifactSummaries for lazy loading instead
   */
  queries?: QueryResult[];

  /**
   * List of call transcripts to display in the Calls tab
   */
  calls?: CallTranscript[];

  /**
   * Title of the drawer
   */
  title?: string;

  /**
   * Artifact summaries for lazy loading (without full content)
   */
  artifactSummaries?: ArtifactSummary[];

  /**
   * Conversation ID for fetching artifact content
   */
  conversationId?: string | null;

  /**
   * Run ID for fetching artifact content
   */
  runId?: string | null;

  /**
   * Whether the artifact list is loading
   */
  isLoading?: boolean;

  /**
   * Callback when a query tab is selected (for lazy loading)
   */
  onQuerySelect?: (queryId: string) => void;
}

/**
 * Props for QueryTab component
 */
export interface QueryTabProps {
  query: QueryResult;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Props for QueryContent component
 */
export interface QueryContentProps {
  query: QueryResult;
}

/**
 * Props for CallsTabContent component
 */
export interface CallsTabContentProps {
  calls: CallTranscript[];
}

/**
 * Tab configuration for navigation
 */
export interface TabConfig {
  id: TopLevelTab;
  label: string;
  icon: React.ReactNode;
  count: number;
}

/**
 * Props for TabNavigation component
 */
export interface TabNavigationProps {
  tabs: TabConfig[];
  activeTab: TopLevelTab;
  onTabChange: (tab: TopLevelTab) => void;
}

/**
 * Props for DrawerBackdrop component
 */
export interface DrawerBackdropProps {
  onClose: () => void;
}
