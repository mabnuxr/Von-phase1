/**
 * CSV Export Utilities
 * Functions for generating CSV content from artifact data
 */

import type { TableData, ValueData, StatisticsData, MetricData, CallSearchResult } from '../types';

/**
 * Escape a value for CSV format
 * - Wraps in quotes if contains comma, newline, or quote
 * - Escapes internal quotes by doubling them
 */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // Check if value needs escaping
  if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
    return `"${strValue.replace(/"/g, '""')}"`;
  }

  return strValue;
}

/**
 * Convert table data to CSV string
 */
export function tableToCSV(table: TableData): string {
  const { columns, rows } = table;

  if (!columns || columns.length === 0) {
    return '';
  }

  // Header row using display_name
  const header = columns.map((col) => escapeCsvValue(col.display_name)).join(',');

  // Data rows using column.name as key
  const dataRows = rows.map((row) => columns.map((col) => escapeCsvValue(row[col.name])).join(','));

  return [header, ...dataRows].join('\n');
}

/**
 * Convert values data to CSV string
 */
export function valuesToCSV(values: ValueData[]): string {
  if (!values || values.length === 0) {
    return '';
  }

  const header = 'Value,Count';
  const dataRows = values.map((v) => `${escapeCsvValue(v.value)},${v.count}`);

  return [header, ...dataRows].join('\n');
}

/**
 * Convert statistics data to CSV string
 */
export function statisticsToCSV(statistics: StatisticsData): string {
  if (!statistics || Object.keys(statistics).length === 0) {
    return '';
  }

  const header = 'Statistic,Value';
  const dataRows = Object.entries(statistics).map(
    ([key, value]) => `${escapeCsvValue(key)},${escapeCsvValue(value)}`
  );

  return [header, ...dataRows].join('\n');
}

/**
 * Convert metrics data to CSV string
 */
export function metricsToCSV(metrics: MetricData[]): string {
  if (!metrics || metrics.length === 0) {
    return '';
  }

  const header = 'Label,Value,Type';
  const dataRows = metrics.map(
    (m) => `${escapeCsvValue(m.label)},${escapeCsvValue(m.value)},${escapeCsvValue(m.type)}`
  );

  return [header, ...dataRows].join('\n');
}

/**
 * Trigger browser download of CSV content
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename for CSV export
 */
export function generateCSVFilename(toolName: string, artifactType: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const sanitizedToolName = toolName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${sanitizedToolName}_${artifactType}_${timestamp}.csv`;
}

/**
 * Helper to format speakers (can be string or string[])
 */
function formatSpeakers(speakers?: string | string[]): string {
  if (!speakers) return '';
  if (Array.isArray(speakers)) return speakers.join('; ');
  return speakers;
}

/**
 * Convert call search results to CSV string
 */
export function callSearchResultsToCSV(results: CallSearchResult[]): string {
  if (!results || results.length === 0) {
    return '';
  }

  const header = [
    'Call ID',
    'Title',
    'Date',
    'Duration (min)',
    'External Speakers',
    'Internal Speakers',
    'External Companies',
    'Match Source',
    'Match Reason',
    'Deep Link',
  ].join(',');

  const dataRows = results.map((call) =>
    [
      escapeCsvValue(call.call_id),
      escapeCsvValue(call.call_title),
      escapeCsvValue(call.call_date),
      escapeCsvValue(call.duration_minutes),
      escapeCsvValue(formatSpeakers(call.external_speakers)),
      escapeCsvValue(formatSpeakers(call.internal_speakers)),
      escapeCsvValue(call.external_companies?.join('; ')),
      escapeCsvValue(call.match_info?.source),
      escapeCsvValue(call.match_info?.match_reason),
      escapeCsvValue(call.deep_link || call.meeting_url),
    ].join(',')
  );

  return [header, ...dataRows].join('\n');
}

/**
 * Check if an artifact type supports CSV export
 */
export function isExportableType(artifactType: string): boolean {
  return ['table', 'values', 'statistics', 'metrics'].includes(artifactType);
}

/**
 * Check if artifact content is call_search_union (for special handling)
 */
export function isCallSearchUnion(content: Record<string, unknown>): boolean {
  return content.type === 'call_search_union' && Array.isArray(content.results);
}
