/**
 * Templates section component
 * Container for category pills and horizontally scrollable templates
 */

import React, { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import type { Template, TemplateCategory } from './types';
import { DEFAULT_TEMPLATES } from './types';
import { getTemplatesByCategory, getActiveCategory, saveActiveCategory } from './storage';
import { CategoryPills } from './CategoryPills';
import { TemplateCard } from './TemplateCard';

export interface TemplatesSectionProps {
  onTemplateSelect: (prompt: string) => void;
  disabled?: boolean;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({
  onTemplateSelect,
  disabled = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('1:1 & Coaching');
  const [templates, setTemplates] = useState<Template[]>(() =>
    DEFAULT_TEMPLATES.filter((tpl) => tpl.category === '1:1 & Coaching')
  );

  // Initialize from localStorage after mount (avoids SSR/hydration issues)
  useLayoutEffect(() => {
    const savedCategory = getActiveCategory();
    setActiveCategory(savedCategory);
    setTemplates(getTemplatesByCategory(savedCategory));
  }, []);
  const [showLeftChevron, setShowLeftChevron] = useState(false);
  const [showRightChevron, setShowRightChevron] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleCategoryChange = useCallback((category: TemplateCategory) => {
    setActiveCategory(category);
    saveActiveCategory(category);
    setTemplates(getTemplatesByCategory(category));
    // Reset scroll position when category changes
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
    setShowLeftChevron(false);
    setShowRightChevron(true);
  }, []);

  const handleTemplateClick = useCallback(
    (template: Template) => {
      if (!disabled) {
        onTemplateSelect(template.prompt);
      }
    },
    [disabled, onTemplateSelect]
  );

  const updateChevronVisibility = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftChevron(scrollLeft > 0);
    setShowRightChevron(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  const handleScroll = useCallback(() => {
    updateChevronVisibility();
  }, [updateChevronVisibility]);

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  // Check chevron visibility after templates load
  useLayoutEffect(() => {
    updateChevronVisibility();
  }, [templates, updateChevronVisibility]);

  return (
    <div className="w-full">
      {/* Category Pills */}
      <div className="mb-4">
        <CategoryPills
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          disabled={disabled}
        />
      </div>

      {/* Templates Carousel */}
      <div className="relative">
        {/* Left Chevron */}
        {showLeftChevron && (
          <button
            onClick={() => scrollBy('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
            aria-label="Scroll left"
          >
            <CaretLeft size={16} weight="bold" className="text-gray-600" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={handleTemplateClick}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Right Chevron */}
        {showRightChevron && templates.length > 3 && (
          <button
            onClick={() => scrollBy('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
            aria-label="Scroll right"
          >
            <CaretRight size={16} weight="bold" className="text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
};

export default TemplatesSection;
