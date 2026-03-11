import type { GridOptions } from '@highcharts/grid-lite-react';
import type { IndividualColumnOptions } from '@highcharts/grid-lite/es-modules/Grid/Core/Options';
import type { DataTableValue } from '@highcharts/grid-lite/es-modules/Data/DataTableOptions';
import type { ColumnType, DataSourceType, ReportColumn } from './ReportTable';

// ============================================================================
// Value Formatting Utility
// ============================================================================

export const formatValue = (value: unknown, type: ColumnType): string => {
  if (value === null || value === undefined) return '—';

  switch (type) {
    case 'currency':
      return typeof value === 'number'
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)
        : String(value);

    case 'percentage':
      return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : `${value}%`;

    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);

    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime())
          ? value
          : date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
      }
      return String(value);

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
          `<div style="display:flex;align-items:center;gap:8px">` +
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
        return items
          .map(
            (item: string) =>
              `<span style="display:inline-flex;padding:2px 8px;font-size:14px;font-weight:500;background:#f9fafb;border:1px solid #f3f4f6;border-radius:9999px;color:#1f2937;white-space:nowrap;margin-right:4px">${escapeHtml(String(item))}</span>`
          )
          .join('');
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

      default:
        return `<span style="color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">${strVal}</span>`;
    }
  };
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
      if (Array.isArray(val)) return JSON.stringify(val);
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

  const gridColumns: IndividualColumnOptions[] = columns.map((col) => ({
    id: col.id,
    header: {
      formatter: createHeaderFormatter(col),
    },
    width: col.width ?? col.minWidth,
    sorting: {
      enabled: col.sortable !== false,
    },
    cells: {
      formatter: createCellFormatter(col.type),
    },
  }));

  const pageSize = overrides?.pageSize ?? 10;

  const options: GridOptions = {
    dataTable: {
      columns: rowsToDataTableColumns(data, columnIds),
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
    },
    pagination: {
      enabled: true,
      pageSize,
    },
    ...overrides,
  };

  // Remove our custom keys from overrides that got spread
  if (options && 'pageSize' in options) delete (options as Record<string, unknown>).pageSize;
  if (options && 'showPagination' in options)
    delete (options as Record<string, unknown>).showPagination;

  return options;
}
