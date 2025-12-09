/**
 * Template card component
 * Displays a single template in the grid
 */

import React from 'react';
import type { Template } from './types';

export interface TemplateCardProps {
  template: Template;
  onClick: (template: Template) => void;
  disabled?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className={`
        flex-shrink-0 w-48 px-4 py-2.5
        shadow-xs rounded-xl bg-white border border-gray-200
        text-left transition-all
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-gray-300 hover:shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
        }
      `}
      onClick={() => !disabled && onClick(template)}
    >
      <div className="text-sm font-medium text-gray-700 line-clamp-3">
        {template.prompt}
      </div>
    </button>
  );
};

export default TemplateCard;
