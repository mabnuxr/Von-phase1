import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TextInput } from '../../../../components/forms/input';
import { Select } from '../../../../components/forms/dropdown';
import { FilterRow } from '../../../../components/forms/filter';
import { AddButton, PrimaryButton, GhostButton } from '../../../../components/forms/buttons';

// Using a generic component for the meta since we have multiple components
const FormComponents = () => <div>Form Components</div>;

const meta = {
  title: '3-Pane/Components/Forms',
  component: FormComponents,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FormComponents>;

export default meta;
type Story = StoryObj<typeof meta>;

const reportOptions = [
  { value: '1', label: 'Accounts at Risk' },
  { value: '2', label: 'Engagement Timeline' },
  { value: '3', label: 'Risk by Region' },
  { value: '4', label: 'ARR at Risk by Industry' },
  { value: '5', label: 'Churn Probability Distribution' },
];

const fieldOptions = [
  { value: 'account_name', label: 'Account Name' },
  { value: 'stage', label: 'Stage' },
  { value: 'amount', label: 'Amount' },
  { value: 'close_date', label: 'Close Date' },
  { value: 'owner', label: 'Owner' },
  { value: 'industry', label: 'Industry' },
  { value: 'region', label: 'Region' },
];

/**
 * Combined Form
 *
 * Example showing all form components together in a configuration form layout.
 */
const CombinedFormWrapper = () => {
  const [title, setTitle] = useState('Revenue by Region');
  const [reportId, setReportId] = useState('3');
  const [filters, setFilters] = useState([
    { id: '1', field: 'stage', operator: 'equals', value: 'Won' },
  ]);

  const updateFilter = (id: string, updates: Partial<typeof filters[0]>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const addFilter = () => {
    setFilters([...filters, { id: crypto.randomUUID(), field: '', operator: '', value: '' }]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  return (
    <div className="w-80 flex flex-col gap-4 p-4 bg-white rounded-xl border border-gray-200">
      <Select
        label="Report"
        options={reportOptions}
        value={reportId}
        onChange={(value) => setReportId(value)}
        placeholder="Select a report..."
      />

      <TextInput
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter chart title..."
      />

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-700">Filters</span>
          <AddButton onClick={addFilter}>
            Add Filter
          </AddButton>
        </div>

        {filters.map((filter) => (
          <FilterRow
            key={filter.id}
            fields={fieldOptions}
            field={filter.field}
            operator={filter.operator}
            value={filter.value}
            onFieldChange={(field) => updateFilter(filter.id, { field })}
            onOperatorChange={(operator) => updateFilter(filter.id, { operator })}
            onValueChange={(value) => updateFilter(filter.id, { value })}
            onRemove={() => removeFilter(filter.id)}
          />
        ))}
      </div>

      <div className="mt-2">
        <div className="flex items-center gap-2">
          <GhostButton onClick={() => console.log('Discard clicked')} fullWidth>
            Discard
          </GhostButton>
          <PrimaryButton onClick={() => console.log('Save clicked')} fullWidth>
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export const CombinedForm: Story = {
  render: () => <CombinedFormWrapper />,
};
