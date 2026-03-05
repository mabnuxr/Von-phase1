import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState } from 'react';
import { ChatInputSelector } from '../../../../components/Chat/ChatInputSelector';
import type { FileAttachment } from '../../../../components/Chat/FileAttachment/types';
import type { AgentMode } from '../../../../components/Chat/StandardChatInput/types';
import { DEFAULT_COMMANDS } from '../../../../components/Commands';

/**
 * ChatInputDecorator - Wraps stories in a container that mimics the chat area
 */
const ChatInputDecorator: Decorator = (Story) => (
  <div
    style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      backgroundColor: '#ffffff',
      padding: '24px',
    }}
  >
    <Story />
  </div>
);

const meta = {
  title: 'Components/Chat/ChatInput',
  component: ChatInputSelector,
  decorators: [ChatInputDecorator],
  args: {
    useStandardInput: true,
    enableCommands: true,
    commands: DEFAULT_COMMANDS,
  },
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChatInputSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Default (Production Configuration)
// ============================================================================

/**
 * Default
 *
 * The production chat input with all features enabled:
 * - Plus menu (file upload + agent selection)
 * - Slash commands (type "/" to see available commands)
 * - Rich text editor with Tiptap
 * - Agent mode selector (Auto, Build Dashboard, Deep Research)
 * - Send button
 */
export const Default: Story = {
  render: () => (
    <ChatInputSelector
      useStandardInput
      placeholder="Ask von anything"
      showPlusMenu
      enableCommands
      commands={DEFAULT_COMMANDS}
      onSend={(message, attachments, options) =>
        console.log('Send:', message, attachments, options)
      }
    />
  ),
};

// ============================================================================
// With File Attachments
// ============================================================================

/**
 * With Attachments
 *
 * Shows the production chat input with file attachments.
 * Files display as chips above the text area.
 */
export const WithAttachments: Story = {
  render: () => {
    const [attachments, setAttachments] = useState<FileAttachment[]>([
      {
        id: '1',
        file: new File([''], 'Q4 Sales Report.pdf'),
        name: 'Q4 Sales Report.pdf',
        size: 2458624,
        type: 'application/pdf',
        extension: 'PDF',
        category: 'document',
        status: 'uploaded',
      },
      {
        id: '2',
        file: new File([''], 'Revenue Data.xlsx'),
        name: 'Revenue Data 2024.xlsx',
        size: 512000,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'XLSX',
        category: 'spreadsheet',
        status: 'uploaded',
      },
    ]);

    return (
      <ChatInputSelector
        useStandardInput
        placeholder="Ask about the attached files..."
        showPlusMenu
        enableCommands
        commands={DEFAULT_COMMANDS}
        attachments={attachments}
        onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
        onSend={(message, atts) => {
          console.log('Send:', message, atts);
          setAttachments([]);
        }}
      />
    );
  },
};

// ============================================================================
// Streaming State
// ============================================================================

/**
 * Streaming
 *
 * Shows the input while the AI is generating a response.
 * The send button becomes a stop button.
 */
export const Streaming: Story = {
  render: () => {
    const [isStreaming, setIsStreaming] = useState(true);

    return (
      <ChatInputSelector
        useStandardInput
        enableCommands
        commands={DEFAULT_COMMANDS}
        placeholder="AI is generating..."
        showPlusMenu
        isStreaming={isStreaming}
        onStop={() => {
          console.log('Stop clicked');
          setIsStreaming(false);
        }}
        onSend={(message) => console.log('Send:', message)}
      />
    );
  },
};

// ============================================================================
// Disabled State
// ============================================================================

/**
 * Disabled
 *
 * Shows the input in a disabled state (e.g. while waiting for approval).
 */
export const Disabled: Story = {
  render: () => (
    <ChatInputSelector
      useStandardInput
      enableCommands
      commands={DEFAULT_COMMANDS}
      placeholder="Input disabled..."
      showPlusMenu
      disabled
      disableSubmit
      onSend={() => {}}
    />
  ),
};

// ============================================================================
// Locked Agent Mode
// ============================================================================

/**
 * Locked Agent
 *
 * Shows the input with a locked agent mode — this happens after the
 * first message in a conversation, when the agent can no longer be changed.
 */
export const LockedAgent: Story = {
  render: () => (
    <ChatInputSelector
      useStandardInput
      placeholder="Continue the conversation..."
      showPlusMenu
      enableCommands
      commands={DEFAULT_COMMANDS}
      isAgentLocked
      lockedAgentMode={'deep-research' as AgentMode}
      onSend={(message, attachments, options) =>
        console.log('Send:', message, attachments, options)
      }
    />
  ),
};

// ============================================================================
// With Formatting Toolbar
// ============================================================================

/**
 * Rich Text Formatting
 *
 * Shows the Tiptap editor with the formatting toolbar visible.
 * Supports bold, italic, strikethrough, code, lists, blockquotes, etc.
 *
 * Keyboard shortcuts:
 * - Cmd/Ctrl+B for bold
 * - Cmd/Ctrl+I for italic
 * - Cmd/Ctrl+E for inline code
 * - Enter to send, Shift+Enter for new line
 */
export const RichTextFormatting: Story = {
  render: () => (
    <div className="space-y-4">
      <ChatInputSelector
        useStandardInput
        placeholder="Try formatting your text or pasting markdown..."
        showPlusMenu
        enableCommands
        commands={DEFAULT_COMMANDS}
        onSend={(message) => console.log('Send:', message)}
      />
      <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 max-w-3xl mx-auto">
        <div className="font-medium mb-2">Try these features:</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Use the formatting toolbar to style your text</li>
          <li>
            Press Cmd/Ctrl+B for <strong>bold</strong>, Cmd/Ctrl+I for <em>italic</em>
          </li>
          <li>Paste markdown content and it auto-formats</li>
          <li>Create lists, add links, and use code blocks</li>
          <li>Press Enter to send, Shift+Enter for new line</li>
        </ul>
      </div>
    </div>
  ),
};

// ============================================================================
// File Upload with Error
// ============================================================================

/**
 * File Error
 *
 * Shows a file validation error message above the input.
 */
export const FileError: Story = {
  render: () => (
    <ChatInputSelector
      useStandardInput
      enableCommands
      commands={DEFAULT_COMMANDS}
      placeholder="Try uploading a file..."
      showPlusMenu
      fileErrorMessage="File exceeds the 10MB size limit. Please upload a smaller file."
      onDismissFileError={() => console.log('Dismiss error')}
      onSend={(message) => console.log('Send:', message)}
    />
  ),
};

// ============================================================================
// Minimal (No Plus Menu, No Commands)
// ============================================================================

/**
 * Minimal
 *
 * A stripped-down version without plus menu or commands.
 * Just the text input and send button.
 */
export const Minimal: Story = {
  render: () => (
    <ChatInputSelector
      useStandardInput
      enableCommands={false}
      placeholder="Type a message..."
      onSend={(message) => console.log('Send:', message)}
    />
  ),
};
