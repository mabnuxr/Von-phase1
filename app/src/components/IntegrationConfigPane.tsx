import { useState, useEffect } from "react";
import usePreferencesStore from "../store/preferencesStore";
import type { IntegrationConfig } from "../store/preferencesStore";
import { RadioButton, Banner, Input } from "@vonlabs/design-components";
import {
  useCreateIntegration,
  useUpdateIntegration,
  useAuthorizeIntegration,
  useIntegrations,
} from "../hooks/useIntegrations";
import type { IntegrationType } from "../services/integrationsService";
import { INTEGRATION_METADATA } from "../constants/integrationMetadata";

// Use centralized integration metadata
const integrationDetails = INTEGRATION_METADATA;

export function IntegrationConfigPane() {
  const {
    configuringIntegrationId,
    setConfiguringIntegration,
    setIntegrationsActiveTab,
    integrationConfigs,
    clearIntegrationConfig,
  } = usePreferencesStore();

  const integration = configuringIntegrationId
    ? integrationDetails[configuringIntegrationId]
    : null;

  // React Query mutations and data
  const createMutation = useCreateIntegration();
  const updateMutation = useUpdateIntegration();
  const authorizeMutation = useAuthorizeIntegration();
  const { data: integrationsData } = useIntegrations();

  // Form state
  const [formData, setFormData] = useState<IntegrationConfig>({
    accessLevel: "tenant",
    apiVersion: "v62.0",
    environmentType: "production",
  });

  // Gong API key configuration state
  const [gongApiBaseUrl, setGongApiBaseUrl] = useState("");
  const [gongAccessKey, setGongAccessKey] = useState("");
  const [gongAccessSecret, setGongAccessSecret] = useState("");

  // Fathom API key configuration state
  const [fathomApiKey, setFathomApiKey] = useState("");

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Detect edit mode: if formData has an 'id' field, we're editing
  const isEditMode = Boolean(formData.id);

  // Get backend integration data to check for existing credentials
  const backendIntegration = formData.id
    ? integrationsData?.integrations.find((i) => i.id === formData.id)
    : null;

  const hasExistingCredentials = backendIntegration?.hasCredentials === true;

  // Initialize form data when integration changes
  useEffect(() => {
    if (configuringIntegrationId) {
      const existingConfig = integrationConfigs[configuringIntegrationId];
      // If existing config exists and has an ID (edit mode), use it
      // Otherwise, always start fresh with tenant as default
      if (existingConfig?.id) {
        setFormData(existingConfig);

        // Initialize Gong fields from existing config
        if (
          configuringIntegrationId === "gong" &&
          existingConfig.gongApiBaseUrl
        ) {
          setGongApiBaseUrl(existingConfig.gongApiBaseUrl);
        }
      } else {
        setFormData({
          accessLevel: "tenant",
          apiVersion: "v62.0",
          environmentType: "production",
        });
        // Clear Gong fields for new integration
        setGongApiBaseUrl("");
        setGongAccessKey("");
        setGongAccessSecret("");
      }
    }
  }, [configuringIntegrationId, integrationConfigs]);

  const handleClose = () => {
    // Clear the stored config to prevent pollution on next open
    if (configuringIntegrationId) {
      clearIntegrationConfig(configuringIntegrationId);
    }
    setConfiguringIntegration(null);
    setFormData({
      accessLevel: "tenant",
      apiVersion: "v62.0",
      environmentType: "production",
    });
    // Clear Gong API key fields
    setGongApiBaseUrl("");
    setGongAccessKey("");
    setGongAccessSecret("");
    setValidationErrors([]);
  };

  const handleSave = async () => {
    if (!configuringIntegrationId) return;

    // Collect validation errors
    const errors: string[] = [];

    // Validation based on integration type
    if (configuringIntegrationId === "salesforce") {
      if (!formData.environmentType) {
        errors.push("Environment Type is required");
      }
    }

    if (configuringIntegrationId === "gong") {
      if (!gongApiBaseUrl) {
        errors.push("API Base URL is required");
      }
      // Only require credentials if they don't already exist (new integration or updating credentials)
      if (!hasExistingCredentials) {
        if (!gongAccessKey) {
          errors.push("Access Key is required");
        }
        if (!gongAccessSecret) {
          errors.push("Access Secret is required");
        }
      }
    }

    if (configuringIntegrationId === "fathom") {
      // Only require API key if no existing credentials
      if (!hasExistingCredentials) {
        if (!fathomApiKey) {
          errors.push("API Key is required");
        }
      }
    }

    // If there are validation errors, display them and return
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Clear client-side validation errors
    setValidationErrors([]);

    try {
      // Build config object based on integration type
      const config: Record<string, unknown> = {};

      if (configuringIntegrationId === "salesforce") {
        config.environment_type = formData.environmentType;
      }

      if (configuringIntegrationId === "gong") {
        // Store instance URL in config (not sensitive) - standardized with Salesforce
        config.instance_url = gongApiBaseUrl;
      }

      if (isEditMode && formData.id) {
        // Update existing integration
        await updateMutation.mutateAsync({
          integrationId: formData.id,
          data: {
            accessLevel: formData.accessLevel,
            config,
            // Only send credentials if they were provided (to update them)
            ...(gongAccessKey &&
              gongAccessSecret && {
                accessKey: gongAccessKey,
                accessSecret: gongAccessSecret,
              }),
          },
        });
        // For updates, just close and navigate (don't re-authorize)
        handleClose();
        setIntegrationsActiveTab("active-integrations");
      } else {
        // Create new integration
        const savedIntegration = await createMutation.mutateAsync({
          type: configuringIntegrationId.toUpperCase() as IntegrationType,
          accessLevel: formData.accessLevel,
          config,
          // Pass API credentials if present
          accessKey:
            configuringIntegrationId === "gong"
              ? gongAccessKey
              : configuringIntegrationId === "fathom"
                ? fathomApiKey
                : undefined,
          accessSecret:
            configuringIntegrationId === "gong" ? gongAccessSecret : undefined,
        });

        // Clear sensitive credentials from state after creation
        if (configuringIntegrationId === "gong") {
          setGongAccessKey("");
          setGongAccessSecret("");
        }
        if (configuringIntegrationId === "fathom") {
          setFathomApiKey("");
        }

        // Only trigger OAuth authorization if required (not for API key integrations)
        if (savedIntegration.requiresOauth !== false) {
          try {
            await authorizeMutation.mutateAsync(savedIntegration.id);
            // OAuth initiated successfully - close pane and navigate
            handleClose();
            setIntegrationsActiveTab("active-integrations");
          } catch (oauthError: unknown) {
            // Handle OAuth-specific errors
            const oauthErrorMessage =
              oauthError &&
              typeof oauthError === "object" &&
              "message" in oauthError
                ? (oauthError as { message: string }).message
                : "Failed to initiate authorization. Please try again from Active Integrations.";

            // Show error but still navigate (integration was saved successfully)
            setValidationErrors([
              "Integration saved successfully, but authorization failed to start: " +
                oauthErrorMessage,
            ]);

            // Navigate after showing error for 2 seconds
            setTimeout(() => {
              handleClose();
              setIntegrationsActiveTab("active-integrations");
            }, 2000);
          }
        } else {
          // API key integration - no OAuth needed, directly navigate
          handleClose();
          setIntegrationsActiveTab("active-integrations");
        }
      }
    } catch (error: unknown) {
      // Handle 409 Conflict errors (duplicate integration)
      if (error && typeof error === "object" && "response" in error) {
        const response = (
          error as {
            response?: { status?: number; data?: { detail?: string } };
          }
        ).response;
        if (response?.status === 409) {
          const detail = response.data?.detail;
          setValidationErrors([
            detail || "This integration configuration already exists.",
          ]);
          return;
        }
      }

      // Handle other errors
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as { message: string }).message
          : "Failed to save integration. Please try again.";
      setValidationErrors([errorMessage]);
    }
  };

  const handleChange = (fieldName: keyof IntegrationConfig, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Render nothing if HubSpot is selected (coming soon)
  const isHubSpot = configuringIntegrationId === "hubspot";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 z-40 ${
          configuringIntegrationId
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-elevated z-50 transform transition-transform duration-300 ease-in-out ${
          configuringIntegrationId ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {integration && (
                  <img
                    src={integration.logoPath}
                    alt={integration.name}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <h2 className="text-lg font-semibold text-gray-900 m-0">
                  {integration?.name} Configuration
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto settings-scrollbar px-6 py-4">
            {isHubSpot ? (
              // HubSpot coming soon message
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    HubSpot integration configuration coming soon
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Access Level Control - For ALL integrations */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Who can access this integration?
                  </label>
                  <div className="space-y-2">
                    <RadioButton
                      name="accessLevel"
                      value="tenant"
                      checked={formData.accessLevel === "tenant"}
                      onChange={(e) =>
                        handleChange("accessLevel", e.target.value)
                      }
                      label="Tenant Level"
                      helperText="All users in your organization can access this integration"
                    />
                    {/* <RadioButton
                      name="accessLevel"
                      value="user"
                      checked={formData.accessLevel === "user"}
                      onChange={(e) =>
                        handleChange("accessLevel", e.target.value)
                      }
                      label="User Level"
                      helperText="Only you can access this integration"
                    /> */}
                  </div>
                </div>

                {/* Salesforce-specific fields */}
                {configuringIntegrationId === "salesforce" && (
                  <>
                    {/* Environment Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        Environment Type
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="space-y-2">
                        <RadioButton
                          name="environmentType"
                          value="development"
                          checked={formData.environmentType === "development"}
                          onChange={(e) =>
                            handleChange("environmentType", e.target.value)
                          }
                          label="Development"
                          helperText="For sandbox and development environments"
                        />
                        <RadioButton
                          name="environmentType"
                          value="production"
                          checked={formData.environmentType === "production"}
                          onChange={(e) =>
                            handleChange("environmentType", e.target.value)
                          }
                          label="Production"
                          helperText="For production Salesforce instances"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Gong-specific fields */}
                {configuringIntegrationId === "gong" && (
                  <>
                    {/* API Base URL */}
                    <div className="gong-input-wrapper">
                      <Input
                        type="text"
                        label="API Base URL"
                        value={gongApiBaseUrl}
                        onChange={(e) => setGongApiBaseUrl(e.target.value)}
                        placeholder="https://us-24323.api.gong.io"
                        helperText="Sample: https://us-24323.api.gong.io"
                        required
                        fullWidth
                      />
                    </div>

                    {/* Access Key */}
                    <div className="gong-input-wrapper">
                      <Input
                        type="password"
                        label="Access Key"
                        value={gongAccessKey}
                        onChange={(e) => setGongAccessKey(e.target.value)}
                        placeholder={
                          hasExistingCredentials
                            ? "••••••••"
                            : "Enter access key"
                        }
                        helperText={
                          hasExistingCredentials
                            ? "Leave empty to keep existing credentials"
                            : "Your Gong access key"
                        }
                        required={!hasExistingCredentials}
                        fullWidth
                      />
                    </div>

                    {/* Access Secret */}
                    <div className="gong-input-wrapper">
                      <Input
                        type="password"
                        label="Access Secret"
                        value={gongAccessSecret}
                        onChange={(e) => setGongAccessSecret(e.target.value)}
                        placeholder={
                          hasExistingCredentials
                            ? "••••••••"
                            : "Enter access secret"
                        }
                        helperText={
                          hasExistingCredentials
                            ? "Leave empty to keep existing credentials"
                            : "Your Gong access secret"
                        }
                        required={!hasExistingCredentials}
                        fullWidth
                      />
                    </div>

                    <style>{`
                      .gong-input-wrapper input::placeholder {
                        font-size: 13px;
                        color: #9ca3af;
                      }
                    `}</style>

                    {/* Help Link */}
                    <div className="text-sm text-gray-600">
                      <span>Need help? </span>
                      <a
                        href="https://help.gong.io/docs/receive-access-to-the-api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-von-purple hover:text-von-purple-600 underline font-medium"
                      >
                        Learn how to generate API credentials
                      </a>
                    </div>

                    {/* Security Notice */}
                    <div className="text-xs text-gray-500 flex items-start gap-1.5">
                      <svg
                        className="size-3.5 shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <span>
                        Credentials are encrypted and transmitted securely.
                      </span>
                    </div>
                  </>
                )}

                {/* Fathom-specific fields */}
                {configuringIntegrationId === "fathom" && (
                  <>
                    {/* API Key */}
                    <div className="fathom-input-wrapper">
                      <Input
                        type="password"
                        label="API Key"
                        value={fathomApiKey}
                        onChange={(e) => setFathomApiKey(e.target.value)}
                        placeholder={
                          hasExistingCredentials
                            ? "••••••••"
                            : "Enter your Fathom API key"
                        }
                        helperText={
                          hasExistingCredentials
                            ? "Leave empty to keep existing API key"
                            : "Your Fathom API key from the Fathom dashboard"
                        }
                        required={!hasExistingCredentials}
                        fullWidth
                      />
                    </div>

                    <style>{`
                      .fathom-input-wrapper input::placeholder {
                        font-size: 13px;
                        color: #9ca3af;
                      }
                    `}</style>

                    {/* Help Link */}
                    <div className="text-sm text-gray-600">
                      <span>Need help? </span>
                      <a
                        href="https://help.fathom.video/en/articles/6455506-api-access"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-von-purple hover:text-von-purple-600 underline font-medium"
                      >
                        Learn how to generate your Fathom API key
                      </a>
                    </div>

                    {/* Security Notice */}
                    <div className="text-xs text-gray-500 flex items-start gap-1.5">
                      <svg
                        className="size-3.5 shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <span>
                        Your API key is encrypted and transmitted securely.
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Validation Errors Banner */}
            {validationErrors.length > 0 && (
              <div className="px-6 pb-4">
                <Banner
                  variant="error"
                  message={
                    validationErrors.length === 1
                      ? validationErrors[0]
                      : `Please fix the following errors:\n${validationErrors.map((e) => `• ${e}`).join("\n")}`
                  }
                  onClose={() => setValidationErrors([])}
                  dismissible={true}
                />
              </div>
            )}
          </div>

          {/* Footer Actions - Hide for HubSpot */}
          {!isHubSpot && (
            <div className="px-6 py-4 border-t border-gray-200 shrink-0">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    authorizeMutation.isPending
                  }
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    authorizeMutation.isPending
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-von-purple border border-von-purple rounded-lg hover:bg-von-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authorizeMutation.isPending
                    ? "Authorizing..."
                    : createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : isEditMode
                        ? "Update integration"
                        : "Save integration"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
