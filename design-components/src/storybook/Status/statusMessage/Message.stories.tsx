import type { Meta, StoryObj } from '@storybook/react-vite';
import { Message } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

const meta: Meta<typeof Message> = {
  title: 'Status/Message',
  component: Message,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
    showIcon: { control: 'boolean' },
    closable: { control: 'boolean' },
    children: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    type: 'info',
    children: 'This is an info message.',
    showIcon: true,
    closable: true,
  },
};

export const Success: Story = {
  args: {
    type: 'success',
    children: 'Action completed successfully!',
    showIcon: true,
    closable: false,
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    children: 'Please check the details.',
    showIcon: true,
    closable: true,
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    children: 'Something went wrong!',
    showIcon: true,
    closable: true,
  },
};
