import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Filter, FilterButton } from '../../../../../components/forms/filter';
import type { FilterGroup } from '../../../../../components/forms/filter';

const meta = {
  title: '3-Pane/Components/Forms/Filter',
  component: Filter,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'white',
      values: [{ name: 'white', value: '#ffffff' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Filter>;

export default meta;
type Story = StoryObj<typeof meta>;

const fieldOptions = [
  { value: 'name', label: 'Name' },
  { value: 'account_name', label: 'Account Name' },
  { value: 'stage', label: 'Stage' },
  { value: 'amount', label: 'Amount' },
  { value: 'close_date', label: 'Close Date' },
  { value: 'owner', label: 'Owner' },
  { value: 'industry', label: 'Industry' },
  { value: 'region', label: 'Region' },
];

/**
 * Default Filter
 *
 * Shows the filter component with a single empty condition row.
 */
const DefaultFilterWrapper = () => {
  const [groups, setGroups] = useState<FilterGroup[]>([
    {
      id: '1',
      conditions: [{ id: 'c1', field: 'name', operator: 'contains', value: '' }],
      connector: 'and',
    },
  ]);

  return (
    <div style={{ width: '700px' }}>
      <Filter
        fields={fieldOptions}
        groups={groups}
        onGroupsChange={setGroups}
        onAIPromptSubmit={(prompt) => console.log('AI Prompt:', prompt)}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <DefaultFilterWrapper />,
};

/**
 * With Multiple Conditions
 *
 * Shows the filter with multiple condition rows connected with AND.
 */
const MultipleConditionsWrapper = () => {
  const [groups, setGroups] = useState<FilterGroup[]>([
    {
      id: '1',
      conditions: [
        { id: 'c1', field: 'name', operator: 'contains', value: '' },
        { id: 'c2', field: 'stage', operator: 'equals', value: 'Won' },
      ],
      connector: 'and',
    },
  ]);

  return (
    <div style={{ width: '700px' }}>
      <Filter
        fields={fieldOptions}
        groups={groups}
        onGroupsChange={setGroups}
        onAIPromptSubmit={(prompt) => console.log('AI Prompt:', prompt)}
      />
    </div>
  );
};

export const MultipleConditions: Story = {
  render: () => <MultipleConditionsWrapper />,
};

/**
 * With Condition Group
 *
 * Shows a nested condition group with OR logic inside.
 */
const WithConditionGroupWrapper = () => {
  const [groups, setGroups] = useState<FilterGroup[]>([
    {
      id: '1',
      conditions: [{ id: 'c1', field: 'name', operator: 'contains', value: '' }],
      connector: 'and',
    },
    {
      id: '2',
      conditions: [
        { id: 'c2', field: 'name', operator: 'contains', value: '' },
        { id: 'c3', field: 'name', operator: 'contains', value: '' },
      ],
      connector: 'or',
    },
  ]);

  return (
    <div style={{ width: '700px' }}>
      <Filter
        fields={fieldOptions}
        groups={groups}
        onGroupsChange={setGroups}
        onAIPromptSubmit={(prompt) => console.log('AI Prompt:', prompt)}
      />
    </div>
  );
};

export const WithConditionGroup: Story = {
  render: () => <WithConditionGroupWrapper />,
};

/**
 * With Empty Condition Group
 *
 * Shows an empty condition group placeholder.
 */
const WithEmptyGroupWrapper = () => {
  const [groups, setGroups] = useState<FilterGroup[]>([
    {
      id: '1',
      conditions: [{ id: 'c1', field: 'name', operator: 'contains', value: '' }],
      connector: 'and',
    },
    {
      id: '2',
      conditions: [],
      connector: 'and',
    },
  ]);

  return (
    <div style={{ width: '700px' }}>
      <Filter
        fields={fieldOptions}
        groups={groups}
        onGroupsChange={setGroups}
        onAIPromptSubmit={(prompt) => console.log('AI Prompt:', prompt)}
      />
    </div>
  );
};

export const WithEmptyGroup: Story = {
  render: () => <WithEmptyGroupWrapper />,
};

/**
 * Complex Filter
 *
 * Full example matching the design screenshot with multiple conditions and groups.
 */
const ComplexFilterWrapper = () => {
  const [groups, setGroups] = useState<FilterGroup[]>([
    {
      id: '1',
      conditions: [{ id: 'c1', field: 'name', operator: 'contains', value: '' }],
      connector: 'and',
    },
    {
      id: '2',
      conditions: [
        { id: 'c2', field: 'name', operator: 'contains', value: '' },
        { id: 'c3', field: 'name', operator: 'contains', value: '' },
      ],
      connector: 'or',
    },
    {
      id: '3',
      conditions: [],
      connector: 'and',
    },
  ]);

  return (
    <div style={{ width: '700px' }}>
      <Filter
        fields={fieldOptions}
        groups={groups}
        onGroupsChange={setGroups}
        onAIPromptSubmit={(prompt) => console.log('AI Prompt:', prompt)}
      />
    </div>
  );
};

export const ComplexFilter: Story = {
  render: () => <ComplexFilterWrapper />,
};

/**
 * Without AI Prompt
 *
 * Filter without the AI prompt input field.
 */
const WithoutAIPromptWrapper = () => {
  const [groups, setGroups] = useState<FilterGroup[]>([
    {
      id: '1',
      conditions: [{ id: 'c1', field: 'name', operator: 'contains', value: '' }],
      connector: 'and',
    },
  ]);

  return (
    <div style={{ width: '700px' }}>
      <Filter
        fields={fieldOptions}
        groups={groups}
        onGroupsChange={setGroups}
        showAIPrompt={false}
      />
    </div>
  );
};

export const WithoutAIPrompt: Story = {
  render: () => <WithoutAIPromptWrapper />,
};

/**
 * Filter Button
 *
 * Button that opens a filter popover when clicked.
 */
const FilterButtonWrapper = () => {
  const [groups, setGroups] = useState<FilterGroup[]>([
    {
      id: '1',
      conditions: [{ id: 'c1', field: 'name', operator: 'contains', value: '' }],
      connector: 'and',
    },
  ]);

  return (
    <div style={{ padding: '20px' }}>
      <FilterButton
        fields={fieldOptions}
        groups={groups}
        onGroupsChange={setGroups}
        onAIPromptSubmit={(prompt) => console.log('AI Prompt:', prompt)}
      />
    </div>
  );
};

export const FilterButtonStory: Story = {
  render: () => <FilterButtonWrapper />,
  name: 'Filter Button',
};

/**
 * Filter Button with Active Filters
 *
 * Shows the filter button with a badge indicating active filters.
 */
const FilterButtonWithActiveWrapper = () => {
  const [groups, setGroups] = useState<FilterGroup[]>([
    {
      id: '1',
      conditions: [
        { id: 'c1', field: 'stage', operator: 'equals', value: 'Won' },
        { id: 'c2', field: 'amount', operator: 'greater_than', value: '50000' },
      ],
      connector: 'and',
    },
  ]);

  return (
    <div style={{ padding: '20px' }}>
      <FilterButton
        fields={fieldOptions}
        groups={groups}
        onGroupsChange={setGroups}
        onAIPromptSubmit={(prompt) => console.log('AI Prompt:', prompt)}
      />
    </div>
  );
};

export const FilterButtonWithActive: Story = {
  render: () => <FilterButtonWithActiveWrapper />,
  name: 'Filter Button (Active)',
};

/**
 * Preview Mode
 *
 * Shows the filter in preview mode with applied filters.
 * Click "Edit filters" to switch to edit mode.
 */
const PreviewModeWrapper = () => {
  const [groups, setGroups] = useState<FilterGroup[]>([
    {
      id: '1',
      conditions: [
        { id: 'c1', field: 'stage', operator: 'equals', value: 'Won' },
        { id: 'c2', field: 'amount', operator: 'greater_than', value: '50000' },
      ],
      connector: 'and',
    },
  ]);

  return (
    <div style={{ width: '700px' }}>
      <Filter
        fields={fieldOptions}
        groups={groups}
        onGroupsChange={setGroups}
        onAIPromptSubmit={(prompt) => console.log('AI Prompt:', prompt)}
      />
    </div>
  );
};

export const PreviewMode: Story = {
  render: () => <PreviewModeWrapper />,
  name: 'Preview Mode (Applied Filters)',
};

/**
 * Preview Mode with Multiple Groups
 *
 * Shows preview mode with multiple filter groups and complex conditions.
 */
const PreviewModeComplexWrapper = () => {
  const [groups, setGroups] = useState<FilterGroup[]>([
    {
      id: '1',
      conditions: [{ id: 'c1', field: 'stage', operator: 'equals', value: 'Won' }],
      connector: 'and',
    },
    {
      id: '2',
      conditions: [
        { id: 'c2', field: 'region', operator: 'equals', value: 'North America' },
        { id: 'c3', field: 'region', operator: 'equals', value: 'Europe' },
      ],
      connector: 'or',
    },
  ]);

  return (
    <div style={{ width: '700px' }}>
      <Filter
        fields={fieldOptions}
        groups={groups}
        onGroupsChange={setGroups}
        onAIPromptSubmit={(prompt) => console.log('AI Prompt:', prompt)}
      />
    </div>
  );
};

export const PreviewModeComplex: Story = {
  render: () => <PreviewModeComplexWrapper />,
  name: 'Preview Mode (Complex)',
};
