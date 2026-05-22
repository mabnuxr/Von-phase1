export interface QueryColumn {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'currency' | 'date' | 'percentage';
  /** When set, render this column's value as a link using row[linkKey] as the URL */
  linkKey?: string;
}

export interface QueryResult {
  id: string;
  name: string;
  description?: string;
  query?: string;
  /** Label for the collapsible query section (e.g. "SQL Query", "Python Code"). Defaults to "SQL Query". */
  queryLabel?: string;
  columns: QueryColumn[];
  rows: Record<string, string | number>[];
  executedAt?: Date;
  duration?: number;
}

export type SentimentType = 'positive' | 'negative' | 'neutral';

export interface CallTranscript {
  id: string;
  title: string;
  date: string;
  duration?: string;
  timeRange?: string;
  participants?: string[];
  sourceUrl?: string;
  meetingUrl?: string;
  accountName?: string;
  opportunityName?: string;
  sentiment?: SentimentType;
  summary?: string;
  relevanceScore?: number;
  recencyScore?: number;
}

export interface EmailTranscript {
  id: string;
  type: 'email';
  subject?: string;
  preview?: string;
  content: string;
  date: string;
  sender?: string;
  recipients?: string[];
  crmObjectType?: string;
  crmObjectId?: string;
  relevanceScore?: number;
  recencyScore?: number;
}

/**
 * Slack search hit — emitted by find_entity_conversations / conversation_search.
 * Two subtypes:
 *  - 'slack_message': a windowed channel chunk (chunkText is the speaker-aware excerpt)
 *  - 'slack_thread': an entire thread surface
 *
 * `timeline` is populated only by fetch_conversation responses (the chronological
 * stitch of parent + neighbors + thread). Search hits leave it undefined and rely
 * on `chunkText` for the inline preview.
 */
export interface SlackTimelineEntry {
  chunkIndex?: number;
  chunkText?: string;
  startTs?: number;
  type?: 'slack_message' | 'slack_thread';
}

export interface SlackTranscript {
  id: string;
  type: 'slack_message' | 'slack_thread';
  channelId: string;
  channelName?: string;
  threadTs?: string;
  /** ISO date string derived from start_ts/start_time */
  date: string;
  /** The matched chunk excerpt (or the joined thread transcript on a thread row) */
  chunkText?: string;
  participants?: string[];
  messageCount?: number;
  hitChunkIndex?: number;
  relevanceScore?: number;
  recencyScore?: number;
  /** Chronologically-ordered stitch from fetch_conversation (slack_content.timeline). */
  timeline?: SlackTimelineEntry[];
}

export type TopLevelTab = 'data' | 'calls';

export interface ArtifactSummary {
  artifact_id: string;
  tool_call_id: string;
  tool_name: string;
  artifact_type: string;
  category?: string;
  size_bytes: number;
  persisted_at: string;
}

export interface ArtifactResponse {
  artifact_id: string;
  tool_call_id: string;
  tool_name: string;
  artifact_type: string;
  content: Record<string, unknown>;
  size_bytes: number;
  persisted_at: string;
}

export interface TabConfig {
  id: string;
  label: string;
  count: number;
}

export interface TransparencyDrawerTabProps {
  config: TabConfig;
  children: React.ReactNode;
}

export interface TransparencyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  activeTab?: string;
  defaultActiveTab?: string;
  onTabChange?: (tabId: string) => void;
  isLoading?: boolean;
}

export interface QueryTabProps {
  query: QueryResult;
  isActive: boolean;
  onClick: () => void;
}

export interface QueryContentProps {
  query: QueryResult;
  onCSVDownloaded?: (stepName: string, rowCount: number) => void;
}

export interface CallsTabContentProps {
  calls: CallTranscript[];
  isLoading?: boolean;
}

export interface DataTabContentProps {
  queries: QueryResult[];
  activeQueryId?: string;
  onQuerySelect?: (queryId: string) => void;
  onCSVDownloaded?: (stepName: string, rowCount: number) => void;
}

export interface TabNavigationProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface DrawerBackdropProps {
  onClose: () => void;
}
