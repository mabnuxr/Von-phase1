import { useEffect, useRef } from 'react';
import { useAutoFit } from './AutoFitContext';
import { useDashboardGridConfig } from './DashboardGridConfigContext';

export interface ContentHeightFitOptions {
  panelId: string;
  /** Stable string that changes only when the agent's content changes. */
  fingerprint: string;
  /** Pixel height of the widget's rendered content. Null until first measurement. */
  measuredPx: number | null;
  /** Pixel height of widget chrome (e.g. WidgetShell header) added to measuredPx before conversion. */
  chromePx?: number;
  /** Set false to skip auto-fit (e.g. user opted into manual scroll via overflow: 'auto'). */
  enabled?: boolean;
}

/**
 * Reports the widget's natural content height up to the dashboard auto-fit
 * coordinator. The coordinator decides whether to PATCH the layout. No-op
 * outside an `AutoFitContext.Provider` (e.g. storybook).
 */
export function useContentHeightFit({
  panelId,
  fingerprint,
  measuredPx,
  chromePx = 0,
  enabled = true,
}: ContentHeightFitOptions): void {
  const auto = useAutoFit();
  const gridConfig = useDashboardGridConfig();
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !auto || !gridConfig) return;
    if (measuredPx == null || measuredPx <= 0) return;

    if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = undefined;
      const totalPx = measuredPx + chromePx;
      const rowPx = gridConfig.rowHeight;
      const verticalMargin = gridConfig.margin?.[1] ?? 0;
      const desiredH = Math.max(
        2,
        Math.ceil((totalPx + verticalMargin) / (rowPx + verticalMargin))
      );
      auto.report({ panelId, desiredH, fingerprint });
    });
    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = undefined;
      }
    };
  }, [auto, gridConfig, panelId, fingerprint, measuredPx, chromePx, enabled]);
}
