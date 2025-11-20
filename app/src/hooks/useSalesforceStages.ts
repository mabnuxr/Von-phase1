import { useQuery } from "@tanstack/react-query";
import {
  salesforceService,
  type OpportunityStage,
} from "../services/salesforceService";

/**
 * Query keys for Salesforce data
 */
export const salesforceKeys = {
  all: ["salesforce"] as const,
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
    staleTime: 5 * 60 * 1000, // 5 minutes - stages don't change frequently
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
}
