import { useMemo } from "react";
import { useIntegrations } from "./useIntegrations";
import {
  IntegrationType,
  AuthenticationStatus,
} from "../services/integrationsService";

/**
 * Hook to check if Salesforce integration is connected and authenticated
 *
 * @returns Object with connection status and loading state
 */
export function useSalesforceConnection() {
  const { data: integrationsData, isLoading, error } = useIntegrations();

  const salesforceStatus = useMemo(() => {
    if (isLoading) {
      return {
        isConnected: false,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      };
    }

    if (error) {
      return {
        isConnected: false,
        isAuthenticated: false,
        isLoading: false,
        error: error as Error,
      };
    }

    // Find Salesforce integration
    const salesforceIntegration = integrationsData?.integrations.find(
      (integration) => integration.type === IntegrationType.SALESFORCE,
    );

    if (!salesforceIntegration) {
      return {
        isConnected: false,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    }

    const isAuthenticated =
      salesforceIntegration.authenticationStatus ===
      AuthenticationStatus.AUTHENTICATED;

    return {
      isConnected: true,
      isAuthenticated,
      isLoading: false,
      error: null,
      integration: salesforceIntegration,
    };
  }, [integrationsData, isLoading, error]);

  return salesforceStatus;
}
