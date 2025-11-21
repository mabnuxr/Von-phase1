import { useQuery } from "@tanstack/react-query";
import {
  salesforceService,
  type OpportunityStage,
} from "../services/salesforceService";
import {
  SALESFORCE_STAGES_STALE_TIME,
  SALESFORCE_RETRY_COUNT,
  SALESFORCE_REFETCH_ON_FOCUS,
} from "../config/constants";

/**
 * Query keys for Salesforce data (via tools API)
 */
export const salesforceKeys = {
  all: ["tools", "salesforce"] as const,
  opportunityStages: () =>
    [...salesforceKeys.all, "opportunity-stages"] as const,
};

/**
 * Hook to fetch Salesforce opportunity stages
 *
 * @returns React Query result with stages, loading, and error states
 *
 * @example
 * ```tsx
 * const { data: stages, isLoading, error, refetch } = useOpportunityStages();
 *
 * if (isLoading) return <div>Loading stages...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <select>
 *     {stages?.map(stage => (
 *       <option key={stage.id} value={stage.label}>{stage.label}</option>
 *     ))}
 *   </select>
 * );
 * ```
 */
export function useOpportunityStages() {
  return useQuery<OpportunityStage[], Error>({
    queryKey: salesforceKeys.opportunityStages(),
    queryFn: () => salesforceService.getOpportunityStages(),
    staleTime: SALESFORCE_STAGES_STALE_TIME,
    retry: SALESFORCE_RETRY_COUNT,
    refetchOnWindowFocus: SALESFORCE_REFETCH_ON_FOCUS,
  });
}
