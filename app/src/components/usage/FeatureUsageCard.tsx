import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { FeatureUsage } from "../../services/usageService";

interface FeatureUsageCardProps {
  feature: FeatureUsage;
}

export function FeatureUsageCard({ feature }: FeatureUsageCardProps) {
  const limit = feature.limit;
  const color = "#8039e9";

  // Convert cumulative Stigg values to daily deltas
  const sorted = [...feature.points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const data = sorted.map((p, i) => [
    new Date(p.timestamp).getTime(),
    i === 0 ? p.value : Math.max(0, p.value - sorted[i - 1].value),
  ]);

  // Period total from deltas
  const current = data.reduce((sum, [, v]) => sum + (v as number), 0);

  const options: Highcharts.Options = {
    chart: {
      type: "area",
      height: 80,
      backgroundColor: "transparent",
      margin: [5, 0, 20, 0],
      style: { fontFamily: "inherit" },
    },
    title: { text: undefined },
    xAxis: {
      type: "datetime",
      visible: true,
      labels: {
        format: "{value:%b %e}",
        style: { color: "#d1d5db", fontSize: "9px" },
      },
      lineWidth: 0,
      tickLength: 0,
    },
    yAxis: { visible: false },
    legend: { enabled: false },
    tooltip: {
      headerFormat: "<b>{point.key:%b %e}</b><br/>",
      pointFormat: "{point.y:,.0f}",
      style: { fontSize: "11px" },
    },
    plotOptions: {
      area: {
        lineWidth: 2,
        lineColor: color,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, Highcharts.color(color).setOpacity(0.2).get("rgba") as string],
            [1, Highcharts.color(color).setOpacity(0.02).get("rgba") as string],
          ],
        },
        marker: { enabled: false },
      },
    },
    series: [{ type: "area", data, color }],
    credits: { enabled: false },
  };

  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-xs font-medium text-gray-700">
            {feature.display_name}
          </p>
          {feature.reset_period && (
            <p className="text-[10px] text-gray-400 capitalize">
              Resets {feature.reset_period.toLowerCase()}
            </p>
          )}
        </div>
        <span className="text-xs font-medium text-gray-900 tabular-nums">
          {limit
            ? `${current.toLocaleString()} / ${limit.toLocaleString()}`
            : current.toLocaleString()}
        </span>
      </div>

      {data.length > 0 ? (
        <HighchartsReact highcharts={Highcharts} options={options} />
      ) : (
        <div className="h-20 flex items-center justify-center text-gray-300 text-xs">
          No usage data for this period
        </div>
      )}
    </div>
  );
}
