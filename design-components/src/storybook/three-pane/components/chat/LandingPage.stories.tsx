import type { Meta, StoryObj, Decorator } from '@storybook/react-vite';
import { ChatEmptyState } from '../../../../components/Chat/ChatEmptyState';
import { DEFAULT_COMMANDS } from '../../../../components/Commands';
import { PrototypeFrame } from '../PrototypeFrame';

/**
 * FullPageDecorator - Full viewport height container
 */
const FullPageDecorator: Decorator = (Story) => (
  <div
    style={{
      height: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f7',
      overflow: 'hidden',
    }}
  >
    <Story />
  </div>
);

const meta = {
  title: 'Prototypes/Landing Page',
  component: ChatEmptyState,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'neutral',
      values: [{ name: 'neutral', value: '#f5f5f7' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChatEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Landing Page - Full 3-Pane Layout with Sidebar
// ============================================================================

/**
 * Landing Page
 *
 * Complete landing page using the production ChatEmptyState component
 * inside a PrototypeFrame with sidebar.
 *
 * Features:
 * - ChatSidebarV2 (collapsible)
 * - Von logo with gradient
 * - Time-based greeting
 * - StandardChatInput via ChatInputSelector
 * - Category pills + template carousel
 * - Disclaimer text
 */
export const LandingPage: Story = {
  decorators: [FullPageDecorator],
  render: () => (
    <PrototypeFrame>
      <ChatEmptyState
        userName="Sarah"
        useStandardInput
        showPlusMenu
        enableFileUpload
        enableCommands
        commands={DEFAULT_COMMANDS}
        onSendMessage={(message, attachments, options) =>
          console.log('Send:', message, attachments, options)
        }
        onFileError={(error, message) => console.log('File error:', error, message)}
      />
    </PrototypeFrame>
  ),
};
