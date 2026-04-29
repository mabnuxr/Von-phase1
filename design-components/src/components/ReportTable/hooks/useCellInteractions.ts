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
 *   2. Generic cell click resolves the column id + raw value from the
 *      grid's dataTable and forwards to `onCellClick`.
 *
 * Anchor links, buttons, inputs, and form controls are skipped so native
 * interactions still work (e.g. a Salesforce link in a cell).
 */
export function useCellInteractions(
  options: GridOptions,
  onCellClick: ((columnId: string, cellValue: unknown) => void) | undefined,
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

      const dataTable = options.dataTable as
        | { columns?: Record<string, unknown[]> }
        | undefined;
      const rowIndex = Array.from(tr.parentElement!.children).indexOf(tr);
      const rawValue =
        dataTable?.columns?.[columnId]?.[rowIndex] ?? td.textContent?.trim() ?? '';

      onCellClick(columnId, rawValue);
    },
    [onCellClick, options.dataTable, options.columns],
  );

  const closeAIReasoningPopover = useCallback(() => setPopover(null), []);

  return {
    onWrapperClick,
    aiReasoningPopover: popover,
    closeAIReasoningPopover,
  };
}
