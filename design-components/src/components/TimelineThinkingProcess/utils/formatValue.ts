/**
 * Format field value for display (V1 simple rendering approach)
 *
 * Simple type-based formatting without complex UI components:
 * - Boolean → "Yes"/"No"
 * - Number ≥ 1000 → comma formatting
 * - String > 100 chars → truncate to 97 chars + "..."
 * - Null/undefined → "—"
 */
export function formatValue(
  value: string | number | boolean | Record<string, unknown> | null | undefined
): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '—';
  }

  // Handle objects (e.g. Tooling API Metadata) — stringify for display
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  // Handle boolean
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Handle number
  if (typeof value === 'number') {
    // Add comma formatting for numbers >= 1000
    if (value >= 1000) {
      return new Intl.NumberFormat('en-US').format(value);
    }
    return String(value);
  }

  // Handle empty string
  if (typeof value === 'string' && value.length === 0) {
    return '—';
  }

  // Handle long strings - truncate to 97 chars + "..."
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 97) + '...';
  }

  // Default: convert to string
  return String(value);
}

/**
 * Format field name from snake_case to Title Case
 */
export function formatFieldName(field: string): string {
  return field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
