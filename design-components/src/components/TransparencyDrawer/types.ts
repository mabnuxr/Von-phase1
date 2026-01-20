export interface QueryColumn {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'currency' | 'date' | 'percentage';
}

export interface QueryResult {
  id: string;
  name: string;
  description?: string;
  query?: string;
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
  accountName?: string;
  opportunityName?: string;
  sentiment?: SentimentType;
  summary?: string;
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
  icon: React.ReactNode;
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
}

export interface QueryTabProps {
  query: QueryResult;
  isActive: boolean;
  onClick: () => void;
}

export interface QueryContentProps {
  query: QueryResult;
}

export interface CallsTabContentProps {
  calls: CallTranscript[];
}

export interface DataTabContentProps {
  queries: QueryResult[];
  activeQueryId?: string;
  onQuerySelect?: (queryId: string) => void;
}

export interface TabNavigationProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface DrawerBackdropProps {
  onClose: () => void;
}
