import type { GridOptions } from '@highcharts/grid-lite-react';
import type { IndividualColumnOptions } from '@highcharts/grid-lite/es-modules/Grid/Core/Options';
import type { DataTableValue } from '@highcharts/grid-lite/es-modules/Data/DataTableOptions';
import type { ColumnType, DataSourceType, ReportColumn, AIReasoningData } from './ReportTable';
import { formatD3Pattern } from '../../utils/formatKpiValue';

// ============================================================================
// Value Formatting Utility
// ============================================================================

export const formatValue = (value: unknown, type: ColumnType): string => {
  if (value === null || value === undefined) return '—';

  switch (type) {
    case 'currency': {
      const num =
        typeof value === 'number'
          ? value
          : typeof value === 'string' && value.trim() !== ''
            ? Number(value)
            : NaN;
      return !isNaN(num)
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(num)
        : String(value);
    }

    case 'percentage':
      return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : `${value}%`;

    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);

    case 'date': {
      const dateOptions: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      };
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', dateOptions);
      }
      if (typeof value === 'number') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-US', dateOptions);
      }
      if (typeof value === 'string') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? value : d.toLocaleDateString('en-US', dateOptions);
      }
      return String(value);
    }

    case 'boolean':
      return value ? 'Yes' : 'No';

    case 'email':
    case 'phone':
    case 'url':
    case 'text':
    case 'picklist':
    default:
      return String(value);
  }
};

// ============================================================================
// Header Icon CSS Class Names (Grid Lite AST strips viewBox from inline SVGs,
// so we use CSS background-image with data URIs instead)
// ============================================================================

const SOURCE_ICON_CLASS: Record<DataSourceType, string> = {
  salesforce: 'report-hdr-icon-salesforce',
  gong: 'report-hdr-icon-gong',
  gmail: 'report-hdr-icon-gmail',
  calendar: 'report-hdr-icon-calendar',
  hubspot: 'report-hdr-icon-hubspot',
  mixed: 'report-hdr-icon-mixed',
};

/** Create a header formatter that includes source/AI icons before the label */
function createHeaderFormatter(col: ReportColumn): () => string {
  return function () {
    const label = escapeHtml(col.label);
    if (col.isAI) {
      return `<div class="report-hdr-flex"><span class="report-hdr-icon-ai"></span><span class="report-hdr-label">${label}</span></div>`;
    }
    if (col.source) {
      const iconClass = SOURCE_ICON_CLASS[col.source] || SOURCE_ICON_CLASS.mixed;
      return `<div class="report-hdr-flex"><span class="${iconClass}"></span><span class="report-hdr-label">${label}</span></div>`;
    }
    return label;
  };
}

// ============================================================================
// Cell Formatter Factories (return HTML strings for Grid Lite)
// ============================================================================

const SENTIMENT_STYLES: Record<string, string> = {
  positive: 'background:#dcfce7;color:#166534;border:1px solid #bbf7d0',
  negative: 'background:#fee2e2;color:#991b1b;border:1px solid #fecaca',
  optimistic: 'background:#ccfbf1;color:#115e59;border:1px solid #99f6e4',
  neutral: 'background:#f3f4f6;color:#1f2937;border:1px solid #e5e7eb',
};

