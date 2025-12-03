import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { MultiSelect } from '../components/MultiSelect';

const meta = {
  title: 'Molecules/MultiSelect',
  component: MultiSelect,
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
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const businessStageOptions = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
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
];

// Interactive wrapper component for controlled state
const MultiSelectWrapper = (args: React.ComponentProps<typeof MultiSelect>) => {
  const [value, setValue] = useState<string[]>(args.value || []);
  return <MultiSelect {...args} value={value} onChange={setValue} />;
};

export const Default: Story = {
  render: (args) => <MultiSelectWrapper {...args} />,
  args: {
    options: businessStageOptions,
    value: [],
    placeholder: 'Select stages...',
    label: 'Business Stages',
  },
};

export const WithPreselectedValues: Story = {
  render: (args) => <MultiSelectWrapper {...args} />,
  args: {
    options: businessStageOptions,
    value: ['prospect', 'qualified'],
    placeholder: 'Select stages...',
    label: 'Business Stages',
  },
};

export const WithHelperText: Story = {
  render: (args) => <MultiSelectWrapper {...args} />,
  args: {
    options: businessStageOptions,
    value: [],
    placeholder: 'Select stages...',
    label: 'Business Stages',
    helperText: 'Select one or more stages to filter by',
  },
};

export const Required: Story = {
  render: (args) => <MultiSelectWrapper {...args} />,
  args: {
    options: businessStageOptions,
    value: [],
    placeholder: 'Select stages...',
    label: 'Business Stages',
    required: true,
  },
};

export const WithError: Story = {
  render: (args) => <MultiSelectWrapper {...args} />,
  args: {
    options: businessStageOptions,
    value: [],
    placeholder: 'Select stages...',
    label: 'Business Stages',
    error: true,
    errorMessage: 'Please select at least one stage',
  },
};

export const Disabled: Story = {
  render: (args) => <MultiSelectWrapper {...args} />,
  args: {
    options: businessStageOptions,
    value: ['prospect', 'qualified'],
    placeholder: 'Select stages...',
    label: 'Business Stages',
    disabled: true,
  },
};

export const WithDisabledOptions: Story = {
  render: (args) => <MultiSelectWrapper {...args} />,
  args: {
    options: [
      { value: 'prospect', label: 'Prospect' },
      { value: 'qualified', label: 'Qualified' },
      { value: 'proposal', label: 'Proposal', disabled: true },
      { value: 'negotiation', label: 'Negotiation' },
      { value: 'closed_won', label: 'Closed Won', disabled: true },
      { value: 'closed_lost', label: 'Closed Lost' },
    ],
    value: [],
    placeholder: 'Select stages...',
    label: 'Business Stages',
    helperText: 'Some options are disabled',
  },
};

export const ManyOptions: Story = {
  render: (args) => <MultiSelectWrapper {...args} />,
  args: {
    options: countryOptions,
    value: [],
    placeholder: 'Select countries...',
    label: 'Countries',
    helperText: 'Use the search to filter options',
  },
};

export const FullWidth: Story = {
  render: (args) => <MultiSelectWrapper {...args} />,
  args: {
    options: businessStageOptions,
    value: [],
    placeholder: 'Select stages...',
    label: 'Business Stages',
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
  render: (args) => <MultiSelectWrapper {...args} />,
  args: {
    options: businessStageOptions,
    value: [],
    placeholder: 'Select stages...',
  },
};
