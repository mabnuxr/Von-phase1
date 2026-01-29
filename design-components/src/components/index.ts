// Main barrel export file for all components
//
// Components follow Atomic Design methodology:
// - ATOMS: Basic building blocks with no component dependencies (only theme tokens)
// - MOLECULES: Simple combinations of 2-3 atoms
// - ORGANISMS: Complex components with state management and business logic

// ============================================================================
// ERROR BOUNDARY
// ============================================================================
export { ErrorBoundary } from './ErrorBoundary';

// ============================================================================
// ATOMS
// Basic building blocks with NO dependencies on other components.
// These components only depend on theme tokens and can be used anywhere.
// ============================================================================

// Display Atoms
// -------------
export { Avatar } from './Avatar';
export type { AvatarProps } from './Avatar';

export { Menu } from './Menu';
export type { MenuProps, MenuItem } from './Menu';

export { Banner } from './Banner';
export type { BannerProps, BannerVariant, BannerAction } from './Banner';

export { Toast } from './Toast';
export type { ToastProps, ToastVariant, ToastAction } from './Toast';

// Forms Atoms
// -----------
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export { MultiSelect } from './MultiSelect';
export type { MultiSelectProps, MultiSelectOption } from './MultiSelect';

export { SingleSelect } from './SingleSelect';
export type { SingleSelectProps, SingleSelectOption } from './SingleSelect';

export { RadioButton } from './RadioButton';
export type { RadioButtonProps } from './RadioButton';

// Layout Atoms
// ------------
export { Box } from './Box';
export type { BoxProps } from './Box';

export { Stack } from './Stack';
export type { StackProps } from './Stack';

export { Container } from './Container';
export type { ContainerProps } from './Container';

export { TabPill } from './TabPill';
export type { TabPillProps } from './TabPill';

export { SidePane } from './SidePane';
export type { SidePaneProps } from './SidePane';

// Typography Atoms
// ----------------
export { Text } from './Text';
export type { TextProps } from './Text';

export { Heading } from './Heading';
export type { HeadingProps } from './Heading';

// Chat Atoms
// ----------
export { ChatHeader } from './Chat';
export type { ChatHeaderProps } from './Chat';

export { ChatMessage } from './Chat';
export type { ChatMessageProps } from './Chat';

export { ChatInput } from './Chat';
export type { ChatInputProps } from './Chat';

export { ChatEmptyState } from './Chat/ChatEmptyState';
export type { ChatEmptyStateProps } from './Chat/ChatEmptyState';

export { ChatTypingIndicator } from './Chat/ChatTypingIndicator';

export { ChatMessageSkeleton } from './Chat/ChatMessageSkeleton';
export type { ChatMessageSkeletonProps } from './Chat/ChatMessageSkeleton';

export { ChatSkeleton } from './Chat/ChatSkeleton';
export type { ChatSkeletonProps } from './Chat/ChatSkeleton';

export { ArtifactPane } from './Chat/ArtifactPane';
export type { ArtifactPaneProps, ArtifactData } from './Chat/ArtifactPane';

// Icon Atoms
// ----------
export {
  DatabaseIcon,
  ToolIcon,
  SearchIcon,
  CalculatorIcon,
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
  ClockIcon,
  PlayCircleIcon,
  ChevronDownIcon,
  CopyIcon,
  ArrowDownIcon,
  TrendingUpIcon,
  HashIcon,
  DollarSignIcon,
  BarChartIcon,
  LayersIcon,
  ZapIcon,
  BrainIcon,
  EditIcon,
  ServerIcon,
  GlobeIcon,
} from './Chat/icons';
export type { IconProps } from './Chat/icons';

// ============================================================================
// MOLECULES
// Simple compositions combining 2-3 atoms into reusable UI patterns.
// ============================================================================

// Dropdown Molecule (uses: Menu atom)
export { Dropdown } from './Dropdown';
export type { DropdownProps, DropdownItem } from './Dropdown';

// Chat Molecules
export { ChatBubble } from './ChatBubble';
export type { ChatBubbleProps } from './ChatBubble';

export { DocumentCard } from './DocumentCard';
export type { DocumentCardProps } from './DocumentCard';

export { TabSwitcher } from './TabSwitcher';
export type { TabSwitcherProps, TabSwitcherTab } from './TabSwitcher';

