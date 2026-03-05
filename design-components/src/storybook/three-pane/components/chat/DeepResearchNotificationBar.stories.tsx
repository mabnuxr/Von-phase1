import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeepResearchNotificationBar } from '../../../../components/Chat/DeepResearch/DeepResearchNotificationBar';

const meta = {
  title: 'Components/Chat/DeepResearchNotificationBar',
  component: DeepResearchNotificationBar,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '600px', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DeepResearchNotificationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state - visible notification bar
 */
export const Default: Story = {
  args: {
    isVisible: true,
  },
};

/**
 * Hidden state - notification bar is not visible
 */
export const Hidden: Story = {
  args: {
    isVisible: false,
  },
};

/**
 * Custom message - with a different message
 */
export const CustomMessage: Story = {
  args: {
    isVisible: true,
    message: "Your deep research is running in the background. We'll notify you when it's ready.",
  },
};
