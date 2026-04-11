import { useState } from "react";
import { useUser } from "../../hooks/useUser";
import { useFeatures, useFeatureUsages } from "../../hooks/useUsage";
import type { UsagePeriod } from "../../services/usageService";
import { TokenUsageCard } from "./TokenUsageCard";
import { FeatureUsageCard } from "./FeatureUsageCard";

const PERIODS: { label: string; value: UsagePeriod }[] = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "7d" },
  { label: "1M", value: "30d" },
  { label: "2M", value: "60d" },
];

type ViewMode = "tenant" | "personal";

export function UsagePortal() {
  const { user } = useUser();
  const [period, setPeriod] = useState<UsagePeriod>("7d");
  const [viewMode, setViewMode] = useState<ViewMode>("tenant");

  const { data: featuresData, isLoading: featuresLoading } = useFeatures(
    user?.tenantId,
  );

  const isAdmin = featuresData?.is_admin ?? false;
  const allFeatures = featuresData?.features ?? [];
  const tokenFeatureInfos = allFeatures.filter((f) => f.category === "tokens");
  const otherFeatureInfos = allFeatures.filter((f) => f.category !== "tokens");

  // Non-admins always see personal view only
  const userId = !isAdmin || viewMode === "personal" ? "me" : undefined;

  // Fetch usage data for all features in parallel
  const tokenUsages = useFeatureUsages(
    user?.tenantId,
    tokenFeatureInfos,
    period,
    userId,
  );
  const otherUsages = useFeatureUsages(
    user?.tenantId,
    otherFeatureInfos,
    period,
    userId,
  );

  if (featuresLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Collect loaded token data
  const tokenFeatures = tokenUsages
    .filter((q) => q.isSuccess && q.data)
    .map((q) => q.data!);

  // Collect loaded integration data (hide zero-usage)
  const otherFeatures = otherUsages
    .filter((q) => q.isSuccess && q.data)
    .map((q) => q.data!)
    .filter((f) => f.points.some((p) => p.value > 0));

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex items-center justify-between">
        {isAdmin ? (
          <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
            {(["tenant", "personal"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors capitalize ${
                  viewMode === mode
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}

        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                period === p.value
                  ? "bg-von-purple-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stacked token chart */}
      <TokenUsageCard
        tokenFeatures={tokenFeatures}
        isLoading={tokenUsages.some((q) => q.isLoading)}
      />

      {/* Integration usage */}
      {(otherFeatures.length > 0 || otherUsages.some((q) => q.isLoading)) && (
        <div>
          <p className="text-sm font-medium text-gray-900 mb-3">
            Integration Usage
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherUsages.map((q, i) => {
              if (q.isLoading) {
                return (
                  <div
                    key={otherFeatureInfos[i]?.feature_id}
                    className="rounded-xl border border-gray-200 p-4 h-50 flex items-center justify-center"
                  >
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  </div>
                );
              }
              if (!q.data || !q.data.points.some((p) => p.value > 0))
                return null;
              return (
                <FeatureUsageCard key={q.data.feature_id} feature={q.data} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
