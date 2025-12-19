import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { ChatInput } from '../components/Chat/ChatInput';
import type { FileAttachment } from '../components/Chat/FileAttachment';

/**
 * File Upload Chat Input Stories
 *
 * This page provides isolated access to the ChatInput component
 * for tweaking and testing file upload-related input behaviors.
 */

const meta = {
  title: 'Features/File Upload/Chat Input',
  component: ChatInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The ChatInput component with file upload functionality. Click the + button to attach files, or drag and drop files onto the input. Supports PDF, Excel, CSV, Word, PowerPoint, Images, and text files. Maximum 10 files, 5MB each.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    isStreaming: {
      control: 'boolean',
      description: 'Whether a message is actively streaming (shows stop button)',
    },
    disableSubmit: {
      control: 'boolean',
      description: 'Disable send button but allow typing',
    },
    enableFileUpload: {
      control: 'boolean',
      description: 'Enable file attachment functionality',
    },
    hideDisclaimer: {
      control: 'boolean',
      description: 'Hide the disclaimer text',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '600px', padding: '2rem', backgroundColor: '#f5f5f5' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default input with file upload enabled
 */
export const Default: Story = {
  args: {
    placeholder: 'Ask von anything',
    enableFileUpload: true,
    hideDisclaimer: false,
  },
};

/**
 * Input without file upload (original behavior)
 */
export const WithoutFileUpload: Story = {
  args: {
    placeholder: 'Ask von anything',
    enableFileUpload: false,
    hideDisclaimer: false,
  },
};

/**
 * Disabled state with file upload
 */
export const Disabled: Story = {
  args: {
    placeholder: 'Upload a file to begin...',
    disabled: true,
    enableFileUpload: true,
    hideDisclaimer: false,
  },
};

/**
 * Streaming state with file upload
 */
export const Streaming: Story = {
  args: {
    placeholder: 'Ask von anything',
    isStreaming: true,
    enableFileUpload: true,
    hideDisclaimer: false,
  },
};

/**
 * Interactive demo with file upload and message sending
 */
const InteractiveFileUploadComponent = () => {
  const [value, setValue] = useState('');
  const [sentMessages, setSentMessages] = useState<
    Array<{ text: string; files: FileAttachment[] }>
  >([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSend = (msg: string, attachments?: FileAttachment[]) => {
    setSentMessages((prev) => [...prev, { text: msg, files: attachments || [] }]);
    setValue('');
    setIsStreaming(true);

    // Simulate streaming completion
    setTimeout(() => {
      setIsStreaming(false);
    }, 2000);
  };

  const handleStop = () => {
    setIsStreaming(false);
  };

  const handleFileError = (error: string, message: string) => {
    alert(`File Error: ${message}`);
  };

  return (
    <div>
      <ChatInput
        placeholder="Type a message or attach files..."
        value={value}
        onChange={setValue}
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
        enableFileUpload
        onFileError={handleFileError}
        hideDisclaimer
      />

      <div className="mt-6 space-y-3">
        <div className="text-xs text-gray-500 font-medium">Sent Messages:</div>
        {sentMessages.length === 0 ? (
          <div className="text-xs text-gray-400 italic">
            No messages sent yet. Try attaching files and sending a message!
          </div>
        ) : (
          <ul className="text-sm space-y-2">
            {sentMessages.map((msg, i) => (
              <li key={i} className="bg-white border border-gray-200 px-3 py-2 rounded-lg">
                {msg.files.length > 0 && (
                  <div className="text-xs text-gray-500 mb-1">
                    Files: {msg.files.map((f) => f.name).join(', ')}
                  </div>
                )}
                <div>{msg.text || <span className="italic text-gray-400">(no text)</span>}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
        <strong>Tips:</strong>
        <ul className="mt-1 list-disc list-inside space-y-0.5">
          <li>Click the + button to attach files</li>
          <li>Supported: PDF, Excel, CSV, Word, PPT, Images, Text</li>
          <li>Max 10 files, 5MB each</li>
          <li>Hover over attached files to remove them</li>
          <li>You can send files with or without a message</li>
        </ul>
      </div>
    </div>
  );
};

export const Interactive: Story = {
  args: {
    placeholder: 'Interactive demo',
  },
  render: () => <InteractiveFileUploadComponent />,
};

/**
 * All states comparison with file upload
 */
export const AllStates: Story = {
  args: {
    placeholder: 'Placeholder',
  },
  render: () => (
    <div className="flex flex-col gap-6" style={{ width: '500px' }}>
      <div>
        <div className="text-xs text-gray-500 mb-2 font-medium">
          Default with File Upload
        </div>
        <ChatInput
          placeholder="Ask von anything"
          enableFileUpload
          onSend={(msg, files) => console.log('Sent:', msg, files)}
          hideDisclaimer
        />
      </div>

      <div>
        <div className="text-xs text-gray-500 mb-2 font-medium">
          Without File Upload
        </div>
        <ChatInput
          placeholder="Ask von anything"
          enableFileUpload={false}
          onSend={(msg) => console.log('Sent:', msg)}
          hideDisclaimer
        />
      </div>

      <div>
        <div className="text-xs text-gray-500 mb-2 font-medium">Disabled</div>
        <ChatInput
          placeholder="Upload a file to begin..."
          disabled
          enableFileUpload
          hideDisclaimer
        />
      </div>

      <div>
        <div className="text-xs text-gray-500 mb-2 font-medium">Streaming</div>
        <ChatInput
          placeholder="Ask von anything"
          isStreaming
          enableFileUpload
          onStop={() => console.log('Stop clicked')}
          hideDisclaimer
        />
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', backgroundColor: '#f5f5f5' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * With context tag
 */
export const WithContextTag: Story = {
  args: {
    placeholder: 'Ask about this file...',
    contextTag: '@Q3_Sales_Report.xlsx',
    enableFileUpload: true,
    hideDisclaimer: false,
  },
};

/**
 * Long content demo
 */
export const LongContent: Story = {
  args: {
    placeholder: 'Type a long message...',
    enableFileUpload: true,
    hideDisclaimer: true,
  },
  render: () => {
    const [value, setValue] = useState(
      'This is a demonstration of how the textarea handles longer content alongside file attachments. The input area expands upward when files are attached, and the text area will also grow as you type more content.\n\nTry attaching some files and typing more text!'
    );
    return (
      <ChatInput
        value={value}
        onChange={setValue}
        placeholder="Long content demo"
        enableFileUpload
      />
    );
  },
};
