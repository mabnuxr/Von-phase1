/**
 * Templates localStorage service
 * Self-contained storage for prompt templates
 */

import type { Template, TemplateCategory } from './types';
import { DEFAULT_TEMPLATES } from './types';

const STORAGE_KEY = 'von-templates';
const ACTIVE_CATEGORY_KEY = 'von-templates-active-category';

/**
 * Get all templates from localStorage
 * Returns default templates if none exist
 */
export function getTemplates(): Template[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Initialize with default templates
      saveTemplates(DEFAULT_TEMPLATES);
      return DEFAULT_TEMPLATES;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.warn('[Templates] Failed to load templates from localStorage:', error);
    return DEFAULT_TEMPLATES;
  }
}

/**
 * Save templates to localStorage
 */
export function saveTemplates(templates: Template[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.warn('[Templates] Failed to save templates to localStorage:', error);
  }
}

/**
 * Get templates by category
 * For 'Popular' category, returns all templates with isPopular: true
 * For other categories, returns templates matching that category
 */
export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  const templates = getTemplates();
  if (category === 'Popular') {
    return templates.filter((tpl) => tpl.isPopular === true);
  }
  return templates.filter((tpl) => tpl.category === category);
}

/**
 * Get a single template by ID
 */
export function getTemplateById(id: string): Template | null {
  const templates = getTemplates();
  return templates.find((tpl) => tpl.id === id) || null;
}

/**
 * Get the active category from localStorage
 */
export function getActiveCategory(): TemplateCategory {
  if (typeof window === 'undefined') return 'Popular';

  try {
    const stored = localStorage.getItem(ACTIVE_CATEGORY_KEY);
    if (stored) {
      return stored as TemplateCategory;
    }
    return 'Popular';
  } catch {
    return 'Popular';
  }
}

/**
 * Save the active category to localStorage
 */
export function saveActiveCategory(category: TemplateCategory): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ACTIVE_CATEGORY_KEY, category);
  } catch (error) {
    console.warn('[Templates] Failed to save active category:', error);
  }
}

/**
 * Reset templates to defaults
 */
export function resetToDefaults(): void {
  saveTemplates(DEFAULT_TEMPLATES);
}
