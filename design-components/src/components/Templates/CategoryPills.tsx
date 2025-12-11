/**
 * Category pills for template selection
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { TemplateCategory } from './types';
import { TEMPLATE_CATEGORIES } from './types';

export interface CategoryPillsProps {
  activeCategory: TemplateCategory;
  onCategoryChange: (category: TemplateCategory) => void;
  disabled?: boolean;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  activeCategory,
  onCategoryChange,
  disabled = false,
}) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {TEMPLATE_CATEGORIES.map((category) => {
        const isActive = category === activeCategory;
        return (
          <motion.button
            key={category}
            onClick={() => !disabled && onCategoryChange(category)}
            className={`
              px-3 py-1 text-xs font-medium rounded-full
              transition-all duration-200
              ${
                isActive
                  ? 'bg-gray-100 border border-gray-100 shadow-sm text-gray-900'
                  : 'bg-white border border-gray-100 text-gray-600 hover:border-gray-200'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            whileHover={disabled ? {} : { scale: 1.02 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
          >
            {category}
          </motion.button>
        );
      })}
    </div>
  );
};

export default CategoryPills;
