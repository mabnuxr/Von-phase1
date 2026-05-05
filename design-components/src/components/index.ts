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
export { Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

export { VonIcon } from './VonIcon';
export type { VonIconProps, VonIconVariant, VonIconShape } from './VonIcon';

export { TruncateWithText } from './TruncateWithText/TruncateWithText';
export type { TruncateWithTextProps } from './TruncateWithText/TruncateWithText';

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

export { SingleSelect } from './SingleSelect';
export type { SingleSelectProps, SingleSelectOption } from './SingleSelect';

export { MultiSelect } from './MultiSelect';
export type { MultiSelectProps, MultiSelectOption } from './MultiSelect';

export { RadioButton } from './RadioButton';
export type { RadioButtonProps } from './RadioButton';

// Layout Atoms
// ------------
export { TabPill } from './TabPill';
export type { TabPillProps } from './TabPill';

export { SidePane } from './SidePane';
export type { SidePaneProps } from './SidePane';

export { ResizableLayout, usePanelResize } from './layouts';
export type {
  ResizableLayoutProps,
  ResizableSlotProps,
  PanelConstraint,
  UsePanelResizeOptions,
  ResizableHandleProps,
  UsePanelResizeReturn,
} from './layouts';

// Typography Atoms
// ----------------
export { Text } from './Text';
export type { TextProps } from './Text';

// File Attachment Types & Components
export type { FileAttachment, FileCategory } from './Chat/FileAttachment';
export { FilePreviewModal } from './Chat/FileAttachment';
export type { FilePreviewModalProps } from './Chat/FileAttachment';
export {
  getFileInfo,
  generateFileId,
  FILE_SIZE_LIMIT_MB,
  FILE_SIZE_LIMIT_BYTES,
  MAX_FILES,
  AGGREGATE_SIZE_LIMIT_MB,
  AGGREGATE_SIZE_LIMIT_BYTES,
  SUPPORTED_FILE_TYPES,
} from './Chat/FileAttachment';
export { FileErrorToast } from './Chat/FileAttachment';
export type { FileErrorToastProps } from './Chat/FileAttachment';

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

export { ScrollToBottomButton } from './Chat';

export { ChatMessageSkeleton } from './Chat/ChatMessageSkeleton';
export type { ChatMessageSkeletonProps } from './Chat/ChatMessageSkeleton';

export { ChatSkeleton } from './Chat/ChatSkeleton';
export type { ChatSkeletonProps } from './Chat/ChatSkeleton';

export { ArtifactPane } from './Chat/ArtifactPane';
export type { ArtifactPaneProps, ArtifactData } from './Chat/ArtifactPane';

export {
  FileArtifactCard,
  DashboardArtifactCard,
  GmailDraftCard,
  EmailComposer,
  ArtifactCardSkeleton,
} from './Chat';
export type {
  FileArtifactCardProps,
  DashboardArtifactCardProps,
  GmailDraftCardProps,
  EmailComposerProps,
  EmailData,
  FileArtifact,
  ArtifactType,
  EmailDraftArtifact,
} from './Chat';

export { ArtifactViewerPanel } from './Chat';
export type { ArtifactViewerPanelProps } from './Chat';

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

// Form-level Select (single-value dropdown for forms)
export { Select } from './forms/dropdown';
export type { SelectProps, SelectOption } from './forms/dropdown';

// Multi-select dropdown
export { MultiSelectDropdown } from './forms/dropdown';
export type { MultiSelectDropdownProps, MultiSelectDropdownOption } from './forms/dropdown';

// Chat Molecules
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

// Chat Organism (uses: ChatHeader + ChatMessage + ChatInput, manages chat state & API)
export { Chat } from './Chat';
export type {
  ChatProps,
  ChatRef,
  Message,
  MessageFileAttachment,
  FixedPosition,
  SendMessageOptions,
  DashboardMetadata,
} from './Chat';
export { ConversationMode } from './Chat';
export type { ReferenceContext } from './Chat';

// ChatInputSelector - Selector component for different input variants
export { ChatInputSelector } from './Chat';
export type { ChatInputSelectorProps } from './Chat';

// Mentions - @ mention system for referencing dashboards
export { MentionsOverlay, MentionsList, MentionStrip, MentionItemType } from './Mentions';
export type {
  MentionItem,
  MentionsOverlayProps,
  MentionsListProps,
  MentionStripProps,
  WidgetMentionType,
} from './Mentions';

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
  RunFinishedEvent,
  DashboardReadyEvent,
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

// ChatSidebar Organism (Folders v2 — sectioned + nested A2 layout, supports
// dashboards + chats inside folders).
export { ChatSidebar } from './ChatSidebar';
export type {
  ChatSidebarProps,
  SidebarItem,
  Folder,
  ItemType,
  ItemStatus,
  ApprovalState,
  FolderItemsMap,
  FolderDashboardsMap,
  FolderLoadingMap,
  DashboardSidebarItem,
  DashboardItemState,
  DashboardItemVisibility,
  SectionShowMoreMap,
  FolderItemType,
} from './ChatSidebar';
export { ApprovalDot } from './ChatSidebar';
export type { ApprovalDotProps } from './ChatSidebar';
export { ApprovalPill } from './ChatSidebar';
export type { ApprovalPillProps } from './ChatSidebar';

// ============================================================================
// FILES PREVIEW (Generic slide-in panel for previewing one or more files)
// ============================================================================
export { FilesPreviewPanel } from './FilesPreview';
export type { FilesPreviewPanelProps, FilePreviewEntry, PreviewableFile } from './FilesPreview';

// ============================================================================
// ANCHORED POPUP (Self-positioning popup anchored to a relative container)
// ============================================================================
export { AnchoredPopup } from './AnchoredPopup';
export type { AnchoredPopupProps, AnchoredPopupRenderProps, PopupPlacement } from './AnchoredPopup';

// ============================================================================
// DRAWER (Reusable right-side slide-in panel primitive)
// ============================================================================
export { Drawer } from './Drawer';
export type { DrawerProps } from './Drawer';

// ============================================================================
// ACCORDION (Collapsible section with animated body)
// ============================================================================
export { Accordion } from './Accordion';
export type { AccordionProps } from './Accordion';

// ============================================================================
// FILE CHIP (Pill chip for representing an attached file)
// ============================================================================
export { FileChip, FileTypeIcon, FileIconStack } from './FileChip';
export type { FileChipProps, ChipFile, FileIconStackProps } from './FileChip';

// ============================================================================
// SCHEDULE PICKER (General-purpose recurring schedule configuration)
// ============================================================================
export { ScheduleFields } from './SchedulePicker';
export { SchedulePicker } from './SchedulePicker';
export type {
  ScheduleFieldsProps,
  SchedulePickerProps,
  Schedule,
  ScheduleFrequency,
  ScheduleDay,
} from './SchedulePicker';
export {
  SCHEDULE_FREQUENCIES,
  SCHEDULE_DAYS,
  SCHEDULE_TIMES,
  DEFAULT_SCHEDULE,
  LOCAL_TIMEZONE,
  formatScheduleBadge,
  normalizeFrequency,
} from './SchedulePicker';

// ============================================================================
// RECIPIENT PICKER (General-purpose recipient/people selector)
// ============================================================================
export { RecipientPicker } from './RecipientPicker';
export type { RecipientPickerProps, Recipient } from './RecipientPicker';

// ============================================================================
// COMMANDS (Self-contained slash commands feature)
// ============================================================================
export {
  CommandsList,
  CommandDrawer,
  ManageCommandsDrawer,
  CommandChip,
  CommandsOverlay,
  CommandPreview,
  useCommands,
  useCommandsInput,
  ACTION_TYPE_LABELS,
  DEFAULT_COMMANDS,
  getCommands,
  saveCommands,
  addCommand,
  updateCommand,
  deleteCommand,
  getCommandById,
  searchCommands,
  resetToDefaults,
} from './Commands';
export type {
  Command,
  CommandAttachment,
  CommandSchedule,
  ScheduleRecipient,
  CommandsState,
  CommandChipProps,
  CommandDrawerProps,
  ManageCommandsDrawerProps,
  CommandsListProps,
  CommandsOverlayProps,
  CommandPreviewProps,
  UseCommandsInputOptions,
  UseCommandsInputReturn,
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
export { TextShimmer } from './TimelineThinkingProcess/components/TextShimmer';
export type { TextShimmerProps } from './TimelineThinkingProcess/components/TextShimmer';
export type {
  TimelineThinkingProcessProps,
  TimelineStep,
  StepType,
  StepStatus,
  SourceType,
  EventCategory,
  ApprovalData,
  BulkOperation,
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
  EmailsTabContent,
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
  EmailTranscript,
  SentimentType,
  TopLevelTab,
  DataTabContentProps,
  CallsTabContentProps,
  EmailsTabContentProps,
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
// REPORT TABLE (Highcharts Grid Lite)
// ============================================================================
export {
  ReportTable,
  buildGridOptions,
  autoSizeGridColumns,
  applyColumnFormats,
  rowsToDataTableColumns,
  createCellFormatter,
  formatValue,
  markdownCellFormatter,
  handleMarkdownCellHover,
  createMarkdownCellClickHandler,
  escapeHtml,
  LongTextPopover,
} from './ReportTable';
export type {
  ReportTableProps,
  ReportColumn,
  ColumnType,
  AIReasoningData,
  ServerSortState,
  ExpandPopoverState,
} from './ReportTable';

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
  DeepResearchApprovalCard,
  DeepResearchDataTablesDrawer,
} from './Chat';
export type {
  DeepResearchNotificationBarProps,
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

export { ShareChatPopup } from './popups';
export type {
  ShareChatPopupProps,
  AccessType as ChatAccessType,
  ShareRecipient as ChatShareRecipient,
  ShareStatus as ChatShareStatus,
  ShareResult as ChatShareResult,
  TeamMemberOption,
} from './popups';

// ============================================================================
// DATA TABLES (Jan17Demo - kept for reference, use DeepResearchDataTablesDrawer for production)
// ============================================================================
// Note: DataTableConfig is now exported from Chat/DeepResearch

// ============================================================================
// HOOKS (Reusable hooks for common UI patterns)
// ============================================================================
export { useIsTruncated } from '../hooks';
export type { UseIsTruncatedReturn } from '../hooks';

export { useVisibilityToggle } from '../hooks';
export type { UseVisibilityToggleReturn } from '../hooks';

export { useCopyToClipboard } from '../hooks';
export type { UseCopyToClipboardReturn } from '../hooks';

export { usePortalPopover } from '../hooks';

// ============================================================================
// FILTER
// ============================================================================
export {
  FilterButton,
  ScrollableFilterBar,
  SplitFilterDropdown,
  isEmptyFilterValue,
} from './forms/filter';
export type {
  FilterButtonProps,
  FilterField,
  FilterCondition,
  FilterGroup,
  FieldType,
  DynamicOptionConfig,
  CustomOperatorDef,
  FilterFieldConfig,
  FilterValue,
  FilterBarValue,
  OptionGroup,
  CalendarOptionConfig,
  ScrollableFilterBarProps,
  SplitFilterDropdownProps,
} from './forms/filter';

// ============================================================================
// DASHBOARD (View-only dashboard display components)
// ============================================================================
export {
  DashboardGrid,
  WidgetShell,
  WidgetRenderer,
  ChartWidget,
  CounterWidget,
  TextWidget,
  DashboardLayout,
  DataSources,
  AutoFitContext,
  useAutoFit,
} from './Dashboard';
export type {
  DashboardGridProps,
  WidgetShellProps,
  WidgetRendererProps,
  ChartWidgetProps,
  CounterWidgetProps,
  TextWidgetProps,
  WidgetConfig,
  WidgetType,
  GridConfig,
  LayoutItem,
  ChartWidgetConfig,
  CounterWidgetConfig,
  TextWidgetConfig,
  MustacheVariables,
  AppliedWidgetFilter,
  DataSourcesProps,
  DataSource,
  DataSourceIcon,
  WidgetAddToChatPayload,
  AutoFitController,
  AutoFitReport,
} from './Dashboard';
