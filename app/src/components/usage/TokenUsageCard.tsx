import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { FeatureUsage } from "../../services/usageService";

interface TokenUsageCardProps {
  tokenFeatures: FeatureUsage[];
}

const TOKEN_COLORS: Record<string, string> = {
  "feature-input-tokens": "#8039e9",
  "feature-output-tokens": "#f97316",
  "feature-cache-write-tokens": "#eab308",
  "feature-cache-read-tokens": "#22c55e",
};

const TOKEN_LABELS: Record<string, string> = {
  "feature-input-tokens": "Input Tokens",
  "feature-output-tokens": "Output Tokens",
  "feature-cache-write-tokens": "Cache Write Tokens",
  "feature-cache-read-tokens": "Cache Read Tokens",
};

function TokenSparkline({ feature }: { feature: FeatureUsage }) {
  const color = TOKEN_COLORS[feature.feature_id] || "#8039e9";
  const label = TOKEN_LABELS[feature.feature_id] || feature.display_name;

  // Convert cumulative Stigg values to daily deltas
  const sorted = [...feature.points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const data = sorted.map((p, i) => [
    new Date(p.timestamp).getTime(),
    i === 0 ? p.value : Math.max(0, p.value - sorted[i - 1].value),
  ]);

  // Sum of deltas for this period
  const total = data.reduce((sum, [, v]) => sum + (v as number), 0);

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
      pointFormat: "{point.y:,.0f} tokens",
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
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-gray-600">{label}</span>
        </div>
        <span className="text-xs font-medium text-gray-900 tabular-nums">
          {total.toLocaleString()}
        </span>
      </div>
      {data.length > 0 ? (
        <HighchartsReact highcharts={Highcharts} options={options} />
      ) : (
        <div className="h-20 flex items-center justify-center text-gray-300 text-xs">
          No data
        </div>
      )}
    </div>
  );
}

export function TokenUsageCard({ tokenFeatures }: TokenUsageCardProps) {
  if (tokenFeatures.length === 0) return null;

  const activeFeatures = tokenFeatures.filter(
    (f) => (f.tenant_usage ?? 0) > 0 || f.points.some((p) => p.value > 0),
  );

  if (activeFeatures.length === 0) return null;

  // Compute period totals from daily deltas (not cumulative Stigg values)
  const grandTotal = tokenFeatures.reduce((sum, f) => {
    const sorted = [...f.points].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const deltas = sorted.map((p, i) =>
      i === 0 ? p.value : Math.max(0, p.value - sorted[i - 1].value),
    );
    return sum + deltas.reduce((s, v) => s + v, 0);
  }, 0);

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-900">LLM Token Usage</p>
        <span className="text-sm text-gray-500 tabular-nums">
          {grandTotal.toLocaleString()} total
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {activeFeatures.map((f) => (
          <TokenSparkline key={f.feature_id} feature={f} />
        ))}
      </div>
    </div>
  );
}
