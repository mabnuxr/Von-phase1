import { useRef, useEffect, memo } from 'react';
import Highcharts from './highchartsSetup';
import HighchartsReact from 'highcharts-react-official';
import type { ChartWidgetConfig, DrilldownConfig, DrillFilters } from '../types';
import { useChartOptions } from './useChartOptions';

export interface ChartWidgetProps {
  config: ChartWidgetConfig;
  /** Drilldown config with column_map for point-level drilldown. */
  drilldown?: DrilldownConfig | null;
  /** Called when a chart data point is clicked and column_map is present. */
  onPointClick?: (drillFilters: DrillFilters) => void;
}

const ChartWidget: React.FC<ChartWidgetProps> = memo(({ config, drilldown, onPointClick }) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const { options: finalOptions, constructorType } = useChartOptions({ config, drilldown, onPointClick });

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
});

export { ChartWidget };
