import type { Meta, StoryObj } from '@storybook/react-vite';
import Text from '../components/Text/Text';

const meta: Meta<typeof Text> = {
  title: 'Components/Text',
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    children: 'Sample Text',
    variant: 'body',
    color: 'black',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'body', 'caption'],
      description: 'Text variant/style',
    },
    color: {
      control: 'color',
      description: 'Text color',
    },
    children: {
      control: 'text',
      description: 'Text content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Heading1: Story = {
  args: {
    variant: 'h1',
    children: 'Heading 1 Text',
    color: '#1a1a1a',
  },
};

export const Heading2: Story = {
  args: {
    variant: 'h2',
    children: 'Heading 2 Text',
    color: '#333333',
  },
};

export const Heading3: Story = {
  args: {
    variant: 'h3',
    children: 'Heading 3 Text',
    color: '#555555',
  },
};

export const Body: Story = {
  args: {
    variant: 'body',
    children: 'This is body text that can be used for paragraphs and general content.',
    color: '#666666',
  },
};

export const Caption: Story = {
  args: {
    variant: 'caption',
    children: 'Caption text for annotations',
    color: '#888888',
  },
};

export const ColorfulText: Story = {
  args: {
    variant: 'h2',
    children: 'Colorful Text Example',
    color: '#2563eb',
  },
};
