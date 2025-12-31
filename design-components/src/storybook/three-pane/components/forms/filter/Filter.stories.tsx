import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FilterRow } from '../../../../../components/forms/filter';

const meta = {
  title: '3-Pane/Components/Forms/Filter',
  component: FilterRow,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FilterRow>;

export default meta;
type Story = StoryObj<typeof meta>;

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
 * Empty
 *
 * Filter row with two-row card layout. X button appears on hover.
 */
export const Empty: Story = {
  render: () => (
    <div style={{ width: '320px' }}>
      <FilterRow
        fields={fieldOptions}
        field=""
        operator=""
        value=""
        onFieldChange={(field) => console.log('Field:', field)}
        onOperatorChange={(op) => console.log('Operator:', op)}
        onValueChange={(val) => console.log('Value:', val)}
        onRemove={() => console.log('Remove')}
      />
    </div>
  ),
};

/**
 * With Values
 *
 * Filter row with pre-filled values.
 */
export const WithValues: Story = {
  render: () => (
    <div style={{ width: '320px' }}>
      <FilterRow
        fields={fieldOptions}
        field="stage"
        operator="equals"
        value="Won"
        onFieldChange={(field) => console.log('Field:', field)}
        onOperatorChange={(op) => console.log('Operator:', op)}
        onValueChange={(val) => console.log('Value:', val)}
        onRemove={() => console.log('Remove')}
      />
    </div>
  ),
};

/**
 * Without Remove Button
 *
 * Filter row without the remove button (useful when there's only one filter).
 */
export const NoRemove: Story = {
  render: () => (
    <div style={{ width: '320px' }}>
      <FilterRow
        fields={fieldOptions}
        field="amount"
        operator="greater_than"
        value="10000"
        onFieldChange={(field) => console.log('Field:', field)}
        onOperatorChange={(op) => console.log('Operator:', op)}
        onValueChange={(val) => console.log('Value:', val)}
        showRemove={false}
      />
    </div>
  ),
};

/**
 * Multiple Filters
 *
 * Example showing multiple filter rows stacked.
 */
const MultipleFiltersWrapper = () => {
  const [filters, setFilters] = useState([
    { id: '1', field: 'stage', operator: 'equals', value: 'Won' },
    { id: '2', field: 'amount', operator: 'greater_than', value: '50000' },
    { id: '3', field: 'region', operator: 'equals', value: 'North America' },
  ]);

  const updateFilter = (id: string, updates: Partial<typeof filters[0]>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  return (
    <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
  );
};

export const Multiple: Story = {
  render: () => <MultipleFiltersWrapper />,
};
