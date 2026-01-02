import type { Message } from '../Chat/types';
import type { FileAttachment } from '../Chat/FileAttachment/types';

/**
 * Reference context for the chat input
 * Shows which dashboard/report the user is referencing
 */
export interface ReferenceContext {
  /** Type of reference */
  type: 'dashboard' | 'report' | 'document';
  /** Display name of the reference */
  name: string;
  /** Unique identifier */
  id: string;
}

export interface ChatPaneProps {
  /**
   * Conversation name displayed in the header
   * @default 'Build with Von'
   */
  conversationName?: string;

  /**
   * Messages to display in the chat
   */
  messages?: Message[];

  /**
   * Callback when a message is sent
   */
  onSendMessage?: (message: string, attachments?: FileAttachment[]) => void;

  /**
   * Callback when stop button is clicked during streaming
   */
  onStop?: () => void;

  /**
   * Whether a message is actively streaming
   * @default false
   */
  isStreaming?: boolean;

  /**
   * Reference context shown above the input
   */
  referenceContext?: ReferenceContext;

  /**
   * Callback when the reference is removed
   */
  onRemoveReference?: () => void;

  /**
   * Whether the pane is collapsed
   * @default false
   */
  isCollapsed?: boolean;

  /**
   * Callback when collapse/expand toggle is clicked
   */
  onToggleCollapse?: () => void;

  /**
   * Callback when new chat button is clicked
   */
  onNewChat?: () => void;

  /**
   * Callback when history button is clicked
   */
  onViewHistory?: () => void;

  /**
   * Callback when cancel button is clicked
   */
  onCancel?: () => void;

  /**
   * User's name (for message avatars)
   */
  userName?: string;

  /**
   * User's email (for message avatars)
   */
  userEmail?: string;

  /**
   * Placeholder text for the input
   * @default 'Type a message...'
   */
  placeholder?: string;

  /**
   * Whether to show the mode toggle (Ask/Build)
   * @default true
   */
  showModeToggle?: boolean;

  /**
   * Whether to enable voice input
   * @default false
   */
  enableVoiceInput?: boolean;

  /**
   * Callback when voice input is triggered
   */
  onVoiceInput?: () => void;

  /**
   * Whether voice input is recording
   * @default false
   */
  isRecording?: boolean;

  /**
   * Hook for fetching artifact data (passed to messages)
   */
  useArtifactHook?: (
    conversationId: string | null,
    messageId: string | null,
    artifactId: string | null
  ) => {
    data?: {
      artifact_id: string;
      tool_call_id: string;
      tool_name: string;
      artifact_type: string;
      content: Record<string, unknown>;
      size_bytes: number;
      persisted_at: string;
    };
    isLoading: boolean;
    error?: Error | null;
  };

  /**
   * Conversation ID (for artifact fetching)
   */
  conversationId?: string;

  /**
   * Callback when user approves an operation
   */
  onApprove?: (toolCallId: string, runId: string) => void;

  /**
   * Callback when user rejects an operation
   */
  onReject?: (toolCallId: string, runId: string) => void;
}

export interface ChatPaneHeaderProps {
  /**
   * Conversation name displayed in the header
   */
  conversationName: string;

  /**
   * Callback when new chat button is clicked
   */
  onNewChat?: () => void;

  /**
   * Callback when history button is clicked
   */
  onViewHistory?: () => void;

  /**
   * Callback when cancel button is clicked
   */
  onCancel?: () => void;

  /**
   * Callback when collapse button is clicked
   */
  onCollapse?: () => void;

  /**
   * Whether streaming is active (shows cancel button)
   * @default false
   */
  isStreaming?: boolean;
}
