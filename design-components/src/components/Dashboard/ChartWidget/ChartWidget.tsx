import { useRef, useEffect, memo } from 'react';
import Highcharts from './highchartsSetup';
import HighchartsReact from 'highcharts-react-official';
import type { ChartWidgetConfig, DrilldownConfig, DrillFilters, PanelDrilldownV2 } from '../types';
import { useChartOptions } from './useChartOptions';

export interface ChartWidgetProps {
  config: ChartWidgetConfig;
  /** Legacy V1 drilldown config — flat ``{query_ref, column_map}``. */
  drilldown?: DrilldownConfig | null;
  /**
   * V2 drilldown config. When present, takes precedence over ``drilldown``
   * for point-click filter extraction (column_map is sourced from the
   * default target's default variant).
   */
  drilldownV2?: PanelDrilldownV2 | null;
  /** Called when a chart data point is clicked and a column_map is
   *  available. The optional second arg carries the point's numeric
   *  metric value (``point.y`` / ``weight`` / ``value``) so the drill
   *  breadcrumb can render it as a parenthesized suffix on the chain
   *  segment (e.g. "Stage: Negotiation (47)"). The drill SQL ignores it;
   *  only the breadcrumb consumes it. */
  onPointClick?: (drillFilters: DrillFilters, metricValue?: unknown) => void;
}

const ChartWidget: React.FC<ChartWidgetProps> = memo(
  ({ config, drilldown, drilldownV2, onPointClick }) => {
    const chartRef = useRef<HighchartsReact.RefObject>(null);
    const sizeRef = useRef<HTMLDivElement>(null);
    const { options: finalOptions, constructorType } = useChartOptions({
      config,
      drilldown,
      drilldownV2,
      onPointClick,
    });

    useEffect(() => {
      const el = sizeRef.current;
      if (!el) return;

      const syncSize = () => {
        const chart = chartRef.current?.chart;
        if (!chart) return;
        const { width, height } = el.getBoundingClientRect();
        if (width > 0 && height > 0) {
          try {
            chart.setSize(Math.floor(width), Math.floor(height), false);
          } catch {
            // Chart was destroyed between rAF scheduling and execution
          }
        }
      };

      const observer = new ResizeObserver(() => {
        requestAnimationFrame(syncSize);
      });

      observer.observe(el);
      requestAnimationFrame(syncSize);

      return () => observer.disconnect();
    }, []);

    return (
      <div className="h-full w-full min-h-0 overflow-hidden p-2">
        <div ref={sizeRef} className="h-full w-full">
          <HighchartsReact
            ref={chartRef}
            highcharts={Highcharts}
            constructorType={constructorType}
            options={finalOptions}
            containerProps={{ style: { height: '100%', width: '100%' } }}
          />
        </div>
      </div>
    );
  }
);

export { ChartWidget };
