import { apiClient } from "./apiClient";

/**
 * Integration types matching backend enum
 */
export const IntegrationType = {
  SALESFORCE: "SALESFORCE",
  GOOGLE_CALENDAR: "GOOGLE_CALENDAR",
} as const;

export type IntegrationType =
  (typeof IntegrationType)[keyof typeof IntegrationType];

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
 * Generic tool execution request (for new tools API)
 */
interface ToolExecutionRequest {
  tool: string;
  action: string;
  integration_type: IntegrationType;
}

/**
 * Generic tool execution response (for new tools API)
 */
interface ToolExecutionResponse<T> {
  success: boolean;
  tool: string;
  action: string;
  data: T | null;
}

/**
 * Salesforce SOQL record response
 */
interface SalesforceRecord {
  [key: string]: string | number | boolean | null;
}

/**
 * Salesforce SOQL query result
 */
interface SalesforceQueryResult {
  records: SalesforceRecord[];
}

/**
 * Service for interacting with Salesforce via the generic tools API
 */
class SalesforceService {
  /**
   * Get opportunity stages from Salesforce
   *
   * Uses the generic tools API framework which keeps SOQL queries server-side.
   *
   * @returns Promise resolving to array of opportunity stages
   * @throws Error if Salesforce is not connected or query fails
   */
  async getOpportunityStages(): Promise<OpportunityStage[]> {
    const requestBody: ToolExecutionRequest = {
      tool: "salesforce_soql_execute",
      action: "get_opportunity_stages",
      integration_type: IntegrationType.SALESFORCE,
    };

    const response = await apiClient.post<
      ToolExecutionResponse<SalesforceQueryResult>
    >("/api/v1/tools/execute", requestBody);

    // Handle error response
    if (!response.success) {
      throw new Error("Failed to fetch opportunity stages from Salesforce");
    }

    // Transform Scalekit response to OpportunityStage array
    const records = response.data?.records || [];
    return records.map((record: SalesforceRecord) => ({
      id: String(record.Id),
      label: String(record.MasterLabel),
      sortOrder: Number(record.SortOrder),
      isClosed: Boolean(record.IsClosed),
      isWon: Boolean(record.IsWon),
    }));
  }

  /**
   * Get Opportunity object field names from Salesforce
   *
   * Fetches all available field API names for the Opportunity object
   * to populate LOV dropdown for field selection.
   *
   * @returns Promise resolving to array of field API names
   * @throws Error if Salesforce is not connected or query fails
   */
  async getOpportunityFields(): Promise<string[]> {
    const requestBody: ToolExecutionRequest = {
      tool: "salesforce_soql_execute",
      action: "get_opportunity_fields",
      integration_type: IntegrationType.SALESFORCE,
    };

    const response = await apiClient.post<
      ToolExecutionResponse<SalesforceQueryResult>
    >("/api/v1/tools/execute", requestBody);

    // Handle error response
    if (!response.success) {
      throw new Error("Failed to fetch opportunity fields from Salesforce");
    }

    // Transform Scalekit response to array of field names
    const records = response.data?.records || [];
    return records.map((record: SalesforceRecord) =>
      String(record.QualifiedApiName),
    );
  }
}

export const salesforceService = new SalesforceService();
