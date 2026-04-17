import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { FeatureUsage } from "../../services/usageService";

interface TokenUsageCardProps {
  tokenFeatures: FeatureUsage[];
  isLoading?: boolean;
}

const SERIES_CONFIG: {
  id: string;
  label: string;
  color: string;
}[] = [
  { id: "feature-input-tokens", label: "Input Tokens", color: "#8039e9" },
  { id: "feature-output-tokens", label: "Output Tokens", color: "#f97316" },
  { id: "feature-cache-write-tokens", label: "Cache Write", color: "#eab308" },
  { id: "feature-cache-read-tokens", label: "Cache Read", color: "#22c55e" },
];

function toDeltas(feature: FeatureUsage): [number, number][] {
  const sorted = [...feature.points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  // Stigg returns cumulative values that reset at period boundaries.
  // A decrease or reset to 0 means a new period started — use the raw value as the delta.
  return sorted.map((p, i) => {
    const ts = new Date(p.timestamp).getTime();
    if (i === 0) return [ts, p.value] as [number, number];
    const prev = sorted[i - 1].value;
    const delta = p.value - prev;
    // If value decreased, it's a reset — use the raw value as this period's usage
    return [ts, delta >= 0 ? delta : p.value] as [number, number];
  });
}

export function TokenUsageCard({
  tokenFeatures,
  isLoading,
}: TokenUsageCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 p-5 h-80 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (tokenFeatures.length === 0) return null;

  const featureMap = Object.fromEntries(
    tokenFeatures.map((f) => [f.feature_id, f]),
  );

  // Build per-type deltas and totals
  const perType: {
    label: string;
    color: string;
    total: number;
    deltas: Map<number, number>;
  }[] = [];

  for (const cfg of SERIES_CONFIG) {
    const feature = featureMap[cfg.id];
    if (!feature) continue;
    const data = toDeltas(feature);
    const total = data.reduce((sum, [, v]) => sum + v, 0);
    if (total === 0 && data.length === 0) continue;

    const deltas = new Map<number, number>();
    for (const [ts, v] of data) deltas.set(ts, v);
    perType.push({ label: cfg.label, color: cfg.color, total, deltas });
  }

  if (perType.length === 0) return null;

  // Collect all unique timestamps
  const allTimestamps = new Set<number>();
  for (const t of perType) {
    for (const ts of t.deltas.keys()) allTimestamps.add(ts);
  }
  const sortedTs = [...allTimestamps].sort();

  // Build stacked series — each token type as a colored series
  const series: Highcharts.SeriesColumnOptions[] = perType.map((t) => ({
    type: "column" as const,
    name: t.label,
    color: t.color,
    data: sortedTs.map((ts) => [ts, t.deltas.get(ts) ?? 0] as [number, number]),
  }));

  const grandTotal = perType.reduce((sum, t) => sum + t.total, 0);

  const options: Highcharts.Options = {
    chart: {
      type: "column",
      height: 260,
      backgroundColor: "transparent",
      style: { fontFamily: "inherit" },
    },
    title: { text: undefined },
    xAxis: {
      type: "datetime",
      labels: {
        format: "{value:%b %e}",
        style: { color: "#9ca3af", fontSize: "10px" },
      },
      lineColor: "#e5e7eb",
      tickLength: 0,
    },
    yAxis: {
      title: { text: undefined },
      labels: {
        style: { color: "#9ca3af", fontSize: "10px" },
        formatter() {
          const v = this.value as number;
          if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
          if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
          return String(v);
        },
      },
      gridLineColor: "#f3f4f6",
    },
    legend: { enabled: false },
    tooltip: {
      useHTML: true,
      formatter() {
        const ts = this.x as number;
        const date = Highcharts.dateFormat("%b %e", ts);
        let html = `<b>${date}</b><br/>`;
        for (const t of perType) {
          const val = t.deltas.get(ts) ?? 0;
          if (val > 0) {
            html += `<span style="color:${t.color}">●</span> ${t.label}: <b>${val.toLocaleString()}</b><br/>`;
          }
        }
        const total = perType.reduce(
          (sum, t) => sum + (t.deltas.get(ts) ?? 0),
          0,
        );
        html += `<b>Total: ${total.toLocaleString()}</b>`;
        return html;
      },
      style: { fontSize: "11px" },
    },
    plotOptions: {
      column: {
        stacking: "normal",
        borderRadius: 2,
        maxPointWidth: 24,
        minPointLength: 3,
        pointPadding: 0.05,
        groupPadding: 0.1,
        borderWidth: 0,
      },
    },
    series,
    credits: { enabled: false },
  };

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-900">LLM Token Usage</p>
        <span className="text-sm text-gray-500 tabular-nums">
          {grandTotal.toLocaleString()} total
        </span>
      </div>

      <HighchartsReact highcharts={Highcharts} options={options} />

      {/* Breakdown legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
        {perType.map((t) => (
          <div key={t.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: t.color }}
            />
            <span className="text-xs text-gray-500">{t.label}</span>
            <span className="text-xs font-medium text-gray-700 tabular-nums">
              {t.total.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
