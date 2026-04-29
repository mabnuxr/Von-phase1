import { forwardRef } from 'react';
import type { ProbeColumn } from '../columnWidthLogic';

interface ColumnWidthProbeProps {
  /** One descriptor per column. The probe renders a hidden TH per column
   *  (header text) and one TD per candidate row, then JS measures each.
   *  Ref forwards to the underlying <table> so the parent can read
   *  offsetWidth without poking at internal structure. */
  columns: ProbeColumn[];
}

/**
 * Hidden, off-screen table whose only job is to expose Grid Lite-equivalent
 * styling for natural-width measurement. We render it ourselves (instead of
 * peeking at Grid Lite's DOM) so the measurement runs synchronously in
 * useLayoutEffect — no waiting on Grid Lite's async init.
 *
 * One row per candidate-rank: the longest data value lives in row 0,
 * second-longest in row 1, etc. Columns with fewer candidates emit empty
 * <td>s for the missing rows. The measurement step takes the max
 * offsetWidth across all rows for each column.
 */
export const ColumnWidthProbe = forwardRef<HTMLTableElement, ColumnWidthProbeProps>(
  function ColumnWidthProbe({ columns }, ref) {
    const rowCount = Math.max(1, ...columns.map((c) => c.candidates.length));

    return (
      <table
        ref={ref}
        aria-hidden
        className="report-grid-probe"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          top: -9999,
          left: -9999,
          tableLayout: 'auto',
          width: 'max-content',
          whiteSpace: 'nowrap',
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.id}
                className="hcg-header-cell"
                style={{ whiteSpace: 'nowrap' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {columns.map((col) => (
                <td key={col.id} style={{ whiteSpace: 'nowrap' }}>
                  {col.candidates[rowIdx] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
);
