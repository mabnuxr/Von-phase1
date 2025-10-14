/**
 * Type definitions for Chat component with backend integration
 */

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  /**
   * Active tab for assistant messages
   * @default 'output'
   */
  activeTab?: 'output' | 'sources' | 'thought';
  /**
   * Whether this message is currently streaming
   */
  isStreaming?: boolean;
  /**
   * Whether this message has an error
   */
  hasError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface ChatUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface SourceReference {
  id: string;
  title: string;
  url?: string;
  snippet?: string;
  relevanceScore?: number;
}

export interface DashboardComponent {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text';
  title: string;
  data: unknown;
  config?: Record<string, unknown>;
}

export interface DashboardArtifact {
  id: string;
  messageId: string;
  title: string;
  description?: string;
  components: DashboardComponent[];
  createdAt: Date;
}

export interface PusherConfig {
  key: string;
  cluster: string;
  authEndpoint?: string;
}

export interface ApiEndpoints {
  conversations: string;
  messages: string;
  history: string;
  auth: string;
}

export interface FixedPosition {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface ChatProps {
  /**
   * Title displayed in the chat header
   * @default 'Chat'
   */
  title?: string;

  /**
   * User ID for the chat session
   */
  userId?: string;

  /**
   * Base URL for the backend API
   */
  apiBaseUrl?: string;

  /**
   * Pusher configuration for real-time messaging
   */
  pusherConfig?: PusherConfig;

  /**
   * Messages to display in the chat (for controlled component)
   * @default []
   */
  messages?: Message[];

  /**
   * Callback when a new message is sent
   */
  onSendMessage?: (message: string) => void;

  /**
   * Callback when the add button is clicked
   */
  onAddClick?: () => void;

  /**
   * Callback when the refresh button is clicked
   */
  onRefreshClick?: () => void;

  /**
   * Callback when close button is clicked (for fixed variant)
   */
  onClose?: () => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Callback when a message is received via Pusher (for controlled mode)
   * Allows parent component to handle message updates
   */
  onPusherMessage?: (message: Message) => void;

  /**
   * Placeholder text for the input
   * @default 'Ask von anything'
   */
  placeholder?: string;

  /**
   * Whether the chat is in a loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * Height of the chat container
   * @default '600px'
   */
  height?: string;

  /**
   * Width of the chat container
   * @default '400px'
   */
  width?: string;

  /**
   * Variant of the chat component
   * - floating: Normal document flow
   * - fixed: Fixed position overlay (bottom-right by default)
   * - fullpage: Full viewport coverage
   * @default 'floating'
   */
  variant?: 'floating' | 'fixed' | 'fullpage';

  /**
   * Position for fixed variant (ignored for fullpage variant)
   * @default { bottom: '24px', right: '24px' }
   */
  fixedPosition?: FixedPosition;

  /**
   * Whether to enable real-time Pusher integration
   * @default false
   */
  enableRealtime?: boolean;

  /**
   * Active conversation ID (for multi-conversation support)
   */
  conversationId?: string;

  /**
   * Ref for infinite scroll trigger (load older messages)
   * Place this at the top of the messages container
   */
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;

  /**
   * Whether currently fetching older messages (for infinite scroll)
   * @default false
   */
  isFetchingMore?: boolean;
}
