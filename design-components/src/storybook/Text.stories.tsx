import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from '../components/Text';

const meta = {
  title: 'Components/Text',
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['body', 'bodySmall', 'caption', 'label', 'labelLarge'],
      description: 'Text variant style',
    },
    color: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'disabled',
        'inverse',
        'success',
        'warning',
        'error',
        'info',
      ],
      description: 'Text color',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
      description: 'Text alignment',
    },
    weight: {
      control: 'select',
      options: ['light', 'regular', 'medium', 'semibold', 'bold'],
      description: 'Font weight',
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Body: Story = {
  args: {
    variant: 'body',
    children: 'This is body text with default styling.',
  },
};

export const BodySmall: Story = {
  args: {
    variant: 'bodySmall',
    children: 'This is small body text.',
  },
};

export const Caption: Story = {
  args: {
    variant: 'caption',
    children: 'This is caption text.',
  },
};

export const Label: Story = {
  args: {
    variant: 'label',
    children: 'This is label text.',
  },
};

export const LabelLarge: Story = {
  args: {
    variant: 'labelLarge',
    children: 'This is large label text.',
  },
};

export const AllVariants: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
      <Text variant="body">Body: The quick brown fox jumps over the lazy dog.</Text>
      <Text variant="bodySmall">Body Small: The quick brown fox jumps over the lazy dog.</Text>
      <Text variant="caption">Caption: The quick brown fox jumps over the lazy dog.</Text>
      <Text variant="label">Label: Form Label</Text>
      <Text variant="labelLarge">Label Large: Section Label</Text>
    </div>
  ),
};

export const ColorVariants: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
      <Text color="primary">Primary text color</Text>
      <Text color="secondary">Secondary text color</Text>
      <Text color="success">Success text color</Text>
      <Text color="warning">Warning text color</Text>
      <Text color="error">Error text color</Text>
      <Text color="info">Info text color</Text>
    </div>
  ),
};

export const WeightVariants: Story = {
  args: { children: 'Placeholder' },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
      <Text weight="light">Light weight text</Text>
      <Text weight="regular">Regular weight text</Text>
      <Text weight="medium">Medium weight text</Text>
      <Text weight="semibold">Semibold weight text</Text>
      <Text weight="bold">Bold weight text</Text>
    </div>
  ),
};
