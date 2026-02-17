import { saveAs } from 'file-saver';

/**
 * Export spreadsheet data as CSV
 */
export function downloadCSV(
  columns: Array<{ id: string; label: string }>,
  rows: Record<string, string | number>[],
  filename: string
): void {
  const header = columns.map((col) => `"${col.label}"`).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const val = row[col.id] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    )
    .join('\n');

  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const safeName = filename.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
  saveAs(blob, `${safeName}.csv`);
}

/**
 * Create a new empty sheet
 */
export function createEmptySheet(
  columns: Array<{ id: string; label: string }>,
  rowCount = 5
): Record<string, string | number>[] {
  return Array.from({ length: rowCount }, () => {
    const row: Record<string, string | number> = {};
    columns.forEach((col) => {
      row[col.id] = '';
    });
    return row;
  });
}
