import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Avatar } from '../components/Avatar';
import { Menu } from '../components/Menu';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Box } from '../components/Box';
import { Stack } from '../components/Stack';
import { Text } from '../components/Text';
import { Heading } from '../components/Heading';
import { colors } from '../theme';

// This is a meta component for demonstrating composition recipes
const RecipesDemo = () => <div>Recipes & Examples</div>;

const meta = {
  title: 'Examples/Composition Patterns',
  component: RecipesDemo,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RecipesDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A user profile card combining Avatar, Text, and Button atoms with Box and Stack layouts.
 * Demonstrates how to compose atoms into a complete UI pattern.
 */
export const UserProfileCard: Story = {
  render: () => (
    <Box
      padding={6}
      backgroundColor={colors.common.white}
      borderRadius="lg"
      border
      borderColor={colors.neutral[200]}
      style={{ maxWidth: '320px' }}
    >
      <Stack direction="vertical" gap="lg" align="center">
        <Avatar size="large" src="https://i.pravatar.cc/150?img=12" />
        <Stack direction="vertical" gap="sm" align="center">
          <Heading level="h3">Sarah Johnson</Heading>
          <Text variant="body" color="secondary">
            Product Designer
          </Text>
          <Text variant="caption" color="secondary">
            sarah.johnson@example.com
          </Text>
        </Stack>
        <Stack direction="horizontal" gap="sm" style={{ width: '100%' }}>
          <Button variant="primary" fullWidth>
            Follow
          </Button>
          <Button variant="secondary" fullWidth>
            Message
          </Button>
        </Stack>
      </Stack>
    </Box>
  ),
};

/**
 * A search bar combining Input and Button atoms with Stack layout.
 * Shows a common pattern for search functionality.
 */
export const SearchBar: Story = {
  render: () => (
    <Box padding={4} backgroundColor={colors.neutral[50]} borderRadius="md">
      <Stack direction="horizontal" gap="sm" align="center">
        <Input placeholder="Search..." fullWidth style={{ flex: 1 }} />
        <Button variant="primary">Search</Button>
      </Stack>
    </Box>
  ),
};

/**
 * A navigation header combining Avatar, Menu, and layout atoms.
 * Demonstrates a complete header pattern with user menu.
 */
export const NavigationHeader: Story = {
  render: () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    return (
      <Box
        padding={4}
        backgroundColor={colors.common.white}
        border
        borderColor={colors.neutral[200]}
        style={{ borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
      >
        <Stack direction="horizontal" justify="space-between" align="center">
          <Heading level="h4" style={{ margin: 0 }}>
            My Application
          </Heading>
          <Stack direction="horizontal" gap="md" align="center">
            <Button variant="ghost">Dashboard</Button>
            <Button variant="ghost">Projects</Button>
            <Button variant="ghost">Team</Button>
            <div style={{ position: 'relative' }} ref={menuRef}>
              <Avatar
                size="small"
                src="https://i.pravatar.cc/150?img=20"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ cursor: 'pointer' }}
              />
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px' }}>
                <Menu
                  isOpen={isMenuOpen}
                  onClose={() => setIsMenuOpen(false)}
                  items={[
                    { key: 'profile', label: 'Profile', onClick: () => console.log('Profile') },
                    { key: 'settings', label: 'Settings', onClick: () => console.log('Settings') },
                    { key: 'logout', label: 'Log out', onClick: () => console.log('Logout') },
                  ]}
                />
              </div>
            </div>
          </Stack>
        </Stack>
      </Box>
    );
  },
};

/**
 * A form section combining Input atoms with layout and typography atoms.
 * Shows a typical form composition pattern.
 */
