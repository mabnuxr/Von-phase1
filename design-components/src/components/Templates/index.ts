/**
 * Templates module
 * Self-contained prompt template functionality for chat
 */

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
