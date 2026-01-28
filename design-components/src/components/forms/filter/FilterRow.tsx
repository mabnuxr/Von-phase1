import { useState } from 'react';
import { TrashIcon } from '@phosphor-icons/react';
import { Dropdown } from '../dropdown';

export interface FilterRowProps {
  /**
   * Available fields to filter by
   */
  fields: { value: string; label: string }[];
  /**
   * Selected field
   */
  field: string;
  /**
   * Selected operator
   */
  operator: string;
  /**
   * Filter value
   */
  value: string;
  /**
   * Called when field changes
   */
  onFieldChange: (field: string) => void;
  /**
   * Called when operator changes
   */
  onOperatorChange: (operator: string) => void;
  /**
   * Called when value changes
   */
  onValueChange: (value: string) => void;
  /**
   * Called when remove button is clicked
   */
  onRemove?: () => void;
  /**
   * Whether to show the remove button
   */
  showRemove?: boolean;
  /**
   * Whether to render dropdowns in a portal (useful when inside overflow containers)
   */
  usePortal?: boolean;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'greater_or_equal', label: 'Greater or Equal' },
  { value: 'less_or_equal', label: 'Less or Equal' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Is Not Null' },
];

/**
 * FilterRow - Two-row card layout for filter configuration
 *
 * Row 1: Field selector
 * Row 2: Operator and Value
 * Trash button appears on hover, positioned absolute top-right
 */
export const FilterRow: React.FC<FilterRowProps> = ({
  fields,
  field,
  operator,
  value,
  onFieldChange,
  onOperatorChange,
  onValueChange,
  onRemove,
  showRemove = true,
  usePortal = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Filter Card */}
      <div className="relative flex flex-col gap-2 p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
        {/* Remove Button - absolute positioned top-right inside card, appears on hover */}
        {showRemove && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Remove filter"
            className={`
              absolute top-1.5 right-1.5 p-1 rounded-md
              text-white bg-red-600 hover:bg-red-700
              transition-opacity duration-150 cursor-pointer z-10
              ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            <TrashIcon size={14} weight="bold" />
          </button>
        )}

        {/* Row 1: Field Select */}
        <div className="w-full">
          <Dropdown
            options={fields}
            value={field}
            onChange={onFieldChange}
            placeholder="Select field..."
            usePortal={usePortal}
          />
        </div>

        {/* Row 2: Operator and Value */}
        <div className="flex items-center gap-2">
          {/* Operator Select */}
          <div className="flex-1 min-w-0">
            <Dropdown
              options={OPERATORS}
              value={operator}
              onChange={onOperatorChange}
              placeholder="Operator"
              usePortal={usePortal}
            />
          </div>

          {/* Value Input */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="Value"
              className="w-full px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:border-gray-300 focus:ring-gray-200 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterRow;
