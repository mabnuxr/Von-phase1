import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chat } from '../components/Chat';

const meta = {
  title: 'Organisms/Chat',
  component: Chat,
  parameters: {
    layout: 'centered',
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
    isLoading: {
      control: 'boolean',
      description: 'Whether the chat is in a loading state',
    },
    height: {
      control: 'text',
      description: 'Height of the chat container',
    },
    width: {
      control: 'text',
      description: 'Width of the chat container',
    },
    variant: {
      control: 'select',
      options: ['floating', 'fixed', 'fullpage'],
      description: 'Chat variant - floating, fixed position, or fullpage',
    },
    onSendMessage: { action: 'message sent' },
    onAddClick: { action: 'add clicked' },
    onRefreshClick: { action: 'refresh clicked' },
    onClose: { action: 'close clicked' },
    onError: { action: 'error occurred' },
  },
} satisfies Meta<typeof Chat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Forecast Q3',
    placeholder: 'Ask von anything',
  },
};

export const EmptyState: Story = {
  args: {
    title: 'Chat',
    messages: [],
  },
};

export const WithMessages: Story = {
  args: {
    title: 'Forecast Q3',
    messages: [
      {
        id: '1',
        type: 'assistant',
        content:
          '3 deals moved stages in your Forecast for Q3:\n• Acme Corp → Negotiation ($240K)\n• TechStart → Closed Won ($180K)\n• GlobalRetail → Pushed to Q4 ($500K)',
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: '2',
        type: 'user',
        content: "What's changed since yesterday?",
        timestamp: new Date(Date.now() - 3000000),
      },
      {
        id: '3',
        type: 'assistant',
        content: "Give me a roll-up view of my team's forecast for this quarter",
        timestamp: new Date(Date.now() - 2400000),
      },
      {
        id: '4',
        type: 'user',
        content: 'Which rep owns the GlobalRetail deal?',
        timestamp: new Date(Date.now() - 1800000),
      },
      {
        id: '5',
        type: 'assistant',
        content: 'Sarah Chen owns GlobalRetail.\nLast activity: pricing discussion 3 days ago',
        timestamp: new Date(Date.now() - 1200000),
      },
    ],
  },
};

export const LoadingState: Story = {
  args: {
    title: 'Forecast Q3',
    isLoading: true,
    messages: [
      {
        id: '1',
        type: 'user',
        content: 'Show me the latest pipeline updates',
        timestamp: new Date(),
      },
    ],
  },
};

export const ConversationExample: Story = {
  args: {
    title: 'Forecast Q3',
    messages: [
      {
        id: '1',
        type: 'assistant',
        content:
          '3 deals moved stages in your Forecast for Q3:\n• Acme Corp → Negotiation ($240K)\n• TechStart → Closed Won ($180K)\n• GlobalRetail → Pushed to Q4 ($500K)',
      },
      {
        id: '2',
        type: 'user',
        content: "What's changed since yesterday?",
      },
      {
        id: '3',
        type: 'assistant',
        content:
          'Sure! I have built a forecast view for your team this quarter. There are 18 Deals under progress.',
      },
    ],
  },
};

export const CustomSize: Story = {
  args: {
    title: 'Sales Chat',
    height: '800px',
    width: '500px',
    messages: [
      {
        id: '1',
        type: 'assistant',
        content: 'Hello! How can I help you today?',
      },
    ],
  },
};

export const AllStates: Story = {
  args: { title: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Chat title="Empty" messages={[]} height="400px" width="320px" />
      <Chat
        title="With Messages"
        height="400px"
        width="320px"
        messages={[
          {
            id: '1',
            type: 'assistant',
            content: 'Hello! How can I help?',
          },
          {
            id: '2',
            type: 'user',
            content: 'Show me my deals',
          },
        ]}
      />
      <Chat
        title="Loading"
        height="400px"
        width="320px"
        isLoading
        messages={[
          {
            id: '1',
            type: 'user',
            content: 'What are my top deals?',
          },
        ]}
      />
    </div>
  ),
};

export const FloatingVariant: Story = {
  args: {
    title: 'Forecast Q3',
    variant: 'floating',
    messages: [
      {
        id: '1',
        type: 'assistant',
        content:
          '3 deals moved stages in your Forecast for Q3:\n• Acme Corp → Negotiation ($240K)\n• TechStart → Closed Won ($180K)\n• GlobalRetail → Pushed to Q4 ($500K)',
      },
      {
        id: '2',
        type: 'user',
        content: "What's changed since yesterday?",
      },
    ],
  },
};

export const FixedBottomRight: Story = {
  args: {
    title: 'Chat Assistant',
    variant: 'fixed',
    fixedPosition: { bottom: '24px', right: '24px' },
    messages: [
      {
        id: '1',
        type: 'assistant',
        content: "Hi! I'm your chat assistant. How can I help you today?",
      },
    ],
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const FixedCustomPosition: Story = {
  args: {
    title: 'Support Chat',
    variant: 'fixed',
    fixedPosition: { top: '80px', right: '40px' },
    height: '500px',
    width: '380px',
    messages: [
      {
        id: '1',
        type: 'assistant',
        content: 'Welcome to support! How can we assist you?',
      },
      {
        id: '2',
        type: 'user',
        content: 'I need help with my account',
      },
      {
        id: '3',
        type: 'assistant',
        content:
          "I'd be happy to help with your account. What specific issue are you experiencing?",
      },
    ],
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const FullPageVariant: Story = {
  args: {
    title: 'Full Screen Chat',
    variant: 'fullpage',
    messages: [
      {
        id: '1',
        type: 'assistant',
        content:
          'Welcome to the full-page chat experience! This variant covers the entire viewport.',
      },
      {
        id: '2',
        type: 'user',
        content: 'This is great for immersive conversations!',
      },
      {
        id: '3',
        type: 'assistant',
        content:
          'Absolutely! The full-page variant is perfect for:\n• Deep focus mode\n• Extended conversations\n• Maximum content visibility\n• Distraction-free interaction',
      },
    ],
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const VariantComparison: Story = {
  args: { title: 'Placeholder' },
  render: () => (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        padding: '2rem',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
          Floating Variant
        </h2>
        <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.875rem' }}>
          Normal document flow • Custom width/height • Shadow
        </p>
        <Chat
          title="Floating Chat"
          variant="floating"
          height="400px"
          width="380px"
          messages={[
            {
              id: '1',
              type: 'assistant',
              content: "This is a floating variant. I'm positioned in the normal document flow.",
            },
          ]}
        />
      </div>

      <Chat
        title="Fixed Chat"
        variant="fixed"
        fixedPosition={{ bottom: '24px', right: '24px' }}
        messages={[
          {
            id: '1',
            type: 'assistant',
            content: 'Fixed variant at bottom-right. Click × to close.',
          },
        ]}
      />

      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          padding: '1rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '300px',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
          💡 <strong>Tip:</strong> Try the "Full Screen Chat" story to see the fullpage variant!
        </p>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
