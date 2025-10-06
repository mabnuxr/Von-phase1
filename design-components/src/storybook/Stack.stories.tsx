import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from '../components/Stack';

const meta = {
  title: 'Atoms/Layout/Stack',
  component: Stack,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Direction of the stack',
    },
    gap: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Gap between items',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end', 'stretch', 'baseline'],
      description: 'Alignment of items',
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'],
      description: 'Justify content',
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

const DemoItem = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      backgroundColor: '#dbeafe',
      padding: '1rem',
      borderRadius: '0.375rem',
      border: '1px solid #3b82f6',
    }}
  >
    {children}
  </div>
);

export const Vertical: Story = {
  args: {
    direction: 'vertical',
    gap: 'md',
    children: (
      <>
        <DemoItem>Item 1</DemoItem>
        <DemoItem>Item 2</DemoItem>
        <DemoItem>Item 3</DemoItem>
      </>
    ),
  },
};

export const Horizontal: Story = {
  args: {
    direction: 'horizontal',
    gap: 'md',
    children: (
      <>
        <DemoItem>Item 1</DemoItem>
        <DemoItem>Item 2</DemoItem>
        <DemoItem>Item 3</DemoItem>
      </>
    ),
  },
};

export const GapVariants: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h4>Extra Small Gap (xs)</h4>
        <Stack direction="horizontal" gap="xs">
          <DemoItem>1</DemoItem>
          <DemoItem>2</DemoItem>
          <DemoItem>3</DemoItem>
        </Stack>
      </div>
      <div>
        <h4>Small Gap (sm)</h4>
        <Stack direction="horizontal" gap="sm">
          <DemoItem>1</DemoItem>
          <DemoItem>2</DemoItem>
          <DemoItem>3</DemoItem>
        </Stack>
      </div>
      <div>
        <h4>Medium Gap (md)</h4>
        <Stack direction="horizontal" gap="md">
          <DemoItem>1</DemoItem>
          <DemoItem>2</DemoItem>
          <DemoItem>3</DemoItem>
        </Stack>
      </div>
      <div>
        <h4>Large Gap (lg)</h4>
        <Stack direction="horizontal" gap="lg">
          <DemoItem>1</DemoItem>
          <DemoItem>2</DemoItem>
          <DemoItem>3</DemoItem>
        </Stack>
      </div>
      <div>
        <h4>Extra Large Gap (xl)</h4>
        <Stack direction="horizontal" gap="xl">
          <DemoItem>1</DemoItem>
          <DemoItem>2</DemoItem>
          <DemoItem>3</DemoItem>
        </Stack>
      </div>
    </div>
  ),
};

export const AlignmentVariants: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h4>Align Start</h4>
        <Stack
          direction="horizontal"
          gap="md"
          align="start"
          style={{ height: '100px', border: '1px dashed #ccc' }}
        >
          <DemoItem>Short</DemoItem>
          <DemoItem>Tall Item with more content</DemoItem>
          <DemoItem>Medium</DemoItem>
        </Stack>
      </div>
      <div>
        <h4>Align Center</h4>
        <Stack
          direction="horizontal"
          gap="md"
          align="center"
          style={{ height: '100px', border: '1px dashed #ccc' }}
        >
          <DemoItem>Short</DemoItem>
          <DemoItem>Tall Item with more content</DemoItem>
          <DemoItem>Medium</DemoItem>
        </Stack>
      </div>
      <div>
        <h4>Align End</h4>
        <Stack
          direction="horizontal"
          gap="md"
          align="end"
          style={{ height: '100px', border: '1px dashed #ccc' }}
        >
          <DemoItem>Short</DemoItem>
          <DemoItem>Tall Item with more content</DemoItem>
          <DemoItem>Medium</DemoItem>
        </Stack>
      </div>
    </div>
  ),
};

export const JustifyVariants: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h4>Justify Start</h4>
        <Stack
          direction="horizontal"
          gap="md"
          justify="start"
          style={{ width: '500px', border: '1px dashed #ccc' }}
        >
          <DemoItem>1</DemoItem>
          <DemoItem>2</DemoItem>
          <DemoItem>3</DemoItem>
        </Stack>
      </div>
      <div>
        <h4>Justify Center</h4>
        <Stack
          direction="horizontal"
          gap="md"
          justify="center"
          style={{ width: '500px', border: '1px dashed #ccc' }}
        >
          <DemoItem>1</DemoItem>
          <DemoItem>2</DemoItem>
          <DemoItem>3</DemoItem>
        </Stack>
      </div>
      <div>
        <h4>Justify Space Between</h4>
        <Stack
          direction="horizontal"
          gap="md"
          justify="space-between"
          style={{ width: '500px', border: '1px dashed #ccc' }}
        >
          <DemoItem>1</DemoItem>
          <DemoItem>2</DemoItem>
          <DemoItem>3</DemoItem>
        </Stack>
      </div>
    </div>
  ),
};
