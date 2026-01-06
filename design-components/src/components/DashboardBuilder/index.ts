// Dashboard Builder Components
export { ThreePaneLayout } from './ThreePaneLayout';
export type { ThreePaneLayoutProps } from './ThreePaneLayout';

export { BuildModeLayout } from './BuildModeLayout';
export type { BuildModeLayoutProps } from './BuildModeLayout';

export { DashboardBuilderDemo } from './DashboardBuilderDemo';
export type { DashboardBuilderDemoProps } from './DashboardBuilderDemo';

export { ModeToggle } from './ModeToggle';
export type { ModeToggleProps } from './ModeToggle';

export { ThinkingProcess } from './ThinkingProcess';
export type { ThinkingProcessProps } from './ThinkingProcess';

export { ProgressTimeline } from './ProgressTimeline';
export type { ProgressTimelineProps } from './ProgressTimeline';

export { DataExplorer } from './DataExplorer';
export type { DataExplorerProps } from './DataExplorer';

export { DashboardCanvas } from './DashboardCanvas';
export type { DashboardCanvasProps } from './DashboardCanvas';

export { ChartWidget } from './ChartWidget';
export type { ChartWidgetProps } from './ChartWidget';

export { TableWidget } from './TableWidget';
export type { TableWidgetProps } from './TableWidget';

export { TableViewer } from './TableViewer';
export type { TableViewerProps } from './TableViewer';

export { DashboardGrid, Widget, WidgetLayout, useDashboardGridLayout } from './DashboardGrid';
export type {
  DashboardGridProps,
  DashboardData,
  UseDashboardGridLayoutParams,
  WidgetProps,
  WidgetLayoutProps,
} from './DashboardGrid';

export { BuildChat } from './BuildChat';
export type { BuildChatProps } from './BuildChat';

// Interactive Prototype
export {
  InteractivePrototype,
  TypingText,
  AmbientGlow,
  AgentProgressBar,
  AnimatedTable,
  AnimatedChart,
  SimulatedInteraction,
  FinalizationOverlay,
  usePrototypeOrchestrator,
} from './InteractivePrototype';
export type {
  InteractivePrototypeProps,
  TypingTextProps,
  AmbientGlowProps,
  AgentProgressBarProps,
  AgentStatus,
  AnimatedTableProps,
  AnimatedChartProps,
  SimulatedInteractionProps,
  InteractionType,
  FinalizationOverlayProps,
  OverlayPhase,
  OrchestratorState,
  PrototypePhase,
} from './InteractivePrototype';

// Types
export type {
  BuildMode,
  BuildPhase,
  ThinkingStep,
  ProgressStep,
  DataColumn,
  DataTable,
  ChartConfig,
  DashboardWidget,
  MetricConfig,
  TableWidgetConfig,
  TextConfig,
  Dashboard,
  DashboardFilter,
  ChatMessage,
  DataViewTab,
  TableOperation,
  DraggableItemType,
  DragItem,
  DropPosition,
  NewWidgetConfig,
} from './types';

// Mock Data (for prototyping)
export {
  accountsAtRiskData,
  engagementTimelineData,
  riskByRegionData,
  arrAtRiskByIndustry,
  churnProbabilityData,
  mockDataTables,
  mockThinkingSteps,
  mockProgressSteps,
  mockDashboardFilters,
  mockDashboard,
  mockChatMessages,
  visualizationPalette,
  tableOperations,
} from './mockData';
