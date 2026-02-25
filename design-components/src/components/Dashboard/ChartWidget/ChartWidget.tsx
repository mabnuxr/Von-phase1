import { useRef, useEffect, useMemo } from 'react';
import Highcharts from 'highcharts';
import 'highcharts/modules/xrange';
import HighchartsReact from 'highcharts-react-official';
import type { ChartWidgetProps } from '../types';

/**
 * Zero-transform Highcharts wrapper.
 * Receives pre-built highchartsOptions from the backend and passes them directly to Highcharts.
 * Measures its container and calls chart.setSize() to fill available space exactly.
 */
const ChartWidget: React.FC<ChartWidgetProps> = ({ config }) => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const sizeRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => {
    const opts = config.highchartsOptions as Highcharts.Options;
    return {
      ...opts,
      chart: {
        ...(opts.chart ?? {}),
        reflow: false, // we handle sizing manually via setSize
      },
    };
  }, [config.highchartsOptions]);

  useEffect(() => {
    const el = sizeRef.current;
    if (!el) return;

    const syncSize = () => {
      const chart = chartRef.current?.chart;
      if (!chart) return;
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        chart.setSize(Math.floor(width), Math.floor(height), false);
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
          options={options}
          containerProps={{ style: { height: '100%', width: '100%' } }}
        />
      </div>
    </div>
  );
};

export { ChartWidget };
