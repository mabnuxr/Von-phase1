import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dropdown } from '../components/Dropdown';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';

const meta = {
  title: 'Molecules/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
      description: 'Position of the dropdown menu',
    },
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = [
  {
    key: 'profile',
    label: 'Profile',
    onClick: () => console.log('Profile clicked'),
  },
  {
    key: 'settings',
    label: 'Settings',
    onClick: () => console.log('Settings clicked'),
  },
  {
    key: 'logout',
    label: 'Log out',
    onClick: () => console.log('Logout clicked'),
  },
];

export const Default: Story = {
  args: {
    trigger: <Button>Open Menu</Button>,
    items: sampleItems,
  },
};

export const WithAvatar: Story = {
  args: {
    trigger: <Avatar src="https://i.pravatar.cc/150?img=1" />,
    items: [
      {
        key: 'settings',
        label: 'Settings',
        onClick: () => alert('Settings clicked'),
      },
      {
        key: 'logout',
        label: 'Log out',
        onClick: () => alert('Logout clicked'),
      },
    ],
  },
};

export const BottomLeft: Story = {
  args: {
    trigger: <Button>Bottom Left</Button>,
    items: sampleItems,
    position: 'bottom-left',
  },
};

export const BottomRight: Story = {
  args: {
    trigger: <Button>Bottom Right</Button>,
    items: sampleItems,
    position: 'bottom-right',
  },
};

export const WithIcons: Story = {
  args: {
    trigger: <Button>With Icons</Button>,
    items: [
      {
        key: 'user',
        label: 'Profile',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        ),
        onClick: () => console.log('Profile'),
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
          </svg>
        ),
        onClick: () => console.log('Settings'),
      },
      {
        key: 'logout',
        label: 'Log out',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </svg>
        ),
        onClick: () => console.log('Logout'),
      },
    ],
  },
};

export const WithDisabledItem: Story = {
  args: {
    trigger: <Button>Open Menu</Button>,
    items: [
      {
        key: 'profile',
        label: 'Profile',
        onClick: () => console.log('Profile'),
      },
      {
        key: 'settings',
        label: 'Settings (disabled)',
        disabled: true,
        onClick: () => console.log('Settings'),
      },
      {
        key: 'logout',
        label: 'Log out',
        onClick: () => console.log('Logout'),
      },
    ],
  },
};

export const UserMenu: Story = {
  args: {
    trigger: <Avatar fallback="JD" size="medium" />,
    items: [
      {
        key: 'settings',
        label: 'Settings',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
          </svg>
        ),
        onClick: () => alert('Navigate to Settings'),
      },
      {
        key: 'logout',
        label: 'Log out',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </svg>
        ),
        onClick: () => alert('Logout'),
      },
    ],
  },
};
