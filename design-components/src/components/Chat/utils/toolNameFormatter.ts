/**
 * Tool Name Formatter Utility
 *
 * Converts internal tool names to user-friendly display names
 */

const TOOL_NAME_MAP: Record<string, string> = {
  // SQL Tools (remove SQL prefix, use present tense)
  sql_execute_query: 'Execute Query',
  sql_get_schema: 'Get Schema',
  sql_list_schema: 'List Schema',
  sql_list_tables: 'List Tables',
  sql_get_table_info: 'Get Table Info',
  sql_get_statistics: 'Get Statistics',
  sql_get_distinct_values: 'Get Distinct Values',
  sql_discover_values: 'Discover Values',

  // Search Tools
  search: 'Search',
  semantic_search: 'Semantic Search',
  keyword_search: 'Keyword Search',

  // Analysis Tools
  analyze_data: 'Analyze Data',
  calculate: 'Calculate',
  aggregate: 'Aggregate Data',

  // Data Tools
  fetch_data: 'Fetch Data',
  transform_data: 'Transform Data',
  filter_data: 'Filter Data',

  // Google Calendar Tools
  googlecalendar_create_event: 'Create Event',
  googlecalendar_delete_event: 'Delete Event',
  request_google_calendar_approval: 'Calendar Approval',
};

/**
 * Get user-friendly display name for a tool
 * @param toolName Internal tool name (e.g., 'sql_execute_query')
 * @returns User-friendly display name (e.g., 'Execute Query')
 */
export function getToolDisplayName(toolName: string): string {
  // Check if we have a custom mapping
  if (TOOL_NAME_MAP[toolName]) {
    return TOOL_NAME_MAP[toolName];
  }

  // Fallback: Remove technical prefixes and convert snake_case to Title Case
  const withoutPrefix = toolName.replace(/^(sql_|db_|api_|http_|rest_|graphql_|grpc_)/i, '');

  return withoutPrefix
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get a short version of the tool name for compact displays
 * @param toolName Internal tool name
 * @returns Shortened display name
 */
export function getShortToolName(toolName: string): string {
  const displayName = getToolDisplayName(toolName);

  // Remove common verbs for shorter version
  return displayName.replace(/^(Retrieved|Executed|Fetched|Analyzed)\s+/, '').trim();
}
