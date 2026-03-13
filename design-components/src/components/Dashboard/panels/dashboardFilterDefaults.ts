import type { FilterGroup, FilterField } from '../../forms/filter';

export const dashboardFilterFields: FilterField[] = [
  { value: 'region', label: 'Region' },
  { value: 'stage', label: 'Stage' },
  { value: 'owner', label: 'Owner' },
  { value: 'amount', label: 'Amount', type: 'number' },
  { value: 'close_date', label: 'Close Date', type: 'date' },
  { value: 'account_name', label: 'Account Name' },
  { value: 'industry', label: 'Industry' },
];

export const preAppliedFilterGroups: FilterGroup[] = [
  {
    id: 'g1',
    connector: 'and',
    conditions: [
      { id: 'c1', field: 'close_date', operator: 'greater_or_equal', value: '2025-01-01' },
      { id: 'c2', field: 'region', operator: 'equals', value: 'West' },
    ],
  },
];
