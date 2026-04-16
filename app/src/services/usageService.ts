import { apiClient } from "./apiClient";

export interface FeatureUserUsage {
  user_id: string;
  name: string;
  usage: number;
}

export interface UsagePoint {
  timestamp: string;
  value: number;
}

export type FeatureCategory = "tokens" | "integration" | "artifacts";

export interface FeatureInfo {
  feature_id: string;
  display_name: string;
  category: FeatureCategory;
}

export interface FeaturesResponse {
  features: FeatureInfo[];
  is_admin: boolean;
}

export interface BreakdownSeries {
  total: number;
  points: UsagePoint[];
}

export interface FeatureUsage {
  feature_id: string;
  display_name: string;
  category: FeatureCategory;
  users: FeatureUserUsage[];
  points: UsagePoint[];
  breakdown?: Record<string, BreakdownSeries>;
}

export type UsagePeriod = "1d" | "7d" | "30d" | "60d";

class UsageService {
  async getFeatures(): Promise<FeaturesResponse> {
    return apiClient.get<FeaturesResponse>("/api/v1/usage/features");
  }

  async getFeatureUsage(
    featureId: string,
    period: UsagePeriod = "7d",
    userId?: string,
  ): Promise<FeatureUsage> {
    const params = new URLSearchParams({ period });
    if (userId) params.set("user_id", userId);
    return apiClient.get<FeatureUsage>(`/api/v1/usage/${featureId}?${params}`);
  }
}

export const usageService = new UsageService();