export { IntegrationCard } from './IntegrationCard';
export type { IntegrationCardProps } from './IntegrationCard';

export { ConfirmationModal } from './ConfirmationModal';
export type { ConfirmationModalProps } from './ConfirmationModal';

// ============================================================================
// ORGANISMS
// Complex components with state management, hooks, and business logic.
// These coordinate multiple atoms/molecules to create complete features.
// ============================================================================

// Header Organism (simple page header with logo)
export { Header } from './Header';
export type { HeaderProps } from './Header';

// Chat Organism (uses: ChatHeader + ChatMessage + ChatInput, manages chat state & API)
export { Chat } from './Chat';
export type { ChatProps, Message, FixedPosition, AgentMode, SendMessageOptions } from './Chat';

// ChatInputSelector - Selector component for different input variants
export { ChatInputSelector } from './Chat';
export type { ChatInputSelectorProps } from './Chat';

// Deep Research Chat - specialized chat UI for deep research mode
export { DeepResearchChat, DeepResearchNotificationBar } from './Chat';
export type { DeepResearchChatProps } from './Chat';

// Export AGUI types for external use (from Chat/index.ts, not Chat.tsx)
export type {
  AguiEventWrapper,
  AguiEvent,
  ToolCall,
  ToolResult,
  StepMessage,
  TableData,
  QueryInfo,
  MetricData,
} from './Chat/index';

// Export approval utility functions
export { isApprovalTool, isGoogleCalendarApprovalTool } from './Chat/index';

// Export tool result renderers (for rendering agent tool outputs)
export { ToolResultRenderer } from './Chat/ToolResultRenderer';
export type { ToolResultRendererProps } from './Chat/ToolResultRenderer';

export { CallSearchUnionRenderer } from './Chat/CallSearchUnionRenderer';
export type { CallSearchUnionRendererProps } from './Chat/CallSearchUnionRenderer';

export { ConversationSearchRenderer } from './Chat/ConversationSearchRenderer';
export type { ConversationSearchRendererProps } from './Chat/ConversationSearchRenderer';

// TopBar Organism (uses: TabPill + Avatar, manages tab state)
export { TopBar } from './TopBar';
export type { TopBarProps, Tab } from './TopBar';

// ChatSidebar Organism (uses: Search + List, manages chat history)
export { ChatSidebar } from './ChatSidebar';
export type { ChatSidebarProps, ChatItem } from './ChatSidebar';

// ChatSidebarV2 Organism (uses: Folders + Search + List, supports folder organization)
export { ChatSidebar as ChatSidebarV2 } from './ChatSidebarV2';
export type {
  ChatSidebarProps as ChatSidebarV2Props,
  SidebarItem,
  Folder,
  ItemType,
  FolderItemsMap,
  FolderLoadingMap,
} from './ChatSidebarV2';

// ChatSidebarV3 Organism (extended version for prototyping)
export { ChatSidebarV3 } from './ChatSidebarV3';
export type { ChatSidebarV3Props } from './ChatSidebarV3';

// ChatConversation Organism (uses: ChatBubble + TabSwitcher + DocumentCard + ChatInput)
export { ChatConversation } from './ChatConversation';
export type { ChatConversationProps, ConversationMessage } from './ChatConversation';

// ============================================================================
// COMMANDS (Self-contained slash commands feature)
// ============================================================================
export {
  CommandsList,
  CommandDrawer,
  ManageCommandsDrawer,
  ChatInputWithCommands,
  useCommands,
  DATA_SOURCE_LABELS,
  ACTION_TYPE_LABELS,
  CATEGORY_OPTIONS,
  DEFAULT_COMMANDS,
  getCommands,
  saveCommands,
  addCommand,
  updateCommand,
  deleteCommand,
  getCommandById,
  searchCommands,
  getCommandsByCategory,
  resetToDefaults,
} from './Commands';
export type {
  Command,
  CommandCategory,
  DataSource,
  ActionType,
  CommandsState,
  ChatInputWithCommandsProps,
} from './Commands';

// ============================================================================
// DASHBOARD CANVAS (Thesys-powered dashboard generation)
// ============================================================================
export { DashboardCanvas } from './DashboardCanvas';
export type { DashboardCanvasProps } from './DashboardCanvas';

