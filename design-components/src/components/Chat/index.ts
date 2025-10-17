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
} from './Chat';

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

// Export hooks
export { usePusherAuth } from './hooks/usePusherAuth';
export type { PusherConfig as PusherAuthConfig, UsePusherAuthReturn } from './hooks/usePusherAuth';

export { useMessageStream } from './hooks/useMessageStream';
export type { StreamMessage, MessageStreamEvents } from './hooks/useMessageStream';

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
