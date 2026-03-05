import type { Message } from '../Chat/types';
import type { FileAttachment } from '../Chat/FileAttachment/types';
import type { AutoEditMode, ActivePopover } from '../Chat/StandardChatInput/types';

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

// Re-export types for convenience
export type { AutoEditMode, ActivePopover };

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
   * Callback when user clicks on an artifact
   * The consumer should render the appropriate UI with fetched data
   */
  onArtifactClick?: (
    artifactId: string,
    toolName: string,
    artifactType: string,
    runId: string
  ) => void;

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

  // ============================================================================
  // Auto Edit Mode Props
  // ============================================================================

  /**
   * Whether to show the mode selector button
   * @default false
   */
  showModeSelector?: boolean;

  /**
   * Current auto edit mode
   * @default 'off'
   */
  autoEditMode?: AutoEditMode;

  /**
   * Callback when auto edit mode changes
   */
  onAutoEditModeChange?: (mode: AutoEditMode) => void;

  // ============================================================================
  // Popover Props
  // ============================================================================

  /**
   * Active popover configuration (if any)
   */
  activePopover?: ActivePopover;

  /**
   * Callback when popover is closed/dismissed
   */
  onPopoverClose?: () => void;

  /**
   * Callback when popover primary action is clicked
   */
  onPopoverPrimaryAction?: () => void;

  /**
   * Callback when user submits feedback in the popover
   */
  onPopoverFeedback?: (feedback: string) => void;
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