// ============================================================================
// THINKING PROCESS V2 (Timeline-based thinking visualization)
// ============================================================================
export { TimelineThinkingProcess } from './TimelineThinkingProcess';
export type {
  TimelineThinkingProcessProps,
  TimelineStep,
  StepType,
  StepStatus,
  SourceType,
  EventCategory,
  ApprovalData,
  QueryResult,
} from './TimelineThinkingProcess';

// ============================================================================
// TRANSPARENCY DRAWER (Data sources and call recordings)
// ============================================================================
export {
  TransparencyDrawer,
  DataTabContent,
  DataTabShimmer,
  CallsTabContent,
  CallsTabShimmer,
  CallsTabError,
  DataTablesDrawer,
  IQDataTabContent,
} from './TransparencyDrawer';
export type {
  TransparencyDrawerProps,
  TransparencyDrawerTabProps,
  TabConfig as TransparencyTabConfig,
  QueryResult as TransparencyQueryResult,
  QueryColumn,
  CallTranscript,
  SentimentType,
  TopLevelTab,
  DataTabContentProps,
  CallsTabContentProps,
  DataTablesDrawerProps,
  DataTableArtifact,
  IQQueryResult,
  IQDataTabContentProps,
} from './TransparencyDrawer';

// ============================================================================
// TIPTAP EDITOR (Standalone rich text editor)
// ============================================================================
export { TiptapEditor, EditorToolbar } from './TiptapEditor';
export type { TiptapEditorProps, EditorToolbarProps } from './TiptapEditor';

// ============================================================================
// REPORT TABLE (TanStack Table for data reports)
// ============================================================================
export { ReportTable } from './ReportTable';
export type { ReportTableProps, ReportColumn, ColumnType, AIReasoningData } from './ReportTable';

// ============================================================================
// ARTIFACT VIEWER (Single artifact display drawer)
// ============================================================================
export { SingleArtifactDrawer, ArtifactContentViewer, useArtifactContent } from './ArtifactViewer';
export type {
  SingleArtifactDrawerProps,
  DataViewProps as ArtifactDataViewProps,
  CallsViewProps as ArtifactCallsViewProps,
  MemoryViewProps as ArtifactMemoryViewProps,
  IQViewProps as ArtifactIQViewProps,
  ArtifactViewMode,
  ArtifactContentViewerProps,
  ArtifactContentData,
  UseArtifactContentReturn,
} from './ArtifactViewer';

// ============================================================================
// DEEP RESEARCH (Research results streaming components)
// ============================================================================
export {
  DeepResearchResults,
  DeepResearchThinkingIndicator,
  DataTablesCard,
  DeepResearchApprovalCard,
  DeepResearchDataTablesDrawer,
} from './Chat';
export type {
  DeepResearchNotificationBarProps,
  DataTablesCardProps,
  DeepResearchApprovalCardProps,
  DeepResearchAction,
  DataSourceInfo,
  DeepResearchDataTablesDrawerProps,
  DataTableConfig,
} from './Chat';
export type {
  // Event types
  ResearchResultsMetadata,
  ResearchResultsStartEvent,
  ResearchResultsContentEvent,
  ResearchResultsEndEvent,
  ResearchResultsEvent,
  // Metadata types
  ResearchDataSource,
  ResearchApprovalAction,
  // State types
  ResearchResultsStatus,
  ResearchResultsState,
  // Component props
  DeepResearchResultsProps,
  DeepResearchThinkingIndicatorProps,
  // Hook types
  UseDeepResearchStreamingReturn,
  UseDeepResearchStreamingConfig,
} from './Chat';
export {
  // Type guards
  isResearchResultsStartEvent,
  isResearchResultsContentEvent,
  isResearchResultsEndEvent,
  isResearchResultsEvent,
  // Initial state
  initialResearchResultsState,
} from './Chat';

// ============================================================================
// POPUPS (Modals and Popovers)
// ============================================================================
export { ExpensiveOperationModal } from './popups';
export type { ExpensiveOperationModalProps } from './popups';

// ============================================================================
// DATA TABLES (Jan17Demo - kept for reference, use DeepResearchDataTablesDrawer for production)
// ============================================================================
// Note: DataTableConfig is now exported from Chat/DeepResearch
