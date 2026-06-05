/**
 * Mock dashboard for the Q2 Pipeline Review prototype.
 * Matches the real Analytics page chrome (same outer wrapper, same header structure)
 * without wiring any real API calls.
 */

import { useState } from "react";
import {
  ArrowClockwiseIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  ShareNetworkIcon,
  TrendUpIcon,
  TrendDownIcon,
} from "@phosphor-icons/react";
import { ShareModal } from "../components/prototype/ShareModal";
import { useAuthCheck } from "../hooks/useAuthCheck";

// ─── Metric card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  caption: string;
}

function MetricCard({ label, value, trend, trendUp, caption }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-5 flex flex-col gap-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">{label}</p>
      <div>
        <p className="text-3xl font-semibold text-gray-900 leading-none">{value}</p>
        <div className="flex items-center gap-1.5 mt-2">
          {trendUp ? (
            <TrendUpIcon size={13} className="text-emerald-500" weight="bold" />
          ) : (
            <TrendDownIcon size={13} className="text-red-400" weight="bold" />
          )}
          <span className={`text-xs font-medium ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
            {trend}
          </span>
          <span className="text-xs text-gray-400">{caption}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Chart placeholder ────────────────────────────────────────────────────────

function ChartPlaceholder({ title, height = 200 }: { title: string; height?: number }) {
  const bars = [62, 45, 78, 55, 88, 71, 94, 67, 82, 59, 76, 91];
  const max = Math.max(...bars);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-5">
      <p className="text-sm font-semibold text-gray-800 mb-1">{title}</p>
      <p className="text-xs text-gray-400 mb-5">Q1 2026 · Monthly</p>
      <div
        className="flex items-end gap-2"
        style={{ height }}
      >
        {bars.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm bg-violet-200 transition-all"
              style={{ height: `${(v / max) * (height - 24)}px` }}
            />
            <span className="text-[9px] text-gray-300">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StageTable() {
  const stages = [
    { stage: "Prospecting",        count: 34, value: "$4.1M",  pct: 17 },
    { stage: "Qualification",      count: 28, value: "$6.2M",  pct: 26 },
    { stage: "Proposal",           count: 19, value: "$5.8M",  pct: 24 },
    { stage: "Negotiation",        count: 11, value: "$4.9M",  pct: 20 },
    { stage: "Closed Won",         count: 47, value: "$3.3M",  pct: 13 },
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <p className="text-sm font-semibold text-gray-800">Pipeline by Stage</p>
        <p className="text-xs text-gray-400">Active opportunities · Q1 2026</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-gray-50">
            <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stage</th>
            <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Deals</th>
            <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Value</th>
            <th className="px-5 py-2.5 w-32" />
          </tr>
        </thead>
        <tbody>
          {stages.map((row) => (
            <tr key={row.stage} className="border-t border-gray-50 hover:bg-gray-50/60 transition-colors">
              <td className="px-5 py-3 text-gray-800 font-medium">{row.stage}</td>
              <td className="px-5 py-3 text-gray-600 text-right">{row.count}</td>
              <td className="px-5 py-3 text-gray-600 text-right">{row.value}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-400"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-7 text-right">{row.pct}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const DASHBOARD_NAME = "Q2 Pipeline Review";

export default function MockDashboard() {
  useAuthCheck();

  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      {shareOpen && (
        <ShareModal
          dashboardName={DASHBOARD_NAME}
          onClose={() => setShareOpen(false)}
        />
      )}

      {/* Matches Analytics.tsx outer wrapper exactly */}
      <div className="flex h-full w-full gap-1.5">
        <div className="flex-1 min-w-0 h-full flex bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="flex-1 min-w-0 h-full relative flex flex-col">

            {/* Header — matches AnalyticsHeader chrome */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{DASHBOARD_NAME}</h1>
                <p className="text-sm text-gray-400 mt-0.5">Q1 2026 · Meridian Technologies</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Refresh */}
                <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                  <ArrowClockwiseIcon size={16} weight="regular" />
                </button>

                {/* Edit — secondary outlined */}
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                  <PencilSimpleIcon size={14} />
                  Edit
                </button>

                {/* Share — primary black */}
                <button
                  onClick={() => setShareOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <ShareNetworkIcon size={14} weight="fill" />
                  Share
                </button>

                {/* More options */}
                <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                  <DotsThreeIcon size={18} weight="bold" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Metric cards */}
              <div className="grid grid-cols-4 gap-4">
                <MetricCard
                  label="Total Pipeline"
                  value="$24.3M"
                  trend="+12%"
                  trendUp
                  caption="vs Q1 2025"
                />
                <MetricCard
                  label="Deals Won"
                  value="47"
                  trend="+8"
                  trendUp
                  caption="vs last quarter"
                />
                <MetricCard
                  label="Win Rate"
                  value="31%"
                  trend="−3pp"
                  trendUp={false}
                  caption="vs Q1 2025"
                />
                <MetricCard
                  label="Avg Deal Size"
                  value="$517K"
                  trend="+$43K"
                  trendUp
                  caption="vs last quarter"
                />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-2 gap-4">
                <ChartPlaceholder title="Pipeline Created" height={180} />
                <ChartPlaceholder title="Revenue Closed" height={180} />
              </div>

              {/* Stage table */}
              <StageTable />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
