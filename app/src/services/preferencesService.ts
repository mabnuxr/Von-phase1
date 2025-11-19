import { apiClient } from "./apiClient";
import type {
  Field,
  EmailCategorizationSettings,
  ProcessConfigurationSettings,
} from "../store/preferencesStore";

/**
 * Backend response (snake_case)
 */
interface PreferencesBackendResponse {
  salesforce_fields: Field[];
  email_categorization: EmailCategorizationSettings | Record<string, never>;
  process_configuration:
    | Partial<ProcessConfigurationSettings>
    | Record<string, never>;
  updated_at: string;
}

/**
 * Frontend preferences data (camelCase)
 */
export interface PreferencesData {
  salesforceFields: Field[];
  emailCategorization: EmailCategorizationSettings;
  processConfiguration: ProcessConfigurationSettings;
  updatedAt: string;
}

/**
 * Default process configuration to merge with backend response
 */
const DEFAULT_PROCESS_CONFIG: ProcessConfigurationSettings = {
  businessStages: [],
  customerStages: [],
  churnSignalField: "",
  renewalDetectionField: "",
  customerIdentificationField: "",
  salesforceDescription: "",
  salesQuarter: "Fiscal",
  keywords: "",
  businessProcess: "",
  companyDescription: "",
};

/**
 * Transform backend response to frontend format
 * Provides defaults for empty objects from backend
 */
function transformPreferences(
  backend: PreferencesBackendResponse,
): PreferencesData {
  return {
    salesforceFields: backend.salesforce_fields,
    emailCategorization:
      backend.email_categorization as EmailCategorizationSettings,
    processConfiguration: {
      ...DEFAULT_PROCESS_CONFIG,
      ...(backend.process_configuration as Partial<ProcessConfigurationSettings>),
    },
    updatedAt: backend.updated_at,
  };
}

/**
 * Transform frontend data to backend format
 */
function toBackendFormat(data: Partial<PreferencesData>) {
  return {
    salesforce_fields: data.salesforceFields,
    email_categorization: data.emailCategorization,
    process_configuration: data.processConfiguration,
  };
}

/**
 * Preferences Service - Handles preferences API calls
 */
export class PreferencesService {
  async getPreferences(): Promise<PreferencesData> {
    const response = await apiClient.get<PreferencesBackendResponse>(
      "/api/v1/preferences",
    );
    return transformPreferences(response);
  }

  async updatePreferences(
    data: Partial<PreferencesData>,
  ): Promise<PreferencesData> {
    const response = await apiClient.put<PreferencesBackendResponse>(
      "/api/v1/preferences",
      toBackendFormat(data),
    );
    return transformPreferences(response);
  }
}

export const preferencesService = new PreferencesService();
