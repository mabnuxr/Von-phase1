import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { ChatEmptyState } from '../components/Chat/ChatEmptyState';

/**
 * File Upload Feature Stories - Empty State
 *
 * This page shows the empty state view with file upload functionality enabled.
 * Users can attach files using the + button or drag and drop files onto the chat area.
 */

const meta = {
  title: 'Features/File Upload/Empty State',
  component: ChatEmptyState,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The empty state view with file upload enabled. Click the + button to attach files, or drag and drop files onto the chat area. Supports PDF, Excel, CSV, Word, PowerPoint, Images, and text files. Maximum 10 files, 5MB each.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    userName: {
      control: 'text',
      description: "User's first name for personalized greeting",
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input field',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input and prompts are disabled',
    },
    enableFileUpload: {
      control: 'boolean',
      description: 'Enable file upload functionality',
    },
  },
} satisfies Meta<typeof ChatEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state with file upload enabled
 */
export const Default: Story = {
  args: {
    userName: 'John',
    placeholder: 'Ask von anything',
    disabled: false,
    enableFileUpload: true,
  },
  render: (args) => (
    <div className="w-screen h-screen bg-white">
      <ChatEmptyState
        {...args}
        onSendMessage={(msg) => console.log('Message sent:', msg)}
        onFileError={(error, message) => alert(`File Error: ${message}`)}
      />
    </div>
  ),
};

/**
 * Empty state without file upload (original behavior)
 */
export const WithoutFileUpload: Story = {
  args: {
    userName: 'John',
    placeholder: 'Ask von anything',
    disabled: false,
    enableFileUpload: false,
  },
  render: (args) => (
    <div className="w-screen h-screen bg-white">
      <ChatEmptyState {...args} onSendMessage={(msg) => console.log('Message sent:', msg)} />
    </div>
  ),
};

/**
 * Empty state with file upload and personalized greeting
 */
export const WithUserName: Story = {
  args: {
    userName: 'Sarah',
    placeholder: 'Ask von anything or attach files...',
    enableFileUpload: true,
  },
  render: (args) => (
    <div className="w-screen h-screen bg-white">
      <ChatEmptyState
        {...args}
        onSendMessage={(msg) => console.log('Message sent:', msg)}
        onFileError={(error, message) => alert(`File Error: ${message}`)}
      />
    </div>
  ),
};

/**
 * Disabled state with file upload
 */
export const DisabledState: Story = {
  args: {
    userName: 'John',
    placeholder: 'Processing...',
    disabled: true,
    enableFileUpload: true,
  },
  render: (args) => (
    <div className="w-screen h-screen bg-white">
      <ChatEmptyState
        {...args}
        onSendMessage={(msg) => console.log('Message sent:', msg)}
        onDisabledClick={() => console.log('Clicked while disabled')}
      />
    </div>
  ),
};

/**
 * Empty state with file upload info banner
 */
export const WithFileUploadBanner: Story = {
  args: {
    userName: 'John',
    placeholder: 'Ask von anything',
    enableFileUpload: true,
  },
  render: (args) => (
    <div className="w-screen h-screen bg-white">
      <ChatEmptyState
        {...args}
        onSendMessage={(msg) => console.log('Message sent:', msg)}
        onFileError={(error, message) => alert(`File Error: ${message}`)}
        topBanner={
          <div className="w-full p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            <strong>File Upload Tips:</strong>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Click the + button or drag files to attach</li>
              <li>Supported: PDF, Excel, CSV, Word, PPT, Images</li>
              <li>Max 10 files, 5MB each</li>
            </ul>
          </div>
        }
      />
    </div>
  ),
};
