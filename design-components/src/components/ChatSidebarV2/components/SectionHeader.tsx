import React, { useState } from 'react';
import { CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react';
import { AddButton } from '../../forms/buttons';

export interface SectionHeaderProps {
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  addButtonLabel?: string;
  count?: number;
}

/**
 * SectionHeader - Expandable section header with optional add button
 *
 * Features:
 * - Clickable label to toggle expansion
 * - Caret icon indicating expansion state
 * - Optional count display
 * - Add button that appears on hover
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  isExpanded,
  onToggle,
  onAdd,
  addButtonLabel = 'Add new',
  count,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-center justify-between px-2 py-1.5 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        className="flex items-center justify-between text-xs font-medium text-gray-700 hover:text-gray-800 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <span>{label}</span>
        <div className="flex items-center gap-1.5">
          {count !== undefined && (
            <span className="pl-0.5 text-[11px] text-gray-700 font-mono normal-case -mb-0.5">
              [{count}]
            </span>
          )}
          {isExpanded ? (
            <CaretDownIcon size={12} weight="duotone" className="text-gray-800" />
          ) : (
            <CaretRightIcon size={12} weight="duotone" className="text-gray-800" />
          )}
        </div>
      </button>
      {onAdd && (
        <div className={`transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <AddButton
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            {addButtonLabel}
          </AddButton>
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
