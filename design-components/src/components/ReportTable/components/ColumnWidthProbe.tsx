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
 * Hidden, off-screen table whose only job is to mirror Grid Lite's cell
 * rendering for natural-width measurement. Each candidate is pre-rendered
 * by `buildProbeColumns` through the column's own `cells.formatter` (or
 * `cells.format` template) and injected here as innerHTML, so the probe TD
 * has the same DOM as the eventual cell. Measurement therefore reflects
 * the real visible pixel width — `<a href="...">Name</a>` measures the
 * link text "Name", not the source string; markdown values measure the
 * `dt-markdown-wrap` layout, not the raw value; and so on.
 *
 * Done synchronously in useLayoutEffect so we don't have to wait on Grid
 * Lite's async init. One row per candidate-rank (longest → shortest),
 * empty TDs for columns with fewer candidates than the max.
 */
export const ColumnWidthProbe = forwardRef<HTMLTableElement, ColumnWidthProbeProps>(
  function ColumnWidthProbe({ columns }, ref) {
    const rowCount = Math.max(1, ...columns.map((c) => c.candidateHtml.length));

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
              <th key={col.id} className="hcg-header-cell" style={{ whiteSpace: 'nowrap' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {columns.map((col) => (
                <td
                  key={col.id}
                  style={{ whiteSpace: 'nowrap' }}
                  dangerouslySetInnerHTML={{ __html: col.candidateHtml[rowIdx] ?? '' }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
);
