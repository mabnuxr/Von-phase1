import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from '../components/Heading';

const meta = {
  title: 'Components/Heading',
  component: Heading,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      description: 'Heading level (semantic)',
    },
    visualLevel: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      description: 'Visual style override',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'inverse'],
      description: 'Text color',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Text alignment',
    },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const H1: Story = {
  args: {
    level: 'h1',
    children: 'Heading 1',
  },
};

export const H2: Story = {
  args: {
    level: 'h2',
    children: 'Heading 2',
  },
};

export const H3: Story = {
  args: {
    level: 'h3',
    children: 'Heading 3',
  },
};

export const H4: Story = {
  args: {
    level: 'h4',
    children: 'Heading 4',
  },
};

export const H5: Story = {
  args: {
    level: 'h5',
    children: 'Heading 5',
  },
};

export const H6: Story = {
  args: {
    level: 'h6',
    children: 'Heading 6',
  },
};

export const AllLevels: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px' }}>
      <Heading level="h1">Heading 1 - Main Page Title</Heading>
      <Heading level="h2">Heading 2 - Section Title</Heading>
      <Heading level="h3">Heading 3 - Subsection Title</Heading>
      <Heading level="h4">Heading 4 - Minor Section</Heading>
      <Heading level="h5">Heading 5 - Small Section</Heading>
      <Heading level="h6">Heading 6 - Smallest Section</Heading>
    </div>
  ),
};

export const ColorVariants: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px' }}>
      <Heading level="h2" color="primary">
        Primary Color Heading
      </Heading>
      <Heading level="h2" color="secondary">
        Secondary Color Heading
      </Heading>
      <div style={{ backgroundColor: '#000', padding: '1rem' }}>
        <Heading level="h2" color="inverse">
          Inverse Color Heading
        </Heading>
      </div>
    </div>
  ),
};

export const VisualOverride: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px' }}>
      <Heading level="h1" visualLevel="h3">
        H1 element styled as H3
      </Heading>
      <Heading level="h3" visualLevel="h1">
        H3 element styled as H1
      </Heading>
    </div>
  ),
};
