import { useQuery, useQueries } from "@tanstack/react-query";
import { usageService } from "../services/usageService";
import type { UsagePeriod, FeatureInfo } from "../services/usageService";

export const usageKeys = {
  features: (tenantId: string) => ["usage", "features", tenantId] as const,
  featureUsage: (
    tenantId: string,
    featureId: string,
    period: UsagePeriod,
    userId?: string,
  ) => ["usage", tenantId, featureId, period, userId ?? "tenant"] as const,
};

/** Fetch the feature catalog (light, no usage data) */
export function useFeatures(tenantId: string | undefined) {
  return useQuery({
    queryKey: tenantId ? usageKeys.features(tenantId) : ["usage", "loading"],
    queryFn: () => usageService.getFeatures(),
    enabled: !!tenantId,
    staleTime: 300000, // 5 min — feature list rarely changes
  });
}

/** Fetch usage data for multiple features in parallel */
export function useFeatureUsages(
  tenantId: string | undefined,
  features: FeatureInfo[],
  period: UsagePeriod,
  userId?: string,
) {
  return useQueries({
    queries: features.map((f) => ({
      queryKey: tenantId
        ? usageKeys.featureUsage(tenantId, f.feature_id, period, userId)
        : ["usage", "loading", f.feature_id],
      queryFn: () => usageService.getFeatureUsage(f.feature_id, period, userId),
      enabled: !!tenantId,
      staleTime: 60000,
    })),
  });
}
