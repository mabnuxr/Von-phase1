/**
 * Tool display utilities for beautiful, explicit tool call rendering
 */

import type { IconProps } from '../icons';
import {
  LayersIcon,
  SearchIcon,
  BarChartIcon,
  TrendingUpIcon,
  CalculatorIcon,
  ToolIcon,
  CalendarIcon,
} from '../icons';

// Friendly display names for tools
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  sql_list_schema: 'Examined Schema',
  sql_discover_values: 'Discovered Values',
  sql_execute_query: 'Ran Query',
  sql_analyze: 'Analyzed Data',
  search_documents: 'Searched Documents',
  calculate: 'Calculated',
  // Google Calendar Tools
  googlecalendar_create_event: 'Created Calendar Event',
  googlecalendar_delete_event: 'Deleted Calendar Event',
  request_google_calendar_approval: 'Calendar Approval Requested',
};

// Icons for different tool types - SVG components
export const TOOL_ICONS: Record<string, React.ComponentType<IconProps>> = {
  sql_list_schema: LayersIcon,
  sql_discover_values: SearchIcon,
  sql_execute_query: BarChartIcon,
  sql_analyze: TrendingUpIcon,
  search_documents: SearchIcon,
  calculate: CalculatorIcon,
  // Google Calendar Tools
  googlecalendar_create_event: CalendarIcon,
  googlecalendar_delete_event: CalendarIcon,
  request_google_calendar_approval: CalendarIcon,
};

/**
 * Generate natural language summary from tool arguments
 * Converts JSON args to human-readable description
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateToolSummary(toolName: string, args: Record<string, any>): string {
  if (!args || Object.keys(args).length === 0) {
    return '';
  }

  switch (toolName) {
    case 'sql_list_schema':
      return args.table_name ? `Table: ${args.table_name}` : 'Examining database schema';

    case 'sql_discover_values':
      if (args.table_name && args.column_name) {
        return `Column: ${args.column_name} in ${args.table_name}`;
      }
      if (args.column_name) {
        return `Column: ${args.column_name}`;
      }
      return 'Discovering column values';

    case 'sql_execute_query':
      // Try to extract table name from query
      if (args.sql_query) {
        const tableMatch = args.sql_query.match(/FROM\s+(?:(\w+)\.)?(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[2];
          return `Querying ${tableName}`;
        }
      }
      return 'Running SQL query';

    case 'sql_analyze':
      return args.table_name ? `Analyzing ${args.table_name}` : 'Analyzing data';

    case 'search_documents':
      return args.query ? `Searching for: "${args.query}"` : 'Searching documents';

    default:
      // Generic fallback - show key: value pairs
      return Object.entries(args)
        .filter(([, v]) => v != null && v !== '')
        .slice(0, 3) // Limit to first 3 args
        .map(([k, v]) => {
          const value =
            typeof v === 'string' && v.length > 50 ? v.substring(0, 47) + '...' : String(v);
          return `${formatKey(k)}: ${value}`;
        })
        .join(' • ');
  }
}

/**
 * Get display info for a tool
 */
export function getToolDisplayInfo(toolName: string) {
  return {
    name: TOOL_DISPLAY_NAMES[toolName] || formatToolName(toolName),
    IconComponent: TOOL_ICONS[toolName] || ToolIcon,
  };
}

/**
 * Format tool name from snake_case to Title Case
 */
function formatToolName(name: string): string {
  return name
    .replace(/^sql_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Format argument key from snake_case to readable format
 */
function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
