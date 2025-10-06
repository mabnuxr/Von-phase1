import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Header } from '../components/Header';
import { Box } from '../components/Box';
import { Stack } from '../components/Stack';
import { Container } from '../components/Container';
import { Text } from '../components/Text';
import { Heading } from '../components/Heading';
import { Button } from '../components/Button';
import { colors } from '../theme';

// Meta component for Templates
const TemplatesDemo = () => <div>Templates - Page Layouts</div>;

const meta = {
  title: 'Templates/Page Layouts',
  component: TemplatesDemo,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TemplatesDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Two-Pane Layout
 *
 * A vertical split layout with:
 * - Header with logo and user menu
 * - Left pane: Navigation sidebar (280px)
 * - Right pane: Main content area (flexible)
 *
 * Ideal for: Dashboards, Settings, Admin panels
 */
export const TwoPane: Story = {
  render: () => {
    const menuItems = [
      { key: 'profile', label: 'Profile', onClick: () => console.log('Profile') },
      { key: 'settings', label: 'Settings', onClick: () => console.log('Settings') },
      { key: 'divider', isDivider: true } as const,
      { key: 'logout', label: 'Log out', onClick: () => console.log('Logout') },
    ];

    return (
      <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Header logoSrc="/logo.gif" avatarFallback="JD" menuItems={menuItems} />

        {/* Two-Pane Layout */}
        <Box style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Pane - Navigation */}
          <Box
            backgroundColor={colors.neutral[50]}
            style={{
              width: '280px',
              borderRight: `1px solid ${colors.neutral[200]}`,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Navigation Header */}
            <Box padding={5} style={{ borderBottom: `1px solid ${colors.neutral[200]}` }}>
              <Heading level="h6" style={{ margin: 0, color: colors.neutral[600] }}>
                Navigation
              </Heading>
            </Box>

            {/* Navigation Items */}
            <Box style={{ padding: '16px', flex: 1 }}>
              <Stack direction="vertical" gap="xs">
                <Button variant="primary" fullWidth style={{ justifyContent: 'flex-start' }}>
                  Dashboard
                </Button>
                <Button variant="ghost" fullWidth style={{ justifyContent: 'flex-start' }}>
                  Analytics
                </Button>
                <Button variant="ghost" fullWidth style={{ justifyContent: 'flex-start' }}>
                  Reports
                </Button>
                <Button variant="ghost" fullWidth style={{ justifyContent: 'flex-start' }}>
                  Team
                </Button>
                <Button variant="ghost" fullWidth style={{ justifyContent: 'flex-start' }}>
                  Settings
                </Button>
              </Stack>
            </Box>
          </Box>

          {/* Right Pane - Main Content */}
          <Box style={{ flex: 1, overflow: 'auto', backgroundColor: colors.common.white }}>
            <Container maxWidth="xl" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
              <Stack direction="vertical" gap="xl">
                {/* Page Header */}
                <Box>
                  <Heading level="h1" style={{ marginBottom: '8px' }}>
                    Dashboard Overview
                  </Heading>
                  <Text variant="body" color="secondary">
                    Monitor your key metrics and performance indicators
                  </Text>
                </Box>

                {/* Content Grid */}
                <Box
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                  }}
                >
                  {/* Metric Card 1 */}
                  <Box
                    padding={5}
                    backgroundColor={colors.neutral[50]}
                    borderRadius="lg"
                    border
                    borderColor={colors.neutral[200]}
                  >
                    <Text
                      variant="label"
                      color="secondary"
                      style={{ display: 'block', marginBottom: '12px' }}
                    >
                      Total Revenue
                    </Text>
                    <Heading level="h2" style={{ margin: 0 }}>
                      $47,293
                    </Heading>
                    <Text variant="bodySmall" color="secondary" style={{ marginTop: '8px' }}>
                      +12.5% from last month
                    </Text>
                  </Box>

                  {/* Metric Card 2 */}
                  <Box
                    padding={5}
                    backgroundColor={colors.neutral[50]}
                    borderRadius="lg"
                    border
                    borderColor={colors.neutral[200]}
                  >
                    <Text
                      variant="label"
                      color="secondary"
                      style={{ display: 'block', marginBottom: '12px' }}
                    >
                      Active Users
                    </Text>
                    <Heading level="h2" style={{ margin: 0 }}>
                      2,847
                    </Heading>
                    <Text variant="bodySmall" color="secondary" style={{ marginTop: '8px' }}>
                      +8.1% from last month
                    </Text>
                  </Box>

                  {/* Metric Card 3 */}
                  <Box
                    padding={5}
                    backgroundColor={colors.neutral[50]}
                    borderRadius="lg"
                    border
                    borderColor={colors.neutral[200]}
                  >
                    <Text
                      variant="label"
                      color="secondary"
                      style={{ display: 'block', marginBottom: '12px' }}
                    >
                      Conversion Rate
                    </Text>
                    <Heading level="h2" style={{ margin: 0 }}>
                      3.24%
                    </Heading>
                    <Text variant="bodySmall" color="secondary" style={{ marginTop: '8px' }}>
                      -0.3% from last month
                    </Text>
                  </Box>
                </Box>

                {/* Main Content Area */}
                <Box
                  padding={6}
                  backgroundColor={colors.neutral[50]}
                  borderRadius="lg"
                  border
                  borderColor={colors.neutral[200]}
                  style={{ minHeight: '400px' }}
                >
                  <Heading level="h4" style={{ marginBottom: '16px' }}>
                    Activity Chart
                  </Heading>
                  <Text color="secondary">[Chart visualization area]</Text>
                </Box>
              </Stack>
            </Container>
          </Box>
        </Box>
      </Box>
    );
  },
};

