import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Dropdown, Select } from '../../../../../components/forms/dropdown';

const meta = {
  title: 'Components/Forms/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const reportOptions = [
  { value: '1', label: 'Accounts at Risk' },
  { value: '2', label: 'Engagement Timeline' },
  { value: '3', label: 'Risk by Region' },
  { value: '4', label: 'ARR at Risk by Industry' },
  { value: '5', label: 'Churn Probability Distribution' },
];

/**
 * Default
 *
 * Custom styled dropdown with placeholder.
 */
export const Default: Story = {
  render: () => (
    <div style={{ width: '280px' }}>
      <Dropdown label="Report" options={reportOptions} placeholder="Select a report..." />
    </div>
  ),
};

/**
 * Report Selector
 *
 * Interactive dropdown for selecting reports.
 */
const ReportSelectorWrapper = () => {
  const [value, setValue] = useState('');

  return (
    <div style={{ width: '280px' }}>
      <Dropdown
        label="Report"
        options={reportOptions}
        value={value}
        onChange={setValue}
        placeholder="Select a report..."
      />
      <p style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
        Selected: {value || 'None'}
      </p>
    </div>
  );
};

export const Report: Story = {
  render: () => <ReportSelectorWrapper />,
};

/**
 * Data Source
 *
 * Dropdown with a pre-selected value for data source selection.
 */
export const DataSource: Story = {
  render: () => (
    <div style={{ width: '280px' }}>
      <Dropdown label="Data Source" options={reportOptions} value="2" onChange={() => {}} />
    </div>
  ),
};

/**
 * With Helper
 *
 * Dropdown with helper text below.
 */
export const WithHelper: Story = {
  render: () => (
    <div style={{ width: '280px' }}>
      <Dropdown
        label="Report"
        options={reportOptions}
        placeholder="Select a report..."
        helperText="Choose the data source for this chart"
      />
    </div>
  ),
};

/**
 * With Error
 *
 * Dropdown in error state.
 */
export const WithError: Story = {
  render: () => (
    <div style={{ width: '280px' }}>
      <Dropdown
        label="Report"
        options={reportOptions}
        placeholder="Select a report..."
        error="A report is required"
      />
    </div>
  ),
};

/**
 * Disabled
 *
 * Dropdown in disabled state.
 */
export const Disabled: Story = {
  render: () => (
    <div style={{ width: '280px' }}>
      <Dropdown label="Report" options={reportOptions} value="2" disabled />
    </div>
  ),
};

/**
 * Select Component
 *
 * Select component (alias for Dropdown) with placeholder.
 */
export const SelectComponent: Story = {
  render: () => (
    <div style={{ width: '280px' }}>
      <Select label="Report" options={reportOptions} placeholder="Select a report..." />
    </div>
  ),
};
