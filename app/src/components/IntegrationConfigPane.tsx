import { useState, useEffect } from "react";
import usePreferencesStore from "../store/preferencesStore";
import type { IntegrationConfig } from "../store/preferencesStore";
import { RadioButton, Banner } from "@vonlabs/design-components";
import {
  useCreateIntegration,
  useUpdateIntegration,
} from "../hooks/useIntegrations";

interface IntegrationDetails {
  id: string;
  name: string;
  logoPath: string;
}

const integrationDetails: Record<string, IntegrationDetails> = {
  salesforce: {
    id: "salesforce",
    name: "Salesforce",
    logoPath: "/Images/salesforce.svg",
  },
  gong: {
    id: "gong",
    name: "Gong",
    logoPath: "/Images/gong.svg",
  },
  hubspot: {
    id: "hubspot",
    name: "HubSpot",
    logoPath: "/Images/hubspot.svg",
  },
};

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

  // React Query mutations
  const createMutation = useCreateIntegration();
  const updateMutation = useUpdateIntegration();

  // Form state
  const [formData, setFormData] = useState<IntegrationConfig>({
    accessLevel: "user",
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Detect edit mode: if formData has an 'id' field, we're editing
  const isEditMode = Boolean(formData.id);

  // Initialize form data when integration changes
  useEffect(() => {
    if (configuringIntegrationId) {
      const existingConfig = integrationConfigs[configuringIntegrationId];
      setFormData(existingConfig || { accessLevel: "user" });
    }
  }, [configuringIntegrationId, integrationConfigs]);

  const handleClose = () => {
    // Clear the stored config to prevent pollution on next open
    if (configuringIntegrationId) {
      clearIntegrationConfig(configuringIntegrationId);
    }
    setConfiguringIntegration(null);
    setFormData({ accessLevel: "user" });
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
      if (!formData.instanceUrl || formData.instanceUrl.trim() === "") {
        errors.push("Instance URL is required");
      }
      if (!formData.apiVersion || formData.apiVersion.trim() === "") {
        errors.push("API Version is required");
      }
    } else if (configuringIntegrationId === "gong") {
      if (!formData.gongInstanceUrl || formData.gongInstanceUrl.trim() === "") {
        errors.push("Instance URL is required");
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
        config.instance_url = formData.instanceUrl;
        config.environment_type = formData.environmentType;
        config.api_version = formData.apiVersion;
      } else if (configuringIntegrationId === "gong") {
        config.instance_url = formData.gongInstanceUrl;
      }

      if (isEditMode && formData.id) {
        // Update existing integration
        await updateMutation.mutateAsync({
          integrationId: formData.id,
          data: {
            accessLevel: formData.accessLevel,
            config,
          },
        });
      } else {
        // Create new integration
        await createMutation.mutateAsync({
          type: configuringIntegrationId.toUpperCase(),
          accessLevel: formData.accessLevel,
          config,
        });
      }

      // Success: close pane and switch to Active Integrations tab
      handleClose();
      setIntegrationsActiveTab("active-integrations");
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
                    <RadioButton
                      name="accessLevel"
                      value="user"
                      checked={formData.accessLevel === "user"}
                      onChange={(e) =>
                        handleChange("accessLevel", e.target.value)
                      }
                      label="User Level"
                      helperText="Only you can access this integration"
                    />
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

                    {/* Instance URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">
                        Instance URL
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.instanceUrl || ""}
                        onChange={(e) =>
                          handleChange("instanceUrl", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200"
                        placeholder="https://yourcompany.salesforce.com"
                      />
                      <p className="mt-1.5 text-xs text-gray-500">
                        Enter your Salesforce instance URL (e.g.,
                        https://yourcompany.salesforce.com)
                      </p>
                    </div>

                    {/* API Version */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1.5">
                        API Version
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.apiVersion || ""}
                        onChange={(e) =>
                          handleChange("apiVersion", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200"
                        placeholder="v62.0"
                      />
                      <p className="mt-1.5 text-xs text-gray-500">
                        Enter the Salesforce API version to use (e.g., v62.0)
                      </p>
                    </div>
                  </>
                )}

                {/* Gong-specific fields */}
                {configuringIntegrationId === "gong" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">
                      Instance URL
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.gongInstanceUrl || ""}
                      onChange={(e) =>
                        handleChange("gongInstanceUrl", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-von-purple focus:border-transparent bg-white transition-all duration-200"
                      placeholder="https://yourcompany.gong.io"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
                      Enter your Gong instance URL (e.g.,
                      https://yourcompany.gong.io)
                    </p>
                  </div>
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
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-von-purple border border-von-purple rounded-lg hover:bg-von-purple-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending
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
