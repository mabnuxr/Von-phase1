import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { FeatureUsage, UsagePoint } from "../../services/usageService";

interface FeatureUsageCardProps {
  feature: FeatureUsage;
}

const BREAKDOWN_COLORS = ["#8039e9", "#f97316", "#22c55e", "#eab308", "#06b6d4", "#ec4899"];

function toDeltas(points: UsagePoint[]): [number, number][] {
  const sorted = [...points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  return sorted.map((p, i) => {
    const ts = new Date(p.timestamp).getTime();
    if (i === 0) return [ts, p.value] as [number, number];
    const prev = sorted[i - 1].value;
    const delta = p.value - prev;
    return [ts, delta >= 0 ? delta : p.value] as [number, number];
  });
}

export function FeatureUsageCard({ feature }: FeatureUsageCardProps) {
  const hasBreakdown = feature.breakdown && Object.keys(feature.breakdown).length > 0;

  // Build series
  let series: Highcharts.SeriesColumnOptions[];
  let legendItems: { label: string; color: string; total: number }[] = [];
  let grandTotal: number;

  if (hasBreakdown) {
    const entries = Object.entries(feature.breakdown!);
    series = entries.map(([type, bd], i) => {
      const color = BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length];
      const data = toDeltas(bd.points);
      const total = data.reduce((sum, [, v]) => sum + v, 0);
      legendItems.push({ label: type.charAt(0).toUpperCase() + type.slice(1), color, total });
      return { type: "column" as const, name: type, color, data };
    });
    grandTotal = legendItems.reduce((sum, l) => sum + l.total, 0);
  } else {
    const color = "#8039e9";
    const data = toDeltas(feature.points);
    grandTotal = data.reduce((sum, [, v]) => sum + v, 0);
    series = [{ type: "column", data, color }];
  }

  const options: Highcharts.Options = {
    chart: {
      type: "column",
      height: 160,
      backgroundColor: "transparent",
      style: { fontFamily: "inherit" },
    },
    title: { text: undefined },
    xAxis: {
      type: "datetime",
      labels: {
        format: "{value:%b %e}",
        style: { color: "#9ca3af", fontSize: "9px" },
      },
      lineColor: "#e5e7eb",
      tickLength: 0,
    },
    yAxis: {
      title: { text: undefined },
      labels: { style: { color: "#9ca3af", fontSize: "9px" } },
      gridLineColor: "#f3f4f6",
    },
    legend: { enabled: false },
    tooltip: {
      shared: hasBreakdown,
      headerFormat: "<b>{point.key:%b %e}</b><br/>",
      pointFormat: hasBreakdown
        ? '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y:,.0f}</b><br/>'
        : "{point.y:,.0f}",
      style: { fontSize: "11px" },
    },
    plotOptions: {
      column: {
        stacking: hasBreakdown ? "normal" : undefined,
        borderRadius: 2,
        maxPointWidth: 16,
        minPointLength: hasBreakdown ? 3 : 0,
        pointPadding: 0.05,
        groupPadding: 0.1,
        borderWidth: 0,
      },
    },
    series,
    credits: { enabled: false },
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-900">
          {feature.display_name}
        </p>
        <span className="text-sm font-medium text-gray-700 tabular-nums">
          {grandTotal.toLocaleString()}
        </span>
      </div>

      {series.some((s) => (s.data as [number, number][])?.length > 0) ? (
        <>
          <HighchartsReact highcharts={Highcharts} options={options} />
          {legendItems.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {legendItems.map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-sm shrink-0"
                    style={{ backgroundColor: l.color }}
                  />
                  <span className="text-[10px] text-gray-500">{l.label}</span>
                  <span className="text-[10px] font-medium text-gray-700 tabular-nums">
                    {l.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="h-40 flex items-center justify-center text-gray-300 text-xs">
          No usage data for this period
        </div>
      )}
    </div>
  );
}
