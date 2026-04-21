import { useState, useId, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  DotsSixVerticalIcon,
  TrashIcon,
  FunnelIcon,
  QuestionIcon,
  PencilSimpleIcon,
} from '@phosphor-icons/react';
import { Dropdown } from '../dropdown';
import { SecondaryButton } from '../buttons';
import { useVisibilityToggle } from '../../../hooks';
import { VonIcon } from '../../VonIcon';

// ============================================================================
// Types
// ============================================================================

export interface FilterField {
  value: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: { value: string; label: string }[];
}

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

export interface FilterProps {
  fields: FilterField[];
  groups: FilterGroup[];
  onGroupsChange: (groups: FilterGroup[]) => void;
  showAIPrompt?: boolean;
  aiPromptPlaceholder?: string;
  onAIPromptSubmit?: (prompt: string) => void;
  usePortal?: boolean;
}

export interface FilterButtonProps {
  fields: FilterField[];
  groups: FilterGroup[];
  onGroupsChange: (groups: FilterGroup[]) => void;
  showAIPrompt?: boolean;
  aiPromptPlaceholder?: string;
  onAIPromptSubmit?: (prompt: string) => void;
  /** Hide the leading funnel icon */
  hideIcon?: boolean;
  /** When true, hides the AI prompt input and edit button — filters are view-only */
  readOnly?: boolean;
  /** When true, hides title/subtitle/pre-applied label — shows only filter pills */
  compact?: boolean;
}

// ============================================================================
// Operators
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
  { value: 'greater_or_equal', label: 'is at least' },
  { value: 'less_or_equal', label: 'is at most' },
  { value: 'is_any_of', label: 'is any of' },
  { value: 'is_null', label: 'is empty' },
  { value: 'is_not_null', label: 'is not empty' },
];

const CONNECTOR_OPTIONS = [
  { value: 'and', label: 'and' },
  { value: 'or', label: 'or' },
];

const NULL_OPERATORS = ['is_null', 'is_not_null'];

// ============================================================================
// Helper Functions
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const getOperatorLabel = (operatorValue: string): string => {
  return OPERATORS.find((op) => op.value === operatorValue)?.label || operatorValue;
};

const getFieldLabel = (fieldValue: string, fields: FilterField[]): string => {
  return fields.find((f) => f.value === fieldValue)?.label || fieldValue;
};

// ============================================================================
// FilterPreview Component (Read-only compact display)
// ============================================================================

interface FilterPreviewProps {
  groups: FilterGroup[];
  fields: FilterField[];
  onEdit: () => void;
}

const FilterPreview: React.FC<FilterPreviewProps> = ({ groups, fields, onEdit }) => {
  // Check if there are any active filters
  const hasFilters = groups.length > 0 && groups.some((g) => g.conditions.some((c) => c.field));

  if (!hasFilters) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
        <span className="text-sm text-gray-500">No filters applied</span>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-gray-800 hover:text-gray-900 transition-colors cursor-pointer"
        >
          Add filter
        </button>
      </div>
    );
  }

  // Build a single-line filter summary
  const filterParts: { field: string; operator: string; value: string; connector?: string }[] = [];
  groups.forEach((group, groupIndex) => {
    group.conditions
      .filter((c) => c.field)
      .forEach((condition, condIndex) => {
        filterParts.push({
          field: getFieldLabel(condition.field, fields),
          operator: getOperatorLabel(condition.operator),
          value: NULL_OPERATORS.includes(condition.operator) ? '' : condition.value,
          connector: condIndex > 0 || groupIndex > 0 ? group.connector : undefined,
        });
      });
  });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-500">Where</span>
      {filterParts.map((part, index) => (
        <div key={index} className="flex items-center gap-1.5">
          {part.connector && <span className="text-sm text-gray-500">{part.connector}</span>}
          <span className="text-sm text-gray-700">
            <span className="font-medium">{part.field}</span> {part.operator}
            {part.value && (
              <>
                {' '}
                "<span className="font-medium">{part.value}</span>"
              </>
            )}
          </span>
        </div>
      ))}
      <button
        type="button"
        onClick={onEdit}
        className="p-1 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        title="Edit filters"
      >
        <PencilSimpleIcon size={14} />
      </button>
    </div>
  );
};

