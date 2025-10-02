import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '../components/Box';
import { colors } from '../theme';

const meta = {
  title: 'Layout/Box',
  component: Box,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
      description: 'Padding (all sides)',
    },
    margin: {
      control: 'select',
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
      description: 'Margin (all sides)',
    },
    borderRadius: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'full'],
      description: 'Border radius',
    },
    border: {
      control: 'boolean',
      description: 'Show border',
    },
  },
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Box with default styling',
  },
};

export const WithPadding: Story = {
  args: {
    padding: 4,
    backgroundColor: colors.primary[50],
    children: 'Box with padding',
  },
};

export const WithMargin: Story = {
  args: {
    margin: 4,
    padding: 4,
    backgroundColor: colors.primary[50],
    children: 'Box with margin',
  },
};

export const WithBorder: Story = {
  args: {
    padding: 4,
    border: true,
    borderColor: colors.primary[500],
    children: 'Box with border',
  },
};

export const WithBorderRadius: Story = {
  args: {
    padding: 4,
    backgroundColor: colors.primary[500],
    borderRadius: 'lg',
    children: <span style={{ color: 'white' }}>Box with border radius</span>,
  },
};

export const PaddingVariants: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Box
        padding={2}
        backgroundColor={colors.primary[100]}
        border
        borderColor={colors.primary[300]}
      >
        Padding: 2 (8px)
      </Box>
      <Box
        padding={4}
        backgroundColor={colors.primary[100]}
        border
        borderColor={colors.primary[300]}
      >
        Padding: 4 (16px)
      </Box>
      <Box
        padding={6}
        backgroundColor={colors.primary[100]}
        border
        borderColor={colors.primary[300]}
      >
        Padding: 6 (24px)
      </Box>
      <Box
        padding={8}
        backgroundColor={colors.primary[100]}
        border
        borderColor={colors.primary[300]}
      >
        Padding: 8 (32px)
      </Box>
    </div>
  ),
};

export const BorderRadiusVariants: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Box padding={4} backgroundColor={colors.primary[500]} borderRadius="none">
        <span style={{ color: 'white' }}>None</span>
      </Box>
      <Box padding={4} backgroundColor={colors.primary[500]} borderRadius="sm">
        <span style={{ color: 'white' }}>Small</span>
      </Box>
      <Box padding={4} backgroundColor={colors.primary[500]} borderRadius="md">
        <span style={{ color: 'white' }}>Medium</span>
      </Box>
      <Box padding={4} backgroundColor={colors.primary[500]} borderRadius="lg">
        <span style={{ color: 'white' }}>Large</span>
      </Box>
      <Box padding={4} backgroundColor={colors.primary[500]} borderRadius="full">
        <span style={{ color: 'white' }}>Full</span>
      </Box>
    </div>
  ),
};

export const ColorVariants: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Box padding={4} backgroundColor={colors.primary[500]}>
        <span style={{ color: 'white' }}>Primary</span>
      </Box>
      <Box padding={4} backgroundColor={colors.success[500]}>
        <span style={{ color: 'white' }}>Success</span>
      </Box>
      <Box padding={4} backgroundColor={colors.warning[500]}>
        <span style={{ color: 'white' }}>Warning</span>
      </Box>
      <Box padding={4} backgroundColor={colors.error[500]}>
        <span style={{ color: 'white' }}>Error</span>
      </Box>
      <Box padding={4} backgroundColor={colors.info[500]}>
        <span style={{ color: 'white' }}>Info</span>
      </Box>
    </div>
  ),
};

export const ComplexLayout: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <Box
      padding={6}
      backgroundColor={colors.neutral[50]}
      borderRadius="lg"
      border
      borderColor={colors.neutral[200]}
    >
      <Box marginBottom={4}>
        <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Card Title</h3>
        <p style={{ margin: 0, color: colors.neutral[600] }}>
          This is a card-like layout using Box components
        </p>
      </Box>
      <Box
        paddingY={3}
        border
        borderColor={colors.neutral[200]}
        borderRadius="md"
        backgroundColor={colors.common.white}
      >
        <Box paddingX={4}>Content area with custom spacing</Box>
      </Box>
      <Box marginTop={4} paddingTop={4} style={{ borderTop: `1px solid ${colors.neutral[200]}` }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Box padding={2} backgroundColor={colors.primary[500]} borderRadius="md">
            <span style={{ color: 'white' }}>Action 1</span>
          </Box>
          <Box padding={2} backgroundColor={colors.secondary[300]} borderRadius="md">
            Action 2
          </Box>
        </div>
      </Box>
    </Box>
  ),
};
