import { useCallback, useState } from 'react';
import type { GridOptions } from '@highcharts/grid-lite-react';
import type { AIReasoningData } from '../types';

interface PopoverPosition {
  top: number;
  left: number;
}

interface AIReasoningPopoverState {
  reasoning: AIReasoningData;
  position: PopoverPosition;
}

interface UseCellInteractionsResult {
  /** Wire onto the wrapper's onClick. Handles both AI reasoning button
   *  clicks and generic cell-click drilldowns. */
  onWrapperClick: (e: React.MouseEvent) => void;
  /** Currently shown AI reasoning popover, if any. Pass to <SourcePopover>. */
  aiReasoningPopover: AIReasoningPopoverState | null;
  /** Close handler for the popover. */
  closeAIReasoningPopover: () => void;
}

/**
 * Wraps two click behaviors that share the same click target:
 *   1. AI reasoning button (`.von-cell-btn[data-reasoning]`) opens a
 *      SourcePopover anchored to the button.
 *   2. Generic cell click resolves the column id + raw value + full row
 *      data from the grid's dataTable and forwards to `onCellClick`. The
 *      row data is required by V2 drilldown which needs to look up multiple
 *      data_keys from the clicked row (e.g. cohort cell click drills on
 *      both `account_name` AND `week_label`, regardless of which cell was
 *      clicked).
 *
 * Anchor links, buttons, inputs, and form controls are skipped so native
 * interactions still work (e.g. a Salesforce link in a cell).
 */
export function useCellInteractions(
  options: GridOptions,
  onCellClick:
    | ((
        columnId: string,
        cellValue: unknown,
        rowData: Record<string, unknown>,
        displayText?: string
      ) => void)
    | undefined
): UseCellInteractionsResult {
  const [popover, setPopover] = useState<AIReasoningPopoverState | null>(null);

  const onWrapperClick = useCallback(
    (e: React.MouseEvent) => {
      // AI reasoning button takes priority over the generic cell click.
      const btn = (e.target as HTMLElement).closest('.von-cell-btn') as HTMLElement | null;
      if (btn) {
        e.stopPropagation();
        const reasoningAttr = btn.getAttribute('data-reasoning');
        if (!reasoningAttr) return;

        try {
          const reasoning = JSON.parse(reasoningAttr) as AIReasoningData;
          const rect = btn.getBoundingClientRect();
          setPopover({
            reasoning,
            position: {
              top: rect.bottom + 4,
              // Clamp to viewport so the popover doesn't disappear off-edge.
              left: Math.max(8, Math.min(rect.left - 240, window.innerWidth - 340)),
            },
          });
        } catch {
          // Malformed JSON — silently ignore rather than crashing the table.
        }
        return;
      }

      // Generic cell click — only when caller wants it.
      if (!onCellClick) return;
      // Skip native interactive elements so links/buttons keep working.
      if ((e.target as HTMLElement).closest('a,button,input,select,textarea')) return;

      const td = (e.target as HTMLElement).closest('td') as HTMLTableCellElement | null;
      if (!td) return;
      const tr = td.closest('tr');
      if (!tr || !tr.closest('tbody')) return; // ignore header clicks

      const colIndex = td.cellIndex;
      const cols = options.columns as Array<{ id?: string }> | undefined;
      const columnId = cols?.[colIndex]?.id;
      if (!columnId) return;

      const dataTable = options.dataTable as { columns?: Record<string, unknown[]> } | undefined;
      const rowIndex = Array.from(tr.parentElement!.children).indexOf(tr);
      const rawValue = dataTable?.columns?.[columnId]?.[rowIndex] ?? td.textContent?.trim() ?? '';

      // Build the row dict by reading dataTable.columns[col][rowIndex] for every
      // column. V2 drilldown's column_map can reference any data_key from the
      // row (not just the clicked cell's column), so the handler needs full
      // row context to extract drillFilters correctly.
      const rowData: Record<string, unknown> = {};
      const allCols = dataTable?.columns;
      if (allCols) {
        for (const [colId, values] of Object.entries(allCols)) {
          if (Array.isArray(values)) {
            rowData[colId] = values[rowIndex];
          }
        }
      }

      // Capture the cell's rendered text — the actually-formatted string
      // (e.g. ``"$1,096,367"``) that the user visually clicked. The cell
      // body is wrapped in a ``<span style="color:#111827">…</span>`` by
      // ``createCellFormatter``; ``td.textContent`` reads through that
      // wrapper so we get the same string the user saw. Falls back to
      // the rawValue stringified when the cell is empty.
      const displayText = td.textContent?.trim() || String(rawValue ?? '');
      onCellClick(columnId, rawValue, rowData, displayText);
    },
    [onCellClick, options.dataTable, options.columns]
  );

  const closeAIReasoningPopover = useCallback(() => setPopover(null), []);

  return {
    onWrapperClick,
    aiReasoningPopover: popover,
    closeAIReasoningPopover,
  };
}
