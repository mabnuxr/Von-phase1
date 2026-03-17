/**
 * KPI value formatting utilities.
 *
 * Parses a subset of d3-format pattern strings and formats numbers
 * using Intl.NumberFormat, following the same conventions as
 * CounterWidget's formatValue.
 */

/**
 * Parse a d3-format pattern and format a number accordingly.
 *
 * Supported patterns:
 * - `,.0f`  → comma-grouped integer (1,234,567)
 * - `,.2f`  → comma-grouped, 2 decimals (1,234,567.89)
 * - `.1f`   → 1 decimal, no grouping (5.3)
 * - `.1%`   → percentage, 1 decimal (value × 100 → "45.3%")
 * - `+,.0f` → explicit sign (+1,234,567)
 * - `$,...`  → the `$` in the pattern is treated as a currency prefix
 *
 * Note on `%` type: d3-format multiplies the value by 100 before formatting.
 * If your comparison values are already percentages (e.g. 12.5 meaning 12.5%),
 * use format `.1f` with suffix `%` instead of the `%` type character.
 */
export function formatD3Pattern(value: number, pattern: string | null): string {
  if (pattern === null || pattern === '') {
    return value.toLocaleString();
  }

  let sign = '';
  let useGrouping = false;
  let precision = 0;
  let type = 'f';
  let currencyPrefix = '';

  let remaining = pattern;

  // Extract sign (+ or -)
  if (remaining.startsWith('+') || remaining.startsWith('-')) {
    sign = remaining[0];
    remaining = remaining.slice(1);
  }

  // Extract $ symbol (d3 currency prefix)
  if (remaining.startsWith('$')) {
    currencyPrefix = '$';
    remaining = remaining.slice(1);
  }

  // Extract comma (grouping)
  if (remaining.includes(',')) {
    useGrouping = true;
    remaining = remaining.replace(',', '');
  }

  // Extract .precision
  const precisionMatch = remaining.match(/\.(\d+)/);
  if (precisionMatch) {
    precision = parseInt(precisionMatch[1], 10);
    remaining = remaining.replace(precisionMatch[0], '');
  }

  // Extract type character (f, %, s, etc.)
  const typeChar = remaining.trim();
  if (typeChar) {
    type = typeChar;
  }

  // Format based on type
  let formatted: string;

  if (type === '%') {
    // Percentage: multiply by 100, format with decimals, append %
    const pctValue = value * 100;
    formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      useGrouping,
    }).format(pctValue);
    formatted += '%';
  } else {
    // Fixed-point (f) or fallback
    formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      useGrouping,
    }).format(value);
  }

  // Apply sign
  if (sign === '+' && value > 0) {
    formatted = `+${formatted}`;
  }

  // Apply currency prefix from pattern
  if (currencyPrefix) {
    formatted = `${currencyPrefix}${formatted}`;
  }

  return formatted;
}

/**
 * Auto-abbreviate large numbers (K/M/B).
 * Follows the same convention as CounterWidget's formatValue.
 */
function abbreviateNumber(value: number, decimals: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(decimals > 0 ? decimals : 1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(decimals > 0 ? decimals : 1)}M`;
  }
  if (abs >= 1_000) {
    return `${(value / 1_000).toFixed(decimals > 0 ? decimals : 0)}K`;
  }
  return value.toFixed(decimals);
}

/**
 * Detect whether the value looks like a currency metric based on prefix.
 */
function isCurrencyPrefix(prefix: string | null | undefined): boolean {
  return prefix === '$' || prefix === '€' || prefix === '£' || prefix === '¥';
}

/**
 * Format a KPI value for display.
 *
 * @param value       - Raw numeric value (null → "—")
 * @param format      - d3-format pattern string
 * @param prefix      - Prefix to prepend (e.g. "$")
 * @param suffix      - Suffix to append (e.g. " deals")
 * @param abbreviate  - Auto-abbreviate large currency values (default true).
 *                      Only applies when prefix is a currency symbol ($, €, £, ¥).
 */
export function formatKpiDisplay(
  value: number | null,
  format: string | null,
  prefix?: string | null,
  suffix?: string | null,
  abbreviate = true,
): string {
  if (value === null) return '—';

  let formatted: string;

  const shouldAbbreviate = abbreviate
    && isCurrencyPrefix(prefix)
    && (format === null || !format.includes('%'));

  if (shouldAbbreviate) {
    const precisionMatch = format?.match(/\.(\d+)/);
    const decimals = precisionMatch ? parseInt(precisionMatch[1], 10) : 0;
    formatted = abbreviateNumber(value, decimals);
  } else {
    formatted = formatD3Pattern(value, format);
  }

  return `${prefix ?? ''}${formatted}${suffix ?? ''}`;
}

/**
 * Compute progress percentage from value and target.
 * Returns undefined if either value is null/0.
 * May exceed 100% for "exceeding target" display — the bar width
 * is clamped separately in the UI.
 */
export function computeProgress(
  value: number | null,
  targetValue: number | null,
  inverted?: boolean,
): number | undefined {
  if (value === null || targetValue === null || targetValue === 0) {
    return undefined;
  }
  if (inverted) {
    if (value === 0) return undefined;
    return (targetValue / value) * 100;
  }
  return (value / targetValue) * 100;
}

/**
 * Determine comparison color semantics based on delta and positive_is_good.
 *
 * | value > 0, positive_is_good = true  → 'good'  (green)
 * | value > 0, positive_is_good = false → 'bad'   (red)
 * | value < 0, positive_is_good = true  → 'bad'   (red)
 * | value < 0, positive_is_good = false → 'good'  (green)
 * | value === 0 or null                 → 'neutral' (gray)
 */
export function getComparisonColor(
  comparisonValue: number | null,
  positiveIsGood: boolean,
): 'good' | 'bad' | 'neutral' {
  if (comparisonValue === null || comparisonValue === 0) return 'neutral';
  const isPositive = comparisonValue > 0;
  return isPositive === positiveIsGood ? 'good' : 'bad';
}