/**
 * Three-Pane Layout
 *
 * A vertical three-column layout with:
 * - Header with logo and user menu
 * - Left pane: Primary navigation (280px)
 * - Center pane: Main content area (flexible)
 * - Right pane: Contextual info/details (320px)
 *
 * Ideal for: Complex dashboards, Email clients, Project management tools
 */
export const ThreePane: Story = {
  render: () => {
    const menuItems = [
      { key: 'profile', label: 'Profile', onClick: () => console.log('Profile') },
      { key: 'settings', label: 'Settings', onClick: () => console.log('Settings') },
      { key: 'divider', isDivider: true } as const,
      { key: 'logout', label: 'Log out', onClick: () => console.log('Logout') },
    ];

    return (
      <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Header logoSrc="/logo.gif" avatarFallback="JD" menuItems={menuItems} />

        {/* Three-Pane Layout */}
        <Box style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Pane - Navigation */}
          <Box
            backgroundColor={colors.neutral[50]}
            style={{
              width: '280px',
              borderRight: `1px solid ${colors.neutral[200]}`,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Navigation Header */}
            <Box padding={5} style={{ borderBottom: `1px solid ${colors.neutral[200]}` }}>
              <Heading level="h6" style={{ margin: 0, color: colors.neutral[600] }}>
                Navigation
              </Heading>
            </Box>

            {/* Navigation Items */}
            <Box style={{ padding: '16px', flex: 1 }}>
              <Stack direction="vertical" gap="xs">
                <Button variant="primary" fullWidth style={{ justifyContent: 'flex-start' }}>
                  Dashboard
                </Button>
                <Button variant="ghost" fullWidth style={{ justifyContent: 'flex-start' }}>
                  Projects
                </Button>
                <Button variant="ghost" fullWidth style={{ justifyContent: 'flex-start' }}>
                  Tasks
                </Button>
                <Button variant="ghost" fullWidth style={{ justifyContent: 'flex-start' }}>
                  Team
                </Button>
                <Button variant="ghost" fullWidth style={{ justifyContent: 'flex-start' }}>
                  Calendar
                </Button>
                <Button variant="ghost" fullWidth style={{ justifyContent: 'flex-start' }}>
                  Reports
                </Button>
              </Stack>
            </Box>
          </Box>

          {/* Center Pane - Main Content */}
          <Box style={{ flex: 1, overflow: 'auto', backgroundColor: colors.common.white }}>
            <Box style={{ padding: '32px' }}>
              <Stack direction="vertical" gap="lg">
                {/* Page Header */}
                <Box>
                  <Heading level="h1" style={{ marginBottom: '8px' }}>
                    Project Dashboard
                  </Heading>
                  <Text variant="body" color="secondary">
                    Track progress and manage your active projects
                  </Text>
                </Box>

                {/* Project Cards */}
                <Stack direction="vertical" gap="md">
                  <Box
                    padding={5}
                    backgroundColor={colors.neutral[50]}
                    borderRadius="lg"
                    border
                    borderColor={colors.neutral[200]}
                  >
                    <Stack direction="vertical" gap="sm">
                      <Heading level="h4" style={{ margin: 0 }}>
                        Website Redesign
                      </Heading>
                      <Text variant="bodySmall" color="secondary">
                        In Progress • Due in 5 days
                      </Text>
                      <Box
                        style={{
                          height: '6px',
                          backgroundColor: colors.neutral[200],
                          borderRadius: '3px',
                          overflow: 'hidden',
                          marginTop: '8px',
                        }}
                      >
                        <Box
                          style={{
                            width: '65%',
                            height: '100%',
                            backgroundColor: colors.primary[500],
                          }}
                        />
                      </Box>
                      <Text variant="caption" color="secondary" style={{ marginTop: '4px' }}>
                        65% complete
                      </Text>
                    </Stack>
                  </Box>

                  <Box
                    padding={5}
                    backgroundColor={colors.neutral[50]}
                    borderRadius="lg"
                    border
                    borderColor={colors.neutral[200]}
                  >
                    <Stack direction="vertical" gap="sm">
                      <Heading level="h4" style={{ margin: 0 }}>
                        Mobile App Development
                      </Heading>
                      <Text variant="bodySmall" color="secondary">
                        In Progress • Due in 12 days
                      </Text>
                      <Box
                        style={{
                          height: '6px',
                          backgroundColor: colors.neutral[200],
                          borderRadius: '3px',
                          overflow: 'hidden',
                          marginTop: '8px',
                        }}
                      >
                        <Box
                          style={{
                            width: '40%',
                            height: '100%',
                            backgroundColor: colors.primary[500],
                          }}
                        />
                      </Box>
                      <Text variant="caption" color="secondary" style={{ marginTop: '4px' }}>
                        40% complete
                      </Text>
                    </Stack>
                  </Box>

                  <Box
                    padding={5}
                    backgroundColor={colors.neutral[50]}
                    borderRadius="lg"
                    border
                    borderColor={colors.neutral[200]}
                  >
                    <Stack direction="vertical" gap="sm">
                      <Heading level="h4" style={{ margin: 0 }}>
                        Marketing Campaign
                      </Heading>
                      <Text variant="bodySmall" color="secondary">
                        Planning • Due in 20 days
                      </Text>
                      <Box
                        style={{
                          height: '6px',
                          backgroundColor: colors.neutral[200],
                          borderRadius: '3px',
                          overflow: 'hidden',
                          marginTop: '8px',
                        }}
                      >
                        <Box
                          style={{
                            width: '15%',
                            height: '100%',
                            backgroundColor: colors.primary[500],
                          }}
                        />
                      </Box>
                      <Text variant="caption" color="secondary" style={{ marginTop: '4px' }}>
                        15% complete
                      </Text>
                    </Stack>
                  </Box>
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* Right Pane - Details */}
          <Box
            backgroundColor={colors.neutral[50]}
            style={{
              width: '320px',
              borderLeft: `1px solid ${colors.neutral[200]}`,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Details Header */}
            <Box padding={5} style={{ borderBottom: `1px solid ${colors.neutral[200]}` }}>
              <Heading level="h6" style={{ margin: 0, color: colors.neutral[600] }}>
                Project Details
              </Heading>
            </Box>

            {/* Details Content */}
            <Box style={{ padding: '16px' }}>
              <Stack direction="vertical" gap="md">
                {/* Quick Stats */}
                <Box
                  padding={4}
                  backgroundColor={colors.common.white}
                  borderRadius="md"
                  border
                  borderColor={colors.neutral[200]}
                >
                  <Text
                    variant="label"
                    color="secondary"
                    style={{ display: 'block', marginBottom: '12px' }}
                  >
                    Active Tasks
                  </Text>
                  <Heading level="h2" style={{ margin: 0 }}>
                    23
                  </Heading>
                  <Text variant="bodySmall" color="secondary" style={{ marginTop: '4px' }}>
                    12 completed this week
                  </Text>
                </Box>

                {/* Team Members */}
                <Box
                  padding={4}
                  backgroundColor={colors.common.white}
                  borderRadius="md"
                  border
                  borderColor={colors.neutral[200]}
                >
                  <Text
                    variant="label"
                    color="secondary"
                    style={{ display: 'block', marginBottom: '12px' }}
                  >
                    Team Members
                  </Text>
                  <Stack direction="vertical" gap="sm">
                    <Text variant="bodySmall">Sarah Johnson</Text>
                    <Text variant="bodySmall">Michael Chen</Text>
                    <Text variant="bodySmall">Emma Davis</Text>
                    <Text variant="bodySmall">James Wilson</Text>
                  </Stack>
                </Box>

                {/* Recent Activity */}
                <Box
                  padding={4}
                  backgroundColor={colors.common.white}
                  borderRadius="md"
                  border
                  borderColor={colors.neutral[200]}
                >
                  <Text
                    variant="label"
                    color="secondary"
                    style={{ display: 'block', marginBottom: '12px' }}
                  >
                    Recent Activity
                  </Text>
                  <Stack direction="vertical" gap="sm">
                    <Box>
                      <Text variant="bodySmall" style={{ display: 'block' }}>
                        Task completed
                      </Text>
                      <Text variant="caption" color="secondary">
                        2 hours ago
                      </Text>
                    </Box>
                    <Box>
                      <Text variant="bodySmall" style={{ display: 'block' }}>
                        New comment added
                      </Text>
                      <Text variant="caption" color="secondary">
                        5 hours ago
                      </Text>
                    </Box>
                    <Box>
                      <Text variant="bodySmall" style={{ display: 'block' }}>
                        File uploaded
                      </Text>
                      <Text variant="caption" color="secondary">
                        Yesterday
                      </Text>
                    </Box>
                  </Stack>
                </Box>

                {/* Upcoming Deadlines */}
                <Box
                  padding={4}
                  backgroundColor={colors.common.white}
                  borderRadius="md"
                  border
                  borderColor={colors.neutral[200]}
                >
                  <Text
                    variant="label"
                    color="secondary"
                    style={{ display: 'block', marginBottom: '12px' }}
                  >
                    Upcoming Deadlines
                  </Text>
                  <Stack direction="vertical" gap="sm">
                    <Box>
                      <Text variant="bodySmall" style={{ display: 'block' }}>
                        Design Review
                      </Text>
                      <Text variant="caption" color="secondary">
                        Tomorrow, 2:00 PM
                      </Text>
                    </Box>
                    <Box>
                      <Text variant="bodySmall" style={{ display: 'block' }}>
                        Client Presentation
                      </Text>
                      <Text variant="caption" color="secondary">
                        Friday, 10:00 AM
                      </Text>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  },
};
