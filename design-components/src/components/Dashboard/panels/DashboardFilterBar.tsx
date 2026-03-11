import React, { useState } from 'react';
import { ChatTextIcon } from '@phosphor-icons/react';
import { FilterButton } from '../../forms/filter';
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

export interface DashboardFilterBarProps {
  fields?: FilterField[];
  initialGroups?: FilterGroup[];
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  fields = dashboardFilterFields,
  initialGroups = preAppliedFilterGroups,
}) => {
  const [groups, setGroups] = useState<FilterGroup[]>(initialGroups);

  return (
    <div className="flex items-center gap-2">
      <FilterButton
        fields={fields}
        groups={groups}
        onGroupsChange={setGroups}
        showAIPrompt
        aiPromptPlaceholder="Describe what you want to filter"
        onAIPromptSubmit={(prompt) => console.log('AI filter prompt:', prompt)}
      />

      {/* Hint */}
      <div className="flex items-center gap-1 ml-auto">
        <ChatTextIcon size={12} className="text-gray-400" />
        <span className="text-[10px] text-gray-400">Filters managed by Von</span>
      </div>
    </div>
  );
};