// ============================================================================
// FilterConditionRow Component
// ============================================================================

interface FilterConditionRowProps {
  condition: FilterCondition;
  fields: FilterField[];
  onChange: (condition: FilterCondition) => void;
  onRemove: () => void;
  showRemove: boolean;
  usePortal?: boolean;
  rowPrefix: 'where' | 'connector';
  connector?: 'and' | 'or';
  onConnectorChange?: (connector: 'and' | 'or') => void;
}

const FilterConditionRow: React.FC<FilterConditionRowProps> = ({
  condition,
  fields,
  onChange,
  onRemove,
  showRemove,
  usePortal = false,
  rowPrefix,
  connector = 'and',
  onConnectorChange,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isNullOperator = NULL_OPERATORS.includes(condition.operator);

  return (
    <div
      className="group flex items-center gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Row Prefix: "Where" or and/or dropdown */}
      <div className="w-14 flex-shrink-0">
        {rowPrefix === 'where' ? (
          <span className="text-sm text-gray-700">Where</span>
        ) : (
          <Dropdown
            options={CONNECTOR_OPTIONS}
            value={connector}
            onChange={(value) => onConnectorChange?.(value as 'and' | 'or')}
            usePortal={usePortal}
          />
        )}
      </div>

      {/* Field Dropdown */}
      <div className="w-28 flex-shrink-0">
        <Dropdown
          options={fields.map((f) => ({ value: f.value, label: f.label }))}
          value={condition.field}
          onChange={(field) => onChange({ ...condition, field })}
          placeholder="Name"
          usePortal={usePortal}
        />
      </div>

      {/* Operator Dropdown */}
      <div className="w-28 flex-shrink-0">
        <Dropdown
          options={OPERATORS}
          value={condition.operator}
          onChange={(operator) => onChange({ ...condition, operator })}
          placeholder="contains"
          usePortal={usePortal}
        />
      </div>

      {/* Value Input */}
      {!isNullOperator && (
        <div className="flex-1 min-w-[140px]">
          <input
            type="text"
            value={condition.value}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            placeholder="Enter a value"
            className="w-full px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:border-gray-300 focus:ring-gray-200 transition-colors"
          />
        </div>
      )}

      {isNullOperator && <div className="flex-1" />}

      {/* Delete Button */}
      <button
        type="button"
        onClick={onRemove}
        title="Remove condition"
        className={`
          flex-shrink-0 p-1.5 rounded-lg
          text-gray-800 hover:bg-gray-100
          transition-all duration-150 cursor-pointer
          ${isHovered && showRemove ? 'opacity-100' : 'opacity-0'}
        `}
        disabled={!showRemove}
      >
        <TrashIcon size={16} />
      </button>

      {/* Drag Handle */}
      <div
        className={`
          flex-shrink-0 cursor-grab text-gray-400
          transition-opacity duration-150
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <DotsSixVerticalIcon size={16} />
      </div>
    </div>
  );
};

// ============================================================================
// FilterGroupCard Component (nested condition group)
// ============================================================================

interface FilterGroupCardProps {
  group: FilterGroup;
  fields: FilterField[];
  onChange: (group: FilterGroup) => void;
  onRemove: () => void;
  usePortal?: boolean;
  groupConnector: 'and' | 'or';
  onGroupConnectorChange: (connector: 'and' | 'or') => void;
  isEmpty?: boolean;
}

const FilterGroupCard: React.FC<FilterGroupCardProps> = ({
  group,
  fields,
  onChange,
  onRemove,
  usePortal = false,
  groupConnector,
  onGroupConnectorChange,
  isEmpty = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: generateId(),
      field: '',
      operator: 'contains',
      value: '',
    };
    onChange({
      ...group,
      conditions: [...group.conditions, newCondition],
    });
  };

  const updateCondition = (index: number, updatedCondition: FilterCondition) => {
    const newConditions = [...group.conditions];
    newConditions[index] = updatedCondition;
    onChange({ ...group, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    if (group.conditions.length === 1) {
      onRemove();
    } else {
      const newConditions = group.conditions.filter((_, i) => i !== index);
      onChange({ ...group, conditions: newConditions });
    }
  };

  const updateConditionConnector = (connector: 'and' | 'or') => {
    onChange({ ...group, connector });
  };

  const groupLabel =
    group.connector === 'or'
      ? 'Any of the following are true...'
      : 'All of the following are true...';

  return (
    <div
      className="relative flex items-start gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Group connector dropdown */}
      <div className="w-14 flex-shrink-0 pt-2">
        <Dropdown
          options={CONNECTOR_OPTIONS}
          value={groupConnector}
          onChange={(value) => onGroupConnectorChange(value as 'and' | 'or')}
          usePortal={usePortal}
        />
      </div>

      {/* Group content card */}
      <div className="flex-1 bg-gray-50 rounded-lg border border-gray-100">
        {/* Group header */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-gray-600">{groupLabel}</span>
          <div className="flex items-center gap-1">
            {/* Add condition to group */}
            <button
              type="button"
              onClick={addCondition}
              className="p-1 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Add condition to group"
            >
              <PlusIcon size={16} />
            </button>
            {/* Delete group */}
            <button
              type="button"
              onClick={onRemove}
              className={`p-1 text-gray-800 hover:bg-gray-100 rounded-lg transition-all cursor-pointer ${isHovered ? 'opacity-100' : 'opacity-0'}`}
              title="Remove group"
            >
              <TrashIcon size={16} />
            </button>
            {/* Drag handle */}
            <div
              className={`cursor-grab text-gray-400 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            >
              <DotsSixVerticalIcon size={16} />
            </div>
          </div>
        </div>

        {/* Group conditions */}
        {isEmpty || group.conditions.length === 0 ? (
          <div className="px-3 pb-3">
            <div className="text-sm text-gray-400 py-2">
              Drag conditions here to add them to this group
            </div>
          </div>
        ) : (
          <div className="px-3 pb-3 flex flex-col gap-2">
            {group.conditions.map((condition, index) => (
              <FilterConditionRow
                key={condition.id}
                condition={condition}
                fields={fields}
                onChange={(updated) => updateCondition(index, updated)}
                onRemove={() => removeCondition(index)}
                showRemove={group.conditions.length > 1}
                usePortal={usePortal}
                rowPrefix={index === 0 ? 'where' : 'connector'}
                connector={group.connector}
                onConnectorChange={updateConditionConnector}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// FilterPopoverContent Component
// ============================================================================

interface FilterPopoverContentProps {
  fields: FilterField[];
  groups: FilterGroup[];
  onGroupsChange: (groups: FilterGroup[]) => void;
  showAIPrompt?: boolean;
  aiPromptPlaceholder?: string;
  onAIPromptSubmit?: (prompt: string) => void;
  onClose: () => void;
  /** When true, hides the AI prompt input and edit button — filters are view-only */
  readOnly?: boolean;
  /** When true, hides title/subtitle/pre-applied label — shows only filter pills */
  compact?: boolean;
}

const FilterPopoverContent: React.FC<FilterPopoverContentProps> = ({
  fields,
  groups,
  onGroupsChange,
  showAIPrompt = true,
  aiPromptPlaceholder = 'Describe what you want to see',
  onAIPromptSubmit,
  readOnly = false,
  compact = false,
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputId = useId();

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiPrompt.trim() && onAIPromptSubmit) {
      onAIPromptSubmit(aiPrompt.trim());
      setAiPrompt('');
    }
  };

  const firstGroup = groups[0];
  const nestedGroups = groups.slice(1);

  const addCondition = () => {
    if (groups.length === 0) {
      const newGroup: FilterGroup = {
        id: generateId(),
        conditions: [{ id: generateId(), field: '', operator: 'contains', value: '' }],
        connector: 'and',
      };
      onGroupsChange([newGroup]);
    } else {
      const updatedFirstGroup = {
        ...firstGroup,
        conditions: [
          ...firstGroup.conditions,
          { id: generateId(), field: '', operator: 'contains', value: '' },
        ],
      };
      onGroupsChange([updatedFirstGroup, ...nestedGroups]);
    }
  };

  const addConditionGroup = () => {
    const newGroup: FilterGroup = {
      id: generateId(),
      conditions: [{ id: generateId(), field: '', operator: 'contains', value: '' }],
      connector: 'or',
    };
    onGroupsChange([...groups, newGroup]);
  };

  const updateFirstGroupCondition = (index: number, updatedCondition: FilterCondition) => {
    const newConditions = [...firstGroup.conditions];
    newConditions[index] = updatedCondition;
    const updatedFirstGroup = { ...firstGroup, conditions: newConditions };
    onGroupsChange([updatedFirstGroup, ...nestedGroups]);
  };

  const removeFirstGroupCondition = (index: number) => {
    if (firstGroup.conditions.length === 1 && nestedGroups.length === 0) {
      return;
    }
    if (firstGroup.conditions.length === 1) {
      onGroupsChange(nestedGroups);
    } else {
      const newConditions = firstGroup.conditions.filter((_, i) => i !== index);
      const updatedFirstGroup = { ...firstGroup, conditions: newConditions };
      onGroupsChange([updatedFirstGroup, ...nestedGroups]);
    }
  };

  const updateFirstGroupConnector = (connector: 'and' | 'or') => {
    const updatedFirstGroup = { ...firstGroup, connector };
    onGroupsChange([updatedFirstGroup, ...nestedGroups]);
  };

  const updateNestedGroup = (index: number, updatedGroup: FilterGroup) => {
    const newNestedGroups = [...nestedGroups];
    newNestedGroups[index] = updatedGroup;
    onGroupsChange([firstGroup, ...newNestedGroups]);
  };

  const removeNestedGroup = (index: number) => {
    const newNestedGroups = nestedGroups.filter((_, i) => i !== index);
    onGroupsChange([firstGroup, ...newNestedGroups]);
  };

  const updateNestedGroupConnector = (index: number, connector: 'and' | 'or') => {
    const newNestedGroups = [...nestedGroups];
    newNestedGroups[index] = { ...newNestedGroups[index], connector };
    onGroupsChange([firstGroup, ...newNestedGroups]);
  };

  // Check for pre-applied filters
  const hasAppliedFilters =
    groups.length > 0 && groups.some((g) => g.conditions.some((c) => c.field && c.field !== ''));

  // Build filter parts for preview
  const filterParts: { field: string; operator: string; value: string; connector?: string }[] = [];
  if (hasAppliedFilters) {
    groups.forEach((group, groupIndex) => {
      group.conditions
        .filter((c) => c.field)
        .forEach((condition, condIndex) => {
          filterParts.push({
            field: getFieldLabel(condition.field, fields),
            operator: getOperatorLabel(condition.operator),
            value: NULL_OPERATORS.includes(condition.operator) ? '' : condition.value,
            connector: condIndex > 0 || groupIndex > 0 ? group.connector : undefined,
          });
        });
    });
  }

  return (
    <div className="flex flex-col gap-3 p-3 min-w-[600px] max-w-[800px]">
      {/* Header */}
      {!compact && (
        <div>
          <p className="text-sm font-medium text-gray-900">Filter</p>
          <p className="text-xs text-gray-500">Narrow down records in this view</p>
        </div>
      )}

      {/* AI Prompt Input */}
      {showAIPrompt && !readOnly && (
        <form onSubmit={handleAISubmit}>
          <div
            className="p-[1px] rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #FF9042 0%, #854FFF 100%)',
            }}
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-[7px]">
              <VonIcon variant="badge" size={18} />
              <input
                id={inputId}
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={aiPromptPlaceholder}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>
        </form>
      )}

      {/* Pre-applied filters preview (when not editing) */}
      {hasAppliedFilters && !isEditing && (
        <div className="flex flex-col gap-2">
          {!compact && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Pre-applied filters</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Edit filters"
                >
                  <PencilSimpleIcon size={14} />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-wrap px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
            <span className="text-sm text-gray-500">Where</span>
            {filterParts.map((part, index) => (
              <span key={index} className="flex items-center gap-1">
                {part.connector && <span className="text-sm text-gray-500">{part.connector}</span>}
                <span className="text-sm text-gray-700">
                  <span className="font-medium">{part.field}</span> {part.operator}
                  {part.value && (
                    <>
                      {' '}
                      "<span className="font-medium">{part.value}</span>"
                    </>
                  )}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter Editor (when editing or no filters applied) */}
      {!readOnly && (isEditing || !hasAppliedFilters) && (
        <>
          {/* Section label */}
          <div className="text-sm text-gray-700">In this view, show records</div>

          {/* Filter Conditions */}
          <div className="flex flex-col gap-2">
            {/* First group conditions (flat, not in a card) */}
            {firstGroup &&
              firstGroup.conditions.map((condition, index) => (
                <FilterConditionRow
                  key={condition.id}
                  condition={condition}
                  fields={fields}
                  onChange={(updated) => updateFirstGroupCondition(index, updated)}
                  onRemove={() => removeFirstGroupCondition(index)}
                  showRemove={firstGroup.conditions.length > 1 || nestedGroups.length > 0}
                  usePortal={true}
                  rowPrefix={index === 0 ? 'where' : 'connector'}
                  connector={firstGroup.connector}
                  onConnectorChange={updateFirstGroupConnector}
                />
              ))}

            {/* Nested condition groups */}
            {nestedGroups.map((group, index) => (
              <FilterGroupCard
                key={group.id}
                group={group}
                fields={fields}
                onChange={(updated) => updateNestedGroup(index, updated)}
                onRemove={() => removeNestedGroup(index)}
                usePortal={true}
                groupConnector={group.connector}
                onGroupConnectorChange={(connector) => updateNestedGroupConnector(index, connector)}
              />
            ))}

            {/* Add buttons */}
            <div className="flex items-center gap-3 mt-2">
              <SecondaryButton
                onClick={addCondition}
                className="flex items-center gap-1.5 !px-2.5 !py-1.5 !rounded-lg"
              >
                <PlusIcon size={14} />
                <span>Add condition</span>
              </SecondaryButton>
              <SecondaryButton
                onClick={addConditionGroup}
                className="flex items-center gap-1.5 !px-2.5 !py-1.5 !rounded-lg !border-transparent !bg-transparent hover:!bg-gray-50"
              >
                <PlusIcon size={14} />
                <span>Add condition group</span>
              </SecondaryButton>
              <QuestionIcon size={16} className="text-gray-400" />
            </div>
          </div>

          {/* Done button when editing */}
          {isEditing && hasAppliedFilters && (
            <div className="flex justify-end">
              <SecondaryButton
                onClick={() => setIsEditing(false)}
                className="!px-3 !py-1.5 !rounded-lg !bg-gray-900 !text-white !border-gray-900 hover:!bg-gray-800"
              >
                Done
              </SecondaryButton>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// FilterButton Component (Button + Popover)
// ============================================================================

export const FilterButton: React.FC<FilterButtonProps> = ({
  fields,
  groups,
  onGroupsChange,
  showAIPrompt = true,
  aiPromptPlaceholder = 'Describe what you want to see',
  onAIPromptSubmit,
  hideIcon = false,
  readOnly = false,
  compact = false,
}) => {
  const { isVisible: isOpen, hide, toggleVisibility } = useVisibilityToggle();
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const activeFilterCount = groups.reduce(
    (sum, g) => sum + g.conditions.filter((c) => c.field).length,
    0
  );

  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Calculate the popover width (min-w-[600px] from FilterPopoverContent)
      const popoverWidth = 600;
      const viewportWidth = window.innerWidth;
      // Right-align if button is in right half, left-align if in left half
      const buttonCenter = rect.left + rect.width / 2;
      const preferred = buttonCenter > viewportWidth / 2 ? rect.right - popoverWidth : rect.left;
      const leftPosition = Math.max(16, Math.min(preferred, viewportWidth - popoverWidth - 16));
      setPopoverStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: leftPosition,
        zIndex: 10000,
      });
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        hide();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, hide]);

  return (
    <>
      <div ref={containerRef}>
        <SecondaryButton onClick={toggleVisibility} className="flex items-center gap-1.5">
          {!hideIcon && <FunnelIcon size={14} />}
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 bg-gray-50 border border-gray-200 text-gray-900 text-[10px] font-medium rounded-md">
              {activeFilterCount}
            </span>
          )}
        </SecondaryButton>
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ type: 'spring', duration: 0.25, bounce: 0.1 }}
              style={popoverStyle}
              className="bg-white rounded-xl border border-gray-200 shadow-lg"
            >
              <FilterPopoverContent
                fields={fields}
                groups={groups}
                onGroupsChange={onGroupsChange}
                showAIPrompt={showAIPrompt}
                aiPromptPlaceholder={aiPromptPlaceholder}
                onAIPromptSubmit={onAIPromptSubmit}
                onClose={hide}
                readOnly={readOnly}
                compact={compact}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

// ============================================================================
// Main Filter Component
// ============================================================================

export const Filter: React.FC<FilterProps> = ({
  fields,
  groups,
  onGroupsChange,
  showAIPrompt = true,
  aiPromptPlaceholder = 'Describe what you want to see',
  onAIPromptSubmit,
  usePortal = false,
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputId = useId();

  // Check if there are any applied filters
  const hasAppliedFilters =
    groups.length > 0 && groups.some((g) => g.conditions.some((c) => c.field && c.field !== ''));

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiPrompt.trim() && onAIPromptSubmit) {
      onAIPromptSubmit(aiPrompt.trim());
      setAiPrompt('');
      setIsEditing(false);
    }
  };

  const firstGroup = groups[0];
  const nestedGroups = groups.slice(1);

  const addCondition = () => {
    if (groups.length === 0) {
      const newGroup: FilterGroup = {
        id: generateId(),
        conditions: [{ id: generateId(), field: '', operator: 'contains', value: '' }],
        connector: 'and',
      };
      onGroupsChange([newGroup]);
    } else {
      const updatedFirstGroup = {
        ...firstGroup,
        conditions: [
          ...firstGroup.conditions,
          { id: generateId(), field: '', operator: 'contains', value: '' },
        ],
      };
      onGroupsChange([updatedFirstGroup, ...nestedGroups]);
    }
  };

  const addConditionGroup = () => {
    const newGroup: FilterGroup = {
      id: generateId(),
      conditions: [{ id: generateId(), field: '', operator: 'contains', value: '' }],
      connector: 'or',
    };
    onGroupsChange([...groups, newGroup]);
  };

  const updateFirstGroupCondition = (index: number, updatedCondition: FilterCondition) => {
    const newConditions = [...firstGroup.conditions];
    newConditions[index] = updatedCondition;
    const updatedFirstGroup = { ...firstGroup, conditions: newConditions };
    onGroupsChange([updatedFirstGroup, ...nestedGroups]);
  };

  const removeFirstGroupCondition = (index: number) => {
    if (firstGroup.conditions.length === 1 && nestedGroups.length === 0) {
      return;
    }
    if (firstGroup.conditions.length === 1) {
      onGroupsChange(nestedGroups);
    } else {
      const newConditions = firstGroup.conditions.filter((_, i) => i !== index);
      const updatedFirstGroup = { ...firstGroup, conditions: newConditions };
      onGroupsChange([updatedFirstGroup, ...nestedGroups]);
    }
  };

  const updateFirstGroupConnector = (connector: 'and' | 'or') => {
    const updatedFirstGroup = { ...firstGroup, connector };
    onGroupsChange([updatedFirstGroup, ...nestedGroups]);
  };

  const updateNestedGroup = (index: number, updatedGroup: FilterGroup) => {
    const newNestedGroups = [...nestedGroups];
    newNestedGroups[index] = updatedGroup;
    onGroupsChange([firstGroup, ...newNestedGroups]);
  };

  const removeNestedGroup = (index: number) => {
    const newNestedGroups = nestedGroups.filter((_, i) => i !== index);
    onGroupsChange([firstGroup, ...newNestedGroups]);
  };

  const updateNestedGroupConnector = (index: number, connector: 'and' | 'or') => {
    const newNestedGroups = [...nestedGroups];
    newNestedGroups[index] = { ...newNestedGroups[index], connector };
    onGroupsChange([firstGroup, ...newNestedGroups]);
  };

  // Preview Mode - show compact read-only view when filters are applied and not editing
  if (hasAppliedFilters && !isEditing) {
    return (
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="text-sm font-medium text-gray-900">Filter</div>

        {/* Filter Preview */}
        <FilterPreview groups={groups} fields={fields} onEdit={() => setIsEditing(true)} />
      </div>
    );
  }

  // Edit Mode - full filter editor
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="text-sm font-medium text-gray-900">Filter</div>

      {/* AI Prompt Input */}
      {showAIPrompt && (
        <form onSubmit={handleAISubmit}>
          <div
            className="p-[1px] rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #FF9042 0%, #854FFF 100%)',
            }}
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-[7px]">
              <VonIcon variant="badge" size={18} />
              <input
                id={inputId}
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={aiPromptPlaceholder}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>
        </form>
      )}

      {/* Section label */}
      <div className="text-sm text-gray-700">In this view, show records</div>

      {/* Filter Conditions */}
      <div className="flex flex-col gap-2">
        {/* First group conditions */}
        {firstGroup &&
          firstGroup.conditions.map((condition, index) => (
            <FilterConditionRow
              key={condition.id}
              condition={condition}
              fields={fields}
              onChange={(updated) => updateFirstGroupCondition(index, updated)}
              onRemove={() => removeFirstGroupCondition(index)}
              showRemove={firstGroup.conditions.length > 1 || nestedGroups.length > 0}
              usePortal={usePortal}
              rowPrefix={index === 0 ? 'where' : 'connector'}
              connector={firstGroup.connector}
              onConnectorChange={updateFirstGroupConnector}
            />
          ))}

        {/* Nested condition groups */}
        {nestedGroups.map((group, index) => (
          <FilterGroupCard
            key={group.id}
            group={group}
            fields={fields}
            onChange={(updated) => updateNestedGroup(index, updated)}
            onRemove={() => removeNestedGroup(index)}
            usePortal={usePortal}
            groupConnector={group.connector}
            onGroupConnectorChange={(connector) => updateNestedGroupConnector(index, connector)}
            isEmpty={group.conditions.length === 0}
          />
        ))}

        {/* Add buttons */}
        <div className="flex items-center gap-3 mt-2">
          <SecondaryButton
            onClick={addCondition}
            className="flex items-center gap-1.5 !px-2.5 !py-1.5 !rounded-lg"
          >
            <PlusIcon size={14} />
            <span>Add condition</span>
          </SecondaryButton>
          <SecondaryButton
            onClick={addConditionGroup}
            className="flex items-center gap-1.5 !px-2.5 !py-1.5 !rounded-lg !border-transparent !bg-transparent hover:!bg-gray-50"
          >
            <PlusIcon size={14} />
            <span>Add condition group</span>
          </SecondaryButton>
          <QuestionIcon size={16} className="text-gray-400" />
        </div>
      </div>

      {/* Done button when editing */}
      {hasAppliedFilters && (
        <div className="flex justify-end">
          <SecondaryButton
            onClick={() => setIsEditing(false)}
            className="!px-3 !py-1.5 !rounded-lg !bg-gray-900 !text-white !border-gray-900 hover:!bg-gray-800"
          >
            Done
          </SecondaryButton>
        </div>
      )}
    </div>
  );
};

export default Filter;
