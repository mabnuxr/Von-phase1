
import type { Meta, StoryObj } from '@storybook/react-vite';
import AvatarDisplay from '../../components/MediaAndIcon/Avatar/Avatar';

const meta = {
  title: 'Media-and-Icon/AvatarDisplay',
  component: AvatarDisplay,
} satisfies Meta<typeof AvatarDisplay>;

export default meta;

type Story = StoryObj<typeof AvatarDisplay>;

export const Default: Story = {
  args: {
  src: 'https://i.pravatar.cc/100?img=1',
  alt: 'User Avatar',
  size: 'md',
  circle: true,
  },
};

export const WithInitials: Story = {
  args: {
    children: 'AB',
    size: 'md',
  },
};

export const Square: Story = {
  args: {
    src: 'https://i.pravatar.cc/100?img=2',
    circle: false,
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    src: 'https://i.pravatar.cc/100?img=3',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    src: 'https://i.pravatar.cc/100?img=4',
    size: 'lg',
  },
};