const AVATAR_COLORS = [
  '#2563eb',
  '#16a34a',
  '#9333ea',
  '#ea580c',
  '#db2777',
  '#0d9488',
  '#4f46e5',
  '#dc2626',
  '#ca8a04',
  '#0891b2',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Von logo SVG as inline HTML for AI cell buttons
const VON_LOGO_SVG = `<svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.57 0.01C11.37 0.2 14.4 3.35 14.4 7.2l-.01.35c-.08 1.73-.78 3.3-1.87 4.5l-.1.13c-.04.04-.08.08-.12.13-.08.08-.17.15-.25.22-1.2 1.09-2.77 1.79-4.5 1.87L7.2 14.4C3.35 14.4.2 11.37.01 7.57L0 7.2c0-1.87.71-3.58 1.88-4.86.07-.08.14-.17.21-.25.08-.08.17-.16.26-.23C3.63.71 5.33 0 7.2 0l.37.01zM1.55 5.9A5.82 5.82 0 001.4 7.2 5.8 5.8 0 007.2 13c.45 0 .88-.05 1.3-.15a11.16 11.16 0 01-4.27-2.68A11.16 11.16 0 011.55 5.9zm3.83-3.05c-1.05-.29-1.74-.16-2.13.1a7.49 7.49 0 00-.32.32c-.32.45-.44 1.22-.14 2.31a10.27 10.27 0 002.42 3.89 10.27 10.27 0 003.89 2.42c1.09.3 1.86.17 2.3-.14.1-.09.2-.19.33-.33.27-.39.4-1.07.14-2.3a10.27 10.27 0 00-2.42-3.89 10.27 10.27 0 00-3.9-2.42zM7.2 1.4c-.45 0-.88.05-1.3.15a11.16 11.16 0 014.27 2.68 11.16 11.16 0 012.68 4.27c.1-.42.15-.85.15-1.3A5.8 5.8 0 007.2 1.4z" fill="url(%23vonGrad)"/><defs><radialGradient id="vonGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(11.14 1.08) rotate(121) scale(15.31)"><stop stop-color="%23FFF3EB"/><stop offset=".26" stop-color="%23FF9042"/><stop offset="1" stop-color="%23854FFF"/></radialGradient></defs></svg>`;

/**
 * Create a cell formatter for an AI column that appends a Von reasoning button.
 * The button stores reasoning data as a data attribute for event delegation.
 */
export function createAICellFormatter(
  type: ColumnType,
  colId: string
): (this: { value: unknown }) => string {
  const baseFormatter = createCellFormatter(type);
  return function (this: { value: unknown }) {
    const baseHtml = baseFormatter.call(this);

    // Access _aiReasoning from the row data (Grid Lite TableRow exposes row.data)
    const rowData = (this as unknown as { row?: { data?: Record<string, unknown> } }).row?.data;
    let aiReasoningRaw = rowData?._aiReasoning as
      | Record<string, AIReasoningData>
      | string
      | undefined;
    // The data table stores objects as JSON strings, so parse if needed
    if (typeof aiReasoningRaw === 'string') {
      try {
        aiReasoningRaw = JSON.parse(aiReasoningRaw);
      } catch {
        aiReasoningRaw = undefined;
      }
    }
    const aiReasoningMap = aiReasoningRaw as Record<string, AIReasoningData> | undefined;
    const reasoning = aiReasoningMap?.[colId];

    if (!reasoning) return baseHtml;

    const reasoningJson = escapeHtml(JSON.stringify(reasoning));
    return (
      `<div style="display:flex;align-items:center;gap:4px;min-width:0">` +
      `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1">${baseHtml}</span>` +
      `<button class="von-cell-btn" data-reasoning="${reasoningJson}" title="View sources" style="margin-left:4px;padding:2px;background:white;box-shadow:0 1px 2px rgba(0,0,0,0.05);border-radius:4px;border:none;cursor:pointer;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center">${VON_LOGO_SVG}</button>` +
      `</div>`
    );
  };
}

/** Create a cell formatter for a given ColumnType */
export function createCellFormatter(type: ColumnType): (this: { value: unknown }) => string {
  return function (this: { value: unknown }) {
    const value = this.value;
    if (value === null || value === undefined) return '<span style="color:#9ca3af">—</span>';

    const strVal = escapeHtml(String(value));

    switch (type) {
      case 'owner': {
        const name = String(value);
        const initials = getInitials(name);
        const colorIdx = hashString(name) % AVATAR_COLORS.length;
        const bg = AVATAR_COLORS[colorIdx];
        return (
          `<div style="display:flex;align-items:center;gap:8px" data-tooltip="${escapeHtml(name)}">` +
          `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:${bg};color:white;font-size:10px;font-weight:500;flex-shrink:0">${escapeHtml(initials)}</div>` +
          `<span style="color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(name)}</span>` +
          `</div>`
        );
      }

      case 'multiPicklist': {
        let items: string[];
        if (Array.isArray(value)) {
          items = value;
        } else {
          const str = String(value);
          try {
            const parsed = JSON.parse(str);
            items = Array.isArray(parsed) ? parsed : str.split(',').map((s: string) => s.trim());
          } catch {
            items = str.split(',').map((s: string) => s.trim());
          }
        }
        const tooltipText = items.join(', ');
        return (
          `<span data-tooltip="${escapeHtml(tooltipText)}">` +
          items
            .map(
              (item: string) =>
                `<span style="display:inline-flex;padding:2px 8px;font-size:14px;font-weight:500;background:#f9fafb;border:1px solid #f3f4f6;border-radius:9999px;color:#1f2937;white-space:nowrap;margin-right:4px">${escapeHtml(String(item))}</span>`
            )
            .join('') +
          '</span>'
        );
      }

      case 'sentiment': {
        const normalized = String(value).toLowerCase();
        const style = SENTIMENT_STYLES[normalized] || SENTIMENT_STYLES.neutral;
        return `<span style="display:inline-flex;padding:2px 8px;font-size:14px;font-weight:500;border-radius:9999px;${style}">${escapeHtml(String(value))}</span>`;
      }

      case 'boolean': {
        const isTrue =
          value === true || value === 'true' || value === 'yes' || value === 'Yes' || value === '1';
        const style = isTrue
          ? 'background:#dcfce7;color:#166534;border:1px solid #bbf7d0'
          : 'background:#fee2e2;color:#991b1b;border:1px solid #fecaca';
        return `<span style="display:inline-flex;padding:2px 8px;font-size:14px;font-weight:500;border-radius:9999px;${style}">${isTrue ? 'Yes' : 'No'}</span>`;
      }

      case 'picklist':
        return value
          ? `<span style="display:inline-flex;padding:2px 8px;font-size:14px;font-weight:500;background:#f9fafb;border:1px solid #f3f4f6;border-radius:9999px;color:#1f2937;white-space:nowrap">${strVal}</span>`
          : '<span style="color:#9ca3af">—</span>';

      case 'currency':
        return `<span style="color:#111827">${escapeHtml(formatValue(value, 'currency'))}</span>`;

      case 'percentage':
        return `<span style="color:#111827">${escapeHtml(formatValue(value, 'percentage'))}</span>`;

      case 'number':
        return `<span style="color:#111827">${escapeHtml(formatValue(value, 'number'))}</span>`;

      case 'date':
        return `<span style="color:#111827">${escapeHtml(formatValue(value, 'date'))}</span>`;

      case 'longText':
        return `<span style="color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block" title="${escapeHtml(String(value))}">${strVal}</span>`;

      case 'url': {
        const href = String(value).trim();
        const isSafe = /^https?:\/\//i.test(href);
        return isSafe
          ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="color:#4f46e5;text-decoration:underline;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block" onclick="event.stopPropagation()">${escapeHtml(href)}</a>`
          : href
            ? `<span style="color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">${escapeHtml(href)}</span>`
            : '<span style="color:#9ca3af">—</span>';
      }

      default:
        return `<span style="color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">${strVal}</span>`;
    }
  };
}

// ============================================================================
// Content-based Column Width Calculation
// ============================================================================

/** Approximate character width in pixels at 14px font, weight 500 */
const CHAR_WIDTH_PX = 8.4;
/** Padding inside each cell (6px left + 12px right from CSS, plus buffer) */
const CELL_PADDING_PX = 28;
/** Extra width for header icons (source/AI) + sort icon */
const HEADER_ICON_WIDTH = 24;
/** Sort icon space */
const SORT_ICON_WIDTH = 16;

const MIN_COL_WIDTH: Record<ColumnType, number> = {
  boolean: 70,
  number: 90,
  currency: 100,
  percentage: 90,
  date: 120,
  text: 80,
  owner: 130,
  picklist: 100,
  multiPicklist: 130,
  sentiment: 110,
  email: 140,
  phone: 120,
  url: 140,
  longText: 140,
};

/** Maximum column width — tooltips handle overflow beyond this */
const MAX_COL_WIDTH = 280;

/** Number of data rows to sample for width estimation */
const SAMPLE_SIZE = 50;

/**
 * Estimate the ideal pixel width for a column based on its header label,
 * data type, and a sample of actual cell values.
 */
function estimateColumnWidth(col: ReportColumn, data: Record<string, unknown>[]): number {
  const minW = MIN_COL_WIDTH[col.type] ?? 80;

  // Header width: label chars + padding + icons
  let headerWidth = col.label.length * CHAR_WIDTH_PX + CELL_PADDING_PX + SORT_ICON_WIDTH;
  if (col.isAI || col.source) {
    headerWidth += HEADER_ICON_WIDTH;
  }

  // For types with fixed-width rendering, use type-based min
  if (col.type === 'boolean' || col.type === 'sentiment') {
    return Math.min(Math.max(minW, headerWidth), MAX_COL_WIDTH);
  }

  // Sample data values to find the widest formatted value
  const sampleRows = data.length <= SAMPLE_SIZE ? data : data.slice(0, SAMPLE_SIZE);
  let maxContentWidth = 0;

  for (const row of sampleRows) {
    const val = row[col.id];
    if (val === null || val === undefined) continue;

    let displayLen: number;
    switch (col.type) {
      case 'currency':
        displayLen = formatValue(val, 'currency').length;
        break;
      case 'percentage':
        displayLen = formatValue(val, 'percentage').length;
        break;
      case 'number':
        displayLen = formatValue(val, 'number').length;
        break;
      case 'date':
        displayLen = formatValue(val, 'date').length;
        break;
      case 'owner':
        // Avatar (24px) + gap (8px) + name text
        displayLen = String(val).length;
        maxContentWidth = Math.max(
          maxContentWidth,
          displayLen * CHAR_WIDTH_PX + 32 + CELL_PADDING_PX
        );
        continue;
      default:
        displayLen = String(val).length;
        break;
    }

    maxContentWidth = Math.max(maxContentWidth, displayLen * CHAR_WIDTH_PX + CELL_PADDING_PX);
  }

  // AI columns need extra space for the reasoning button
  if (col.isAI) {
    maxContentWidth += 28;
  }

  const idealWidth = Math.max(minW, headerWidth, maxContentWidth);
  return Math.min(idealWidth, MAX_COL_WIDTH);
}

// ============================================================================
// Auto-size columns in pre-built gridOptions (e.g. from backend API)
// ============================================================================

/**
 * Extract column data from gridOptions, supporting:
 *  1. New format: `data.columns` (Grid Lite local data provider)
 *  2. Deprecated format: `dataTable.columns` (still used by backend API)
 */
export function getDataTableColumns(options: GridOptions): Record<string, unknown[]> | undefined {
  // New format: options.data.columns
  const dataOpt = (options as Record<string, unknown>).data as
    | { columns?: Record<string, unknown[]> }
    | undefined;
  if (dataOpt?.columns) return dataOpt.columns;

  // Deprecated format: options.dataTable.columns (backend API)
  const legacy = (options as Record<string, unknown>).dataTable as
    | { columns?: Record<string, unknown[]> }
    | undefined;
  return legacy?.columns;
}

/**
 * Post-process gridOptions to auto-size columns that don't have an explicit width.
 * Works with both the new `data.dataTable` and deprecated `dataTable` formats.
 * Columns that already have a width set are left untouched.
 */
export function autoSizeGridColumns(options: GridOptions): GridOptions {
  const columns = options.columns as
    | Array<{ id: string; width?: number; [key: string]: unknown }>
    | undefined;
  if (!columns || columns.length === 0) return options;

  const dtCols = getDataTableColumns(options);
  if (!dtCols) return options;

  // Mutate column widths IN-PLACE. Grid Lite's async init via the React wrapper
  // means a new options object passed through grid.update() doesn't reliably
  // re-apply column widths. By mutating the original columns array, the widths
  // are present when Grid.grid(container, options) first initializes.
  for (const col of columns) {
    if (col.width) continue;

    const colData = dtCols[col.id];
    if (!colData) continue;

    const headerLabel = col.id
      .replace(/^col_/, '')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
    const headerWidth = headerLabel.length * CHAR_WIDTH_PX + CELL_PADDING_PX + SORT_ICON_WIDTH;

    const sampleData = colData.length <= SAMPLE_SIZE ? colData : colData.slice(0, SAMPLE_SIZE);
    let maxContentWidth = 0;
    for (const val of sampleData) {
      if (val === null || val === undefined) continue;
      maxContentWidth = Math.max(
        maxContentWidth,
        String(val).length * CHAR_WIDTH_PX + CELL_PADDING_PX
      );
    }

    col.width = Math.round(Math.min(Math.max(80, headerWidth, maxContentWidth), MAX_COL_WIDTH));
  }

  // Ensure column resizing is always available
  const rendering = (options.rendering ?? {}) as Record<string, unknown>;
  const renderingCols = (rendering.columns ?? {}) as Record<string, unknown>;
  const existingResizing = (renderingCols.resizing ?? {}) as Record<string, unknown>;
  options.rendering = {
    ...rendering,
    columns: {
      ...renderingCols,
      resizing: { enabled: true, mode: 'independent' as const, ...existingResizing },
    },
  } as GridOptions['rendering'];

  return options;
}

// ============================================================================
// Apply column-level format (d3-format) to backend-generated gridOptions
// ============================================================================

/**
 * Process gridOptions columns that have a `format` field (d3-format string)
 * and inject a `cells.formatter` that applies the format to numeric values.
 *
 * This bridges the backend's column-level `format` (e.g., "$,.2f") with
 * Grid Lite's cell rendering. If a column also has `cells.format` (a template
 * like "{value}%"), the d3-formatted number is injected into the template.
 *
 * Columns without `format` are left untouched.
 */
export function applyColumnFormats(options: GridOptions): GridOptions {
  const columns = options.columns as
    | Array<{ id: string; format?: string; cells?: Record<string, unknown>; [key: string]: unknown }>
    | undefined;
  if (!columns || columns.length === 0) return options;

  for (const col of columns) {
    if (!col.format || typeof col.format !== 'string') continue;

    const d3Format = col.format;
    const cellTemplate = col.cells?.format as string | undefined;

    col.cells = {
      ...col.cells,
      formatter: function (this: { value: unknown }): string {
        const value = this.value;
        if (value === null || value === undefined) return '<span style="color:#9ca3af">—</span>';

        const num = typeof value === 'number' ? value : Number(value);
        if (isNaN(num)) return `<span style="color:#111827">${String(value)}</span>`;

        const formatted = formatD3Pattern(num, d3Format);

        // If there's a cell template like "{value}%", inject the formatted number
        if (cellTemplate && cellTemplate.includes('{value}')) {
          const display = cellTemplate.replace('{value}', formatted);
          return `<span style="color:#111827">${display}</span>`;
        }

        return `<span style="color:#111827">${formatted}</span>`;
      },
    };
  }

  return options;
}

// ============================================================================
// Helpers: Convert row-based data to Grid Lite column-based format
// ============================================================================

/**
 * Convert an array of row objects into Grid Lite's column-oriented dataTable format.
 */
export function rowsToDataTableColumns(
  rows: Record<string, unknown>[],
  columnIds: string[]
): Record<string, DataTableValue[]> {
  const result: Record<string, DataTableValue[]> = {};
  for (const id of columnIds) {
    result[id] = rows.map((row) => {
      const val = row[id];
      if (val === null || val === undefined) return null;
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean')
        return val;
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    });
  }
  return result;
}

/**
 * Build GridOptions from ReportColumn definitions and row data.
 * Convenience function for migrating from the old API.
 */
export function buildGridOptions(
  columns: ReportColumn[],
  data: Record<string, unknown>[],
  overrides?: Partial<GridOptions> & {
    pageSize?: number;
    showPagination?: boolean;
  }
): GridOptions {
  const columnIds = columns.map((c) => c.id);

  // Include _aiReasoning in data table columns so TableRow.data exposes it to formatters
  const hasAIColumns = columns.some((col) => col.isAI);
  const dataColumnIds =
    hasAIColumns && data.some((row) => '_aiReasoning' in row)
      ? [...columnIds, '_aiReasoning']
      : columnIds;

  const gridColumns: IndividualColumnOptions[] = columns.map((col) => ({
    id: col.id,
    header: {
      formatter: createHeaderFormatter(col),
    },
    width: col.width ?? col.minWidth ?? estimateColumnWidth(col, data),
    sorting: {
      enabled: col.sortable !== false,
    },
    cells: {
      formatter: col.isAI ? createAICellFormatter(col.type, col.id) : createCellFormatter(col.type),
    },
  }));

  // Separate custom keys from GridOptions overrides
  const {
    pageSize: overridePageSize,
    showPagination,
    rendering: renderingOverrides,
    pagination: paginationOverrides,
    ...restOverrides
  } = overrides ?? {};

  const pageSize = overridePageSize ?? 10;
  const paginationEnabled = showPagination !== false;

  const options: GridOptions = {
    ...restOverrides,
    data: {
      columns: rowsToDataTableColumns(data, dataColumnIds),
    },
    columns: gridColumns,
    columnDefaults: {
      sorting: { enabled: true },
    },
    rendering: {
      theme: 'hcg-theme-default',
      columns: {
        resizing: { enabled: true, mode: 'independent' },
      },
      rows: {
        strictHeights: true,
      },
      ...renderingOverrides,
    },
    pagination: {
      enabled: paginationEnabled,
      ...(paginationEnabled ? { pageSize } : {}),
      ...paginationOverrides,
    },
  };

  return options;
}
