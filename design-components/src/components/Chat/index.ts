export { Chat } from './Chat';
export { DeepResearchChat } from './DeepResearchChat';
export type { DeepResearchChatProps } from './DeepResearchChat';
export type {
  ChatProps,
  Message,
  MessageStatus,
  MessageFileAttachment,
  FixedPosition,
  ChatSession,
  ChatUser,
  SourceReference,
  DashboardComponent,
  DashboardArtifact,
  ApiEndpoints,
  DashboardMetadata,
} from './types';

// Export ConversationMode and ReferenceContext for agent selection and context
export { ConversationMode } from './StandardChatInput/types';
export type { ReferenceContext } from './StandardChatInput/types';

// Export ChatInputSelector types
export { ChatInputSelector } from './ChatInputSelector';
export type {
  ChatInputSelectorProps,
  ChatInputSelectorRef,
  SendMessageOptions,
} from './ChatInputSelector';

export { ChatHeader } from './ChatHeader';
export type { ChatHeaderProps } from './ChatHeader';

export { ChatMessage } from './ChatMessage';
export type { ChatMessageProps } from './ChatMessage';

export { ChatInput } from './ChatInput';
export type { ChatInputProps } from './ChatInput';

export { RichTextInput, hasPlaceholders } from './RichTextInput';
export type { RichTextInputProps, RichTextInputRef } from './RichTextInput';

export { ChatMarkdown } from './ChatMarkdown';
export type { ChatMarkdownProps } from './ChatMarkdown';

export { ThinkingBlock } from './ThinkingBlock';
export type { ThinkingBlockProps } from './ThinkingBlock';

export { EngagingMessage, ENGAGING_MESSAGES } from './EngagingMessage';
export type { EngagingMessageProps } from './EngagingMessage';

export { ArtifactPane } from './ArtifactPane';

export { FileArtifactCard, DashboardArtifactCard, GmailDraftCard } from './ArtifactCards';
export type {
  FileArtifactCardProps,
  DashboardArtifactCardProps,
  GmailDraftCardProps,
  FileArtifact,
  EmailDraftArtifact,
  ArtifactType,
} from './ArtifactCards';

export { ArtifactViewerPanel } from './ArtifactViewerPanel';
export type { ArtifactViewerPanelProps } from './ArtifactViewerPanel';

export { ToolCallItem } from './ToolCallItem';

export { ApprovalCard } from './ApprovalCard';
export type { ApprovalCardProps, SalesforceOperation, ApprovalToolArgs } from './ApprovalCard';

export { SalesforceLink } from './SalesforceLink';
export type { SalesforceLinkProps } from './SalesforceLink';

// Export Salesforce deep link utilities
export { buildSalesforceDeepLink, isSalesforceUrl } from './utils/salesforceDeepLink';

export { GoogleCalendarApprovalCard } from './GoogleCalendarApprovalCard';
export type { GoogleCalendarApprovalCardProps } from './GoogleCalendarApprovalCard';

export { MessageActions } from './MessageActions';
export type { MessageActionsProps } from './MessageActions';

export { ScrollToBottomButton } from './ScrollToBottomButton';

// Export error components
export { MessageAreaError } from './MessageAreaError';
export type { MessageAreaErrorProps } from './MessageAreaError';

// Export tool call and result components
export { DataTable } from './DataTable';
export type { DataTableProps } from './DataTable';

export { QueryBlock } from './QueryBlock';
export type { QueryBlockProps } from './QueryBlock';

export { JsonBlock } from './JsonBlock';
export type { JsonBlockProps } from './JsonBlock';

export { MetricsGrid } from './MetricsGrid';
export type { MetricsGridProps } from './MetricsGrid';

export { ToolResultRenderer } from './ToolResultRenderer';
export type { ToolResultRendererProps } from './ToolResultRenderer';

export { MemoryResultRenderer } from './MemoryResultRenderer';

export { CallSearchUnionRenderer } from './CallSearchUnionRenderer';
export type { CallSearchUnionRendererProps } from './CallSearchUnionRenderer';

export { ConversationSearchRenderer } from './ConversationSearchRenderer';
export type { ConversationSearchRendererProps } from './ConversationSearchRenderer';

export { ToolCallBlock } from './ToolCallBlock';
export type { ToolCallBlockProps } from './ToolCallBlock';

// Export icons
export {
  DatabaseIcon,
  ToolIcon,
  SearchIcon,
  CalculatorIcon,
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
  ChevronDownIcon,
  CopyIcon,
  ArrowDownIcon,
  TrendingUpIcon,
  HashIcon,
  DollarSignIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  VideoIcon,
  RepeatIcon,
} from './icons';
export type { IconProps } from './icons';

// Export AGUI types
export type {
  AguiEventWrapper,
  AguiEvent,
  EventMeta,
  RunStartedEvent,
  StepStartedEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
  StepFinishedEvent,
  RunFinishedEvent,
  ToolCall,
  ToolResult,
  TableData,
  QueryInfo,
  MetricData,
  StepMessage,
  // Salesforce approval types
  ApprovalResult,
  // Google Calendar approval types
  GoogleCalendarOperation,
  GoogleCalendarApprovalToolArgs,
  // Deep Research approval types
  DeepResearchDataSource,
  DeepResearchApprovalToolArgs,
  // Call Search Union types
  CallMatchSource,
  CallSearchResult,
  CallSearchUnionResult,
  UnionQueryComponent,
  DeduplicationInfo,
  CallSearchParams,
} from './types';

// Export approval utility functions
export {
  isApprovalTool,
  parseApprovalArgs,
  isGoogleCalendarApprovalTool,
  parseGoogleCalendarApprovalArgs,
} from './types';

// Export localStorage utilities
export {
  saveConversation,
  loadConversation,
  loadAllConversations,
  deleteConversation as deleteConversationLocal,
  needsSync,
  getStorageInfo,
} from './utils/localStorage';

// Export CSV export utilities
export {
  tableToCSV,
  valuesToCSV,
  statisticsToCSV,
  metricsToCSV,
  downloadCSV,
  generateCSVFilename,
  isExportableType,
  escapeCsvValue,
} from './utils/csvExport';

// Export Deep Research components and types
export {
  DeepResearchResults,
  DeepResearchThinkingIndicator,
  DeepResearchNotificationBar,
  DataTablesCard,
  DeepResearchApprovalCard,
  MarkdownActionCard,
  DeepResearchDataTablesDrawer,
} from './DeepResearch';
export type {
  DeepResearchNotificationBarProps,
  DataTablesCardProps,
  DeepResearchApprovalCardProps,
  DeepResearchAction,
  DataSourceInfo,
  MarkdownActionCardProps,
  MarkdownActionCardVariant,
  ActionButton,
  BulkItemChange,
  BulkItem,
  CalendarOperationType,
  CalendarEvent,
  DeepResearchDataTablesDrawerProps,
  DataTableConfig,
} from './DeepResearch';
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
} from './DeepResearch';
export {
  // Type guards
  isResearchResultsStartEvent,
  isResearchResultsContentEvent,
  isResearchResultsEndEvent,
  isResearchResultsEvent,
  // Initial state
  initialResearchResultsState,
} from './DeepResearch';
