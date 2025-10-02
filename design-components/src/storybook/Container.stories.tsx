import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container } from '../components/Container';

const meta = {
  title: 'Layout/Container',
  component: Container,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', 'full'],
      description: 'Maximum width of the container',
    },
    disablePadding: {
      control: 'boolean',
      description: 'Disable horizontal padding',
    },
    center: {
      control: 'boolean',
      description: 'Center the container',
    },
  },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

const DemoContent = () => (
  <div
    style={{
      backgroundColor: '#e0e7ff',
      padding: '2rem',
      borderRadius: '0.5rem',
      textAlign: 'center',
    }}
  >
    Container Content
  </div>
);

export const Small: Story = {
  args: {
    maxWidth: 'sm',
    children: <DemoContent />,
  },
};

export const Medium: Story = {
  args: {
    maxWidth: 'md',
    children: <DemoContent />,
  },
};

export const Large: Story = {
  args: {
    maxWidth: 'lg',
    children: <DemoContent />,
  },
};

export const ExtraLarge: Story = {
  args: {
    maxWidth: 'xl',
    children: <DemoContent />,
  },
};

export const ExtraExtraLarge: Story = {
  args: {
    maxWidth: '2xl',
    children: <DemoContent />,
  },
};

export const FullWidth: Story = {
  args: {
    maxWidth: 'full',
    children: <DemoContent />,
  },
};

export const NoPadding: Story = {
  args: {
    maxWidth: 'lg',
    disablePadding: true,
    children: <DemoContent />,
  },
};

export const AllSizes: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <div>
        <h3 style={{ marginBottom: '0.5rem' }}>Small (640px)</h3>
        <Container maxWidth="sm">
          <DemoContent />
        </Container>
      </div>
      <div>
        <h3 style={{ marginBottom: '0.5rem' }}>Medium (768px)</h3>
        <Container maxWidth="md">
          <DemoContent />
        </Container>
      </div>
      <div>
        <h3 style={{ marginBottom: '0.5rem' }}>Large (1024px)</h3>
        <Container maxWidth="lg">
          <DemoContent />
        </Container>
      </div>
      <div>
        <h3 style={{ marginBottom: '0.5rem' }}>Extra Large (1280px)</h3>
        <Container maxWidth="xl">
          <DemoContent />
        </Container>
      </div>
    </div>
  ),
};
