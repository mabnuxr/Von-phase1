import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { useState } from 'react';
import { StandardChatInput, type AutoEditMode } from '../../../../components/Chat/StandardChatInput';
import type { FileAttachment } from '../../../../components/Chat/FileAttachment/types';
import type { BuildMode } from '../../../../components/DashboardBuilder/types';

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
  title: '3-Pane/Components/Chat/ChatInput',
  component: StandardChatInput,
  decorators: [ChatInputDecorator],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StandardChatInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Default State
// ============================================================================

/**
 * Default
 *
 * The default StandardChatInput with all features enabled:
 * - Plus button for file upload
 * - Ask/Build mode toggle (defaults to "Ask")
 * - Voice input button
 * - Send button
 * - White background with subtle gradient border
 */
export const Default: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');

    return (
      <StandardChatInput
        placeholder="Type a message..."
        mode={mode}
        onModeChange={setMode}
        onVoiceInput={() => console.log('Voice input clicked')}
        onSend={(message, attachments) => {
          console.log('Send:', message, attachments);
        }}
      />
    );
  },
};

// ============================================================================
// With File Attachments
// ============================================================================

/**
 * With Attachments
 *
 * Shows the chat input with file attachments displayed above the text area.
 * Files use the minimal variant styling (white background, colored badge/icon).
 */
export const WithAttachments: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');
    const [attachments, setAttachments] = useState<FileAttachment[]>([
      {
        id: '1',
        file: new File([''], 'VON _ pre-dashboard-ux-spec.docx'),
        name: 'VON _ pre-dashboard-ux-spec.docx',
        size: 15759,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extension: 'DOCX',
        category: 'document',
        status: 'uploaded',
      },
    ]);

    const handleRemove = (id: string) => {
      setAttachments(attachments.filter((a) => a.id !== id));
    };

    return (
      <StandardChatInput
        placeholder="Type a message..."
        mode={mode}
        onModeChange={setMode}
        onVoiceInput={() => console.log('Voice input clicked')}
        onSend={(message, atts) => {
          console.log('Send:', message, atts);
          setAttachments([]);
        }}
        attachments={attachments}
        onRemoveAttachment={handleRemove}
      />
    );
  },
};

// ============================================================================
// Multiple Attachments
// ============================================================================

/**
 * Multiple Attachments
 *
 * Shows multiple file types attached to the input.
 */
export const MultipleAttachments: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');
    const [attachments, setAttachments] = useState<FileAttachment[]>([
      {
        id: '1',
        file: new File([''], 'report.pdf'),
        name: 'Q4 Sales Report.pdf',
        size: 2458624,
        type: 'application/pdf',
        extension: 'PDF',
        category: 'document',
        status: 'uploaded',
      },
      {
        id: '2',
        file: new File([''], 'data.xlsx'),
        name: 'Revenue Data 2024.xlsx',
        size: 512000,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'XLSX',
        category: 'spreadsheet',
        status: 'uploaded',
      },
      {
        id: '3',
        file: new File([''], 'screenshot.png'),
        name: 'Dashboard Screenshot.png',
        size: 156789,
        type: 'image/png',
        extension: 'PNG',
        category: 'image',
        status: 'uploaded',
        previewUrl: 'https://placehold.co/200x200/e2e8f0/64748b?text=Preview',
      },
    ]);

    const handleRemove = (id: string) => {
      setAttachments(attachments.filter((a) => a.id !== id));
    };

    return (
      <StandardChatInput
        placeholder="Type a message..."
        mode={mode}
        onModeChange={setMode}
        onVoiceInput={() => console.log('Voice input clicked')}
        onSend={(message, atts) => {
          console.log('Send:', message, atts);
          setAttachments([]);
        }}
        attachments={attachments}
        onRemoveAttachment={handleRemove}
      />
    );
  },
};

// ============================================================================
// Build Mode
// ============================================================================

/**
 * Build Mode
 *
 * Shows the input with "Build" mode selected instead of "Ask".
 */
export const BuildModeSelected: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('build');

    return (
      <StandardChatInput
        placeholder="Describe what you want to build..."
        mode={mode}
        onModeChange={setMode}
        onVoiceInput={() => console.log('Voice input clicked')}
        onSend={(message) => {
          console.log('Build:', message);
        }}
      />
    );
  },
};

// ============================================================================
// Recording State
// ============================================================================

/**
 * Recording
 *
 * Shows the input while voice recording is active.
 */
