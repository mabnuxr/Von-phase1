import { useState } from "react";
import { useUser } from "../../hooks/useUser";
import { useUsage } from "../../hooks/useUsage";
import type { UsagePeriod } from "../../services/usageService";
import { SeatUsageCard } from "./SeatUsageCard";
import { TokenUsageCard } from "./TokenUsageCard";
import { FeatureUsageCard } from "./FeatureUsageCard";

const PERIODS: { label: string; value: UsagePeriod }[] = [
  { label: "1D", value: "1d" },
  { label: "1W", value: "7d" },
  { label: "1M", value: "30d" },
  { label: "2M", value: "60d" },
];

export function UsagePortal() {
  const { user } = useUser();
  const [period, setPeriod] = useState<UsagePeriod>("7d");
  const { data, isLoading } = useUsage(user?.tenantId, period);
  const features = data?.features ?? [];
  const tokenFeatures = features.filter((f) => f.category === "tokens");
  const otherFeatures = features.filter((f) => f.category !== "tokens");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seat usage */}
      <SeatUsageCard />

      {/* Time range selector */}
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

      {/* Stacked token chart */}
      {tokenFeatures.length > 0 && (
        <TokenUsageCard tokenFeatures={tokenFeatures} />
      )}

      {/* Per-feature charts (non-token features) */}
      {otherFeatures.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherFeatures.map((f) => (
            <FeatureUsageCard key={f.feature_id} feature={f} />
          ))}
        </div>
      )}
    </div>
  );
}
