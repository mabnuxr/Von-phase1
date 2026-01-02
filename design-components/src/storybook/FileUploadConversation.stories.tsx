import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState, useCallback } from 'react';
import { Chat } from '../components/Chat';
import type { Message, MessageFileAttachment } from '../components/Chat/types';

/**
 * File Upload Conversation Stories
 *
 * This page demonstrates the full chat experience with file uploads,
 * including drag-and-drop support and file attachments in messages.
 */

const meta = {
  title: 'Features/File Upload/Conversation',
  component: Chat,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The full chat experience with file upload and drag-drop support. Drag files onto the chat area to see the overlay, or use the + button to attach files. Files are displayed in user messages after sending.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title displayed in the chat header',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input field',
    },
    enableFileUpload: {
      control: 'boolean',
      description: 'Enable file upload functionality',
    },
    variant: {
      control: 'select',
      options: ['floating', 'fixed', 'fullpage'],
      description: 'Chat variant',
    },
  },
} satisfies Meta<typeof Chat>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample messages with file attachments
const fileUploadMessages: Message[] = [
  {
    id: '1',
    type: 'user',
    content: 'I have uploaded my Q3 sales report. Can you analyze it?',
    timestamp: new Date(Date.now() - 300000),
    attachments: [
      {
        id: 'file-1',
        name: 'Q3_Sales_Report.xlsx',
        size: 245000,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'XLSX',
        category: 'spreadsheet',
      },
    ],
  },
  {
    id: '2',
    type: 'assistant',
    content: `I've analyzed your Q3 sales report. Here are the key insights:

**Revenue Summary:**
• Total Revenue: $2.4M (+15% vs Q2)
• New Business: $890K
• Expansion: $1.1M
• Renewals: $410K

**Top Performers:**
1. Sarah Chen - $340K closed
2. Mike Johnson - $285K closed
3. Lisa Park - $260K closed

**Areas of Concern:**
• West region underperforming by 12%
• Average deal size decreased by 8%
• Sales cycle extended by 5 days

Would you like me to drill down into any specific area?`,
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: '3',
    type: 'user',
    content: "Here's the regional breakdown for context",
    timestamp: new Date(Date.now() - 180000),
    attachments: [
      {
        id: 'file-2',
        name: 'Regional_Analysis.pdf',
        size: 1250000,
        type: 'application/pdf',
        extension: 'PDF',
        category: 'document',
      },
      {
        id: 'file-3',
        name: 'West_Region_Details.csv',
        size: 45000,
        type: 'text/csv',
        extension: 'CSV',
        category: 'spreadsheet',
      },
    ],
  },
  {
    id: '4',
    type: 'assistant',
    content: `Looking at the West region data from your files:

**Root Causes:**
• 2 key account executives left in July
• Major prospect "TechCorp West" pushed decision to Q4
• Competitive pressure from new market entrant

**Deals at Risk:**
| Deal | Value | Stage | Risk Level |
|------|-------|-------|------------|
| GlobalRetail West | $180K | Negotiation | High |
| Pacific Finance | $95K | Discovery | Medium |
| WestCoast Dynamics | $140K | Proposal | High |

**Recommended Actions:**
1. Reallocate enterprise AE to cover open territory
2. Schedule executive sponsor calls for at-risk deals
3. Accelerate hiring for 2 open positions

Should I create an action plan document?`,
    timestamp: new Date(Date.now() - 120000),
  },
];

/**
 * Default conversation with file upload enabled - drag files to test overlay
 */
export const Default: Story = {
  args: {
    title: 'File Analysis Chat',
    messages: fileUploadMessages,
    variant: 'fullpage',
    placeholder: 'Ask about your files or drag to upload...',
    enableFileUpload: true,
  },
  render: (args) => (
    <Chat
      {...args}
      onSendMessage={(msg) => console.log('Message sent:', msg)}
      onFileError={(error, message) => alert(`File Error: ${message}`)}
    />
  ),
};

/**
 * Empty chat with file upload - drag files to see overlay
 */
export const EmptyWithDragDrop: Story = {
  args: {
    title: 'New Chat',
    messages: [],
    variant: 'fullpage',
    placeholder: 'Ask von anything or drag files here...',
    enableFileUpload: true,
    userName: 'John',
  },
  render: (args) => (
    <Chat
      {...args}
      onSendMessage={(msg) => console.log('Message sent:', msg)}
      onFileError={(error, message) => alert(`File Error: ${message}`)}
    />
  ),
};

/**
 * Interactive conversation with file upload
 */
