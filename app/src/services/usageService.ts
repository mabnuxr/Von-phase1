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

export interface FeatureUsage {
  feature_id: string;
  display_name: string;
  category: FeatureCategory;
  tenant_usage: number | null;
  limit: number | null;
  has_access: boolean | null;
  reset_period: string | null;
  users: FeatureUserUsage[];
  points: UsagePoint[];
}

export interface UsageResponse {
  features: FeatureUsage[];
}

export type UsagePeriod = "1d" | "7d" | "30d" | "60d";

class UsageService {
  async getUsage(period: UsagePeriod = "7d"): Promise<UsageResponse> {
    return apiClient.get<UsageResponse>(`/api/v1/usage?period=${period}`);
  }
}

export const usageService = new UsageService();
