import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextInput } from '../../../../../components/forms/input';

const meta = {
  title: '3-Pane/Components/Forms/Input',
  component: TextInput,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default
 *
 * Basic text input with label.
 */
export const Default: Story = {
  render: () => (
    <div style={{ width: '280px' }}>
      <TextInput label="Title" placeholder="Enter title..." />
    </div>
  ),
};

/**
 * With Value
 *
 * Text input with a pre-filled value.
 */
export const WithValue: Story = {
  render: () => (
    <div style={{ width: '280px' }}>
      <TextInput label="Chart Title" value="Revenue by Region" onChange={() => {}} />
    </div>
  ),
};

/**
 * With Helper Text
 *
 * Text input with helper text below.
 */
export const WithHelper: Story = {
  render: () => (
    <div style={{ width: '280px' }}>
      <TextInput
        label="Dashboard Name"
        placeholder="Enter name..."
        helperText="This will be displayed in the sidebar"
      />
    </div>
  ),
};

/**
 * With Error
 *
 * Text input in error state.
 */
export const WithError: Story = {
  render: () => (
    <div style={{ width: '280px' }}>
      <TextInput
        label="Email"
        value="invalid-email"
        error="Please enter a valid email address"
        onChange={() => {}}
      />
    </div>
  ),
};
