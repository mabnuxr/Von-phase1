import type { Meta, StoryObj } from '@storybook/react-vite';
import Divider from '../../components/Layout/Divider/Divider';

const meta: Meta<typeof Divider> = {
  title: 'Layout/Divider',
  component: Divider,
  argTypes: {
    vertical: { control: 'boolean' },
    children: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div style={{ padding: 20 }}>
      <div>Above</div>
      <Divider {...args}>Section Title</Divider>
      <div>Below</div>
    </div>
  ),
  args: {
    vertical: false,
    children: 'Section Title',
  },
};

export const Vertical: Story = {
  render: (args) => (
    <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span>Left</span>
      <Divider {...args} />
      <span>Right</span>
    </div>
  ),
  args: {
    vertical: true,
  },
};
