import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../components/Avatar';

const meta = {
  title: 'Atoms/Display/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size of the avatar',
    },
    src: {
      control: 'text',
      description: 'Image source URL',
    },
    alt: {
      control: 'text',
      description: 'Alt text for the image',
    },
    fallback: {
      control: 'text',
      description: 'Fallback text (initials) when no image',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=1',
    alt: 'User Avatar',
  },
};

export const WithFallback: Story = {
  args: {
    fallback: 'JD',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    src: 'https://i.pravatar.cc/150?img=2',
  },
};

export const Medium: Story = {
  args: {
    size: 'medium',
    src: 'https://i.pravatar.cc/150?img=3',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    src: 'https://i.pravatar.cc/150?img=4',
  },
};

export const Clickable: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=5',
    onClick: () => alert('Avatar clicked!'),
  },
};

export const FallbackInitials: Story = {
  args: {
    size: 'medium',
    fallback: 'AB',
  },
};

export const AllSizes: Story = {
  args: { src: 'https://i.pravatar.cc/150?img=6' },
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Avatar size="small" src="https://i.pravatar.cc/150?img=7" />
      <Avatar size="medium" src="https://i.pravatar.cc/150?img=8" />
      <Avatar size="large" src="https://i.pravatar.cc/150?img=9" />
    </div>
  ),
};

export const AllVariants: Story = {
  args: {},
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Avatar src="https://i.pravatar.cc/150?img=10" alt="With Image" />
        <Avatar fallback="JD" />
        <Avatar />
      </div>
    </div>
  ),
};
