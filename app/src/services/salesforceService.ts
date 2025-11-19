import { apiClient } from "./apiClient";

/**
 * Salesforce Opportunity Stage interface
 */
export interface OpportunityStage {
  id: string;
  label: string;
  sortOrder: number;
  isClosed: boolean;
  isWon: boolean;
}

/**
 * API response for opportunity stages
 */
interface OpportunityStagesResponse {
  stages: OpportunityStage[];
}

/**
 * Service for interacting with Salesforce metadata endpoints
 */
class SalesforceService {
  /**
   * Get opportunity stages from Salesforce
   *
   * @returns Promise resolving to array of opportunity stages
   * @throws Error if Salesforce is not connected or query fails
   */
  async getOpportunityStages(): Promise<OpportunityStage[]> {
    const response = await apiClient.get<OpportunityStagesResponse>(
      "/api/v1/salesforce/opportunity-stages",
    );
    return response.stages;
  }
}

export const salesforceService = new SalesforceService();