export const Recording: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');
    const [isRecording, setIsRecording] = useState(true);

    return (
      <StandardChatInput
        placeholder="Listening..."
        mode={mode}
        onModeChange={setMode}
        onVoiceInput={() => setIsRecording(!isRecording)}
        isRecording={isRecording}
        onSend={(message) => {
          console.log('Send:', message);
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
 * Shows the input while AI is generating a response.
 * The send button becomes a stop button.
 */
export const Streaming: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');
    const [isStreaming, setIsStreaming] = useState(true);

    return (
      <StandardChatInput
        placeholder="AI is generating..."
        mode={mode}
        onModeChange={setMode}
        onVoiceInput={() => console.log('Voice input clicked')}
        isStreaming={isStreaming}
        onStop={() => {
          console.log('Stop clicked');
          setIsStreaming(false);
        }}
        onSend={(message) => {
          console.log('Send:', message);
        }}
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
 * Shows the input in a disabled state.
 */
export const Disabled: Story = {
  render: () => {
    return (
      <StandardChatInput
        placeholder="Input disabled..."
        disabled={true}
        onVoiceInput={() => {}}
        onSend={() => {}}
      />
    );
  },
};

// ============================================================================
// Without Voice Input
// ============================================================================

/**
 * Without Voice
 *
 * Shows the input without the voice input button.
 */
export const WithoutVoice: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');

    return (
      <StandardChatInput
        placeholder="Type a message..."
        mode={mode}
        onModeChange={setMode}
        onSend={(message) => {
          console.log('Send:', message);
        }}
      />
    );
  },
};

// ============================================================================
// Controlled Input
// ============================================================================

/**
 * Controlled
 *
 * Demonstrates controlled input mode where value is managed externally.
 */
export const Controlled: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');
    const [value, setValue] = useState('This is a controlled input value');

    return (
      <div className="space-y-4">
        <StandardChatInput
          placeholder="Type a message..."
          mode={mode}
          onModeChange={setMode}
          value={value}
          onChange={setValue}
          onVoiceInput={() => console.log('Voice input clicked')}
          onSend={(message) => {
            console.log('Send:', message);
            setValue('');
          }}
        />
        <div className="text-xs text-gray-500 text-center">Current value: "{value}"</div>
      </div>
    );
  },
};

// ============================================================================
// Rich Text Editor with Formatting
// ============================================================================

/**
 * Rich Text Formatting
 *
 * Demonstrates the Tiptap rich text editor with Slack-like formatting options:
 * - Bold, italic, strikethrough, underline
 * - Inline code and code blocks
 * - Links (auto-detected)
 * - Bulleted and numbered lists
 * - Task lists with checkboxes
 * - Blockquotes
 * - Headings
 * - Markdown paste support
 *
 * Try pasting markdown content or using keyboard shortcuts:
 * - Cmd/Ctrl+B for bold
 * - Cmd/Ctrl+I for italic
 * - Cmd/Ctrl+E for inline code
 * - Enter for submit, Shift+Enter for new line
 */
export const RichTextFormatting: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');

    return (
      <div className="space-y-4">
        <StandardChatInput
          placeholder="Try formatting your text or pasting markdown..."
          mode={mode}
          onModeChange={setMode}
          onVoiceInput={() => console.log('Voice input clicked')}
          onSend={(message, attachments) => {
            console.log('Send:', message, attachments);
          }}
          showFormattingToolbar={true}
        />
        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 max-w-3xl mx-auto">
          <div className="font-semibold mb-2">Try these features:</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Use the formatting toolbar to style your text</li>
            <li>
              Press Cmd/Ctrl+B for <strong>bold</strong>, Cmd/Ctrl+I for <em>italic</em>
            </li>
            <li>Paste markdown content and it will be automatically formatted</li>
            <li>Create lists, add links, and use code blocks</li>
            <li>Press Enter to send, Shift+Enter for new line</li>
          </ul>
        </div>
      </div>
    );
  },
};

// ============================================================================
// Without Formatting Toolbar
// ============================================================================

/**
 * Without Formatting Toolbar
 *
 * Shows the rich text editor without the formatting toolbar.
 * Keyboard shortcuts and markdown paste still work.
 */
export const WithoutFormattingToolbar: Story = {
  render: () => {
    const [mode, setMode] = useState<BuildMode>('ask');

    return (
      <StandardChatInput
        placeholder="Type a message (formatting toolbar hidden)..."
        mode={mode}
        onModeChange={setMode}
        onVoiceInput={() => console.log('Voice input clicked')}
        onSend={(message) => {
          console.log('Send:', message);
        }}
        showFormattingToolbar={false}
      />
    );
  },
};

// ============================================================================
// With Mode Selector (Auto Edits)
// ============================================================================

/**
 * With Mode Selector
 *
 * Shows the chat input with the Auto Edits mode selector button.
 * Click the button to cycle through modes: off -> on -> Plan Mode -> off
 */
export const WithModeSelector: Story = {
  render: () => {
    const [autoEditMode, setAutoEditMode] = useState<AutoEditMode>('off');

    return (
      <div className="space-y-4">
        <StandardChatInput
          placeholder="Type a message..."
          showModeSelector={true}
          autoEditMode={autoEditMode}
          onAutoEditModeChange={setAutoEditMode}
          onVoiceInput={() => console.log('Voice input clicked')}
          onSend={(message) => {
            console.log('Send:', message);
          }}
        />
        <div className="text-xs text-gray-500 text-center">
          Current auto edit mode: <strong>{autoEditMode}</strong>
        </div>
      </div>
    );
  },
};

/**
 * Plan Mode Active
 *
 * Shows the chat input with Plan Mode active.
 */
export const PlanModeActive: Story = {
  render: () => {
    const [autoEditMode, setAutoEditMode] = useState<AutoEditMode>('plan');

    return (
      <StandardChatInput
        placeholder="Describe your plan..."
        showModeSelector={true}
        autoEditMode={autoEditMode}
        onAutoEditModeChange={setAutoEditMode}
        onVoiceInput={() => console.log('Voice input clicked')}
        onSend={(message) => {
          console.log('Send:', message);
        }}
      />
    );
  },
};
