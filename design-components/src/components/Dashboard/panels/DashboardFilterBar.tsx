import React, { useState } from 'react';
import { ChatTextIcon } from '@phosphor-icons/react';
import { FilterButton } from '../../forms/filter';
import type { FilterGroup, FilterField } from '../../forms/filter';
import { dashboardFilterFields, preAppliedFilterGroups } from './dashboardFilterDefaults';

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
