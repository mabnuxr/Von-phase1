import React, { useState } from 'react';
import { AddButton } from '../../forms/buttons';

export interface SectionHeaderProps {
  label: string;
  onAdd?: () => void;
  addButtonLabel?: string;
}

/**
 * SectionHeader - Static section label with optional add button on hover
 *
 * Matches V4 style: simple label with an add button that appears on hover.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  label,
  onAdd,
  addButtonLabel = 'Add new',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-center justify-between px-2 py-1.5 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-xs font-medium text-gray-700">{label}</span>
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