const InteractiveConversationComponent = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        "Hello! I'm ready to help you analyze your files. Upload documents using the + button or drag them into this chat area.",
      timestamp: new Date(Date.now() - 60000),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(
    (content: string, attachments?: MessageFileAttachment[]) => {
      // Add user message with attachments
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        type: 'user',
        content,
        timestamp: new Date(),
        attachments,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Simulate assistant response after delay
      const hasFiles = attachments && attachments.length > 0;
      const fileInfo = hasFiles
        ? `\n\nI received ${attachments.length} file(s): ${attachments.map((f) => f.name).join(', ')}`
        : '';

      setTimeout(() => {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: `I received your message${content ? `: "${content}"` : ''}.${fileInfo}\n\nThis is a demo response. Try dragging files onto the chat area to see the drag-drop overlay, or use the + button to attach files.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1500);
    },
    []
  );

  const handleFileError = useCallback((error: string, message: string) => {
    alert(`File Error: ${message}`);
  }, []);

  return (
    <Chat
      title="Interactive File Chat"
      messages={messages}
      variant="fullpage"
      placeholder="Type a message or drag files here..."
      isLoading={isLoading}
      onSendMessage={handleSendMessage}
      enableFileUpload
      onFileError={handleFileError}
    />
  );
};

export const Interactive: Story = {
  args: {
    title: 'Interactive Demo',
    messages: [],
    variant: 'fullpage',
    enableFileUpload: true,
  },
  render: () => <InteractiveConversationComponent />,
};

/**
 * Conversation with multiple file types attached
 */
export const MultipleFileTypes: Story = {
  args: {
    title: 'Multi-File Analysis',
    variant: 'fullpage',
    enableFileUpload: true,
    messages: [
      {
        id: '1',
        type: 'user',
        content: 'Please analyze these documents together',
        timestamp: new Date(Date.now() - 120000),
        attachments: [
          {
            id: 'file-1',
            name: 'Financial_Report.pdf',
            size: 2500000,
            type: 'application/pdf',
            extension: 'PDF',
            category: 'document',
          },
          {
            id: 'file-2',
            name: 'Sales_Data.xlsx',
            size: 850000,
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            extension: 'XLSX',
            category: 'spreadsheet',
          },
          {
            id: 'file-3',
            name: 'Team_Photo.png',
            size: 1200000,
            type: 'image/png',
            extension: 'PNG',
            category: 'image',
            previewUrl: 'https://picsum.photos/200',
          },
          {
            id: 'file-4',
            name: 'Meeting_Notes.txt',
            size: 15000,
            type: 'text/plain',
            extension: 'TXT',
            category: 'text',
          },
        ],
      },
      {
        id: '2',
        type: 'assistant',
        content: `I've received all 4 files:

1. **Financial_Report.pdf** (2.5 MB) - Financial document
2. **Sales_Data.xlsx** (850 KB) - Spreadsheet data
3. **Team_Photo.png** (1.2 MB) - Image file
4. **Meeting_Notes.txt** (15 KB) - Text notes

I'll analyze these together. What specific insights are you looking for?`,
        timestamp: new Date(Date.now() - 60000),
      },
    ],
  },
  render: (args) => (
    <Chat
      {...args}
      onSendMessage={(msg) => console.log('Message sent:', msg)}
      onFileError={(error, message) => alert(`File Error: ${message}`)}
    />
  ),
};

/**
 * Floating panel variant with file upload
 */
export const FloatingPanel: Story = {
  args: {
    title: 'File Assistant',
    messages: fileUploadMessages.slice(0, 2),
    variant: 'floating',
    height: '600px',
    width: '450px',
    placeholder: 'Ask about your file...',
    enableFileUpload: true,
  },
  parameters: {
    layout: 'centered',
  },
  render: (args) => (
    <Chat
      {...args}
      onSendMessage={(msg) => console.log('Message sent:', msg)}
      onFileError={(error, message) => alert(`File Error: ${message}`)}
    />
  ),
};

/**
 * Without file upload (original behavior)
 */
export const WithoutFileUpload: Story = {
  args: {
    title: 'Standard Chat',
    messages: [
      {
        id: '1',
        type: 'user',
        content: 'This is a chat without file upload functionality',
        timestamp: new Date(Date.now() - 60000),
      },
      {
        id: '2',
        type: 'assistant',
        content: 'Notice there is no + button for file attachments in this variant.',
        timestamp: new Date(),
      },
    ],
    variant: 'fullpage',
    placeholder: 'Ask von anything...',
    enableFileUpload: false,
  },
  render: (args) => <Chat {...args} onSendMessage={(msg) => console.log('Message sent:', msg)} />,
};
