import React, { useState, useRef } from 'react';
import { Trash, DotsSixVertical, Plus, PencilSimple } from '@phosphor-icons/react';
import { LOGO_STATIC_URL } from '../../constants';
import { Dropdown } from '../forms/dropdown';

// ============================================================================
// Types
// ============================================================================

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
  connector: 'and' | 'or';
}

export interface FilterField {
  value: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'picklist';
}

export interface AIFilterPanelProps {
  /**
   * Available fields to filter by
   */
  fields: FilterField[];
  /**
   * Current filter groups
   */
  filterGroups: FilterGroup[];
  /**
   * Called when filters change
   */
  onFiltersChange: (groups: FilterGroup[]) => void;
  /**
   * Called when AI prompt is submitted
   */
  onAIPromptSubmit?: (prompt: string) => void;
  /**
   * Whether AI filter is processing
   */
  isProcessing?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const OPERATORS = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
  { value: 'is_any_of', label: 'is any of' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
];

// ============================================================================
// Helper Functions
// ============================================================================

const generateId = () => Math.random().toString(36).slice(2, 11);

const formatConditionDisplay = (condition: FilterCondition, fields: FilterField[]): string => {
  const field = fields.find((f) => f.value === condition.field);
  const operator = OPERATORS.find((o) => o.value === condition.operator);
  const fieldLabel = field?.label || condition.field;
  const operatorLabel = operator?.label || condition.operator;

  if (condition.operator === 'is_empty' || condition.operator === 'is_not_empty') {
    return `${fieldLabel} ${operatorLabel}`;
  }

  return `${fieldLabel} ${operatorLabel} "${condition.value}"`;
};

// ============================================================================
// Filter Condition Row Component
// ============================================================================

interface FilterConditionRowProps {
  condition: FilterCondition;
  fields: FilterField[];
  onUpdate: (condition: FilterCondition) => void;
  onRemove: () => void;
  showDragHandle?: boolean;
}

const FilterConditionRow: React.FC<FilterConditionRowProps> = ({
  condition,
  fields,
  onUpdate,
  onRemove,
  showDragHandle = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const showValueInput = condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty';

  return (
    <div
      className="flex items-center gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showDragHandle && (
        <div
          className={`cursor-grab text-gray-400 hover:text-gray-600 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <DotsSixVertical size={14} weight="bold" />
        </div>
      )}

      <div className="flex-1 flex items-center gap-2">
        {/* Field selector */}
        <div className="w-36">
          <Dropdown
            options={fields}
            value={condition.field}
            onChange={(value) => onUpdate({ ...condition, field: value })}
            placeholder="Field"
          />
        </div>

        {/* Operator selector */}
        <div className="w-36">
          <Dropdown
            options={OPERATORS}
            value={condition.operator}
            onChange={(value) => onUpdate({ ...condition, operator: value })}
            placeholder="Operator"
          />
        </div>

        {/* Value input */}
        {showValueInput && (
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={condition.value}
              onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
              placeholder="Value"
              className="w-full px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:border-gray-300 focus:ring-gray-200 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={onRemove}
        className={`p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Trash size={14} weight="bold" />
      </button>
    </div>
  );
};

// ============================================================================
// Filter Preview Component (Read-only)
// ============================================================================

interface FilterPreviewProps {
  filterGroups: FilterGroup[];
  fields: FilterField[];
  onEdit: () => void;
}

const FilterPreview: React.FC<FilterPreviewProps> = ({ filterGroups, fields, onEdit }) => {
  if (filterGroups.length === 0 || filterGroups.every((g) => g.conditions.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          Active Filters
        </span>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
        >
          <PencilSimple size={12} />
          Edit
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {filterGroups.map((group, groupIndex) => (
          <React.Fragment key={group.id}>
            {groupIndex > 0 && (
              <span className="px-2 py-1 text-[11px] text-gray-500 font-medium uppercase">
                {group.connector}
              </span>
            )}
            {group.conditions.map((condition, condIndex) => (
              <React.Fragment key={condition.id}>
                {condIndex > 0 && <span className="px-1 py-1 text-[11px] text-gray-400">and</span>}
                <span className="px-2 py-1 text-[11px] bg-gray-100 text-gray-700 rounded-md">
                  {formatConditionDisplay(condition, fields)}
                </span>
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Filter Edit Panel Component
// ============================================================================

interface FilterEditPanelProps {
  filterGroups: FilterGroup[];
  fields: FilterField[];
  onFiltersChange: (groups: FilterGroup[]) => void;
  onClose: () => void;
}

const FilterEditPanel: React.FC<FilterEditPanelProps> = ({
  filterGroups,
  fields,
  onFiltersChange,
  onClose,
}) => {
  const [localGroups, setLocalGroups] = useState<FilterGroup[]>(
    filterGroups.length > 0
      ? filterGroups
      : [{ id: generateId(), conditions: [], connector: 'and' }]
  );

  const handleAddCondition = (groupIndex: number) => {
    const newGroups = [...localGroups];
    newGroups[groupIndex].conditions.push({
      id: generateId(),
      field: fields[0]?.value || '',
      operator: 'equals',
      value: '',
    });
    setLocalGroups(newGroups);
  };

  const handleUpdateCondition = (
    groupIndex: number,
    conditionIndex: number,
    condition: FilterCondition
  ) => {
    const newGroups = [...localGroups];
    newGroups[groupIndex].conditions[conditionIndex] = condition;
    setLocalGroups(newGroups);
  };

  const handleRemoveCondition = (groupIndex: number, conditionIndex: number) => {
    const newGroups = [...localGroups];
    newGroups[groupIndex].conditions.splice(conditionIndex, 1);
    setLocalGroups(newGroups);
  };

  const handleAddGroup = () => {
    setLocalGroups([...localGroups, { id: generateId(), conditions: [], connector: 'or' }]);
  };

  const handleToggleConnector = (groupIndex: number) => {
    const newGroups = [...localGroups];
    newGroups[groupIndex].connector = newGroups[groupIndex].connector === 'and' ? 'or' : 'and';
    setLocalGroups(newGroups);
  };

  const handleApply = () => {
    // Filter out empty groups
    const filteredGroups = localGroups.filter((g) => g.conditions.length > 0);
    onFiltersChange(filteredGroups);
    onClose();
  };

  const handleClear = () => {
    onFiltersChange([]);
    onClose();
  };

  return (
    <div className="space-y-4">
      {localGroups.map((group, groupIndex) => (
        <div key={group.id}>
          {/* Group connector */}
          {groupIndex > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-gray-200" />
              <button
                onClick={() => handleToggleConnector(groupIndex)}
                className="px-2 py-0.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors cursor-pointer uppercase"
              >
                {group.connector}
              </button>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {/* Conditions */}
          <div className="space-y-2">
            {group.conditions.map((condition, condIndex) => (
              <FilterConditionRow
                key={condition.id}
                condition={condition}
                fields={fields}
                onUpdate={(updated) => handleUpdateCondition(groupIndex, condIndex, updated)}
                onRemove={() => handleRemoveCondition(groupIndex, condIndex)}
              />
            ))}

            {/* Add condition button */}
            <button
              onClick={() => handleAddCondition(groupIndex)}
              className="flex items-center gap-1 px-2 py-1.5 text-[12px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={12} weight="bold" />
              Add condition
            </button>
          </div>
        </div>
      ))}

      {/* Add group button */}
      <button
        onClick={handleAddGroup}
        className="flex items-center gap-1 px-2 py-1.5 text-[12px] font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
      >
        <Plus size={12} weight="bold" />
        Add condition group
      </button>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          Clear all
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const AIFilterPanel: React.FC<AIFilterPanelProps> = ({
  fields,
  filterGroups,
  onFiltersChange,
  onAIPromptSubmit,
  isProcessing = false,
}) => {
  const [promptValue, setPromptValue] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePromptSubmit = () => {
    if (!promptValue.trim() || !onAIPromptSubmit) return;
    onAIPromptSubmit(promptValue.trim());
    setPromptValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Prompt Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <img src={LOGO_STATIC_URL} alt="Von" className="w-4 h-4 rounded-sm" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={promptValue}
          onChange={(e) => setPromptValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to see"
          disabled={isProcessing}
          className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-shadow disabled:opacity-50"
        />
        {isProcessing && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Filter Preview or Edit Mode */}
      {isEditMode ? (
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
          <FilterEditPanel
            filterGroups={filterGroups}
            fields={fields}
            onFiltersChange={onFiltersChange}
            onClose={() => setIsEditMode(false)}
          />
        </div>
      ) : (
        <FilterPreview
          filterGroups={filterGroups}
          fields={fields}
          onEdit={() => setIsEditMode(true)}
        />
      )}
    </div>
  );
};

export default AIFilterPanel;
