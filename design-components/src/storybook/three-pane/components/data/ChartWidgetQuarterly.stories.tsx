import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartWidget } from '../../../../components/Dashboard/ChartWidget/ChartWidget';
import type { ChartWidgetConfig } from '../../../../components/Dashboard/types';

// Stories for verifying the `%Q` quarter token + datetime axis pattern
// across realistic chart-widget sizes.
//
// Each story shares the same fixed widget size (matches a typical dashboard
// tile) and varies only the number of quarters in the data, so we can see
// how Highcharts' label-collision logic thins quarter labels as the axis
// gets denser.

const FIXED_WIDGET_SIZE = { width: 720, height: 360 };

// Helper: epoch ms for the first day of a given quarter
const quarterStart = (year: number, quarter: number) => Date.UTC(year, (quarter - 1) * 3, 1);

// Deterministic PRNG so the bars look the same across reloads.
function pseudoRandomSeries(seed: number, count: number, min: number, max: number): number[] {
  let r = seed;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    r = (r * 9301 + 49297) % 233280;
    out.push(Math.round((min + (r / 233280) * (max - min)) * 10) / 10);
  }
  return out;
}

// Build N consecutive quarters ending at the most recent quarter, returning
// (timestamp, value) tuples for each series.
function buildQuarterlyData(count: number, values: number[]): [number, number][] {
  // Anchor the rightmost quarter at Q4 2025 so leap-year Q1 2024 is exercised.
  const endYear = 2025;
  const endQuarter = 4;
  const points: [number, number][] = [];
  for (let i = count - 1; i >= 0; i--) {
    // walk backwards from the end quarter
    const totalQuarter = endYear * 4 + (endQuarter - 1) - i;
    const year = Math.floor(totalQuarter / 4);
    const quarter = (totalQuarter % 4) + 1;
    points.push([quarterStart(year, quarter), values[count - 1 - i]]);
  }
  return points;
}

function buildConfig(quarterCount: number): ChartWidgetConfig {
  const nrr = pseudoRandomSeries(42, quarterCount, 80, 115);
  const grr = pseudoRandomSeries(99, quarterCount, 70, 95);

  return {
    chartType: 'column',
    highchartsOptions: {
      chart: { type: 'column' },
      title: { text: undefined },
      xAxis: {
        type: 'datetime',
        units: [['month', [3]]],
        labels: {
          format: 'Q{value:%Q} {value:%Y}',
          style: { fontSize: '10px' },
        },
        startOnTick: true,
        endOnTick: true,
      },
      yAxis: {
        title: { text: '%' },
        max: 150,
      },
      tooltip: {
        xDateFormat: 'Q%Q %Y',
        shared: true,
      },
      plotOptions: {
        column: {
          // 1 quarter ≈ 92 days; pointRange in ms keeps grouped bars from
          // overlapping on a datetime axis.
          pointRange: 90 * 24 * 3600 * 1000,
        },
      },
      series: [
        {
          name: 'NRR %',
          color: '#7DA7F2',
          data: buildQuarterlyData(quarterCount, nrr),
        },
        {
          name: 'GRR %',
          color: '#5B4FE0',
          data: buildQuarterlyData(quarterCount, grr),
        },
      ],
    },
  };
}

interface QuarterlyArgs {
  quarters: number;
}

const meta: Meta<QuarterlyArgs> = {
  title: 'Components/Dashboard/ChartWidget/Quarterly Axis',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Verifies the `%Q` token + `type: "datetime"` + `units: [["month", [3]]]`',
          'pattern for quarterly time-series charts.',
          '',
          'All stories use the same fixed widget size (720×360) and vary only the',
          'number of quarters in the data. Watch how Highcharts thins axis labels',
          'as the count grows — and confirm tooltips remain quarter-precise via',
          '`tooltip.xDateFormat: "Q%Q %Y"`.',
        ].join('\n'),
      },
    },
  },
  render: ({ quarters }) => (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 px-1">
        {quarters} quarters · widget size {FIXED_WIDGET_SIZE.width}×{FIXED_WIDGET_SIZE.height}
      </div>
      <div
        className="bg-white rounded-xl border border-gray-200"
        style={{ width: FIXED_WIDGET_SIZE.width, height: FIXED_WIDGET_SIZE.height }}
      >
        <ChartWidget config={buildConfig(quarters)} />
      </div>
    </div>
  ),
};

export default meta;
type Story = StoryObj<QuarterlyArgs>;

export const FourQuarters: Story = {
  name: '4 quarters (1 year)',
  args: { quarters: 4 },
};

export const EightQuarters: Story = {
  name: '8 quarters (2 years)',
  args: { quarters: 8 },
};

export const FifteenQuarters: Story = {
  name: '15 quarters (~4 years)',
  args: { quarters: 15 },
};

export const TwentyQuarters: Story = {
  name: '20 quarters (5 years)',
  args: { quarters: 20 },
};

export const FortyQuarters: Story = {
  name: '40 quarters (10 years)',
  args: { quarters: 40 },
};
