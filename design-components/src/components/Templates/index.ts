/**
 * Templates module
 * Self-contained prompt template functionality for chat
 */

// Components
export { TemplatesSection } from './TemplatesSection';
export type { TemplatesSectionProps } from './TemplatesSection';
export { CategoryPills } from './CategoryPills';
export type { CategoryPillsProps } from './CategoryPills';
export { TemplateCard } from './TemplateCard';
export type { TemplateCardProps } from './TemplateCard';

// Types
export type { Template, TemplateCategory, TemplatesState } from './types';
export { TEMPLATE_CATEGORIES, DEFAULT_TEMPLATES } from './types';

// Storage utilities
export {
  getTemplates,
  saveTemplates,
  getTemplatesByCategory,
  getTemplateById,
  getActiveCategory,
  saveActiveCategory,
  resetToDefaults,
} from './storage';
