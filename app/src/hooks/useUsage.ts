import { useQuery } from "@tanstack/react-query";
import { usageService } from "../services/usageService";
import type { UsagePeriod } from "../services/usageService";

export const usageKeys = {
  all: ["usage"] as const,
  usage: (tenantId: string, period: UsagePeriod) =>
    [...usageKeys.all, tenantId, period] as const,
};

export function useUsage(
  tenantId: string | undefined,
  period: UsagePeriod = "7d",
) {
  return useQuery({
    queryKey: tenantId
      ? usageKeys.usage(tenantId, period)
      : ["usage", "loading"],
    queryFn: () => usageService.getUsage(period),
    enabled: !!tenantId,
    staleTime: 60000,
  });
}
