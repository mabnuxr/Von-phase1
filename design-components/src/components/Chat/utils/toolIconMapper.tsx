/**
 * Tool Icon Mapper Utility
 *
 * Maps tool names to their corresponding SVG icons
 */

import type { ComponentType } from 'react';
import type { IconProps } from '../icons';
import {
  DatabaseIcon,
  SearchIcon,
  CalculatorIcon,
  ToolIcon,
  BarChartIcon,
  LayersIcon,
  EditIcon,
  ServerIcon,
  GlobeIcon,
  BrainIcon,
} from '../icons';

/**
 * Get the appropriate icon component for a tool
 * @param toolName Internal tool name (e.g., 'sql_execute_query')
 * @returns Icon component
 */
export function getToolIcon(toolName: string): ComponentType<IconProps> {
  const lowerToolName = toolName.toLowerCase();

  // SQL Tools
  if (
    lowerToolName.includes('sql') ||
    lowerToolName.includes('database') ||
    lowerToolName.includes('query')
  ) {
    return DatabaseIcon;
  }

  // Search Tools
  if (
    lowerToolName.includes('search') ||
    lowerToolName.includes('find') ||
    lowerToolName.includes('lookup')
  ) {
    return SearchIcon;
  }

  // Calculation Tools
  if (
    lowerToolName.includes('calculate') ||
    lowerToolName.includes('compute') ||
    lowerToolName.includes('math')
  ) {
    return CalculatorIcon;
  }

  // Analysis Tools
  if (
    lowerToolName.includes('analyze') ||
    lowerToolName.includes('statistics') ||
    lowerToolName.includes('metrics')
  ) {
    return BarChartIcon;
  }

  // Data Aggregation
  if (
    lowerToolName.includes('aggregate') ||
    lowerToolName.includes('group') ||
    lowerToolName.includes('summarize')
  ) {
    return LayersIcon;
  }

  // Text/Content Editing
  if (
    lowerToolName.includes('edit') ||
    lowerToolName.includes('update') ||
    lowerToolName.includes('modify')
  ) {
    return EditIcon;
  }

  // Server/API Tools
  if (
    lowerToolName.includes('api') ||
    lowerToolName.includes('server') ||
    lowerToolName.includes('endpoint')
  ) {
    return ServerIcon;
  }

  // Web/URL Tools
  if (
    lowerToolName.includes('web') ||
    lowerToolName.includes('url') ||
    lowerToolName.includes('http')
  ) {
    return GlobeIcon;
  }

  // AI/ML Tools
  if (
    lowerToolName.includes('ai') ||
    lowerToolName.includes('ml') ||
    lowerToolName.includes('model') ||
    lowerToolName.includes('predict')
  ) {
    return BrainIcon;
  }

  // Default fallback
  return ToolIcon;
}
