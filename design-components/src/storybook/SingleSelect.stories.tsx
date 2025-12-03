import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SingleSelect } from '../components/SingleSelect';

const meta = {
  title: 'Molecules/SingleSelect',
  component: SingleSelect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the field is disabled',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    error: {
      control: 'boolean',
      description: 'Error state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width',
    },
    showSearch: {
      control: 'boolean',
      description: 'Whether to show search input in dropdown',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SingleSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const quarterOptions = [
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'calendar', label: 'Calendar' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'in', label: 'India' },
  { value: 'br', label: 'Brazil' },
  { value: 'mx', label: 'Mexico' },
];

// Interactive wrapper component for controlled state
const SingleSelectWrapper = (args: React.ComponentProps<typeof SingleSelect>) => {
  const [value, setValue] = useState<string>(args.value || '');
  return <SingleSelect {...args} value={value} onChange={setValue} />;
};

export const Default: Story = {
  render: (args) => <SingleSelectWrapper {...args} />,
  args: {
    options: quarterOptions,
    value: '',
    placeholder: 'Select quarter type...',
    label: 'Sales Quarter',
  },
};

export const WithPreselectedValue: Story = {
  render: (args) => <SingleSelectWrapper {...args} />,
  args: {
    options: quarterOptions,
    value: 'fiscal',
    placeholder: 'Select quarter type...',
    label: 'Sales Quarter',
  },
};

export const WithHelperText: Story = {
  render: (args) => <SingleSelectWrapper {...args} />,
  args: {
    options: priorityOptions,
    value: '',
    placeholder: 'Select priority...',
    label: 'Priority Level',
    helperText: 'Choose the priority for this task',
  },
};

export const Required: Story = {
  render: (args) => <SingleSelectWrapper {...args} />,
  args: {
    options: priorityOptions,
    value: '',
    placeholder: 'Select priority...',
    label: 'Priority Level',
    required: true,
  },
};

export const WithError: Story = {
  render: (args) => <SingleSelectWrapper {...args} />,
  args: {
    options: priorityOptions,
    value: '',
    placeholder: 'Select priority...',
    label: 'Priority Level',
    error: true,
    errorMessage: 'Please select a priority',
  },
};

export const Disabled: Story = {
  render: (args) => <SingleSelectWrapper {...args} />,
  args: {
    options: priorityOptions,
    value: 'high',
    placeholder: 'Select priority...',
    label: 'Priority Level',
    disabled: true,
  },
};

export const WithDisabledOptions: Story = {
  render: (args) => <SingleSelectWrapper {...args} />,
  args: {
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium', disabled: true },
      { value: 'high', label: 'High' },
      { value: 'critical', label: 'Critical', disabled: true },
    ],
    value: '',
    placeholder: 'Select priority...',
    label: 'Priority Level',
    helperText: 'Some options are disabled',
  },
};

export const ManyOptions: Story = {
  render: (args) => <SingleSelectWrapper {...args} />,
  args: {
    options: countryOptions,
    value: '',
    placeholder: 'Select country...',
    label: 'Country',
    helperText: 'Use the search to filter options',
  },
};

export const WithoutSearch: Story = {
  render: (args) => <SingleSelectWrapper {...args} />,
  args: {
    options: quarterOptions,
    value: '',
    placeholder: 'Select quarter type...',
    label: 'Sales Quarter',
    showSearch: false,
  },
};

export const FullWidth: Story = {
  render: (args) => <SingleSelectWrapper {...args} />,
  args: {
    options: priorityOptions,
    value: '',
    placeholder: 'Select priority...',
    label: 'Priority Level',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
};

export const NoLabel: Story = {
  render: (args) => <SingleSelectWrapper {...args} />,
  args: {
    options: priorityOptions,
    value: '',
    placeholder: 'Select priority...',
  },
};
