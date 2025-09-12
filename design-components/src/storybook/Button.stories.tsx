import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from '../components/Button/Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: 'Click Me',
    color: 'primary',
    width: 150,
  },
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    width: {
      control: 'text',
      description: 'Width of the button (number or string)',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler function',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    color: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    color: 'secondary',
    children: 'Secondary Button',
  },
};

export const Danger: Story = {
  args: {
    color: 'danger',
    children: 'Delete',
  },
};

export const CustomWidth: Story = {
  args: {
    color: 'primary',
    children: 'Custom Width',
    width: '100%',
  },
};

export const Small: Story = {
  args: {
    color: 'primary',
    children: 'Small',
    width: 80,
  },
};

export const Large: Story = {
  args: {
    color: 'primary',
    children: 'Large Button',
    width: 250,
  },
};
