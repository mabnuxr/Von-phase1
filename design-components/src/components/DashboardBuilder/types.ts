// Dashboard Builder Types

export type BuildMode = 'ask' | 'build';

export type BuildPhase =
  | 'idle'
  | 'thinking'
  | 'gathering-data'
  | 'creating-tables'
  | 'building-dashboard'
  | 'complete';

export interface ThinkingStep {
  id: string;
  text: string;
  status: 'pending' | 'in-progress' | 'complete';
}

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'complete';
}

export interface DataColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'currency' | 'percentage' | 'boolean' | 'date';
  isAIGenerated?: boolean;
  source?: 'salesforce' | 'hubspot' | 'gong' | 'von-ai' | 'custom';
}

export interface DataTable {
  id: string;
  name: string;
  description?: string;
  columns: DataColumn[];
  data: Record<string, unknown>[];
  source: 'salesforce' | 'hubspot' | 'gong' | 'von-ai' | 'custom';
  rowCount: number;
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'column' | 'donut' | 'funnel' | 'scatter' | 'heatmap';
  title: string;
  subtitle?: string;
  dataTableId: string;
  xAxis?: string;
  yAxis?: string;
  series?: string[];
  options?: Record<string, unknown>;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text';
  title: string;
  config: ChartConfig | MetricConfig | TableWidgetConfig | TextConfig;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface MetricConfig {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  format?: 'number' | 'currency' | 'percentage';
}

export interface TableWidgetConfig {
  id: string;
  dataTableId: string;
  visibleColumns?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TextConfig {
  id: string;
  content: string;
  variant?: 'heading' | 'subheading' | 'body' | 'caption';
}

export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  widgets: DashboardWidget[];
  filters?: DashboardFilter[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardFilter {
  id: string;
  label: string;
  type: 'select' | 'multi-select' | 'date-range' | 'search';
  field: string;
  options?: { value: string; label: string }[];
  value?: unknown;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  thinkingSteps?: ThinkingStep[];
  isThinkingCollapsed?: boolean;
}

export type DataViewTab = 'data' | 'dashboard';

export interface TableOperation {
  type: 'split-column' | 'merge-tables' | 'filter' | 'sort' | 'rename-column' | 'add-column';
  label: string;
  icon: string;
}

// Drag and Drop Types
export type DraggableItemType = 'visualization' | 'table';

export interface DragItem {
  type: DraggableItemType;
  visualizationType?: ChartConfig['type'] | 'metric' | 'table';
  tableId?: string;
  tableName?: string;
}

export interface DropPosition {
  x: number;
  y: number;
}

export interface NewWidgetConfig {
  type: 'chart' | 'metric' | 'table';
  chartType?: ChartConfig['type'];
  dataTableId?: string;
}
