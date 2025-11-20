import { useQuery } from "@tanstack/react-query";
import { salesforceService } from "../services/salesforceService";
import {
  SALESFORCE_STAGES_STALE_TIME,
  SALESFORCE_RETRY_COUNT,
  SALESFORCE_REFETCH_ON_FOCUS,
} from "../config/constants";

/**
 * Query keys for Salesforce Opportunity fields
 */
export const salesforceFieldKeys = {
  opportunityFields: () =>
    ["tools", "salesforce", "opportunity-fields"] as const,
};

/**
 * Hook to fetch Salesforce Opportunity object field names
 *
 * Fetches all available field API names for the Opportunity object
 * to populate LOV dropdown for field selection.
 *
 * @returns React Query result with field names array, loading, and error states
 *
 * @example
 * ```tsx
 * const { data: fields, isLoading, error } = useOpportunityFields();
 *
 * if (isLoading) return <div>Loading fields...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <select>
 *     {fields?.map(field => (
 *       <option key={field} value={field}>{field}</option>
 *     ))}
 *   </select>
 * );
 * ```
 */
export function useOpportunityFields() {
  return useQuery<string[], Error>({
    queryKey: salesforceFieldKeys.opportunityFields(),
    queryFn: () => salesforceService.getOpportunityFields(),
    staleTime: SALESFORCE_STAGES_STALE_TIME, // Reuse same stale time config
    retry: SALESFORCE_RETRY_COUNT,
    refetchOnWindowFocus: SALESFORCE_REFETCH_ON_FOCUS,
  });
}