export const LoginForm: Story = {
  render: () => (
    <Box
      padding={8}
      backgroundColor={colors.common.white}
      borderRadius="lg"
      border
      borderColor={colors.neutral[200]}
      style={{ maxWidth: '400px' }}
    >
      <Stack direction="vertical" gap="lg">
        <Stack direction="vertical" gap="sm">
          <Heading level="h3">Sign in to your account</Heading>
          <Text variant="body" color="secondary">
            Enter your credentials to continue
          </Text>
        </Stack>
        <Stack direction="vertical" gap="md">
          <Input label="Email address" type="email" placeholder="you@example.com" fullWidth />
          <Input label="Password" type="password" placeholder="Enter your password" fullWidth />
        </Stack>
        <Stack direction="horizontal" justify="space-between" align="center">
          <Text variant="caption">
            <a href="#" style={{ color: colors.primary[500], textDecoration: 'none' }}>
              Forgot password?
            </a>
          </Text>
        </Stack>
        <Button variant="primary" fullWidth>
          Sign in
        </Button>
      </Stack>
    </Box>
  ),
};

/**
 * A stat card combining Text and Heading atoms with Box layout.
 * Demonstrates a dashboard metric pattern.
 */
export const StatCard: Story = {
  render: () => (
    <Stack direction="horizontal" gap="md" style={{ flexWrap: 'wrap' }}>
      <Box
        padding={6}
        backgroundColor={colors.primary[50]}
        borderRadius="md"
        border
        borderColor={colors.primary[200]}
        style={{ minWidth: '200px' }}
      >
        <Stack direction="vertical" gap="sm">
          <Text variant="label" color="secondary">
            Total Users
          </Text>
          <Heading level="h2" color="primary">
            12,543
          </Heading>
          <Text variant="caption" color="success">
            +12% from last month
          </Text>
        </Stack>
      </Box>
      <Box
        padding={6}
        backgroundColor={colors.success[50]}
        borderRadius="md"
        border
        borderColor={colors.success[200]}
        style={{ minWidth: '200px' }}
      >
        <Stack direction="vertical" gap="sm">
          <Text variant="label" color="secondary">
            Revenue
          </Text>
          <Heading level="h2" style={{ color: colors.success[700] }}>
            $45,231
          </Heading>
          <Text variant="caption" color="success">
            +8% from last month
          </Text>
        </Stack>
      </Box>
      <Box
        padding={6}
        backgroundColor={colors.info[50]}
        borderRadius="md"
        border
        borderColor={colors.info[200]}
        style={{ minWidth: '200px' }}
      >
        <Stack direction="vertical" gap="sm">
          <Text variant="label" color="secondary">
            Active Projects
          </Text>
          <Heading level="h2" style={{ color: colors.info[700] }}>
            32
          </Heading>
          <Text variant="caption" color="info">
            4 completed this week
          </Text>
        </Stack>
      </Box>
    </Stack>
  ),
};

/**
 * A notification list combining Avatar, Text atoms with Stack and Box layouts.
 * Shows a common notification/activity feed pattern.
 */
export const NotificationList: Story = {
  render: () => (
    <Box
      backgroundColor={colors.common.white}
      borderRadius="lg"
      border
      borderColor={colors.neutral[200]}
      style={{ maxWidth: '500px' }}
    >
      <Box padding={4} style={{ borderBottom: `1px solid ${colors.neutral[200]}` }}>
        <Heading level="h5" style={{ margin: 0 }}>
          Notifications
        </Heading>
      </Box>
      <Stack direction="vertical" gap="xs">
        {[
          {
            avatar: 'https://i.pravatar.cc/150?img=30',
            name: 'Alice Cooper',
            action: 'commented on your post',
            time: '5 min ago',
          },
          {
            avatar: 'https://i.pravatar.cc/150?img=31',
            name: 'Bob Smith',
            action: 'liked your photo',
            time: '1 hour ago',
          },
          {
            avatar: 'https://i.pravatar.cc/150?img=32',
            name: 'Carol Davis',
            action: 'started following you',
            time: '2 hours ago',
          },
        ].map((notification, idx) => (
          <Box
            key={idx}
            padding={4}
            style={{
              borderBottom: idx < 2 ? `1px solid ${colors.neutral[100]}` : 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.neutral[50];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Stack direction="horizontal" gap="md" align="start">
              <Avatar size="medium" src={notification.avatar} />
              <Stack direction="vertical" gap="xs" style={{ flex: 1 }}>
                <Text variant="body">
                  <strong>{notification.name}</strong> {notification.action}
                </Text>
                <Text variant="caption" color="secondary">
                  {notification.time}
                </Text>
              </Stack>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  ),
};
