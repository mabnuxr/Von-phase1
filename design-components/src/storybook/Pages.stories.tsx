import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { TopBar } from '../components/TopBar';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatConversation } from '../components/ChatConversation';
import type { ConversationMessage } from '../components/ChatConversation';

// Meta component for Pages
const PagesDemo = () => <div>Pages - Actual Product Screens</div>;

const meta = {
  title: 'Pages/Product Screens',
  component: PagesDemo,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PagesDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Chat Page - Complete Chat Interface
 *
 * A complete chat interface with:
 * - TopBar for navigation with tabs and search
 * - Two-pane layout: ChatSidebar + ChatConversation
 * - Page background: rgb(240, 239, 239)
 * - Content backgrounds: White
 */
export const ChatPage: Story = {
  render: () => {
    const [selectedChatId, setSelectedChatId] = React.useState('2');
    const [messages, setMessages] = React.useState<ConversationMessage[]>([
      {
        id: '1',
        type: 'user',
        content: 'How much will I win this quarter?',
        showAvatar: true,
      },
      {
        id: '2',
        type: 'assistant',
        content:
          'Based on the Forecast Q3 data, your projected win rate for this quarter is $2.4M across 12 opportunities. This represents a 15% increase from Q2.',
        showTabs: true,
        activeTab: 'output',
        documents: [
          { id: 'd1', title: 'Forecast Q3', timestamp: '2 min ago' },
          { id: 'd2', title: 'Sales Pipeline Report', timestamp: '5 min ago' },
        ],
        showAvatar: true,
      },
    ]);

    const chatItems = [
      { id: '1', label: 'Team Review', timestamp: 'Yesterday' },
      { id: '2', label: 'Forecast Q3', timestamp: '2 hours ago' },
      { id: '3', label: 'Sales Performance Analysis', timestamp: 'Last week' },
      { id: '4', label: 'Revenue Projections', timestamp: '3 days ago' },
      { id: '5', label: 'Market Analysis', timestamp: 'Last month' },
    ];

    const handleSendMessage = (content: string) => {
      const newMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        type: 'user',
        content,
        showAvatar: true,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Simulate assistant response
      setTimeout(() => {
        const assistantMessage: ConversationMessage = {
          id: `msg-${Date.now()}-assistant`,
          type: 'assistant',
          content:
            'This is a demo response from the von AI assistant. In production, this would connect to your backend API for real conversational AI.',
          showTabs: true,
          activeTab: 'output',
          showAvatar: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }, 1000);
    };

    const handleAskMessage = (content: string) => {
      const newMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        type: 'user',
        content,
        showAvatar: true,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Simulate assistant response with document references
      setTimeout(() => {
        const assistantMessage: ConversationMessage = {
          id: `msg-${Date.now()}-assistant`,
          type: 'assistant',
          content:
            "Here's the analysis you requested based on the Forecast Q3 data and recent sales reports.",
          showTabs: true,
          activeTab: 'output',
          documents: [{ id: `doc-${Date.now()}`, title: 'Forecast Q3', timestamp: 'Just now' }],
          showAvatar: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }, 1000);
    };

    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f7',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* TopBar in White Rounded Container */}
        <div
          style={{
            margin: '32px 24px 12px 24px',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <TopBar
            logoSrc="/logo.gif"
            onLogoClick={() => console.log('Logo clicked')}
            showMenu={false}
          />
        </div>

        {/* Two-Pane Layout with Rounded Corners */}
        <div
          style={{
            display: 'flex',
            height: 'calc(100vh - 120px)',
            padding: '0 24px 24px 24px',
            gap: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Left Pane - ChatSidebar with rounded corners */}
          <div
            style={{
              width: '200px',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <ChatSidebar
              chatItems={chatItems}
              selectedChatId={selectedChatId}
              onChatClick={(id) => setSelectedChatId(id)}
              onNewChatClick={() => {
                setMessages([]);
                console.log('New chat created');
              }}
              onSearchChange={(value) => console.log('Search chats:', value)}
              searchPlaceholder="Search conversations..."
              width="100%"
            />
          </div>

          {/* Right Pane - ChatConversation with rounded corners */}
          <div
            style={{
              flex: 1,
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <ChatConversation
              question="How much will I win this quarter?"
              messages={messages}
              onSend={handleSendMessage}
              onAsk={handleAskMessage}
              onBuild={() => console.log('Build clicked')}
              contextTag="@Forecast Q3"
              showActionButtons={true}
              placeholder="Ask von anything"
            />
          </div>
        </div>
      </div>
    );
  },
};
