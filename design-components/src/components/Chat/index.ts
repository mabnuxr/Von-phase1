export { Chat } from './Chat';
export type {
  ChatProps,
  Message,
  FixedPosition,
  ChatSession,
  ChatUser,
  SourceReference,
  DashboardComponent,
  DashboardArtifact,
  PusherConfig,
  ApiEndpoints,
} from './types';

export { ChatHeader } from './ChatHeader';
export type { ChatHeaderProps } from './ChatHeader';

export { ChatMessage } from './ChatMessage';
export type { ChatMessageProps } from './ChatMessage';

export { ChatInput } from './ChatInput';
export type { ChatInputProps } from './ChatInput';

export { ChatMarkdown } from './ChatMarkdown';
export type { ChatMarkdownProps } from './ChatMarkdown';

export { ThinkingBlock } from './ThinkingBlock';
export type { ThinkingBlockProps } from './ThinkingBlock';

export { ArtifactPane } from './ArtifactPane';

export { ToolCallItem } from './ToolCallItem';

// Export hooks
export { usePusherAuth } from './hooks/usePusherAuth';
export type { PusherConfig as PusherAuthConfig, UsePusherAuthReturn } from './hooks/usePusherAuth';

export { useMessageStream } from './hooks/useMessageStream';
export type { StreamMessage, MessageStreamEvents } from './hooks/useMessageStream';

export { useAguiMessageStream } from './hooks/useAguiMessageStream';
export type { AguiStateUpdate, UserMessageData } from './hooks/useAguiMessageStream';

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
} from './types';

// Export API utilities
export {
  createConversation,
  sendMessage,
  fetchConversationHistory,
  fetchUserConversations,
  deleteConversation as deleteConversationApi,
  updateConversationTitle,
} from './utils/api';
export type { ApiEndpoints as ApiEndpointsConfig, Conversation, ApiMessage } from './utils/api';

// Export localStorage utilities
export {
  saveConversation,
  loadConversation,
  loadAllConversations,
  deleteConversation as deleteConversationLocal,
  needsSync,
  getStorageInfo,
} from './utils/localStorage';
